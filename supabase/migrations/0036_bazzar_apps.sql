-- Create the bazzar_apps table
CREATE TABLE IF NOT EXISTS public.bazzar_apps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  description text,
  icon_url text,
  ipa_url text,
  bundle_id text,
  size_bytes bigint,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bazzar_apps ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active apps
CREATE POLICY "Allow public read access to active apps"
  ON public.bazzar_apps
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to manage all apps
CREATE POLICY "Allow authenticated users to manage apps"
  ON public.bazzar_apps
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bazzar_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bazzar_apps_updated_at
  BEFORE UPDATE ON public.bazzar_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_bazzar_apps_updated_at();

-- Add the bazzar-apps storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bazzar-apps',
  'bazzar-apps',
  true,
  1073741824, -- 1 GB limit
  ARRAY['application/octet-stream', 'application/x-ios-app', 'image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
-- Allow public to read/download files
CREATE POLICY "Allow public to read apps"
ON storage.objects FOR SELECT
USING ( bucket_id = 'bazzar-apps' );

-- Allow authenticated to upload/manage
CREATE POLICY "Allow authenticated to manage apps"
ON storage.objects FOR ALL
USING ( auth.role() = 'authenticated' AND bucket_id = 'bazzar-apps' );
