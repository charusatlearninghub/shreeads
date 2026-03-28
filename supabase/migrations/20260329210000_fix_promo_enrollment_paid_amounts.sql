-- Harden promo pricing: triggers on INSERT + relevant UPDATEs, and backfill NULL/zero paid fields.
-- Recreates functions so enrollment rows always pick up promo_codes.promo_price when paid is missing.

CREATE OR REPLACE FUNCTION public.set_enrollment_promo_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_pc public.promo_codes%ROWTYPE;
  r_c public.courses%ROWTYPE;
BEGIN
  IF NEW.promo_code_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO r_pc FROM public.promo_codes WHERE id = NEW.promo_code_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT * INTO r_c FROM public.courses WHERE id = NEW.course_id;

  IF r_c.id IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.course_name := COALESCE(NULLIF(TRIM(NEW.course_name), ''), r_c.title);
  NEW.promo_code := COALESCE(NEW.promo_code, r_pc.code);

  IF NEW.original_price IS NULL THEN
    NEW.original_price := CASE
      WHEN r_c.is_free IS TRUE THEN 0
      ELSE COALESCE(r_c.discount_price, r_c.price, 0)
    END;
  END IF;

  IF NEW.promo_price IS NULL OR NEW.promo_price = 0 THEN
    NEW.promo_price := COALESCE(r_pc.promo_price, 0);
  END IF;

  IF NEW.final_price_paid IS NULL OR NEW.final_price_paid = 0 THEN
    NEW.final_price_paid := COALESCE(r_pc.promo_price, NEW.promo_price, 0);
  END IF;

  NEW.payment_type := COALESCE(NEW.payment_type, 'promo_code');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_promo_snapshot ON public.enrollments;
CREATE TRIGGER trg_enrollment_promo_snapshot
  BEFORE INSERT OR UPDATE OF promo_code_id, course_id, promo_price, final_price_paid, original_price, course_name, promo_code
  ON public.enrollments
  FOR EACH ROW
  WHEN (NEW.promo_code_id IS NOT NULL)
  EXECUTE FUNCTION public.set_enrollment_promo_snapshot();

CREATE OR REPLACE FUNCTION public.set_promo_code_usage_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.paid_amount := COALESCE(NEW.final_price_paid, NEW.promo_price, NEW.paid_amount, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promo_code_usage_paid ON public.promo_code_usage;
CREATE TRIGGER trg_promo_code_usage_paid
  BEFORE INSERT OR UPDATE OF final_price_paid, promo_price, paid_amount ON public.promo_code_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.set_promo_code_usage_paid_amount();

-- Backfill enrollments (NULL / zero paid ↔ promo_codes.promo_price)
UPDATE public.enrollments e
SET
  course_name = COALESCE(NULLIF(TRIM(e.course_name), ''), c.title),
  promo_code = COALESCE(e.promo_code, pc.code),
  original_price = COALESCE(
    e.original_price,
    CASE
      WHEN c.is_free IS TRUE THEN 0
      ELSE COALESCE(c.discount_price, c.price, 0)
    END
  ),
  promo_price = COALESCE(NULLIF(e.promo_price, 0), pc.promo_price, 0),
  final_price_paid = COALESCE(NULLIF(e.final_price_paid, 0), NULLIF(e.promo_price, 0), pc.promo_price, 0),
  payment_type = COALESCE(e.payment_type, 'promo_code')
FROM public.promo_codes pc,
     public.courses c
WHERE e.promo_code_id = pc.id
  AND e.course_id = c.id
  AND (
    e.final_price_paid IS NULL
    OR e.final_price_paid = 0
    OR e.promo_price IS NULL
    OR e.promo_price = 0
    OR e.payment_type IS NULL
  );

-- Sync promo_code_usage from enrollments + promo_codes
UPDATE public.promo_code_usage u
SET
  original_price_at_purchase = COALESCE(u.original_price_at_purchase, e.original_price),
  promo_price = COALESCE(NULLIF(u.promo_price, 0), NULLIF(e.promo_price, 0), pc.promo_price, 0),
  final_price_paid = COALESCE(NULLIF(u.final_price_paid, 0), NULLIF(e.final_price_paid, 0), pc.promo_price, 0),
  paid_amount = COALESCE(NULLIF(u.paid_amount, 0), NULLIF(u.final_price_paid, 0), NULLIF(e.final_price_paid, 0), pc.promo_price, 0)
FROM public.enrollments e
JOIN public.promo_codes pc ON pc.id = u.promo_code_id
WHERE e.promo_code_id = u.promo_code_id
  AND e.user_id = u.user_id
  AND (
    u.final_price_paid IS NULL
    OR u.final_price_paid = 0
    OR u.paid_amount IS NULL
    OR u.paid_amount = 0
    OR u.promo_price IS NULL
    OR u.promo_price = 0
  );
