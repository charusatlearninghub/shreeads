CREATE POLICY "Admins manage course material files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'course-materials' AND public.is_admin())
WITH CHECK (bucket_id = 'course-materials' AND public.is_admin());

CREATE POLICY "Learners read course material files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = split_part(name, '/', 1)
      AND c.is_published = true
      AND (
        c.is_free = true
        OR c.price = 0
        OR public.is_enrolled(auth.uid(), c.id)
      )
  )
);