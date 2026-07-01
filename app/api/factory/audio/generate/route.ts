import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Сценарий не передан' }, { status: 400 });
    }

    const cleanScript = script.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate create inworld_text_to_speech --voice "Dmitry (ru)" --prompt "${cleanScript}" --json`;
    
    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout.trim());
    
    if (Array.isArray(result) && result.length > 0) {
      return NextResponse.json({ taskId: result[0] });
    }
    
    return NextResponse.json({ error: 'Не удалось получить ID задачи' }, { status: 500 });
  } catch (error: any) {
    console.error('Audio Gen Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
