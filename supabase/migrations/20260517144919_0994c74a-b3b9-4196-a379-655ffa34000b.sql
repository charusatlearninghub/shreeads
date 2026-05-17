create or replace function public.get_course_lesson_count(_course_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.lessons where course_id = _course_id
$$;

create or replace function public.get_course_total_duration(_course_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(duration_seconds), 0)::int from public.lessons where course_id = _course_id
$$;

grant execute on function public.get_course_lesson_count(uuid) to anon, authenticated;
grant execute on function public.get_course_total_duration(uuid) to anon, authenticated;