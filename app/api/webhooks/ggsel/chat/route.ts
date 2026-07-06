import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    let data;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      data = await request.json();
    }

    // Typical Digiseller chat message fields
    const message = data.message || data.text || '';
    const uniquecode = data.uniquecode || data.unique_code || 'unknown-client';
    const sender = data.sender || 'buyer'; // "buyer" or "seller"

    if (!message) {
      return NextResponse.json({ success: false, error: 'Empty message' }, { status: 400 });
    }

    if (sender === 'buyer') {
      // Ищем проект или используем дефолтный
      const project = 'GGSel Заказ: ' + uniquecode;

      // Записываем в таблицу support_messages
      await supabase.from('support_messages').insert({
        user_id: uniquecode,
        message: message,
        is_from_user: true,
        is_read: false,
        project: project,
        sender_email: 'buyer@ggsel.com'
      });
      
      // Push уведомление отправится само через pachca_bot.js, так как он слушает support_messages!
    }

    return NextResponse.json({ success: true, message: 'OK' });
  } catch (err: any) {
    console.error('GGSel Chat Webhook Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
