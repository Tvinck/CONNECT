import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для скачивания файла по URL
async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(dest, buffer);
}

// Экранирование текста для drawtext (если не используем textfile)
function escapeDrawtext(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/%/g, '\\%');
}

export async function POST(req: Request) {
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const { chunks, prompt } = await req.json();

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: 'Требуется массив chunks' }, { status: 400 });
    }

    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const runId = randomUUID();
    const outputFileName = `merged_${runId}.mp4`;
    const finalOutputPath = path.join(tmpDir, outputFileName);
    const concatListPath = path.join(tmpDir, `concat_${runId}.txt`);
    
    let concatFileContent = '';
    const filesToCleanup: string[] = [concatListPath, finalOutputPath];

    // Обрабатываем каждый чанк по очереди (скачиваем, склеиваем, накладываем сабы)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const videoPath = path.join(tmpDir, `video_${runId}_${i}.mp4`);
      const audioPath = path.join(tmpDir, `audio_${runId}_${i}.mp4`);
      const chunkOutputPath = path.join(tmpDir, `chunk_${runId}_${i}.mp4`);
      
      filesToCleanup.push(videoPath, audioPath, chunkOutputPath);

      // Скачиваем исходники
      await downloadFile(chunk.videoUrl, videoPath);
      await downloadFile(chunk.audioUrl, audioPath);

      // Готовим фильтр субтитров (желтый текст, черная обводка по центру внизу)
      const cleanText = chunk.text ? chunk.text.replace(/\n/g, ' ') : '';
      const textFilter = cleanText ? `,drawtext=text='${escapeDrawtext(cleanText)}':fontcolor=yellow:fontsize=48:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-250` : '';

      // Объединяем видео и аудио, накладываем текст.
      // Kling video 5s, Audio м.б. длиннее или короче.
      // -shortest обрежет по самому короткому стриму. Но если аудио длиннее видео, видео "зависнет" на последнем кадре если не залупить.
      // Для простоты используем -shortest и -stream_loop -1 для видео, чтобы оно залупилось, если аудио длиннее.
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(videoPath)
          .inputOptions(['-stream_loop -1']) // Зациклить видео, если оно короче звука
          .input(audioPath)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-map 0:v:0',
            '-map 1:a:0',
            '-shortest',
            `-vf scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920${textFilter}`,
            '-y'
          ])
          .save(chunkOutputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      concatFileContent += `file '${chunkOutputPath}'\n`;
    }

    // Записываем список файлов для конкатенации
    fs.writeFileSync(concatListPath, concatFileContent);

    // Склеиваем все чанки в один файл
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy', '-y'])
        .save(finalOutputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    // Загружаем финальный файл в Supabase
    const fileBuffer = fs.readFileSync(finalOutputPath);
    const { data, error } = await supabase.storage
      .from('support-attachments')
      .upload(`renders/${outputFileName}`, fileBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('support-attachments')
      .getPublicUrl(`renders/${outputFileName}`);
    
    // Сохраняем в историю
    await supabase.from('factory_generations').insert({
      prompt: prompt || 'Динамичное видео v4',
      video_url: publicUrl
    });

    // Очистка мусора
    filesToCleanup.forEach(f => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch(e){}
    });

    return NextResponse.json({ mergedUrl: publicUrl });

  } catch (error: any) {
    console.error('Merge V4 Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
