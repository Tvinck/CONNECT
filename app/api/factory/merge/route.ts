import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

import { createClient } from '@supabase/supabase-js';

// Инициализируем Supabase клиент
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const { videoUrl, audioUrl, prompt } = await req.json();

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
            
            // Загружаем в Supabase storage
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
            
            // Сохраняем в историю (базу данных)
            await supabase.from('factory_generations').insert({
              prompt: prompt || 'Сценарий не указан',
              video_url: publicUrl
            });

            fs.unlinkSync(outputPath);
            resolve(NextResponse.json({ mergedUrl: publicUrl }));
          } catch(e: any) {
            console.error('Supabase upload error:', e.message);
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
