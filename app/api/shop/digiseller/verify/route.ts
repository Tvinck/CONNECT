import { NextResponse } from 'next/server'
import { getShopCorsHeaders, getCorsOrigin } from '@/lib/cors'

import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic' // No caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniquecode = searchParams.get('uniquecode')

  // CORS headers for bazzar-certs
  const headers = {
    'Access-Control-Allow-Origin': getCorsOrigin(request?.headers?.get('origin') || null),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  const supabase = createAdminClient()

  if (!uniquecode) {
    return NextResponse.json({ success: false, error: 'Код заказа не указан' }, { status: 400, headers })
  }

  try {
    const sellerId = process.env.DIGISELLER_SELLER_ID;
    const apiKey = process.env.DIGISELLER_API_KEY;

    if (!sellerId || !apiKey) {
      console.error("Missing Digiseller credentials");
      return NextResponse.json({ success: false, error: 'Настройки сервера (API Key) не заданы' }, { status: 500, headers })
    }

    // 1. Получаем токен Digiseller
    const timestamp = Math.floor(Date.now() / 1000).toString(); // Digiseller timestamp is often UNIX seconds or just string, we'll match Digiseller docs which usually use epoch time or standard
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

    const loginRes = await fetch('https://api.digiseller.com/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp: parseInt(timestamp, 10), // API docs usually prefer number here
        sign: sign
      })
    });
    
    if (!loginRes.ok) throw new Error('Ошибка авторизации Digiseller');
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
       console.error("Digiseller auth error:", loginData);
       throw new Error('Не удалось получить токен Digiseller');
    }

    const token = loginData.token;

    // 2. Проверяем код
    const verifyRes = await fetch(`https://api.digiseller.com/api/purchases/unique-code/${uniquecode}?token=${token}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const verifyData = await verifyRes.json();

    if (verifyData.retval !== 0) {
       // Код не найден или ошибка
       return NextResponse.json({
         success: false,
         error: verifyData.retdesc || 'Заказ не найден или недействителен'
       }, { status: 200, headers }) // Return 200 so frontend can fallback easily
    }

    const amount = verifyData.amount || 0;
    const email = verifyData.email || 'unknown@digiseller.com';
    const itemName = verifyData.name_invoice || 'Сертификат Apple ESign (Digiseller)';

    // 3. Сохраняем в финансы (чтобы вы видели прибыль), если заказа еще нет в базе
    const { data: existingOrder } = await supabase
      .from('bazzar_orders')
      .select('id')
      .eq('uniquecode', uniquecode)
      .maybeSingle();

    if (!existingOrder) {
      // Сохраняем в финансы
      const txAmount = Math.max(Number(amount) || 0, 0.01);
      const { error: txErr } = await supabase.from('transactions').insert({
        date: new Date().toISOString().slice(0, 10),
        description: `Digiseller: ${itemName} (код: ${uniquecode})`,
        category: 'revenue',
        type: 'income',
        amount: txAmount,
      });
      if (txErr) console.error('[Digiseller verify] transactions insert failed:', txErr.message);

      // Сохраняем в базу заказов
      const { error: orderErr } = await supabase.from('bazzar_orders').upsert({
        uniquecode: uniquecode,
        item_name: itemName,
        amount: Number(amount) || 0,
        email: email,
        status: 'pending_udid',
        created_at: new Date().toISOString()
      }, { onConflict: 'uniquecode' });
      if (orderErr) console.error('[Digiseller verify] bazzar_orders upsert failed:', orderErr.message);

      // Уведомление в Пачку
      await supabase.from('notifications').insert({
        user_id: 'digiseller-system',
        type: 'mention',
        title: 'Упомянул',
        body: `💳 **Новая оплата на Digiseller (API)!**\nТовар: ${itemName}\nСумма: ${amount} ₽\nКод: \`${uniquecode}\`\nКлиент скоро привяжет UDID.`,
        link: '/finances'
      }).then(({ error: notifErr }) => {
        if (notifErr) console.error('[Digiseller verify] notifications insert failed:', notifErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      item_name: itemName,
      uniquecode: uniquecode,
      status: 'paid'
    }, { headers })

  } catch (err: any) {
    console.error('Verify Digiseller Error:', err);
    return NextResponse.json({ success: false, error: 'Ошибка связи с Digiseller' }, { status: 500, headers })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    headers: getShopCorsHeaders(null)
  })
}
