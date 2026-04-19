-- 1. Remove unused, sensitive 2FA secret column
ALTER TABLE public.user_preferences DROP COLUMN IF EXISTS two_factor_secret;
ALTER TABLE public.user_preferences DROP COLUMN IF EXISTS two_factor_enabled;

-- 2. Restrict software_downloads SELECT to admins only (was: user could see own)
DROP POLICY IF EXISTS "Users can view own downloads" ON public.software_downloads;

CREATE POLICY "Admins can view all downloads"
ON public.software_downloads
FOR SELECT
USING (is_admin());

-- 90-day retention cleanup function (admin-callable)
CREATE OR REPLACE FUNCTION public.cleanup_old_software_downloads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can run cleanup';
  END IF;

  DELETE FROM public.software_downloads
  WHERE downloaded_at < now() - interval '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 3. Allow users to UPDATE and DELETE their own device registrations
CREATE POLICY "Users can update own devices"
ON public.device_registrations
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own devices"
ON public.device_registrations
FOR DELETE
USING (user_id = auth.uid());