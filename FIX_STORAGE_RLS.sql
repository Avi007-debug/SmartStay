-- Fix Storage RLS Policies for PG Images Upload
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies for pg-images bucket (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload pg images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view pg images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own pg images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own pg images" ON storage.objects;

-- 3. Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload pg images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pg-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create policy to allow public read access to pg images
CREATE POLICY "Allow public to view pg images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pg-images');

-- 5. Create policy to allow users to delete their own pg images
CREATE POLICY "Allow users to delete their own pg images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pg-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Create policy to allow users to update their own pg images
CREATE POLICY "Allow users to update their own pg images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pg-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Verify bucket exists and is public
UPDATE storage.buckets
SET public = true
WHERE id = 'pg-images';

-- 8. Also fix profile-pictures bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile pictures" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow public to view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Allow users to delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

UPDATE storage.buckets
SET public = true
WHERE id = 'profile-pictures';

-- 9. Also fix verification-docs bucket (private)
DROP POLICY IF EXISTS "Allow authenticated users to upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own verification docs" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to view their own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own verification docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verification docs bucket should be private
UPDATE storage.buckets
SET public = false
WHERE id = 'verification-docs';

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;
