-- ============================================================================
-- CONNECT — Add CRM approval fields to apple_certificates (0034)
-- ============================================================================

alter table public.apple_certificates
  add column if not exists crm_status text not null default 'pending', -- 'pending', 'in_progress', 'approved', 'rejected'
  add column if not exists approver_id uuid, -- reference to users
  add column if not exists approval_comment text;
