-- ============================================================================
-- CONNECT — add support attachments storage bucket (0029)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public select on support-attachments" ON storage.objects;
CREATE POLICY "Allow public select on support-attachments" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'support-attachments');

DROP POLICY IF EXISTS "Allow public insert on support-attachments" ON storage.objects;
CREATE POLICY "Allow public insert on support-attachments" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'support-attachments');
