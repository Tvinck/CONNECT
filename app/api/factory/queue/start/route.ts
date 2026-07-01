import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { setupCredentials } from '@/lib/cliCreds';
import { addToQueue, getQueue } from '@/lib/factoryQueue';

export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { script } = await req.json();
    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'connect-4va6.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Check if another project is already active — if so, queue this one but don't start tick yet
    const currentQueue = await getQueue();
    const isQueueBusy = !!currentQueue.activeProjectId;

    const projectId = randomUUID();

    if (isQueueBusy) {
      // Add to queue as PENDING — tick of current project will auto-start this one
      const chunks = [{
        id: 0, text: '...', isMascot: false, prompt: '...',
        imageStatus: 'QUEUED', videoStatus: 'QUEUED', audioStatus: 'QUEUED'
      }];

      const projectState = {
        projectId, status: 'PENDING', script,
        musicUrl: 'lofi', currentSceneIndex: 0, error: null, mergedUrl: null,
        chunks: []
      };

      await supabase.from('factory_generations').insert({
        prompt: `project_state_${projectId}`,
        video_url: JSON.stringify(projectState)
      });

      const queue = await addToQueue(projectId, script);
      return NextResponse.json({ projectId, queued: true, queuePosition: queue.items.length, scenes: [] });
    }

    // No active project — start immediately
    await setupCredentials({ withRefresh: true });

    const planRes = await fetch(`${baseUrl}/api/factory/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });
    const planData = await planRes.json();
    if (!planRes.ok) throw new Error(planData.error || 'Ошибка планирования');

    const scenes = planData.scenes;
    const chunks = scenes.map((s: any, idx: number) => ({
      id: idx,
      text: s.text,
      isMascot: s.isMascot,
      prompt: s.prompt,
      imageStatus: s.isMascot ? 'SKIPPED' : 'QUEUED',
      videoStatus: 'QUEUED',
      audioStatus: 'QUEUED'
    }));

    const projectState = {
      projectId, status: 'PROCESSING', script,
      musicUrl: 'lofi', currentSceneIndex: 0, error: null, mergedUrl: null, chunks
    };

    await supabase.from('factory_generations').insert({
      prompt: `project_state_${projectId}`,
      video_url: JSON.stringify(projectState)
    });

    // Register in global queue as PROCESSING
    await addToQueue(projectId, script);

    // Kick off tick chain (fire and forget)
    fetch(`${baseUrl}/api/factory/queue/tick?projectId=${projectId}`).catch(() => {});

    return NextResponse.json({ projectId, queued: false, queuePosition: 1, scenes: chunks });
  } catch (error: any) {
    console.error('Queue Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
