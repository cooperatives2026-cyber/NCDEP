/*
# NCDEP Phase 1 - Storage Setup

This migration creates the storage bucket for image uploads and sets up the appropriate policies.

## Storage Bucket
- `images` - Public bucket for cooperative logos, cover images, and product images

## Security
- Public read access for all images
- Authenticated users can upload images
- Users can only delete their own uploaded images (based on metadata)
*/

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Policy for public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Policy for authenticated uploads
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Policy for users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
