import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setupCredentials } from '@/lib/cliCreds';

export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Activates a PENDING project: plans its scenes via Claude then starts the tick chain.
 * Called automatically by the tick route when a previous project completes.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId не передан' }, { status: 400 });
  }

  const host = req.headers.get('host') || 'connect-4va6.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    // Load pending project state
    const { data: dbData, error } = await supabase
      .from('factory_generations')
      .select('id, video_url')
      .eq('prompt', `project_state_${projectId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !dbData) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const state = JSON.parse(dbData.video_url);
    if (state.status !== 'PENDING') {
      return NextResponse.json({ message: 'Project already active or completed' });
    }

    // Refresh credentials before planning
    await setupCredentials({ withRefresh: true });

    // Plan scenes with Claude
    const planRes = await fetch(`${baseUrl}/api/factory/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: state.script })
    });
    const planData = await planRes.json();
    if (!planRes.ok) throw new Error(planData.error || 'Ошибка планирования');

    const chunks = planData.scenes.map((s: any, idx: number) => ({
      id: idx,
      text: s.text,
      isMascot: s.isMascot,
      prompt: s.prompt,
      imageStatus: s.isMascot ? 'SKIPPED' : 'QUEUED',
      videoStatus: 'QUEUED',
      audioStatus: 'QUEUED'
    }));

    // Update state to PROCESSING with planned chunks
    state.status = 'PROCESSING';
    state.chunks = chunks;
    state.currentSceneIndex = 0;

    await supabase
      .from('factory_generations')
      .update({ video_url: JSON.stringify(state) })
      .eq('id', dbData.id);

    // Start the tick chain (fire and forget)
    fetch(`${baseUrl}/api/factory/queue/tick?projectId=${projectId}`).catch(() => {});

    return NextResponse.json({ status: 'activated', scenes: chunks.length });
  } catch (error: any) {
    console.error('Queue Activate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
