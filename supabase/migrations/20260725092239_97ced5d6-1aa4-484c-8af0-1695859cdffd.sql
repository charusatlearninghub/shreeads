-- 1) SECURITY DEFINER function exposure: revoke broad EXECUTE, grant explicitly.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Grant EXECUTE to authenticated for user-callable RPCs
GRANT EXECUTE ON FUNCTION public.apply_as_affiliate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_package_promo(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_sponsor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referrals_detail() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_completed_course(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_purchased_software(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lesson_accessible(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Public catalog helpers (safe for anon on public pages)
GRANT EXECUTE ON FUNCTION public.get_course_lesson_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_course_total_duration(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_promotion_for_course(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_promotion_for_software(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- 2) signup_attempts: replace always-true INSERT with basic shape validation.
DROP POLICY IF EXISTS "Anyone can insert signup attempts" ON public.signup_attempts;
CREATE POLICY "Anyone can log signup attempts"
  ON public.signup_attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 320
    AND position('@' in email) > 1
  );

-- 3) Storage buckets: remove anonymous SELECT policies, keep admins.
DROP POLICY IF EXISTS "Anyone can view generated certificates" ON storage.objects;
DROP POLICY IF EXISTS "Public read certificates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certificate template images" ON storage.objects;
DROP POLICY IF EXISTS "Public read certificate-templates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certificate font files" ON storage.objects;
DROP POLICY IF EXISTS "Public read certificate-fonts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read course-videos" ON storage.objects;

-- Users can read only their own certificate PDFs (filename == certificate_number.pdf).
CREATE POLICY "Owners can view own certificate PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.user_id = auth.uid()
        AND storage.objects.name = c.certificate_number || '.pdf'
    )
  );

-- Certificate template + font design assets: readable by authenticated users
-- (renderer edge functions use service role and bypass RLS regardless).
CREATE POLICY "Authenticated users can read certificate templates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'certificate-templates');

CREATE POLICY "Authenticated users can read certificate fonts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'certificate-fonts');

-- Course videos: no direct client read. Streaming goes through the
-- get-video-url edge function which mints signed URLs via service_role.
-- Admin ALL policy already covers admin access.
