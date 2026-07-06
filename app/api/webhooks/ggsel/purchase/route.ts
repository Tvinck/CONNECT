import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    let data;
    // Digiseller can send Form Data or JSON
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      data = await request.json();
    }

    // Typical Digiseller fields: uniquecode, amount, inv, email, id_goods
    const uniquecode = data.uniquecode || data.unique_code;
    const amount = data.amount || data.sum || 0;
    const email = data.email || 'unknown@ggsel.com';
    const itemName = data.item_name || data.name_goods || 'Сертификат Apple';

    if (!uniquecode) {
      return NextResponse.json({ success: false, error: 'uniquecode missing' }, { status: 400 });
    }

    // 1. Сохраняем в таблицу финансов (transactions)
    await supabase.from('transactions').insert({
      date: new Date().toISOString(),
      description: `Покупка GGSel: ${itemName} (${uniquecode})`,
      category: 'Продажи',
      type: 'income',
      amount: Number(amount)
    });

    // 2. Сохраняем в заказы (bazzar_orders) для роута verify
    await supabase.from('bazzar_orders').upsert({
      uniquecode: uniquecode,
      item_name: itemName,
      amount: Number(amount),
      email: email,
      status: 'pending_udid',
      created_at: new Date().toISOString()
    }, { onConflict: 'uniquecode' });

    // Опционально: уведомление в Пачку
    await supabase.from('notifications').insert({
      user_id: '12345678-1234-1234-1234-123456789012', // dummy uuid
      type: 'mention',
      title: 'Упомянул',
      body: `💳 **Новая оплата на GGSel!**\nТовар: ${itemName}\nСумма: ${amount} ₽\nКод: \`${uniquecode}\`\nКлиент скоро привяжет UDID.`,
      link: '/finances'
    });

    return NextResponse.json({ success: true, message: 'OK' });
  } catch (err: any) {
    console.error('GGSel Purchase Webhook Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
