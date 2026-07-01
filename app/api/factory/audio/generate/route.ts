import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

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

    // Подготовка окружения для CLI (создаем временный auth.json кроссплатформенно)
    const tmpBase = os.tmpdir();
    const configDir1 = path.join(tmpBase, '.config', 'higgsfield');
    const configDir2 = path.join(tmpBase, 'higgsfield');
    fs.mkdirSync(configDir1, { recursive: true });
    fs.mkdirSync(configDir2, { recursive: true });
    
    const creds = { access_token: cliToken, refresh_token: cliRefresh || '' };
    fs.writeFileSync(path.join(configDir1, 'credentials.json'), JSON.stringify(creds));
    fs.writeFileSync(path.join(configDir2, 'credentials.json'), JSON.stringify(creds));

    const cleanScript = script.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create inworld_text_to_speech --voice "Dmitry (ru)" --prompt "${cleanScript}" --json`;
    
    const { stdout } = await execAsync(command, { 
      env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase } 
    });
    
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
