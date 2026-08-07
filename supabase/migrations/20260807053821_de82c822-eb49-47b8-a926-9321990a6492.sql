-- Certificate design assets: admin only
DROP POLICY IF EXISTS "Anyone can view certificate templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "Anyone can view certificate fonts" ON public.certificate_fonts;
CREATE POLICY "Admins can view certificate templates"
  ON public.certificate_templates FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admins can view certificate fonts"
  ON public.certificate_fonts FOR SELECT TO authenticated
  USING (public.is_admin());

-- Package items: only for active packages and published items
DROP POLICY IF EXISTS "Anyone can view package items" ON public.package_items;
CREATE POLICY "Anyone can view items of active packages"
  ON public.package_items FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_id AND p.is_active = true)
    AND (
      (item_type = 'course' AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = item_id AND c.is_published = true))
      OR (item_type = 'software' AND EXISTS (SELECT 1 FROM public.software_products s WHERE s.id = item_id AND s.is_published = true))
    )
  );

-- Promotion mappings: only active promotions on published items
DROP POLICY IF EXISTS "Anyone can view promotion courses" ON public.promotion_courses;
CREATE POLICY "Anyone can view active promotion courses"
  ON public.promotion_courses FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id AND p.is_active = true
        AND p.start_date <= now() AND p.end_date >= now()
    )
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true)
  );

DROP POLICY IF EXISTS "Anyone can view promotion software" ON public.promotion_software;
CREATE POLICY "Anyone can view active promotion software"
  ON public.promotion_software FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = promotion_id AND p.is_active = true
        AND p.start_date <= now() AND p.end_date >= now()
    )
    AND EXISTS (SELECT 1 FROM public.software_products s WHERE s.id = product_id AND s.is_published = true)
  );

-- Waitlist: require authentication and ownership
DROP POLICY IF EXISTS "Anyone can join a waitlist" ON public.course_waitlist;
CREATE POLICY "Signed-in users can join a waitlist"
  ON public.course_waitlist FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
REVOKE INSERT ON public.course_waitlist FROM anon;