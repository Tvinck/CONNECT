import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
      
      const cliToken = process.env.HIGGSFIELD_CLI_TOKEN;
      const cliRefresh = process.env.HIGGSFIELD_CLI_REFRESH;
      if (!cliToken) return NextResponse.json({ error: 'Нет CLI токена' }, { status: 500 });
      
      const tmpBase = os.tmpdir();
      const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
      const configDir2 = path.join(tmpBase, 'higgsfield');
      fs.mkdirSync(configDir1, { recursive: true });
      fs.mkdirSync(configDir2, { recursive: true });
      
      // Загружаем креды из базы данных Supabase
      const cliTokenEnv = process.env.HIGGSFIELD_CLI_TOKEN;
      const cliRefreshEnv = process.env.HIGGSFIELD_CLI_REFRESH;
      let creds = { access_token: cliTokenEnv, refresh_token: cliRefreshEnv || '' };
      
      const { data: dbData, error: downloadError } = await supabase
        .from('factory_generations')
        .select('video_url')
        .eq('prompt', 'cli_credentials')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (dbData && !downloadError) {
        try {
          creds = JSON.parse(dbData.video_url);
        } catch (e) {}
      }

      const credPath1 = path.join(configDir1, 'credentials.json');
      const credPath2 = path.join(configDir2, 'credentials.json');
      fs.writeFileSync(credPath1, JSON.stringify(creds));
      fs.writeFileSync(credPath2, JSON.stringify(creds));
      
      const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate get ${realId} --json`;
      const { stdout } = await execAsync(command, { env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase } });
      
      try {
        const newCredsText = fs.readFileSync(credPath1, 'utf8');
        if (newCredsText !== JSON.stringify(creds)) {
          await supabase.from('factory_generations').insert({
            prompt: 'cli_credentials',
            video_url: newCredsText
          });
        }
      } catch (e) {}

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
