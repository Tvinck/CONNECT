-- Add invoice_id and source columns to bazzar_orders
-- invoice_id: GGSel invoice ID (may differ from uniquecode)
-- source: where the order came from (ggsel_sync, ggsel_verify, digiseller_verify, etc.)

ALTER TABLE bazzar_orders 
  ADD COLUMN IF NOT EXISTS invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Index for faster lookups by invoice_id
CREATE INDEX IF NOT EXISTS idx_bazzar_orders_invoice_id 
  ON bazzar_orders(invoice_id) 
  WHERE invoice_id IS NOT NULL;

-- Enable Realtime for bazzar_orders (for pachca_bot subscriptions)
ALTER PUBLICATION supabase_realtime ADD TABLE bazzar_orders;

-- Ensure replica identity is FULL for UPDATE old record tracking
ALTER TABLE bazzar_orders REPLICA IDENTITY FULL;
