-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-videos', 'course-videos', true, 524288000) -- 500MB limit
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload videos
CREATE POLICY "Admins can upload course videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-videos' 
  AND public.is_admin()
);

-- Allow admins to update videos
CREATE POLICY "Admins can update course videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-videos' 
  AND public.is_admin()
);

-- Allow admins to delete videos
CREATE POLICY "Admins can delete course videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-videos' 
  AND public.is_admin()
);

-- Allow anyone to view course videos (public bucket)
CREATE POLICY "Anyone can view course videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-videos');