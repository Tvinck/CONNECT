import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // No caching

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)
  const crypto = require('crypto');

  try {
    const sellerId = process.env.GGSEL_SELLER_ID;
    const apiKey = process.env.GGSEL_API_KEY;

    if (!sellerId || !apiKey) {
      return NextResponse.json({ success: false, error: 'GGSel credentials missing' }, { status: 500 })
    }

    const timestamp = Date.now().toString();
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ seller_id: parseInt(sellerId, 10), timestamp, sign })
    });
    
    if (!loginRes.ok) throw new Error('GGSel Auth Failed');
    const { token } = await loginRes.json();
    if (!token) throw new Error('No token');

    const chatsRes = await fetch(`https://seller.ggsel.com/api_sellers/api/debates/v2/chats?token=${token}&filter_new=1`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!chatsRes.ok) throw new Error('Failed to fetch chats');
    const chatsData = await chatsRes.json();
    if (!chatsData.items || chatsData.items.length === 0) {
      return NextResponse.json({ success: true, message: 'No new chats' });
    }

    let insertedCount = 0;

    for (const chat of chatsData.items) {
       const msgsRes = await fetch(`https://seller.ggsel.com/api_sellers/api/debates/v2?token=${token}&id_i=${chat.id_i}`, {
         headers: { 'Accept': 'application/json' }
       });
       if (!msgsRes.ok) continue;
       const msgsData = await msgsRes.json();
       if (!Array.isArray(msgsData)) continue;

       // UUID формат: 00000000-0000-0000-0000-XXXXXXXXXXXX
       const fakeUuid = `00000000-0000-0000-0000-${String(chat.id_i).padStart(12, '0')}`;

       for (const msg of msgsData) {
         if (msg.buyer === 1) {
            const { data: existing } = await supabase
              .from('support_messages')
              .select('id')
              .eq('user_id', fakeUuid)
              .eq('message', msg.message)
              .maybeSingle();

            if (!existing) {
               const { error } = await supabase.from('support_messages').insert({
                 user_id: fakeUuid,
                 message: msg.message,
                 is_from_user: true,
                 project: 'GGSel (Заказ ' + chat.id_i + ')'
               });
               if (!error) insertedCount++;
               else console.error('Insert error:', error);
            }
         }
       }
    }

    return NextResponse.json({ success: true, inserted: insertedCount });
  } catch (err: any) {
    console.error('GGSel Sync Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
