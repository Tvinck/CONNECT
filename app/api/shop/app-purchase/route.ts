/***
 * POST /api/shop/app-purchase
 *
 * Покупка / бесплатная установка приложения.
 * Accepts: { appId, udid, email?, paymentMethod? }
 * Free → создаёт запись status:'free', returns { success: true }
 * Paid → создаёт платёж T-Bank, returns { success: true, paymentUrl }
 */

import { NextRequest, NextResponse } from 'next/server'
import { computeTbankToken, tbankInit } from '@/lib/tbank'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

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
    const { appId, udid, email, paymentMethod } = body

    if (!appId || !udid) {
      return NextResponse.json(
        { success: false, error: 'appId и udid обязательны' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // Загружаем приложение
    const { data: app, error: appErr } = await supabase
      .from('bazzar_apps')
      .select('id, name, price, ipa_url, is_active')
      .eq('id', appId)
      .maybeSingle()

    if (appErr || !app) {
      return NextResponse.json(
        { success: false, error: 'Приложение не найдено' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Проверка: уже куплено?
    const { data: existing } = await supabase
      .from('user_app_purchases')
      .select('id, status')
      .eq('udid', udid)
      .eq('app_id', appId)
      .in('status', ['paid', 'free'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { success: true, alreadyOwned: true },
        { headers: corsHeaders }
      )
    }

    const price = Number(app.price) || 0

    // ── Бесплатное приложение ──
    if (price === 0) {
      await supabase.from('user_app_purchases').insert({
        udid,
        app_id: appId,
        status: 'free',
        amount: 0,
        order_code: `app_free_${Date.now()}`,
      })

      return NextResponse.json(
        { success: true, free: true },
        { headers: corsHeaders }
      )
    }

    // ── Платное — создаём платёж T-Bank ──
    const terminalKey = process.env.TBANK_TERMINAL_KEY
    const password = process.env.TBANK_PASSWORD
    if (!terminalKey || !password) {
      return NextResponse.json(
        { success: false, error: 'Платёжная система не настроена' },
        { status: 500, headers: corsHeaders }
      )
    }

    const orderCode = `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Создаём запись покупки
    await supabase.from('user_app_purchases').insert({
      udid,
      app_id: appId,
      status: 'pending',
      amount: price,
      order_code: orderCode,
    })

    // T-Bank Init
    const amountKopeks = Math.round(price * 100)
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://connect-4va6.vercel.app'

    const initParams: Record<string, unknown> = {
      TerminalKey: terminalKey,
      Amount: amountKopeks,
      OrderId: orderCode,
      Description: `Приложение: ${app.name}`,
      NotificationURL: `${base}/api/webhooks/tbank`,
      SuccessURL: 'https://bazzar-serts.shop/cabinet?tab=apps',
      FailURL: 'https://bazzar-serts.shop/cabinet?tab=apps',
    }

    const Token = computeTbankToken(initParams, password)

    const fullPayload = {
      ...initParams,
      Token,
      Receipt: email ? {
        Email: email,
        Taxation: process.env.TBANK_TAXATION || 'usn_income',
        Items: [{
          Name: `Приложение: ${app.name}`,
          Price: amountKopeks,
          Quantity: 1,
          Amount: amountKopeks,
          Tax: process.env.TBANK_VAT || 'none',
          PaymentMethod: 'full_payment',
          PaymentObject: 'service',
        }],
      } : undefined,
      DATA: {
        udid,
        appId,
        email: email || undefined,
      },
    }

    const result = await tbankInit(fullPayload)

    if (result.Success && result.PaymentURL) {
      if (result.PaymentId) {
        await supabase
          .from('user_app_purchases')
          .update({ payment_id: result.PaymentId })
          .eq('order_code', orderCode)
      }

      return NextResponse.json(
        { success: true, paymentUrl: result.PaymentURL, orderId: orderCode },
        { headers: corsHeaders }
      )
    } else {
      return NextResponse.json(
        { success: false, error: result.Message || 'Ошибка создания платежа' },
        { status: 500, headers: corsHeaders }
      )
    }
  } catch (err: any) {
    console.error('[app-purchase] error:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500, headers: corsHeaders }
    )
  }
}
