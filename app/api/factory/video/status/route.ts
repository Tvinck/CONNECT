import { NextResponse } from 'next/server';
import { createHiggsfieldClient } from '@higgsfield/client/v2';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId не передан' }, { status: 400 });
    }

    // Since the V2 SDK polling is handled internally by client.subscribe, we can just use the exposed globalClient
    // or we can just fetch the status directly using fetch and the API key to avoid SDK limitations on arbitrary tasks.
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

    if (result.status === 'completed') {
      const url = result.video?.url || (result.images && result.images[0]?.url) || '';
      return NextResponse.json({ status: 'completed', url });
    } else if (result.status === 'failed' || result.status === 'nsfw') {
      return NextResponse.json({ status: 'failed', error: result.error || 'Generation failed' });
    }

    return NextResponse.json({ status: result.status || 'processing' });
  } catch (error: any) {
    console.error('Video Status Error:', error?.response?.data || error.message);
    return NextResponse.json({ error: error?.response?.data?.detail || error.message }, { status: 500 });
  }
}
