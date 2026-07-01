import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('npx --yes -p @higgsfield/cli higgsfield account status --json');
    const data = JSON.parse(stdout.trim());
    return NextResponse.json({ credits: data.credits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
