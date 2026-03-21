-- Add ekyc_enrolled column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ekyc_enrolled boolean DEFAULT false;

-- Create ekyc-media storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ekyc-media', 
  'ekyc-media', 
  false, 
  10485760,
  ARRAY['image/jpeg', 'image/png', 'audio/wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for ekyc-media bucket
CREATE POLICY "Users can upload own ekyc media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ekyc-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own ekyc media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ekyc-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own ekyc media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ekyc-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'ekyc-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);