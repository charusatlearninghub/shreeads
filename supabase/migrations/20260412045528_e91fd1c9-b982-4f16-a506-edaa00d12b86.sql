
-- 1. Add promo_price to promo_codes
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS promo_price numeric DEFAULT 0;

-- 2. Add revenue tracking columns to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS final_price_paid numeric DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS promo_price numeric DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT 0;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS course_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'direct';

-- 3. Create promo_code_usage table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  promo_code text NOT NULL,
  user_id uuid NOT NULL,
  user_name text,
  user_email text,
  course_id uuid REFERENCES public.courses(id),
  course_name text,
  original_price_at_purchase numeric DEFAULT 0,
  promo_price numeric DEFAULT 0,
  final_price_paid numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promo code usage"
  ON public.promo_code_usage FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users can view own usage"
  ON public.promo_code_usage FOR SELECT
  USING (user_id = auth.uid());

-- 4. Backfill existing used promo codes: set promo_price = 0 where NULL
UPDATE public.promo_codes SET promo_price = 0 WHERE promo_price IS NULL;
