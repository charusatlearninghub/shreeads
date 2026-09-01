CREATE OR REPLACE FUNCTION public.get_public_platform_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'active_students', (SELECT count(*) FROM public.profiles),
    'video_lessons', (SELECT count(*) FROM public.lessons),
    'expert_courses', (SELECT count(*) FROM public.courses WHERE COALESCE(is_published, true) = true)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated;