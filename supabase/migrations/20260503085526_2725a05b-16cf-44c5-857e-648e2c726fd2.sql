
-- 1) Course-level affiliate commission percent
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS affiliate_commission_percent numeric NOT NULL DEFAULT 0;

-- 2) Extend affiliate_sales to support both packages and courses
ALTER TABLE public.affiliate_sales
  ALTER COLUMN package_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS course_id uuid,
  ADD COLUMN IF NOT EXISTS enrollment_id uuid,
  ADD COLUMN IF NOT EXISTS sale_type text NOT NULL DEFAULT 'package',
  ADD COLUMN IF NOT EXISTS product_name text;

-- Backfill existing rows with package names
UPDATE public.affiliate_sales s
   SET sale_type = 'package',
       product_name = COALESCE(s.product_name, p.name)
  FROM public.packages p
 WHERE s.package_id = p.id AND s.product_name IS NULL;

-- Constraint: must reference exactly one product
ALTER TABLE public.affiliate_sales
  DROP CONSTRAINT IF EXISTS affiliate_sales_product_chk;
ALTER TABLE public.affiliate_sales
  ADD CONSTRAINT affiliate_sales_product_chk
  CHECK (
    (sale_type = 'package' AND package_id IS NOT NULL)
    OR (sale_type = 'course'  AND course_id  IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_affiliate_sales_course ON public.affiliate_sales(course_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_type   ON public.affiliate_sales(sale_type);

-- 3) Helper: record a course sale (called by edge function with service role; SECURITY DEFINER so RPC also works)
CREATE OR REPLACE FUNCTION public.record_course_affiliate_sale(
  _user_id uuid,
  _course_id uuid,
  _enrollment_id uuid,
  _referral_code text,
  _sale_amount numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aff_id uuid;
  v_aff_user uuid;
  v_pct numeric := 0;
  v_commission numeric := 0;
  v_course_title text;
  v_sale_id uuid;
BEGIN
  IF _referral_code IS NULL OR length(trim(_referral_code)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT id, user_id INTO v_aff_id, v_aff_user
    FROM public.affiliates
   WHERE referral_code = upper(trim(_referral_code))
     AND status = 'approved' LIMIT 1;
  IF v_aff_id IS NULL OR v_aff_user = _user_id THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(affiliate_commission_percent, 0), title
    INTO v_pct, v_course_title
    FROM public.courses WHERE id = _course_id;

  IF v_pct <= 0 OR _sale_amount <= 0 THEN
    RETURN NULL;
  END IF;

  v_commission := round(_sale_amount * v_pct / 100, 2);

  INSERT INTO public.affiliate_sales
    (affiliate_id, user_id, course_id, enrollment_id, sale_amount,
     commission_percent, commission_amount, status, sale_type, product_name)
  VALUES
    (v_aff_id, _user_id, _course_id, _enrollment_id, _sale_amount,
     v_pct, v_commission, 'pending', 'course', v_course_title)
  RETURNING id INTO v_sale_id;

  UPDATE public.affiliates
     SET total_sales      = total_sales + _sale_amount,
         total_earnings   = total_earnings + v_commission,
         pending_earnings = pending_earnings + v_commission
   WHERE id = v_aff_id;

  RETURN v_sale_id;
END;
$$;

-- 4) Sponsor card: list referred users + their enrollments
CREATE OR REPLACE FUNCTION public.get_my_referrals_detail()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total int := 0;
  v_converted int := 0;
  v_users jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_total FROM public.profiles WHERE sponsor_id = v_uid;

  SELECT count(DISTINCT p.id) INTO v_converted
    FROM public.profiles p
    JOIN public.enrollments e ON e.user_id = p.id
   WHERE p.sponsor_id = v_uid;

  SELECT jsonb_agg(row_to_json(t)) INTO v_users FROM (
    SELECT p.id,
           COALESCE(p.full_name, p.email) AS name,
           p.created_at,
           (SELECT count(*) FROM public.enrollments e WHERE e.user_id = p.id) AS enrollments_count,
           (SELECT jsonb_agg(jsonb_build_object('id', e.course_id, 'title', e.course_name))
              FROM public.enrollments e WHERE e.user_id = p.id) AS courses
      FROM public.profiles p
     WHERE p.sponsor_id = v_uid
     ORDER BY p.created_at DESC
     LIMIT 50
  ) t;

  RETURN jsonb_build_object(
    'total_referrals', v_total,
    'converted', v_converted,
    'users', COALESCE(v_users, '[]'::jsonb)
  );
END;
$$;
