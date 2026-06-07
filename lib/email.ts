import { Resend } from 'resend'

// Set RESEND_API_KEY in your .env.local
// Set NOTIFY_EMAIL to the CEO's email address (e.g., artyom@bazzar.group)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'CONNECT <noreply@bazzar.group>'
const TO   = process.env.NOTIFY_EMAIL ?? ''

/** Send a notification email. Silently swallows errors — never throws. */
export async function sendEmail(subject: string, html: string) {
  if (!resend || !TO) return
  try {
    await resend.emails.send({ from: FROM, to: TO, subject, html })
  } catch {
    // Email failures must never crash the main flow
  }
}

// ── Templates ──────────────────────────────────────────────────────────────────

export function emailNewOrder(opts: {
  orderId: string
  email: string
  product: string
  amount: number
  recipient?: string
}) {
  return {
    subject: `💸 Новый заказ — ${opts.product} — ${opts.amount.toLocaleString('ru-RU')} ₽`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
        <h2 style="color:#1472F5">Новый заказ в ПодариМомент</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#666">Продукт</td><td style="padding:6px 0;font-weight:600">${opts.product}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Покупатель</td><td style="padding:6px 0">${opts.email}</td></tr>
          ${opts.recipient ? `<tr><td style="padding:6px 0;color:#666">Для кого</td><td style="padding:6px 0">${opts.recipient}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#666">Сумма</td><td style="padding:6px 0;font-weight:700;color:#22C55E">${opts.amount.toLocaleString('ru-RU')} ₽</td></tr>
          <tr><td style="padding:6px 0;color:#666">ID заказа</td><td style="padding:6px 0;font-family:monospace;font-size:12px">${opts.orderId}</td></tr>
        </table>
        <p style="margin-top:20px"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pm" style="background:#1472F5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Открыть в CONNECT</a></p>
      </div>
    `,
  }
}

export function emailStuckOrder(opts: { orderId: string; email: string; product: string; paidAt: string }) {
  return {
    subject: `⚠️ Зависший заказ — ${opts.product}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
        <h2 style="color:#F59E0B">Зависший заказ</h2>
        <p>Оплата прошла, но генерация не завершилась.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#666">Продукт</td><td style="padding:6px 0;font-weight:600">${opts.product}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Покупатель</td><td style="padding:6px 0">${opts.email}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Оплачен</td><td style="padding:6px 0">${new Date(opts.paidAt).toLocaleString('ru-RU')}</td></tr>
        </table>
        <p style="margin-top:20px"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pm" style="background:#F59E0B;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Открыть заказ</a></p>
      </div>
    `,
  }
}
