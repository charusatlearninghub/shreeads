-- Align enrollment + usage paid fields for promo redemptions (fixes legacy "Used" rows with NULL paid).
-- paid_amount on usage mirrors final_price_paid / promo_price on enrollment.

UPDATE public.enrollments e
SET
  promo_price = COALESCE(NULLIF(e.promo_price, 0), pc.promo_price, 0),
  final_price_paid = COALESCE(
    NULLIF(e.final_price_paid, 0),
    NULLIF(e.promo_price, 0),
    pc.promo_price,
    0
  ),
  payment_type = COALESCE(e.payment_type, 'promo_code')
FROM public.promo_codes pc
WHERE e.promo_code_id = pc.id
  AND e.promo_code_id IS NOT NULL
  AND (
    e.final_price_paid IS NULL
    OR e.final_price_paid = 0
  );

UPDATE public.promo_code_usage u
SET
  promo_price = COALESCE(NULLIF(u.promo_price, 0), NULLIF(e.promo_price, 0), pc.promo_price, 0),
  final_price_paid = COALESCE(NULLIF(u.final_price_paid, 0), NULLIF(e.final_price_paid, 0), pc.promo_price, 0),
  paid_amount = COALESCE(
    NULLIF(u.paid_amount, 0),
    NULLIF(u.final_price_paid, 0),
    NULLIF(e.final_price_paid, 0),
    u.promo_price,
    e.promo_price,
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
