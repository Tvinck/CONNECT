import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    // Устанавливаем путь динамически, чтобы не ломать сборку Next.js
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const { videoUrl, audioUrl } = await req.json();

    if (!videoUrl || !audioUrl) {
      return NextResponse.json({ error: 'Требуется videoUrl и audioUrl' }, { status: 400 });
    }

    const outputFileName = `merged_${randomUUID()}.mp4`;
    // Сохраняем в public/renders, чтобы клиент мог скачать по прямой ссылке
    const publicDir = path.join(process.cwd(), 'public', 'renders');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const outputPath = path.join(publicDir, outputFileName);

    return new Promise((resolve) => {
      ffmpeg()
        .input(videoUrl)
        .input(audioUrl)
        .outputOptions([
          '-c:v copy',      // Копируем видеопоток без пережатия
          '-c:a aac',       // Аудио кодируем в aac
          '-map 0:v:0',     // Берем видео из первого входа
          '-map 1:a:0',     // Берем аудио из второго входа
          '-shortest'       // Обрезаем по самому короткому потоку
        ])
        .save(outputPath)
        .on('end', () => {
          resolve(NextResponse.json({ mergedUrl: `/renders/${outputFileName}` }));
        })
        .on('error', (err) => {
          console.error('FFmpeg merge error:', err);
          resolve(NextResponse.json({ error: 'Ошибка при склейке видео и звука' }, { status: 500 }));
        });
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
