import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { uniquecode, udid } = await request.json()

    if (!uniquecode || !udid) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400, headers })
    }

    // 1. Получаем заказ
    const { data: order, error: orderErr } = await supabase
      .from('bazzar_orders')
      .select('*')
      .eq('uniquecode', uniquecode)
      .maybeSingle();

    if (orderErr) {
      return NextResponse.json({ success: false, error: 'Database error checking order' }, { status: 500, headers })
    }

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Заказ не найден. Убедитесь, что вы правильно ввели уникальный код.' 
      }, { status: 404, headers })
    }

    if (order.status === 'linked') {
      return NextResponse.json({ 
        success: false, 
        error: 'Этот уникальный код уже привязан к другому устройству.' 
      }, { status: 400, headers })
    }

    await supabase.from('bazzar_users').upsert({
      udid: udid,
      status: 'bought',
      last_purchase: new Date().toISOString(),
      plan: order.item_name || 'Сертификат Digiseller'
    }, { onConflict: 'udid' })

    // 2. Меняем статус заказа
    await supabase.from('bazzar_orders').update({ status: 'linked', udid: udid }).eq('uniquecode', uniquecode)

    // 3. Отправляем в apple_certificates для CRM и Pachca бота
    await supabase.from('apple_certificates').insert({
      udid: udid,
      plan_id: order?.item_name || 'base',
      source: 'Digiseller',
      sale_price: order?.amount || 0
    });

    // 4. Фиксируем в финансах если транзакция ещё не записана
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .ilike('description', `%${uniquecode}%`)
      .maybeSingle();

    if (!existingTx && order.amount) {
      const txAmount = Math.max(Number(order.amount) || 0, 0.01);
      const { error: txErr } = await supabase.from('transactions').insert({
        date: new Date().toISOString().slice(0, 10),
        description: `Digiseller: ${order.item_name || 'Сертификат'} (код: ${uniquecode})`,
        category: 'revenue',
        type: 'income',
        amount: txAmount,
      });
      if (txErr) console.error('[Digiseller link] transactions insert failed:', txErr.message);
    }

    // 5. Уведомление в Пачку
    await supabase.from('notifications').insert({
      user_id: 'digiseller-system',
      type: 'mention',
      title: 'Digiseller: UDID привязан',
      body: `✅ **UDID привязан!**\nТовар: ${order.item_name || '—'}\nUDID: \`${udid.slice(0, 8)}...\`\nКод: \`${uniquecode}\``,
      link: '/finances'
    }).then(({ error: notifErr }) => {
      if (notifErr) console.error('[Digiseller link] notifications insert failed:', notifErr.message);
    });

    return NextResponse.json({ success: true }, { headers })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  } })
}
