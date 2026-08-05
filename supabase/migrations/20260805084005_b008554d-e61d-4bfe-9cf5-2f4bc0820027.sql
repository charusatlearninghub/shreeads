-- 1. Revoke direct execute on internal RLS helper functions (still usable inside policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_enrolled(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_lesson_accessible(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_completed_course(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_purchased_software(uuid, uuid) FROM anon, authenticated;

-- 2. platform_settings: only non-sensitive keys readable by signed-in users
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
CREATE POLICY "Authenticated can read public platform settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (key IN (
    'site_name',
    'whatsapp_number',
    'watermark_opacity',
    'watermark_center_opacity',
    'maintenance_mode',
    'auto_approve_reviews'
  ));

-- 3. promo_code_usage: restrict to authenticated owner / admin only
DROP POLICY IF EXISTS "Users can view own usage" ON public.promo_code_usage;
DROP POLICY IF EXISTS "Admins can manage promo code usage" ON public.promo_code_usage;
CREATE POLICY "Users can view own promo usage"
  ON public.promo_code_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can manage promo code usage"
  ON public.promo_code_usage FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.promo_code_usage FROM anon;

-- 4. Storage: certificate templates/fonts readable by admins only
DROP POLICY IF EXISTS "Authenticated users can read certificate fonts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read certificate templates" ON storage.objects;
CREATE POLICY "Admins can read certificate fonts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificate-fonts' AND public.is_admin());
CREATE POLICY "Admins can read certificate templates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificate-templates' AND public.is_admin());