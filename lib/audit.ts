import { createClient } from '@/lib/supabase/client'

export type AuditAction =
  | 'task.create' | 'task.update' | 'task.delete'
  | 'client.create' | 'client.update' | 'client.delete'
  | 'user.invite' | 'user.role_change'
  | 'order.refund' | 'order.manual_done' | 'order.restart'
  | 'promo.create' | 'promo.delete'
  | 'transaction.create' | 'transaction.delete'
  | 'shop.purchase'
  | 'profile.update'

interface LogParams {
  action: AuditAction
  entityType?: string
  entityId?: string
  meta?: Record<string, unknown>
}

/** Fire-and-forget audit log write from any client component. */
export async function auditLog({ action, entityType, entityId, meta }: LogParams) {
  try {
    const supabase = createClient()
    await supabase.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      meta,
    })
  } catch {
    // Never throw — audit logging must never break the main flow
  }
}
