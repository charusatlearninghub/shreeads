-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON public.certificates
FOR SELECT
USING (user_id = auth.uid() OR is_admin());

-- Only system (via edge function) can insert certificates
CREATE POLICY "System can insert certificates"
ON public.certificates
FOR INSERT
WITH CHECK (true);

-- Admins can manage certificates
CREATE POLICY "Admins can manage certificates"
ON public.certificates
FOR ALL
USING (is_admin());

-- Create function to check if user completed all lessons in a course
CREATE OR REPLACE FUNCTION public.has_completed_course(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN (SELECT COUNT(*) FROM public.lessons WHERE course_id = _course_id) = 0 THEN false
      ELSE (
        SELECT COUNT(*) = (SELECT COUNT(*) FROM public.lessons WHERE course_id = _course_id)
        FROM public.lesson_progress lp
        JOIN public.lessons l ON l.id = lp.lesson_id
        WHERE lp.user_id = _user_id
          AND l.course_id = _course_id
          AND lp.is_completed = true
      )
    END
$$;

-- Create function to generate unique certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FOR 8));
  RETURN cert_number;
END;
$$;