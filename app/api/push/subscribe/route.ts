import { NextResponse } from 'next/server';
import { addSubscription, PushSub } from '@/lib/pushSubscriptions';

export async function POST(req: Request) {
  try {
    const subscription: PushSub = await req.json();
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    await addSubscription(subscription);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving push subscription:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
