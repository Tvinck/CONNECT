import { NextResponse } from 'next/server';
import { getQueue } from '@/lib/factoryQueue';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const queue = await getQueue();
    return NextResponse.json(queue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
