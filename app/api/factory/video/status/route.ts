import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId не передан' }, { status: 400 });
    }

    // --- B2C (CLI) Tasks (Для аудио) ---
    if (taskId.startsWith('b2c:')) {
      const realId = taskId.replace('b2c:', '');
      const b2cToken = process.env.HIGGSFIELD_B2C_TOKEN;
      if (!b2cToken) return NextResponse.json({ error: 'Нет B2C токена' }, { status: 500 });
      
      const configDir1 = '/tmp/.config/higgsfield';
      const configDir2 = '/tmp/higgsfield';
      fs.mkdirSync(configDir1, { recursive: true });
      fs.mkdirSync(configDir2, { recursive: true });
      fs.writeFileSync(path.join(configDir1, 'auth.json'), JSON.stringify({ access_token: b2cToken }));
      fs.writeFileSync(path.join(configDir2, 'auth.json'), JSON.stringify({ access_token: b2cToken }));
      
      const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate get ${realId} --json`;
      const { stdout } = await execAsync(command, { env: { ...process.env, HOME: '/tmp', XDG_CONFIG_HOME: '/tmp' } });
      const result = JSON.parse(stdout.trim());
      
      let status = 'IN_PROGRESS';
      if (result.status === 'completed') status = 'COMPLETED';
      else if (result.status === 'failed' || result.status === 'nsfw') status = 'FAILED';

      return NextResponse.json({ status, videoUrl: result.result_url || null });
    }

    // --- Developer API Tasks (Для видео Kling) ---
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

    const url = result.video?.url || (result.images && result.images[0]?.url) || '';
    return NextResponse.json({ status, videoUrl: url });
  } catch (error: any) {
    console.error('Status Error:', error.stderr || error?.response?.data || error.message);
    return NextResponse.json({ error: error.stderr || error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
