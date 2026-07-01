import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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

    // 1. Планируем сцены через ИИ Режиссера
    const planRes = await fetch(`${baseUrl}/api/factory/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });
    const planData = await planRes.json();
    if (!planRes.ok) throw new Error(planData.error || 'Ошибка планирования');

    const scenes = planData.scenes;
    const projectId = randomUUID();

    const chunks = scenes.map((s: any, idx: number) => ({
      id: idx,
      text: s.text,
      isMascot: s.isMascot,
      prompt: s.prompt,
      imageStatus: 'QUEUED',
      videoStatus: 'QUEUED',
      audioStatus: 'QUEUED'
    }));

    const projectState = {
      projectId,
      status: 'PROCESSING',
      script,
      musicUrl: 'lofi',
      currentSceneIndex: 0,
      error: null,
      mergedUrl: null,
      chunks
    };

    // 2. Сохраняем начальное состояние проекта в БД
    const { error: dbError } = await supabase
      .from('factory_generations')
      .insert({
        prompt: `project_state_${projectId}`,
        video_url: JSON.stringify(projectState)
      });

    if (dbError) throw dbError;

    // 3. Запускаем фоновый tick-процесс (асинхронный вызов без ожидания)
    fetch(`${baseUrl}/api/factory/queue/tick?projectId=${projectId}`).catch(() => {});

    return NextResponse.json({ projectId });
  } catch (error: any) {
    console.error('Queue Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
