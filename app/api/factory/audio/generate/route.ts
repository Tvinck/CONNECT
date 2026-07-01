import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const b2cToken = process.env.HIGGSFIELD_B2C_TOKEN;
    if (!b2cToken) {
      return NextResponse.json({ error: 'Добавьте HIGGSFIELD_B2C_TOKEN (старый oat_...) в настройки Vercel' }, { status: 500 });
    }

    // Подготовка окружения для CLI (создаем временный auth.json в /tmp)
    const configDir = '/tmp/.config/higgsfield';
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'auth.json'), JSON.stringify({ access_token: b2cToken }));

    const cleanScript = script.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create inworld_text_to_speech --voice "Dmitry (ru)" --prompt "${cleanScript}" --json`;
    
    const { stdout } = await execAsync(command, { 
      env: { ...process.env, HOME: '/tmp', XDG_CONFIG_HOME: '/tmp' } 
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
