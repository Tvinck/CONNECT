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
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const outputPath = path.join(tmpDir, outputFileName);

    return new Promise((resolve) => {
      ffmpeg()
        .input(videoUrl)
        .input(audioUrl)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest'
        ])
        .save(outputPath)
        .on('end', async () => {
          try {
            const fileBuffer = fs.readFileSync(outputPath);
            const blob = new Blob([fileBuffer], { type: 'video/mp4' });
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', blob, outputFileName);
            
            const uploadRes = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              body: formData
            });
            const textUrl = await uploadRes.text();
            
            // Очищаем временный файл
            fs.unlinkSync(outputPath);
            
            resolve(NextResponse.json({ mergedUrl: textUrl }));
          } catch(e) {
            console.error('Catbox upload error:', e);
            resolve(NextResponse.json({ error: 'Ошибка при загрузке видео' }, { status: 500 }));
          }
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
