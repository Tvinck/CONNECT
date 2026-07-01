import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniquecode = searchParams.get('uniquecode')

  // CORS headers for bazzar-certs
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  if (!uniquecode) {
    return NextResponse.json({ success: false, error: 'Код заказа не указан' }, { status: 400, headers })
  }

  // Placeholder logic until GGSel API is connected
  // Here we would normally query GGSel API to check the order status
  return NextResponse.json({
    success: true,
    item_name: 'Сертификат Apple ESign (Автовыдача)',
    uniquecode: uniquecode,
    status: 'paid'
  }, { headers })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  })
}
