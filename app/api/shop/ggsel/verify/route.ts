import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic' // No caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniquecode = searchParams.get('uniquecode')

  // CORS headers for bazzar-certs
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  const supabase = createAdminClient()

  if (!uniquecode) {
    return NextResponse.json({ success: false, error: 'Код заказа не указан' }, { status: 400, headers })
  }

  try {
    const sellerId = process.env.GGSEL_SELLER_ID;
    const apiKey = process.env.GGSEL_API_KEY;

    if (!sellerId || !apiKey) {
      console.error("Missing GGSel credentials");
      return NextResponse.json({ success: false, error: 'Настройки сервера (API Key) не заданы' }, { status: 500, headers })
    }

    // 1. Получаем токен GGSel
    const timestamp = Date.now().toString();
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp: timestamp,
        sign: sign
      })
    });
    
    if (!loginRes.ok) throw new Error('Ошибка авторизации GGSel');
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
       console.error("GGSel auth error:", loginData);
       throw new Error('Не удалось получить токен GGSel');
    }

    const token = loginData.token;

    // 2. Проверяем код
    const verifyRes = await fetch(`https://seller.ggsel.com/api_sellers/api/purchases/unique-code/${uniquecode}?token=${token}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const verifyData = await verifyRes.json();

    if (verifyData.retval !== 0) {
       // Код не найден или ошибка
       return NextResponse.json({
         success: false,
         error: verifyData.retdesc || 'Заказ не найден или недействителен'
       }, { status: 200, headers })
    }

    const amount = verifyData.amount || 0;
    const email = verifyData.email || 'unknown@ggsel.com';
    const itemName = verifyData.name_invoice || 'Сертификат Apple ESign';

    // 3. Сохраняем в финансы (чтобы вы видели прибыль), если заказа еще нет в базе
    const { data: existingOrder } = await supabase
      .from('bazzar_orders')
      .select('id')
      .eq('uniquecode', uniquecode)
      .maybeSingle();

    if (!existingOrder) {
      // Сохраняем в финансы (category должна быть из CHECK constraint: revenue/client_payment/salary/marketing/development/infrastructure/other)
      const txAmount = Math.max(Number(amount) || 0, 0.01); // guard against 0/null — DB requires amount > 0
      const { error: txErr } = await supabase.from('transactions').insert({
        date: new Date().toISOString().slice(0, 10), // date-only, not full ISO
        description: `GGSel: ${itemName} (код: ${uniquecode})`,
        category: 'revenue',   // FIX: 'Продажи' не входит в CHECK constraint
        type: 'income',
        amount: txAmount,
      });
      if (txErr) console.error('[GGSel verify] transactions insert failed:', txErr.message);

      // Сохраняем в базу заказов
      const { error: orderErr } = await supabase.from('bazzar_orders').upsert({
        uniquecode: uniquecode,
        item_name: itemName,
        amount: Number(amount) || 0,
        email: email,
        status: 'pending_udid',
        created_at: new Date().toISOString()
      }, { onConflict: 'uniquecode' });
      if (orderErr) console.error('[GGSel verify] bazzar_orders upsert failed:', orderErr.message);

      // Уведомление в Пачку
      await supabase.from('notifications').insert({
        user_id: 'ggsel-system',
        type: 'mention',
        title: 'Упомянул',
        body: `💳 **Новая оплата на GGSel (API)!**\nТовар: ${itemName}\nСумма: ${amount} ₽\nКод: \`${uniquecode}\`\nКлиент скоро привяжет UDID.`,
        link: '/finances'
      }).then(({ error: notifErr }) => {
        if (notifErr) console.error('[GGSel verify] notifications insert failed:', notifErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      item_name: itemName,
      uniquecode: uniquecode,
      status: 'paid'
    }, { headers })

  } catch (err: any) {
    console.error('Verify GGSel Error:', err);
    return NextResponse.json({ success: false, error: 'Ошибка связи с GGSel' }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  })
}
