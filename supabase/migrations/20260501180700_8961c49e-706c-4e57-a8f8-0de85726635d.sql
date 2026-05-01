
-- =========================
-- PACKAGES
-- =========================
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  affiliate_commission_percent NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage packages"
  ON public.packages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- PACKAGE ITEMS
-- =========================
CREATE TYPE public.package_item_type AS ENUM ('course', 'software');

CREATE TABLE public.package_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  item_type public.package_item_type NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (package_id, item_type, item_id)
);

CREATE INDEX idx_package_items_package ON public.package_items(package_id);

ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view package items"
  ON public.package_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage package items"
  ON public.package_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- PACKAGE PROMO CODES
-- =========================
CREATE TABLE public.package_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  promo_price NUMERIC NOT NULL DEFAULT 0,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.package_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view package promo codes"
  ON public.package_promo_codes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can manage package promo codes"
  ON public.package_promo_codes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- PACKAGE PURCHASES
-- =========================
CREATE TABLE public.package_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES public.package_promo_codes(id) ON DELETE SET NULL,
  promo_code TEXT,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL DEFAULT 0,
  affiliate_id UUID,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, package_id)
);

CREATE INDEX idx_package_purchases_user ON public.package_purchases(user_id);

ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own package purchases"
  ON public.package_purchases FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage package purchases"
  ON public.package_purchases FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- AFFILIATES
-- =========================
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  status public.affiliate_status NOT NULL DEFAULT 'pending',
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  paid_earnings NUMERIC NOT NULL DEFAULT 0,
  pending_earnings NUMERIC NOT NULL DEFAULT 0,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate"
  ON public.affiliates FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can apply as affiliate"
  ON public.affiliates FOR INSERT
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage affiliates"
  ON public.affiliates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public lookup helper (used to validate ?ref= codes without exposing the table)
