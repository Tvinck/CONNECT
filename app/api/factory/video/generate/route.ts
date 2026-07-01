import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = (cmd: string) => promisify(exec)(cmd, { env: { ...process.env, HOME: process.env.HOME || '/tmp' } });

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const cleanScript = script.replace(/"/g, '\\"').replace(/\n/g, ' ');
    // Используем kling3_0_turbo с форматом 9:16 и эталонным Енотом
    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create kling3_0_turbo --aspect_ratio 9:16 --start-image 1b2ef010-50b6-4a19-8db6-8707d03013b9 --prompt "${cleanScript}" --json`;
    
    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout.trim());
    
    if (Array.isArray(result) && result.length > 0) {
      return NextResponse.json({ taskId: result[0] });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Video Gen Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
