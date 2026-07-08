import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Маппинг invoice_state → читаемый статус
function mapInvoiceState(state: number): { label: string; color: 'green' | 'yellow' | 'red' | 'gray' } {
  switch (state) {
    case 0: return { label: 'Ожидает оплаты', color: 'yellow' }
    case 1: return { label: 'Оплачен', color: 'green' }
    case 2: return { label: 'Возврат', color: 'red' }
    case 3: return { label: 'Завершён', color: 'green' }
    case 4: return { label: 'Отменён', color: 'red' }
    default: return { label: 'Неизвестно', color: 'gray' }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId required' }, { status: 400, headers: corsHeaders })
  }

  const sellerId = process.env.GGSEL_SELLER_ID
  const apiKey = process.env.GGSEL_API_KEY

  if (!sellerId || !apiKey) {
    return NextResponse.json({ success: false, error: 'GGSel credentials missing' }, { status: 500, headers: corsHeaders })
  }

  try {
    // Парсим id_i из fake UUID: 00000000-0000-0000-0000-000037603757
    const parts = userId.split('-')
    const id_i_str = parts[parts.length - 1]
    const id_i = parseInt(id_i_str, 10)

    if (isNaN(id_i) || id_i <= 0) {
      return NextResponse.json({ success: false, error: 'Not a GGSel order (invalid id_i)' }, { headers: corsHeaders })
    }

    // Авторизация в GGSel
    const timestamp = Date.now().toString()
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex')

    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ seller_id: parseInt(sellerId, 10), timestamp, sign })
    })

    if (!loginRes.ok) throw new Error('GGSel auth failed')
    const { token } = await loginRes.json()
    if (!token) throw new Error('No token received')

    // Получаем детали заказа
    const orderRes = await fetch(
      `https://seller.ggsel.com/api_sellers/api/purchase/info/${id_i}?token=${token}`,
      { headers: { 'Accept': 'application/json', 'locale': 'ru' } }
    )

    if (!orderRes.ok) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { headers: corsHeaders })
    }

    const orderData = await orderRes.json()
    if (orderData.retval !== 0) {
      return NextResponse.json({ success: false, error: orderData.retdesc || 'GGSel error' }, { headers: corsHeaders })
    }

    const c = orderData.content

    // Также получаем имя товара
    let productName = c.name || ''
    try {
      const prodRes = await fetch(
        `https://seller.ggsel.com/api_sellers/api/products/${c.item_id}/data?token=${token}`,
        { headers: { 'Accept': 'application/json' } }
      )
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        if (prodData.product?.name) productName = prodData.product.name
      }
    } catch { /* ignore */ }

    const statusInfo = mapInvoiceState(c.invoice_state)

    // Нормализованный ответ
    const details = {
      platform: 'ggsel',
      platformLabel: 'GGSel',
      orderId: id_i,
      productName,
      productId: String(c.item_id),
      buyerEmail: c.buyer_info?.email,
      buyerIp: c.buyer_info?.ip_address,
      paymentMethod: c.buyer_info?.payment_method,
      paymentAggregator: c.buyer_info?.payment_aggregator,
      status: statusInfo.label,
      statusColor: statusInfo.color,
      amount: c.amount,
      currency: c.currency_type,
      profit: c.profit,
      createdAt: c.purchase_date,
      paidAt: c.date_pay,
      options: c.options || [],
      lockState: c.lock_state,
      orderUrl: `https://seller.ggsel.com/seller/invoices/details/${id_i}`,
    }

    return NextResponse.json({ success: true, data: details }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('Order details error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders })
  }
}
