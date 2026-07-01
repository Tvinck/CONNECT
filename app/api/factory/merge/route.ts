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

    const { chunks, prompt, musicUrl } = await req.json();

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: 'Требуется массив chunks' }, { status: 400 });
    }

    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const runId = randomUUID();
    const outputFileName = `merged_${runId}.mp4`;
    const finalOutputPath = path.join(tmpDir, `concat_${outputFileName}`);
    const finalMusicOutputPath = path.join(tmpDir, outputFileName);
    const concatListPath = path.join(tmpDir, `concat_${runId}.txt`);
    const musicPath = path.join(tmpDir, `music_${runId}.mp3`);
    
    let concatFileContent = '';
    const filesToCleanup: string[] = [concatListPath, finalOutputPath, finalMusicOutputPath, musicPath];

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

    let renderPath = finalOutputPath;

    // Если есть фоновая музыка - накладываем её на готовое видео
    if (musicUrl) {
      try {
        await downloadFile(musicUrl, musicPath);
        
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(finalOutputPath)
            .input(musicPath)
            .complexFilter([
              // Голос берем на 100% громкости, музыку тише (12%), обрезаем по длине первого стрима (голоса)
              '[0:a]volume=1.0[voice];[1:a]volume=0.12[bgmusic];[voice][bgmusic]amix=inputs=2:duration=first[a]'
            ])
            .outputOptions([
              '-c:v copy',
              '-c:a aac',
              '-map 0:v:0',
              '-map [a]',
              '-y'
            ])
            .save(finalMusicOutputPath)
            .on('end', () => {
              renderPath = finalMusicOutputPath;
              resolve();
            })
            .on('error', (err) => reject(err));
        });
      } catch (musicErr) {
        console.error('Failed to overlay music:', musicErr);
      }
    }

    // Загружаем финальный файл в Supabase
    const fileBuffer = fs.readFileSync(renderPath);
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