CREATE OR REPLACE FUNCTION public.get_affiliate_by_code(_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates
  WHERE referral_code = upper(_code) AND status = 'approved'
  LIMIT 1;
$$;

-- =========================
-- AFFILIATE SALES
-- =========================
CREATE TYPE public.affiliate_sale_status AS ENUM ('pending', 'paid', 'rejected');

CREATE TABLE public.affiliate_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  package_purchase_id UUID REFERENCES public.package_purchases(id) ON DELETE SET NULL,
  sale_amount NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status public.affiliate_sale_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_sales_affiliate ON public.affiliate_sales(affiliate_id);

ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own sales"
  ON public.affiliate_sales FOR SELECT
  USING (
    public.is_admin() OR
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage affiliate sales"
  ON public.affiliate_sales FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =========================
-- REDEMPTION RPC
-- Validates a package promo code, records the purchase, enrolls in all
-- included courses, grants all included software, and creates the
-- affiliate commission row when a referral code is supplied.
-- =========================
CREATE OR REPLACE FUNCTION public.redeem_package_promo(
  _code TEXT,
  _referral_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_promo public.package_promo_codes%ROWTYPE;
  v_package public.packages%ROWTYPE;
  v_purchase_id UUID;
  v_affiliate_id UUID;
  v_commission NUMERIC := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to redeem a package code';
  END IF;

  SELECT * INTO v_promo FROM public.package_promo_codes
   WHERE code = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid promo code';
  END IF;
  IF v_promo.is_used THEN
    RAISE EXCEPTION 'This promo code has already been used';
  END IF;
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RAISE EXCEPTION 'This promo code has expired';
  END IF;

  SELECT * INTO v_package FROM public.packages WHERE id = v_promo.package_id;
  IF NOT FOUND OR v_package.is_active = false THEN
    RAISE EXCEPTION 'This package is not available';
  END IF;

  IF EXISTS (SELECT 1 FROM public.package_purchases
             WHERE user_id = v_user_id AND package_id = v_package.id) THEN
    RAISE EXCEPTION 'You already own this package';
  END IF;

  -- Look up affiliate (approved only)
  IF _referral_code IS NOT NULL AND length(trim(_referral_code)) > 0 THEN
    SELECT id INTO v_affiliate_id FROM public.affiliates
     WHERE referral_code = upper(_referral_code) AND status = 'approved'
     LIMIT 1;
    -- Don't credit self-referrals
    IF v_affiliate_id IS NOT NULL AND
       (SELECT user_id FROM public.affiliates WHERE id = v_affiliate_id) = v_user_id THEN
      v_affiliate_id := NULL;
    END IF;
  END IF;

  -- Record purchase
  INSERT INTO public.package_purchases
    (user_id, package_id, promo_code_id, promo_code, amount_paid, original_price, affiliate_id)
  VALUES
    (v_user_id, v_package.id, v_promo.id, v_promo.code, v_promo.promo_price,
     v_package.original_price, v_affiliate_id)
  RETURNING id INTO v_purchase_id;

  -- Mark promo used
  UPDATE public.package_promo_codes
     SET is_used = true, used_by = v_user_id, used_at = now()
   WHERE id = v_promo.id;

  -- Enroll in every included course (idempotent)
  INSERT INTO public.enrollments
    (user_id, course_id, course_name, payment_type, original_price, final_price_paid)
  SELECT v_user_id, c.id, c.title, 'package', c.price, 0
    FROM public.package_items pi
    JOIN public.courses c ON c.id = pi.item_id
   WHERE pi.package_id = v_package.id AND pi.item_type = 'course'
     AND NOT EXISTS (SELECT 1 FROM public.enrollments e
                      WHERE e.user_id = v_user_id AND e.course_id = c.id);

  -- Grant every included software (idempotent)
  INSERT INTO public.software_purchases
    (user_id, product_id, amount_paid, payment_method)
  SELECT v_user_id, sp.id, 0, 'package'
    FROM public.package_items pi
    JOIN public.software_products sp ON sp.id = pi.item_id
   WHERE pi.package_id = v_package.id AND pi.item_type = 'software'
     AND NOT EXISTS (SELECT 1 FROM public.software_purchases p
                      WHERE p.user_id = v_user_id AND p.product_id = sp.id);

  -- Affiliate commission
  IF v_affiliate_id IS NOT NULL AND v_package.affiliate_commission_percent > 0 THEN
    v_commission := round(v_promo.promo_price * v_package.affiliate_commission_percent / 100, 2);

    INSERT INTO public.affiliate_sales
      (affiliate_id, user_id, package_id, package_purchase_id, sale_amount,
       commission_percent, commission_amount, status)
    VALUES
      (v_affiliate_id, v_user_id, v_package.id, v_purchase_id, v_promo.promo_price,
       v_package.affiliate_commission_percent, v_commission, 'pending');

    UPDATE public.affiliates
       SET total_sales = total_sales + v_promo.promo_price,
           total_earnings = total_earnings + v_commission,
           pending_earnings = pending_earnings + v_commission
     WHERE id = v_affiliate_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'package_id', v_package.id,
    'purchase_id', v_purchase_id,
    'affiliate_credited', v_affiliate_id IS NOT NULL,
    'commission_amount', v_commission
  );
END;
$$;

-- Apply as affiliate helper (auto-generates a unique code)
CREATE OR REPLACE FUNCTION public.apply_as_affiliate()
RETURNS public.affiliates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing public.affiliates%ROWTYPE;
  v_code TEXT;
  v_row public.affiliates%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT * INTO v_existing FROM public.affiliates WHERE user_id = v_user_id;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  -- Generate a unique 8-char code
  LOOP
    v_code := upper(substring(md5(v_user_id::text || clock_timestamp()::text) for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE referral_code = v_code);
  END LOOP;

  INSERT INTO public.affiliates (user_id, referral_code, status)
  VALUES (v_user_id, v_code, 'pending')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Mark commission paid (admin only)
CREATE OR REPLACE FUNCTION public.mark_affiliate_sale_paid(_sale_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.affiliate_sales%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  SELECT * INTO v_sale FROM public.affiliate_sales WHERE id = _sale_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found'; END IF;
  IF v_sale.status = 'paid' THEN RETURN; END IF;

  UPDATE public.affiliate_sales SET status = 'paid', paid_at = now() WHERE id = _sale_id;

  UPDATE public.affiliates
     SET pending_earnings = GREATEST(pending_earnings - v_sale.commission_amount, 0),
         paid_earnings = paid_earnings + v_sale.commission_amount
   WHERE id = v_sale.affiliate_id;
END;
$$;
