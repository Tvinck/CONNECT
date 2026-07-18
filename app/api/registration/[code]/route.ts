import { NextResponse } from 'next/server'
import { getShopCorsHeaders } from '@/lib/cors'
import { createAdminClient } from '@/lib/supabase/admin'

// Публичное чтение заявки на ручную регистрацию по коду — для страницы-ссылки
// на bazzar-serts. Отдаём ТОЛЬКО безопасный субсет (тариф, цена, статус, есть ли
// udid). Никаких api_cost / created_by / внутренних данных.

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: getShopCorsHeaders(request.headers.get('origin')) })
}

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const headers = getShopCorsHeaders(request.headers.get('origin'))
  const code = params.code

  if (!code) {
    return NextResponse.json({ success: false, error: 'code required' }, { status: 400, headers })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('manual_registrations')
    .select('platform, guarantee_months, price, status, udid, extra_info')
    .eq('code', code)
    .maybeSingle()

  if (error) {
    console.error('[registration:get] DB error:', error.message)
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500, headers })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Заявка не найдена' }, { status: 404, headers })
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        platform: data.platform,
        guaranteeMonths: data.guarantee_months,
        price: data.price,
        status: data.status,
        hasUdid: !!data.udid,
        extraInfo: data.extra_info || null,
      },
    },
    { headers }
  )
}
