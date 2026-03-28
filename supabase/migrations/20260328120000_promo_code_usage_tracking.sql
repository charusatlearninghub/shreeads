-- Course promo code usage audit trail (one row per redemption)
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  promo_code TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_code_usage_promo_code_id ON public.promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);

ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view course promo code usage"
  ON public.promo_code_usage FOR SELECT
  USING (public.is_admin());

-- Software promo code usage audit trail
CREATE TABLE public.software_promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_promo_code_id UUID NOT NULL REFERENCES public.software_promo_codes(id) ON DELETE CASCADE,
  promo_code TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  product_id UUID NOT NULL REFERENCES public.software_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_software_promo_code_usage_code_id ON public.software_promo_code_usage(software_promo_code_id);
CREATE INDEX idx_software_promo_code_usage_user_id ON public.software_promo_code_usage(user_id);

ALTER TABLE public.software_promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view software promo code usage"
  ON public.software_promo_code_usage FOR SELECT
  USING (public.is_admin());

-- Backfill course promo usage from existing redeemed codes
INSERT INTO public.promo_code_usage (
  promo_code_id,
  promo_code,
  user_id,
  user_name,
  user_email,
  course_id,
  course_name,
  used_at
)
SELECT
  pc.id,
  pc.code,
  pc.used_by,
  COALESCE(prof.full_name, ''),
  COALESCE(prof.email, ''),
  pc.course_id,
  c.title,
  COALESCE(pc.used_at, pc.created_at)
FROM public.promo_codes pc
JOIN public.courses c ON c.id = pc.course_id
LEFT JOIN public.profiles prof ON prof.id = pc.used_by
WHERE pc.is_used = true
  AND pc.used_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.promo_code_usage u WHERE u.promo_code_id = pc.id
  );

-- Backfill software promo usage
INSERT INTO public.software_promo_code_usage (
  software_promo_code_id,
  promo_code,
  user_id,
  user_name,
  user_email,
  product_id,
  product_name,
  used_at
)
SELECT
  spc.id,
  spc.code,
  spc.used_by,
  COALESCE(prof.full_name, ''),
  COALESCE(prof.email, ''),
  spc.product_id,
  p.title,
  COALESCE(spc.used_at, spc.created_at)
FROM public.software_promo_codes spc
JOIN public.software_products p ON p.id = spc.product_id
LEFT JOIN public.profiles prof ON prof.id = spc.used_by
WHERE spc.is_used = true
  AND spc.used_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.software_promo_code_usage u WHERE u.software_promo_code_id = spc.id
  );
