import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniquecode = searchParams.get('uniquecode')

  // CORS headers for bazzar-certs
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (!uniquecode) {
    return NextResponse.json({ success: false, error: 'Код заказа не указан' }, { status: 400, headers })
  }

  // 1. Пытаемся найти заказ в базе, который был создан вебхуком
  const { data: order, error } = await supabase
    .from('bazzar_orders')
    .select('*')
    .eq('uniquecode', uniquecode)
    .maybeSingle()

  if (order) {
    return NextResponse.json({
      success: true,
      item_name: order.item_name || 'Сертификат Apple ESign',
      uniquecode: uniquecode,
      status: order.status || 'paid'
    }, { headers })
  } else {
    // Если заказ еще не долетел от вебхука
    return NextResponse.json({
      success: false,
      error: 'Заказ еще не обработан системой или не существует. Ожидайте...'
    }, { status: 404, headers })
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
