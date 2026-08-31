CREATE OR REPLACE FUNCTION public.get_public_platform_stats()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'active_students', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'student'::public.app_role),
    'video_lessons', (
      SELECT COUNT(*)
      FROM public.lessons AS lessons
      INNER JOIN public.courses AS courses ON courses.id = lessons.course_id
      WHERE courses.is_published = true
    ),
    'expert_courses', (SELECT COUNT(*) FROM public.courses WHERE is_published = true)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated;