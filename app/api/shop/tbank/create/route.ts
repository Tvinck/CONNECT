/***
 * POST /api/shop/tbank/create
 *
 * Creates a T-Bank payment for BazzarSerts shop.
 * Accepts: amount, description, email, telegram, udid, paymentMethod, returnUrl
 * Returns: { success: true, paymentUrl: string } or { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { computeTbankToken, tbankInit } from '@/lib/tbank'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, description, email, telegram, udid, paymentMethod, returnUrl } = body

    if (!amount || !udid) {
      return NextResponse.json(
        { success: false, error: 'amount и udid обязательны' },
        { status: 400, headers: corsHeaders }
      )
    }

    const terminalKey = process.env.TBANK_TERMINAL_KEY
    const password = process.env.TBANK_PASSWORD
    if (!terminalKey || !password) {
      console.error('[tbank:create] TBANK_TERMINAL_KEY or TBANK_PASSWORD not set')
      return NextResponse.json(
        { success: false, error: 'Платёжная система не настроена' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Create order record in manual_registrations
    const supabase = createAdminClient()
    const code = `bs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const { error: regError } = await supabase.from('manual_registrations').insert({
      code,
      udid,
      email: email || null,
      telegram: telegram || null,
      price: Number(amount),
      platform: 'bazzar-serts',
      status: 'pending',
      guarantee_months: 12,
    })

    if (regError) {
      console.error('[tbank:create] registration insert error:', regError.message)
    }

    // Build T-Bank Init request
    const orderId = `mr_${code}`
    const amountKopeks = Math.round(Number(amount) * 100)
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://connect-4va6.vercel.app'

    const initParams: Record<string, unknown> = {
      TerminalKey: terminalKey,
      Amount: amountKopeks,
      OrderId: orderId,
      Description: description || 'Сертификат Apple',
      NotificationURL: `${base}/api/webhooks/tbank`,
      SuccessURL: returnUrl || 'https://bazzar-serts.shop/cabinet?tab=orders',
      FailURL: returnUrl || 'https://bazzar-serts.shop/cabinet?tab=orders',
    }

    const Token = computeTbankToken(initParams, password)

    const fullPayload = {
      ...initParams,
      Token,
      Receipt: {
        Email: email || undefined,
        Taxation: process.env.TBANK_TAXATION || 'usn_income',
        Items: [
          {
            Name: description || 'Сертификат Apple',
            Price: amountKopeks,
            Quantity: 1,
            Amount: amountKopeks,
            Tax: process.env.TBANK_VAT || 'none',
            PaymentMethod: 'full_payment',
            PaymentObject: 'service',
          },
        ],
      },
      DATA: {
        udid,
        email: email || undefined,
        telegram: telegram || undefined,
      },
    }

    const result = await tbankInit(fullPayload)

    if (result.Success && result.PaymentURL) {
      // Save payment ID to registration
      if (result.PaymentId) {
        await supabase
          .from('manual_registrations')
          .update({ payment_id: result.PaymentId })
          .eq('code', code)
      }

      return NextResponse.json(
        { success: true, paymentUrl: result.PaymentURL, orderId: code },
        { headers: corsHeaders }
      )
    } else {
      console.error('[tbank:create] init failed:', result)
      return NextResponse.json(
        { success: false, error: result.Message || result.Details || 'Ошибка создания платежа' },
        { status: 500, headers: corsHeaders }
      )
    }
  } catch (err: any) {
    console.error('[tbank:create] error:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500, headers: corsHeaders }
    )
  }
}
