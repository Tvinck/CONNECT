import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = (cmd: string) => promisify(exec)(cmd, { env: { ...process.env, HOME: process.env.HOME || '/tmp' } });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const command = `node ./node_modules/@higgsfield/cli/bin/higgsfield.js generate get ${taskId} --json`;
    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout.trim());
    
    let status = 'PENDING';
    if (result.status === 'completed') status = 'COMPLETED';
    else if (result.status === 'failed' || result.status === 'nsfw') status = 'FAILED';
    else if (result.status === 'in_progress' || result.status === 'queued') status = 'IN_PROGRESS';

    return NextResponse.json({ 
      status,
      videoUrl: result.result_url || null
    });
  } catch (error: any) {
    console.error('Video Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
