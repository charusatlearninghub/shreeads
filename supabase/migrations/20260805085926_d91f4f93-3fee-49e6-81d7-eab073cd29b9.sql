ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_upcoming boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS launch_date timestamptz,
  ADD COLUMN IF NOT EXISTS preview_lesson_limit integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS preview_seconds_limit integer NOT NULL DEFAULT 300;

CREATE TABLE IF NOT EXISTS public.course_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  full_name text,
  phone text,
  status text NOT NULL DEFAULT 'waiting',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS course_waitlist_course_email_key
  ON public.course_waitlist (course_id, lower(email));

GRANT SELECT, INSERT ON public.course_waitlist TO authenticated;
GRANT INSERT ON public.course_waitlist TO anon;
GRANT ALL ON public.course_waitlist TO service_role;

ALTER TABLE public.course_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join a waitlist"
  ON public.course_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "Users can view their own waitlist entries"
  ON public.course_waitlist FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all waitlist entries"
  ON public.course_waitlist FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update waitlist entries"
  ON public.course_waitlist FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete waitlist entries"
  ON public.course_waitlist FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT UPDATE, DELETE ON public.course_waitlist TO authenticated;

CREATE TRIGGER update_course_waitlist_updated_at
  BEFORE UPDATE ON public.course_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();