import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // Vercel: max 60s per tick invocation

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для безопасной отправки асинхронного тика
async function triggerNextTick(baseUrl: string, projectId: string) {
  try {
    // Делаем вызов и даем сокету 500мс передать пакет перед замораживанием контейнера Vercel
    fetch(`${baseUrl}/api/factory/queue/tick?projectId=${projectId}`).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (e) {
    console.error('Failed to trigger next tick:', e);
  }
}

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
    // 1. Загружаем текущее состояние проекта из БД
    const { data: dbData, error: dbError } = await supabase
      .from('factory_generations')
      .select('id, video_url')
      .eq('prompt', `project_state_${projectId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !dbData) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const state = JSON.parse(dbData.video_url);

    // Если проект уже завершен или упал с ошибкой - останавливаемся
    if (state.status !== 'PROCESSING' && state.status !== 'CONCATENATING') {
      return NextResponse.json({ status: 'idle', message: 'Project is not active' });
    }

    // Троттлинг: гарантируем интервал между тиками не менее 8 секунд
    const now = Date.now();
    const lastTickedAt = state.lastTickedAt || 0;
    if (now - lastTickedAt < 8000) {
      const sleepTime = 8000 - (now - lastTickedAt);
      console.log(`[Queue] Throttling tick for ${sleepTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, sleepTime));
    }
    state.lastTickedAt = Date.now();

    const chunks = state.chunks;
    const i = state.currentSceneIndex;

    // --- Сценарий 1: Склейка всего ролика (Concat) ---
    if (state.status === 'CONCATENATING') {
      console.log(`[Queue] Final merging for project ${projectId}...`);
      const mergeRes = await fetch(`${baseUrl}/api/factory/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'concat',
          chunks: chunks.map((c: any) => c.processedUrl),
          musicUrl: state.musicUrl
        })
      });
      const mergeData = await mergeRes.json();
      if (!mergeRes.ok) throw new Error(mergeData.error || 'Ошибка финального монтажа');

      state.status = 'COMPLETED';
      state.mergedUrl = mergeData.mergedUrl;

      // Обновляем состояние проекта в БД
      await supabase
        .from('factory_generations')
        .update({ video_url: JSON.stringify(state) })
        .eq('id', dbData.id);

      // Сохраняем готовую запись в историю ИИ Завода
      await supabase
        .from('factory_generations')
        .insert({
          prompt: state.script,
          video_url: state.mergedUrl
        });

      return NextResponse.json({ status: 'completed' });
    }

    // --- Сценарий 2: Обработка текущей сцены ---
    const chunk = chunks[i];
    console.log(`[Queue] Processing scene ${i + 1}/${chunks.length} for project ${projectId}...`);

    // Шаг А: Запуск Flux-генерации (если B-Roll)
    if (!chunk.isMascot && chunk.imageStatus === 'QUEUED') {
      const imgRes = await fetch(`${baseUrl}/api/factory/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chunk.prompt })
      });
      const imgData = await imgRes.json();
      if (!imgRes.ok) throw new Error(imgData.error || 'Сбой ИИ Художника (Flux)');

      chunk.imageStatus = 'PENDING';
      chunk.imageTaskId = imgData.taskId;
      chunk.videoStatus = 'WAITING_FOR_IMAGE';
      chunk.audioStatus = 'WAITING_FOR_IMAGE';

      await supabase
        .from('factory_generations')
        .update({ video_url: JSON.stringify(state) })
        .eq('id', dbData.id);

      await triggerNextTick(baseUrl, projectId);
      return NextResponse.json({ status: 'triggered_image' });
    }

    // Шаг Б: Ожидание Flux-кадра
    if (!chunk.isMascot && chunk.imageStatus === 'PENDING') {
      const statusRes = await fetch(`${baseUrl}/api/factory/video/status?taskId=${chunk.imageTaskId}`);
      const statusData = await statusRes.json();
      if (statusData.status === 'COMPLETED') {
        chunk.imageStatus = 'COMPLETED';
        chunk.imageUrl = statusData.videoUrl;
        chunk.videoStatus = 'QUEUED'; // На следующем тике запустим Kling
        chunk.audioStatus = 'QUEUED';
      } else if (statusData.status === 'FAILED') {
        throw new Error('Сбой отрисовки первого кадра во Flux');
      }

      await supabase
        .from('factory_generations')
        .update({ video_url: JSON.stringify(state) })
        .eq('id', dbData.id);

      await triggerNextTick(baseUrl, projectId);
      return NextResponse.json({ status: 'waiting_image' });
    }

    // Шаг В: Запуск Kling и Диктора
    if (chunk.videoStatus === 'QUEUED' || chunk.audioStatus === 'QUEUED') {
      const startingImage = chunk.isMascot ? '1b2ef010-50b6-4a19-8db6-8707d03013b9' : chunk.imageUrl;
      
      const [vidRes, audRes] = await Promise.all([
        fetch(`${baseUrl}/api/factory/video/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: chunk.text, prompt: chunk.prompt, start_image: startingImage })
        }),
        fetch(`${baseUrl}/api/factory/audio/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: chunk.text })
        })
      ]);

      const vidData = await vidRes.json();
      const audData = await audRes.json();

      if (!vidRes.ok) throw new Error(vidData.error || 'Ошибка Kling');
      if (!audRes.ok) throw new Error(audData.error || 'Ошибка Speech');

      chunk.videoTaskId = vidData.taskId;
      chunk.videoStatus = 'PENDING';
      chunk.audioTaskId = audData.taskId;
      chunk.audioStatus = 'PENDING';

      await supabase
        .from('factory_generations')
        .update({ video_url: JSON.stringify(state) })
        .eq('id', dbData.id);

      await triggerNextTick(baseUrl, projectId);
      return NextResponse.json({ status: 'triggered_media' });
    }

    // Шаг Г: Опрос статуса Kling и Диктора
    if (chunk.videoStatus === 'PENDING' || chunk.audioStatus === 'PENDING') {
      let changed = false;

      if (chunk.videoStatus === 'PENDING') {
        const statusRes = await fetch(`${baseUrl}/api/factory/video/status?taskId=${chunk.videoTaskId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'COMPLETED') {
          chunk.videoStatus = 'COMPLETED';
          chunk.videoUrl = statusData.videoUrl;
          changed = true;
        } else if (statusData.status === 'FAILED') {
          throw new Error(`Сбой анимации в сцене ${i + 1}`);
        }
      }

      if (chunk.audioStatus === 'PENDING') {
        const statusRes = await fetch(`${baseUrl}/api/factory/video/status?taskId=${chunk.audioTaskId}`);
        const statusData = await statusRes.json();
        if (statusData.status === 'COMPLETED') {
          chunk.audioStatus = 'COMPLETED';
          chunk.audioUrl = statusData.videoUrl;
          changed = true;
        } else if (statusData.status === 'FAILED') {
          throw new Error(`Сбой озвучки в сцене ${i + 1}`);
        }
      }

      if (changed) {
        await supabase
          .from('factory_generations')
          .update({ video_url: JSON.stringify(state) })
          .eq('id', dbData.id);
      }

      await triggerNextTick(baseUrl, projectId);
      return NextResponse.json({ status: 'polling_media' });
    }

    // Шаг Д: Монтаж сцены (Слияние видео+аудио+сабы)
    if (chunk.videoStatus === 'COMPLETED' && chunk.audioStatus === 'COMPLETED' && !chunk.processedUrl) {
      console.log(`[Queue] Merging scene ${i + 1} for project ${projectId}...`);
      const mergeRes = await fetch(`${baseUrl}/api/factory/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_chunk',
          videoUrl: chunk.videoUrl,
          audioUrl: chunk.audioUrl,
          text: chunk.text,
          chunkIndex: i
        })
      });
      const mergeData = await mergeRes.json();
      if (!mergeRes.ok) throw new Error(mergeData.error || 'Ошибка сборки сцены');

      chunk.processedUrl = mergeData.processedUrl;

      // Переходим к следующей сцене
      if (i + 1 < chunks.length) {
        state.currentSceneIndex = i + 1;
      } else {
        state.status = 'CONCATENATING';
      }

      await supabase
        .from('factory_generations')
        .update({ video_url: JSON.stringify(state) })
        .eq('id', dbData.id);

      await triggerNextTick(baseUrl, projectId);
      return NextResponse.json({ status: 'chunk_processed' });
    }

    // Если ничего не подошло, запускаем следующий тик
    await triggerNextTick(baseUrl, projectId);
    return NextResponse.json({ status: 'waiting' });

  } catch (error: any) {
    console.error('Queue Tick Error:', error);
    
    // Пытаемся записать ошибку в состояние проекта
    try {
      const { data: dbData } = await supabase
        .from('factory_generations')
        .select('id, video_url')
        .eq('prompt', `project_state_${projectId}`)
        .single();
      if (dbData) {
        const state = JSON.parse(dbData.video_url);
        state.status = 'FAILED';
        state.error = error.message;
        await supabase
          .from('factory_generations')
          .update({ video_url: JSON.stringify(state) })
          .eq('id', dbData.id);
      }
    } catch (dbErr) {
      console.error('Failed to log project error:', dbErr);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
