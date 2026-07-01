import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { setupCredentials, persistRefreshedCredentials } from '@/lib/cliCreds';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { script } = await req.json();
    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    // Авто-рефреш токена перед запуском
    const tmpBase = await setupCredentials({ withRefresh: true });
    const credPath = path.join(tmpBase, '.config', 'higgsfield', 'credentials.json');
    const credsBefore = fs.readFileSync(credPath, 'utf8');

    const cleanScript = script.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create inworld_text_to_speech --voice "Dmitry (ru)" --prompt "${cleanScript}" --json`;
    
    const { stdout } = await execAsync(command, {
      env: { ...process.env, HOME: tmpBase, XDG_CONFIG_HOME: tmpBase }
    });

    // Сохраняем обновлённые токены если CLI их обновил
    await persistRefreshedCredentials(tmpBase, credsBefore);

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
