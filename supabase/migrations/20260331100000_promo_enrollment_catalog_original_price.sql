-- Promo enrollments: snapshot catalog list price even when course.is_free is true,
-- so original_price matches price/discount_price and is not forced to 0.

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
    NEW.original_price := COALESCE(r_c.discount_price, r_c.price, 0);
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
