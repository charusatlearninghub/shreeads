
-- Make previously-public buckets private. Files remain accessible via signed URLs
-- or via explicit public-read RLS policies on storage.objects, but the bucket
-- listing endpoint (which allowed enumeration) is no longer publicly accessible.
UPDATE storage.buckets SET public = false WHERE id IN ('course-videos', 'certificate-templates', 'certificates', 'certificate-fonts');

-- Allow public READ (download by exact path) on these buckets so existing
-- <img src> and <a href> URLs keep working, but block listing.
DROP POLICY IF EXISTS "Public read course-videos" ON storage.objects;
CREATE POLICY "Public read course-videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-videos');

DROP POLICY IF EXISTS "Public read certificate-templates" ON storage.objects;
CREATE POLICY "Public read certificate-templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-templates');

DROP POLICY IF EXISTS "Public read certificates" ON storage.objects;
CREATE POLICY "Public read certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Public read certificate-fonts" ON storage.objects;
CREATE POLICY "Public read certificate-fonts"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-fonts');

-- Admin-only write/update/delete for these buckets
DROP POLICY IF EXISTS "Admins manage course-videos" ON storage.objects;
CREATE POLICY "Admins manage course-videos"
ON storage.objects FOR ALL
USING (bucket_id = 'course-videos' AND public.is_admin())
WITH CHECK (bucket_id = 'course-videos' AND public.is_admin());

DROP POLICY IF EXISTS "Admins manage certificate-templates" ON storage.objects;
CREATE POLICY "Admins manage certificate-templates"
ON storage.objects FOR ALL
USING (bucket_id = 'certificate-templates' AND public.is_admin())
WITH CHECK (bucket_id = 'certificate-templates' AND public.is_admin());

DROP POLICY IF EXISTS "Admins manage certificates" ON storage.objects;
CREATE POLICY "Admins manage certificates"
ON storage.objects FOR ALL
USING (bucket_id = 'certificates' AND public.is_admin())
WITH CHECK (bucket_id = 'certificates' AND public.is_admin());

DROP POLICY IF EXISTS "Admins manage certificate-fonts" ON storage.objects;
CREATE POLICY "Admins manage certificate-fonts"
ON storage.objects FOR ALL
USING (bucket_id = 'certificate-fonts' AND public.is_admin())
WITH CHECK (bucket_id = 'certificate-fonts' AND public.is_admin());

-- Enable required extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Internal scheduler-callable cleanup (bypasses admin check). The admin-callable
-- function public.cleanup_old_software_downloads remains for manual UI runs.
CREATE OR REPLACE FUNCTION public.cleanup_old_software_downloads_scheduled()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.software_downloads
  WHERE downloaded_at < now() - interval '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Schedule daily at 03:15 UTC. Unschedule any prior job with the same name first.
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-old-software-downloads-daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-software-downloads-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-old-software-downloads-daily',
  '15 3 * * *',
  $$ SELECT public.cleanup_old_software_downloads_scheduled(); $$
);
