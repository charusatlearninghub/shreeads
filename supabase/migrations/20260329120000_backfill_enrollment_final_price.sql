-- Fill missing enrollment pricing from live promo_codes row (code.promo_price)
UPDATE public.enrollments e
SET
  course_name = COALESCE(e.course_name, c.title),
  original_price = COALESCE(
    e.original_price,
    CASE
      WHEN c.is_free IS TRUE THEN 0
      ELSE COALESCE(c.discount_price, c.price, 0)
    END
  ),
  promo_code = COALESCE(e.promo_code, pc.code),
  promo_price = COALESCE(e.promo_price, pc.promo_price, 0),
  final_price_paid = COALESCE(e.final_price_paid, pc.promo_price, 0)
FROM public.promo_codes pc,
     public.courses c
WHERE e.promo_code_id = pc.id
  AND e.course_id = c.id
  AND e.final_price_paid IS NULL;

-- Sync usage audit rows from enrollments when pricing was missing on usage only
UPDATE public.promo_code_usage u
SET
  original_price_at_purchase = e.original_price,
  promo_price = e.promo_price,
  final_price_paid = e.final_price_paid
FROM public.enrollments e
WHERE e.promo_code_id = u.promo_code_id
  AND e.user_id = u.user_id
  AND u.final_price_paid IS NULL
  AND e.final_price_paid IS NOT NULL;
