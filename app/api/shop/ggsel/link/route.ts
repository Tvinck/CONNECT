import { NextResponse } from 'next/server'
import { getShopCorsHeaders, getCorsOrigin } from '@/lib/cors'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateShopRequest } from '@/lib/shop-auth'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const headers = getShopCorsHeaders(request.headers.get('origin'))

  // Auth check
  const authError = validateShopRequest(request)
  if (authError) return authError

  try {
    const { uniquecode, udid } = await request.json()

    if (!uniquecode || !udid) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400, headers })
    }

    // Валидация формата UDID (25-40 hex chars с дефисами)
    const udidPattern = /^[0-9a-fA-F-]{25,40}$/;
    if (!udidPattern.test(udid)) {
      return NextResponse.json({ success: false, error: 'Неверный формат UDID' }, { status: 400, headers })
    }

    // 1. Получаем заказ из базы
    const { data: initialOrder, error: orderErr } = await supabase
      .from('bazzar_orders')
      .select('*')
      .eq('uniquecode', uniquecode)
      .maybeSingle();

    let order = initialOrder;

    if (orderErr) {
      console.error('[GGSel link] DB error:', orderErr.message);
    }

    // 2. Если заказа нет — пробуем создать его из GGSel API (verify мог не сработать)
    if (!order) {
      console.log(`[GGSel link] Order not found for ${uniquecode}, trying GGSel API...`);
      
      const sellerId = process.env.GGSEL_SELLER_ID;
      const apiKey = process.env.GGSEL_API_KEY;

      if (sellerId && apiKey) {
        try {
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

          const loginData = await loginRes.json();
          
          if (loginData.token) {
            const verifyRes = await fetch(
              `https://seller.ggsel.com/api_sellers/api/purchases/unique-code/${uniquecode}?token=${loginData.token}`,
              { headers: { 'Accept': 'application/json' } }
            );
            const verifyData = await verifyRes.json();

            if (verifyData.retval === 0) {
              const itemName = verifyData.name_invoice || verifyData.name_goods || 'Сертификат Apple ESign';
              const amount = verifyData.amount || 0;
              const email = verifyData.email || '';

              // Создаём заказ
              const invoiceId = verifyData.inv || verifyData.id_invoice || null;
              const { data: newOrder, error: insertErr } = await supabase
                .from('bazzar_orders')
                .upsert({
                  uniquecode,
                  invoice_id: invoiceId ? String(invoiceId) : null,
                  item_name: itemName,
                  amount: Number(amount) || 0,
                  email,
                  status: 'pending_udid',
                  source: 'ggsel_link_fallback',
                  created_at: new Date().toISOString()
                }, { onConflict: 'uniquecode' })
                .select()
                .maybeSingle();

              if (insertErr) {
                console.error('[GGSel link] Failed to create order:', insertErr.message);
              } else {
                order = newOrder;
                console.log(`[GGSel link] Created order from API: ${uniquecode}`);
              }
            } else {
              console.log(`[GGSel link] GGSel API says code invalid: ${verifyData.retdesc}`);
            }
          }
        } catch (apiErr: any) {
          console.error('[GGSel link] GGSel API call failed:', apiErr.message);
        }
      }
    }

    // 3. Если заказ всё равно не найден — ошибка
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Заказ не найден. Убедитесь, что вы правильно ввели уникальный код.' 
      }, { status: 404, headers })
    }

    // 4. Если уже привязан
    if (order.status === 'linked') {
      return NextResponse.json({ 
        success: true, 
        message: 'Этот код уже привязан.'
      }, { headers })
    }

    // 5. Привязываем UDID к пользователю
    await supabase.from('bazzar_users').upsert({
      udid: udid,
      status: 'bought',
      last_purchase: new Date().toISOString(),
      plan: order.item_name || 'Сертификат GGSel'
    }, { onConflict: 'udid' })

    // 6. Меняем статус заказа
    await supabase.from('bazzar_orders').update({ status: 'linked', udid: udid }).eq('uniquecode', uniquecode)

    // 7. Отправляем в apple_certificates для CRM (upsert — без дублей)
    const { error: certErr } = await supabase.from('apple_certificates').upsert({
      udid: udid,
      plan_id: order?.item_name || 'base',
      source: 'GGSel',
      sale_price: order?.amount || 0,
      status: 'paid',
    }, { onConflict: 'udid' });
    if (certErr) console.error('[GGSel link] apple_certificates upsert failed:', certErr.message);

    // 8. Фиксируем в финансах (единственное место записи транзакции)
    // Дедуп: проверяем есть ли уже транзакция с этим uniquecode в описании
    const safeCode = uniquecode.replace(/[%_\\]/g, '')
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .ilike('description', `%${safeCode}%`)
      .maybeSingle();

    if (!existingTx && order.amount) {
      const txAmount = Math.max(Number(order.amount) || 0, 0.01);
      const { error: txErr } = await supabase.from('transactions').insert({
        date: new Date().toISOString().slice(0, 10),
        description: `GGSel: ${order.item_name || 'Сертификат'} (код: ${uniquecode})`,
        category: 'revenue',
        type: 'income',
        amount: txAmount,
      });
      if (txErr) console.error('[GGSel link] transactions insert failed:', txErr.message);
    }

    // 9. Уведомление
    await supabase.from('notifications').insert({
      user_id: 'ggsel-system',
      type: 'mention',
      title: 'GGSel: UDID привязан',
      body: `✅ **UDID привязан!**\nТовар: ${order.item_name || '—'}\nUDID: \`${udid.slice(0, 8)}...\`\nКод: \`${uniquecode}\``,
      link: '/finances'
    }).then(({ error: notifErr }) => {
      if (notifErr) console.error('[GGSel link] notifications insert failed:', notifErr.message);
    });

    console.log(`[GGSel link] Successfully linked ${uniquecode} → ${udid}`);
    return NextResponse.json({ success: true }, { headers })
  } catch (err: any) {
    console.error('[GGSel link] Error:', err);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500, headers })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: {
    'Access-Control-Allow-Origin': getCorsOrigin(request?.headers?.get('origin') || null),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  } })
}
