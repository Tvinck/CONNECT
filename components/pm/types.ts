export type PMProduct = {
  id: string
  name: string
  emoji: string
  description: string | null
  price: number
  cost: number
  is_active: boolean
  sort_order: number
  updated_at: string
}

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'
export type GenStatus     = 'pending' | 'processing' | 'done' | 'failed' | 'manual'

export type PMOrder = {
  id: string
  product_id: string | null
  client_email: string
  client_name: string | null
  amount: number
  recipient: string | null
  occasion: string | null
  message: string | null
  payment_status: PaymentStatus
  payment_id: string | null
  paid_at: string | null
  gen_status: GenStatus
  file_url: string | null
  gen_started_at: string | null
  gen_done_at: string | null
  sent_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  product: PMProduct | null
}

export type PMClient = {
  id: string
  email: string
  name: string | null
  source: 'pixel' | 'new'
  total_spent: number
  order_count: number
  last_order_at: string | null
  created_at: string
}

export type PMApiLog = {
  id: string
  service: string
  level: 'info' | 'warn' | 'error'
  message: string
  order_id: string | null
  created_at: string
}

// ── UI helpers ────────────────────────────────────────────────────────────────

export const PAY_LABEL: Record<PaymentStatus, string> = {
  pending:  'Ожидание',
  paid:     'Оплачен',
  refunded: 'Возврат',
  failed:   'Ошибка',
}

export const GEN_LABEL: Record<GenStatus, string> = {
  pending:    'Ожидание',
  processing: 'Генерация',
  done:       'Готов',
  failed:     'Ошибка',
  manual:     'Вручную',
}

export const PAY_COLOR: Record<PaymentStatus, string> = {
  pending:  '#8B92B4',
  paid:     '#22C55E',
  refunded: '#F59E0B',
  failed:   '#EF4444',
}

export const GEN_COLOR: Record<GenStatus, string> = {
  pending:    '#8B92B4',
  processing: '#00C2FF',
  done:       '#22C55E',
  failed:     '#EF4444',
  manual:     '#6F4FE8',
}

/** A stuck order: paid but gen is still pending/failed for >15min */
export function isStuck(order: PMOrder): boolean {
  if (order.payment_status !== 'paid') return false
  if (order.gen_status === 'done' || order.gen_status === 'manual') return false
  if (order.gen_status === 'processing') {
    const started = order.gen_started_at ? new Date(order.gen_started_at).getTime() : 0
    return Date.now() - started > 15 * 60 * 1000
  }
  // pending or failed after payment
  const paid = order.paid_at ? new Date(order.paid_at).getTime() : new Date(order.created_at).getTime()
  return Date.now() - paid > 15 * 60 * 1000
}
