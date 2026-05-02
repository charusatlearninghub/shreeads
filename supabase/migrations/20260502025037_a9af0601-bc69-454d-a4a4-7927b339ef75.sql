
-- 1. Sponsor columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sponsor_id uuid,
  ADD COLUMN IF NOT EXISTS referral_code_used text;

CREATE INDEX IF NOT EXISTS idx_profiles_sponsor_id ON public.profiles(sponsor_id);

-- 2. Master referral codes (admin-issued, bypass affiliate requirement)
CREATE TABLE IF NOT EXISTS public.master_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer,
  use_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.master_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage master codes"
  ON public.master_referral_codes FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can read active master codes"
  ON public.master_referral_codes FOR SELECT
  USING (is_active = true OR is_admin());

-- 3. Signup attempt log (soft anti-fraud)
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  ip_address text,
  device_fingerprint text,
  referral_code text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip ON public.signup_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_fp ON public.signup_attempts(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email ON public.signup_attempts(lower(email));

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read signup attempts"
  ON public.signup_attempts FOR SELECT USING (is_admin());

CREATE POLICY "Anyone can insert signup attempts"
  ON public.signup_attempts FOR INSERT WITH CHECK (true);

-- 4. Validate referral code (callable anonymously from signup form)
CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(trim(_code));
  v_aff_id uuid;
  v_aff_user uuid;
  v_aff_name text;
  v_master public.master_referral_codes%ROWTYPE;
BEGIN
  IF v_code IS NULL OR length(v_code) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Referral code is required');
  END IF;

  -- master code?
  SELECT * INTO v_master FROM public.master_referral_codes
   WHERE code = v_code AND is_active = true LIMIT 1;
  IF FOUND THEN
    IF v_master.expires_at IS NOT NULL AND v_master.expires_at < now() THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This referral code has expired');
    END IF;
    IF v_master.max_uses IS NOT NULL AND v_master.use_count >= v_master.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This referral code has reached its limit');
    END IF;
    RETURN jsonb_build_object(
      'valid', true, 'type', 'master',
      'sponsor_name', COALESCE(v_master.label, 'Official'),
      'code', v_code
    );
  END IF;

  -- approved affiliate?
  SELECT a.id, a.user_id, COALESCE(p.full_name, p.email)
    INTO v_aff_id, v_aff_user, v_aff_name
  FROM public.affiliates a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE a.referral_code = v_code AND a.status = 'approved'
  LIMIT 1;

  IF v_aff_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'valid', true, 'type', 'affiliate',
      'sponsor_name', COALESCE(v_aff_name, 'Affiliate'),
      'sponsor_id', v_aff_user,
      'code', v_code
    );
  END IF;

  RETURN jsonb_build_object('valid', false, 'error', 'Invalid referral code. Please enter a valid sponsor code.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- 5. Updated handle_new_user trigger to resolve sponsor & master code use
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  v_sponsor_id uuid;
  v_master_id uuid;
BEGIN
  IF length(v_code) > 0 THEN
    SELECT a.user_id INTO v_sponsor_id
      FROM public.affiliates a
     WHERE a.referral_code = v_code AND a.status = 'approved'
     LIMIT 1;

    IF v_sponsor_id IS NULL THEN
      SELECT id INTO v_master_id FROM public.master_referral_codes
       WHERE code = v_code AND is_active = true LIMIT 1;
      IF v_master_id IS NOT NULL THEN
        UPDATE public.master_referral_codes
           SET use_count = use_count + 1
         WHERE id = v_master_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, sponsor_id, referral_code_used)
  VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    v_sponsor_id,
    NULLIF(v_code, '')
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FOR 8)));

  -- record the referral relationship if sponsor found
  IF v_sponsor_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_sponsor_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Sponsor view RPC for users
CREATE OR REPLACE FUNCTION public.get_my_sponsor()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sponsor_id uuid;
  v_code text;
  v_name text;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  SELECT sponsor_id, referral_code_used INTO v_sponsor_id, v_code
    FROM public.profiles WHERE id = v_uid;

  IF v_sponsor_id IS NULL THEN
    RETURN jsonb_build_object('has_sponsor', false, 'referral_code_used', v_code);
  END IF;

  SELECT full_name, email INTO v_name, v_email
    FROM public.profiles WHERE id = v_sponsor_id;

  RETURN jsonb_build_object(
    'has_sponsor', true,
    'sponsor_id', v_sponsor_id,
    'sponsor_name', COALESCE(v_name, v_email, 'Sponsor'),
    'sponsor_email', v_email,
    'referral_code_used', v_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_sponsor() TO authenticated;

-- 7. Admin Affiliate Network stats
CREATE OR REPLACE FUNCTION public.get_top_sponsors(_limit integer DEFAULT 20)
RETURNS TABLE(sponsor_id uuid, sponsor_name text, sponsor_email text, referral_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, COALESCE(p.full_name, p.email), p.email, COUNT(c.id)
  FROM public.profiles p
  JOIN public.profiles c ON c.sponsor_id = p.id
  WHERE public.is_admin()
  GROUP BY p.id, p.full_name, p.email
  ORDER BY COUNT(c.id) DESC
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_top_sponsors(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_affiliate_network_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  SELECT jsonb_build_object(
    'total_affiliates', (SELECT COUNT(*) FROM public.affiliates WHERE status = 'approved'),
    'pending_affiliates', (SELECT COUNT(*) FROM public.affiliates WHERE status = 'pending'),
    'total_referrals', (SELECT COUNT(*) FROM public.profiles WHERE sponsor_id IS NOT NULL),
    'total_users', (SELECT COUNT(*) FROM public.profiles)
  ) INTO v;
  RETURN v;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_network_stats() TO authenticated;
