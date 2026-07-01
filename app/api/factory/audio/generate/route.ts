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

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const cliToken = process.env.HIGGSFIELD_CLI_TOKEN;
    const cliRefresh = process.env.HIGGSFIELD_CLI_REFRESH;
    if (!cliToken) {
      return NextResponse.json({ error: 'Добавьте HIGGSFIELD_CLI_TOKEN в настройки Vercel' }, { status: 500 });
    }

    // Подготовка окружения для CLI
    const tmpBase = os.tmpdir();
    const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
    const configDir2 = path.join(tmpBase, 'higgsfield');
    fs.mkdirSync(configDir1, { recursive: true });
    fs.mkdirSync(configDir2, { recursive: true });
    
    // Пытаемся скачать свежие креды из Supabase (чтобы обойти stateless природу Vercel)
    let creds = { access_token: cliToken, refresh_token: cliRefresh || '' };
    const { data: fileData, error: downloadError } = await supabase.storage.from('support-attachments').download('cli_credentials.json');
    if (fileData && !downloadError) {
      try {
        const text = await fileData.text();
        creds = JSON.parse(text);
      } catch (e) {}
    }

    const credPath1 = path.join(configDir1, 'credentials.json');
    const credPath2 = path.join(configDir2, 'credentials.json');
    fs.writeFileSync(credPath1, JSON.stringify(creds));
    fs.writeFileSync(credPath2, JSON.stringify(creds));

    const cleanScript = script.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create inworld_text_to_speech --voice "Dmitry (ru)" --prompt "${cleanScript}" --json`;
    
    const { stdout } = await execAsync(command, { 
      env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase } 
    });
    
    // Проверяем, обновил ли CLI токены (при рефреше сессии)
    try {
      const newCredsText = fs.readFileSync(credPath1, 'utf8');
      if (newCredsText !== JSON.stringify(creds)) {
        // Загружаем обновленные креды в Supabase
        await supabase.storage.from('support-attachments').upload('cli_credentials.json', newCredsText, { upsert: true, contentType: 'application/json' });
      }
    } catch (e) {
      console.error('Failed to save refreshed credentials', e);
    }

    const result = JSON.parse(stdout.trim());
    
    if (Array.isArray(result) && result.length > 0) {
      return NextResponse.json({ taskId: 'b2c:' + result[0] });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Audio Gen Error:', error.stderr || error.message);
    return NextResponse.json({ error: error.stderr || error.message }, { status: 500 });
  }
}
