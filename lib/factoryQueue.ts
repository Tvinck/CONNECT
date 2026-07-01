/**
 * Factory Project Queue Manager
 * Manages a persistent queue of video generation projects in Supabase.
 * Queue row: { prompt: 'factory_queue', video_url: JSON }
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface QueueItem {
  projectId: string;
  script: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  title: string;  // first 60 chars of script
  createdAt: number;
  mergedUrl?: string;
}

export interface QueueState {
  items: QueueItem[];
  activeProjectId: string | null;
}

const QUEUE_KEY = 'factory_queue';

export async function getQueue(): Promise<QueueState> {
  const { data } = await supabase
    .from('factory_generations')
    .select('video_url')
    .eq('prompt', QUEUE_KEY)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return { items: [], activeProjectId: null };
  try {
    return JSON.parse(data.video_url);
  } catch {
    return { items: [], activeProjectId: null };
  }
}

export async function saveQueue(state: QueueState): Promise<void> {
  await supabase.from('factory_generations').insert({
    prompt: QUEUE_KEY,
    video_url: JSON.stringify(state)
  });
}

export async function addToQueue(projectId: string, script: string): Promise<QueueState> {
  const current = await getQueue();
  const item: QueueItem = {
    projectId,
    script,
    status: current.activeProjectId ? 'PENDING' : 'PROCESSING',
    title: script.substring(0, 60).trim() + (script.length > 60 ? '...' : ''),
    createdAt: Date.now()
  };
  const updated: QueueState = {
    items: [...current.items, item],
    activeProjectId: current.activeProjectId || projectId
  };
  await saveQueue(updated);
  return updated;
}

export async function markProjectCompleted(projectId: string, mergedUrl: string): Promise<string | null> {
  const current = await getQueue();
  const updated = { ...current };

  // Mark current project as completed
  updated.items = updated.items.map(i =>
    i.projectId === projectId ? { ...i, status: 'COMPLETED' as const, mergedUrl } : i
  );

  // Find next PENDING project
  const next = updated.items.find(i => i.status === 'PENDING');
  if (next) {
    updated.activeProjectId = next.projectId;
    updated.items = updated.items.map(i =>
      i.projectId === next.projectId ? { ...i, status: 'PROCESSING' as const } : i
    );
  } else {
    updated.activeProjectId = null;
  }

  await saveQueue(updated);
  return next?.projectId || null;
}

export async function markProjectFailed(projectId: string, error: string): Promise<string | null> {
  const current = await getQueue();
  const updated = { ...current };

  updated.items = updated.items.map(i =>
    i.projectId === projectId ? { ...i, status: 'FAILED' as const } : i
  );

  const next = updated.items.find(i => i.status === 'PENDING');
  if (next) {
    updated.activeProjectId = next.projectId;
    updated.items = updated.items.map(i =>
      i.projectId === next.projectId ? { ...i, status: 'PROCESSING' as const } : i
    );
  } else {
    updated.activeProjectId = null;
  }

  await saveQueue(updated);
  return next?.projectId || null;
}
