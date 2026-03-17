-- Fix overly permissive INSERT policy - restrict to service role only
DROP POLICY IF EXISTS "System can insert certificates" ON public.certificates;

-- Certificates will be inserted via edge function using service role key
-- No direct insert policy needed for regular users