import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { setupCredentials, persistRefreshedCredentials } from '@/lib/cliCreds';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId не передан' }, { status: 400 });
    }

    // --- B2C (CLI) Tasks — аудио Inworld + картинки Flux ---
    if (taskId.startsWith('b2c:')) {
      const realId = taskId.replace('b2c:', '');

      // Загружаем свежие креды (без withRefresh — статус не требует рефреша)
      const tmpBase = await setupCredentials({ withRefresh: false });
      const credPath = path.join(tmpBase, '.config', 'higgsfield', 'credentials.json');
      const credsBefore = fs.readFileSync(credPath, 'utf8');

      const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate get ${realId} --json`;
      const { stdout } = await execAsync(command, {
        env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase }
      });

      // Сохраняем рефрешнутый токен если CLI его обновил
      await persistRefreshedCredentials(tmpBase, credsBefore);

      const result = JSON.parse(stdout.trim());

      let status = 'IN_PROGRESS';
      if (result.status === 'completed') status = 'COMPLETED';
      else if (result.status === 'failed' || result.status === 'nsfw') status = 'FAILED';

      return NextResponse.json({ status, videoUrl: result.result_url || null });
    }

    // --- Developer API Tasks — видео Kling (через platform API) ---
    const apiKey = process.env.HIGGSFIELD_API_KEY;
    const response = await fetch(`https://platform.higgsfield.ai/requests/${taskId}/status`, {
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || 'Failed to fetch status');
    }

    let status = 'IN_PROGRESS';
    if (result.status === 'completed') status = 'COMPLETED';
    else if (result.status === 'failed' || result.status === 'nsfw') status = 'FAILED';

    const url = result.video?.url ||
                (result.images && result.images[0]?.url) ||
                result.image?.url ||
                result.audio?.url ||
                (result.audios && result.audios[0]?.url) ||
                '';

    return NextResponse.json({ status, videoUrl: url });
  } catch (error: any) {
    console.error('Status Error:', error.stderr || error?.response?.data || error.message);
    return NextResponse.json({ error: error.stderr || error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
