import { NextResponse } from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { sendEmail, emailStuckOrder } from '@/lib/email'

// Called by Vercel CRON or any external scheduler (e.g. every 30 min).
// Protected by a shared secret in CRON_SECRET env var.
// Add to vercel.json:
//   { "crons": [{ "path": "/api/cron/stuck-orders", "schedule": "*/30 * * * *" }] }
//
// Orders are "stuck" when: payment_status = 'paid' AND gen_status IN ('pending','processing')
// AND gen_started_at is older than 15 minutes (or gen_started_at is null and paid_at > 15 min).

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  // Find stuck orders: paid but generation not done and started > 15 min ago (or never started)
  const { data: stuck, error } = await supabase
    .from('pm_orders')
    .select('id, client_email, paid_at, gen_started_at, product:pm_products(name)')
    .eq('payment_status', 'paid')
    .in('gen_status', ['pending', 'processing'])
    .or(`gen_started_at.is.null,gen_started_at.lt.${cutoff}`)
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { id: string; action: string }[] = []

  for (const order of stuck ?? []) {
    // Reset to pending so the generation worker picks it up again
    await supabase
      .from('pm_orders')
      .update({ gen_status: 'pending', gen_started_at: null })
      .eq('id', order.id)

    // Notify CEO
    const product = Array.isArray(order.product) ? order.product[0] : order.product
    const { subject, html } = emailStuckOrder({
      orderId: order.id,
      email:   order.client_email,
      product: product?.name ?? 'Неизвестный продукт',
      paidAt:  order.paid_at ?? order.gen_started_at ?? new Date().toISOString(),
    })
    await sendEmail(subject, html)

    results.push({ id: order.id, action: 'requeued' })
  }

  return NextResponse.json({ processed: results.length, orders: results })
}
