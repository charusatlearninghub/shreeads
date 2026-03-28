-- Backfill promo_code_usage from enrollments when usage rows are missing
-- (e.g. codes redeemed before usage tracking or failed usage insert).
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
  e.promo_code_id,
  pc.code,
  e.user_id,
  COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(SPLIT_PART(COALESCE(p.email, ''), '@', 1), ''),
    'User'
  ),
  COALESCE(p.email, ''),
  e.course_id,
  c.title,
  COALESCE(e.enrolled_at, pc.used_at, now())
FROM public.enrollments e
JOIN public.promo_codes pc ON pc.id = e.promo_code_id
JOIN public.courses c ON c.id = e.course_id
LEFT JOIN public.profiles p ON p.id = e.user_id
WHERE e.promo_code_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.promo_code_usage u
    WHERE u.promo_code_id = e.promo_code_id
      AND u.user_id = e.user_id
  );
