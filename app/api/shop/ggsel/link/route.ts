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

    // Placeholder: In a real integration, we'd check if uniquecode is valid and not already linked
    // and then update bazzar_users / apple_certificates in DB

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
      plan: order.item_name || 'Сертификат GGSel'
    }, { onConflict: 'udid' })

    // 2. Меняем статус заказа
    await supabase.from('bazzar_orders').update({ status: 'linked', udid: udid }).eq('uniquecode', uniquecode)

    // 3. Отправляем в apple_certificates для CRM и Pachca бота
    await supabase.from('apple_certificates').insert({
      udid: udid,
      plan_id: order?.item_name || 'base',
      source: 'GGSel',
      sale_price: order?.amount || 0
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
