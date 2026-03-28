-- Run in Supabase SQL Editor after deploy (Dashboard → SQL → New query).
-- Safe backfill: join on promo_code_id + user_id (same redemption as edge function).

-- 1) Backfill promo_code_usage.paid_amount from enrollments (NULL only)
UPDATE public.promo_code_usage u
SET
  paid_amount = COALESCE(
    NULLIF(u.paid_amount, 0),
    NULLIF(u.final_price_paid, 0),
    NULLIF(e.final_price_paid, 0),
    NULLIF(e.promo_price, 0),
    pc.promo_price,
    0
  ),
  final_price_paid = COALESCE(
    NULLIF(u.final_price_paid, 0),
    NULLIF(e.final_price_paid, 0),
    NULLIF(e.promo_price, 0),
    pc.promo_price,
    0
  ),
  promo_price = COALESCE(
    NULLIF(u.promo_price, 0),
    NULLIF(e.promo_price, 0),
    pc.promo_price,
    0
  )
FROM public.enrollments e
JOIN public.promo_codes pc ON pc.id = u.promo_code_id
WHERE e.promo_code_id = u.promo_code_id
  AND e.user_id = u.user_id
  AND (
    u.paid_amount IS NULL
    OR u.paid_amount = 0
    OR u.final_price_paid IS NULL
    OR u.final_price_paid = 0
  );

-- 2) Verify promo usage (expect no NULL paid_amount for rows tied to enrollments with amounts)
SELECT
  u.promo_code,
  u.paid_amount,
  u.final_price_paid,
  u.used_at
FROM public.promo_code_usage u
ORDER BY u.used_at DESC
LIMIT 100;

-- 3) Verify enrollments (promo rows should have final_price_paid set after redemption)
SELECT
  e.course_id,
  e.promo_code_id,
  e.payment_type,
  e.final_price_paid,
  e.promo_price,
  e.original_price,
  e.enrolled_at
FROM public.enrollments e
WHERE e.promo_code_id IS NOT NULL
ORDER BY e.enrolled_at DESC
LIMIT 100;

-- 4) Quick sanity: counts of NULL paid fields on promo rows
SELECT
  COUNT(*) FILTER (WHERE promo_code_id IS NOT NULL AND final_price_paid IS NULL) AS enrollments_null_final_price,
  COUNT(*) FILTER (WHERE promo_code_id IS NOT NULL) AS promo_enrollments_total
FROM public.enrollments;

SELECT
  COUNT(*) FILTER (WHERE paid_amount IS NULL) AS usage_null_paid,
  COUNT(*) AS usage_total
FROM public.promo_code_usage;
