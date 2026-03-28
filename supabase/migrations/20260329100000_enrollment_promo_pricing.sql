-- Price charged when a course promo code is redeemed (revenue)
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.promo_codes.promo_price IS 'Amount (₹) paid when this code is redeemed';

-- Price charged when a software promo code is redeemed
ALTER TABLE public.software_promo_codes
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Snapshot on enrollment (immutable after insert)
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS course_name TEXT,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS final_price_paid NUMERIC(12, 2);

COMMENT ON COLUMN public.enrollments.original_price IS 'Course selling price at enrollment (discount_price or price)';
COMMENT ON COLUMN public.enrollments.final_price_paid IS 'Revenue attributed to this enrollment';

-- Usage audit pricing
ALTER TABLE public.promo_code_usage
  ADD COLUMN IF NOT EXISTS original_price_at_purchase NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS final_price_paid NUMERIC(12, 2);

ALTER TABLE public.software_promo_code_usage
  ADD COLUMN IF NOT EXISTS original_price_at_purchase NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS promo_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS final_price_paid NUMERIC(12, 2);

-- Backfill enrollments from courses + promo_codes
UPDATE public.enrollments e
SET
  course_name = c.title,
  original_price = CASE
    WHEN c.is_free IS TRUE THEN 0
    ELSE COALESCE(c.discount_price, c.price, 0)
  END,
  promo_code = pc.code,
  promo_price = COALESCE(pc.promo_price, 0),
  final_price_paid = COALESCE(pc.promo_price, 0)
FROM public.courses c
INNER JOIN public.promo_codes pc ON pc.id = e.promo_code_id
WHERE e.course_id = c.id
  AND e.promo_code_id IS NOT NULL
  AND (
    e.final_price_paid IS NULL
    OR e.course_name IS NULL
    OR e.original_price IS NULL
  );

UPDATE public.enrollments e
SET
  course_name = COALESCE(e.course_name, c.title),
  original_price = COALESCE(
    e.original_price,
    CASE WHEN c.is_free IS TRUE THEN 0 ELSE COALESCE(c.discount_price, c.price, 0) END
  ),
  final_price_paid = COALESCE(
    e.final_price_paid,
    CASE WHEN c.is_free IS TRUE THEN 0 ELSE COALESCE(c.discount_price, c.price, 0) END
  )
FROM public.courses c
WHERE e.course_id = c.id
  AND e.promo_code_id IS NULL
  AND (
    e.final_price_paid IS NULL
    OR e.course_name IS NULL
    OR e.original_price IS NULL
  );

-- Align software promo purchase amounts with code promo_price (legacy ₹0 rows)
UPDATE public.software_purchases sp
SET amount_paid = COALESCE(spc.promo_price, 0)
FROM public.software_promo_codes spc
WHERE sp.user_id = spc.used_by
  AND sp.product_id = spc.product_id
  AND sp.payment_method = 'promo_code'
  AND (sp.amount_paid IS NULL OR sp.amount_paid = 0);

-- Backfill promo_code_usage from enrollments
UPDATE public.promo_code_usage u
SET
  original_price_at_purchase = e.original_price,
  promo_price = e.promo_price,
  final_price_paid = e.final_price_paid
FROM public.enrollments e
WHERE e.promo_code_id = u.promo_code_id
  AND e.user_id = u.user_id
  AND (
    u.final_price_paid IS NULL
    OR u.original_price_at_purchase IS NULL
  );
