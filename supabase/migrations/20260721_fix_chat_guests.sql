-- Fix: chat guests — separate from vpn_subscriptions
-- Creates dedicated chat_guests table with auto-incrementing guest numbers
-- Fixes false "Veil VPN subscription" notifications

CREATE TABLE IF NOT EXISTS chat_guests (
  id text PRIMARY KEY,
  guest_number serial UNIQUE,
  udid text,
  display_name text DEFAULT 'Гость',
  device_info text,
  current_page text,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

ALTER TABLE chat_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_guests_anon_insert" ON chat_guests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "chat_guests_anon_select" ON chat_guests FOR SELECT TO anon USING (true);
CREATE POLICY "chat_guests_service" ON chat_guests FOR ALL TO service_role USING (true);

-- Fix bazzar_support_message: use chat_guests instead of vpn_subscriptions
CREATE OR REPLACE FUNCTION bazzar_support_message(
  p_user_id text,
  p_message text,
  p_udid text DEFAULT NULL,
  p_device_info text DEFAULT NULL,
  p_current_page text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO chat_guests (id, udid, device_info, current_page, last_active_at)
  VALUES (p_user_id, p_udid, p_device_info, p_current_page, now())
  ON CONFLICT (id) DO UPDATE SET
    udid = COALESCE(EXCLUDED.udid, chat_guests.udid),
    device_info = COALESCE(EXCLUDED.device_info, chat_guests.device_info),
    current_page = COALESCE(EXCLUDED.current_page, chat_guests.current_page),
    last_active_at = now();

  INSERT INTO support_messages (user_id, is_from_user, message, project)
  VALUES (p_user_id, true, p_message, 'Bazzar Certs');
END;
$$;
