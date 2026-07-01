import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // Allow up to 60 seconds for downloading chunks, merging, and uploading final render

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

// Умный перенос слов для субтитров
function wrapText(text: string, maxChars = 28) {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines.join('\n');
}

// Безопасный путь для FFmpeg (особенно важно на Windows из-за двоеточий в путях)
function getFFmpegSafePath(filePath: string) {
  let p = filePath.replace(/\\/g, '/');
  // На Windows экранируем двоеточие после буквы диска
  if (p.includes(':')) {
    p = p.replace(/:/g, '\\\\:');
  }
  return p;
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    body = await req.json();
    const { action } = body;

    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // --- Действие 1: Обработка отдельного чанка (Склейка видео+аудио + Автоперенос субтитров) ---
    if (action === 'process_chunk') {
      const { videoUrl, audioUrl, text, chunkIndex } = body;
      if (!videoUrl || !audioUrl) {
        return NextResponse.json({ error: 'Пропущен videoUrl или audioUrl' }, { status: 400 });
      }

      const runId = randomUUID();
      const videoPath = path.join(tmpDir, `v_${runId}.mp4`);
      const audioPath = path.join(tmpDir, `a_${runId}.mp3`);
      const textFilePath = path.join(tmpDir, `t_${runId}.txt`);
      const chunkOutputPath = path.join(tmpDir, `out_${runId}.mp4`);

      await downloadFile(videoUrl, videoPath);
      await downloadFile(audioUrl, audioPath);

      // Записываем перенесенный текст в файл для безопасного рендеринга в FFmpeg
      const wrappedText = wrapText(text || '');
      fs.writeFileSync(textFilePath, wrappedText, 'utf8');

      let fontFilePath = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf');
      if (!fs.existsSync(fontFilePath)) {
        // Fallback 1: check if it's placed differently in deployment
        fontFilePath = path.join(process.cwd(), 'fonts', 'Montserrat-Bold.ttf');
      }
      if (!fs.existsSync(fontFilePath)) {
        // Fallback 2: download to /tmp as a fallback to ensure offline / container safety
        fontFilePath = path.join(tmpDir, 'Montserrat-Bold.ttf');
        if (!fs.existsSync(fontFilePath)) {
          try {
            console.log('[Merge] Downloading font fallback to /tmp...');
            await downloadFile('https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf', fontFilePath);
          } catch (fontErr) {
            console.error('[Merge] Failed to download font fallback:', fontErr);
          }
        }
      }

      // Готовим фильтр субтитров с чтением из файла
      const textFilter = text ? `,drawtext=textfile='${getFFmpegSafePath(textFilePath)}':fontfile='${getFFmpegSafePath(fontFilePath)}':fontcolor=yellow:fontsize=44:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-350` : '';

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(videoPath)
          .inputOptions(['-stream_loop -1']) // Зациклить видео, если оно короче аудио
          .input(audioPath)
          .outputOptions([
            '-c:v libx264',
            '-crf 28',
            '-preset medium',
            '-b:v 1.2M',
            '-maxrate 1.5M',
            '-bufsize 3M',
            '-c:a aac',
            '-b:a 96k',
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

      // Загружаем обработанный чанк в Supabase
      const fileBuffer = fs.readFileSync(chunkOutputPath);
      const storagePath = `chunks/processed_${runId}.mp4`;
      const { error } = await supabase.storage
        .from('support-attachments')
        .upload(storagePath, fileBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(storagePath);

      // Чистим временные файлы
      [videoPath, audioPath, textFilePath, chunkOutputPath].forEach(f => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
      });

      return NextResponse.json({ processedUrl: publicUrl });
    }

    // --- Действие 2: Финальное объединение (Concat) и наложение музыки ---
    if (action === 'concat') {
      const { musicUrl, prompt } = body;

      const runId = randomUUID();
      const outputFileName = `final_${runId}.mp4`;
      const concatListPath = path.join(tmpDir, `list_${runId}.txt`);
      const mergedPath = path.join(tmpDir, `merged_${runId}.mp4`);
      const finalMusicPath = path.join(tmpDir, `final_${runId}.mp4`);
      const musicPath = path.join(tmpDir, `m_${runId}.mp3`);
      
      const finalOutputPath = mergedPath;
      const finalMusicOutputPath = finalMusicPath;

      const processedUrls = body.processedUrls || body.chunks;
      if (!processedUrls || !Array.isArray(processedUrls) || processedUrls.length === 0) {
        return NextResponse.json({ error: 'Не передан массив processedUrls' }, { status: 400 });
      }

      const downloadedPaths: string[] = [];
      let concatContent = '';

      // Скачиваем все обработанные чанки локально
      for (let i = 0; i < processedUrls.length; i++) {
        const localPath = path.join(tmpDir, `chunk_${runId}_${i}.mp4`);
        await downloadFile(processedUrls[i], localPath);
        downloadedPaths.push(localPath);
        concatContent += `file '${localPath}'\n`;
      }

      fs.writeFileSync(concatListPath, concatContent, 'utf8');

      // 1. Быстро склеиваем файлы
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

      // 2. Накладываем фоновую музыку, если передана
      if (musicUrl) {
        try {
          let localMusicPath = '';
          if (musicUrl === 'lofi') {
            localMusicPath = path.join(process.cwd(), 'public', 'music', 'lofi.mp3');
          } else if (musicUrl.startsWith('http')) {
            await downloadFile(musicUrl, musicPath);
            localMusicPath = musicPath;
          }

          if (localMusicPath && fs.existsSync(localMusicPath)) {
            await new Promise<void>((resolve, reject) => {
              ffmpeg()
                .input(finalOutputPath)
                .input(localMusicPath)
                .complexFilter([
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
          }
        } catch (musicErr) {
          console.error('Failed to mix background music:', musicErr);
        }
      }

      // 3. Загружаем финальный результат в Supabase
      const finalBuffer = fs.readFileSync(renderPath);
      const { error } = await supabase.storage
        .from('support-attachments')
        .upload(`renders/${outputFileName}`, finalBuffer, {
          contentType: 'video/mp4',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(`renders/${outputFileName}`);

      // Сохраняем в историю
      await supabase.from('factory_generations').insert({
        prompt: prompt || 'Динамичное видео v5',
        video_url: publicUrl
      });

      // Очистка мусора
      const filesToCleanup = [concatListPath, mergedPath, finalMusicPath, musicPath, ...downloadedPaths];
      filesToCleanup.forEach(f => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
      });

      return NextResponse.json({ mergedUrl: publicUrl });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });

  } catch (error: any) {
    console.error('Segmented Merge Error:', error);
    try {
      await supabase.from('factory_generations').insert({
        prompt: 'debug_merge_error',
        video_url: JSON.stringify({
          message: error.message,
          stack: error.stack,
          body: body ? JSON.stringify(body).substring(0, 1000) : 'no_body'
        })
      });
    } catch (dbErr) {
      console.error('Failed to log error to Supabase:', dbErr);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
