-- Auto-approve all new affiliate records and backfill
CREATE OR REPLACE FUNCTION public.apply_as_affiliate()
 RETURNS affiliates
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Auto-approve if previously pending so single-system referral works
    IF v_existing.status = 'pending' THEN
      UPDATE public.affiliates
         SET status = 'approved', approved_at = now()
       WHERE id = v_existing.id
       RETURNING * INTO v_existing;
    END IF;
    RETURN v_existing;
  END IF;

  LOOP
    v_code := upper(substring(md5(v_user_id::text || clock_timestamp()::text) for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE referral_code = v_code);
  END LOOP;

  INSERT INTO public.affiliates (user_id, referral_code, status, approved_at)
  VALUES (v_user_id, v_code, 'approved', now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

-- Backfill: create affiliate row for every existing profile that doesn't have one
INSERT INTO public.affiliates (user_id, referral_code, status, approved_at)
SELECT
  p.id,
  -- prefer their existing referral_codes.code if available, else generate
  COALESCE(
    (SELECT rc.code FROM public.referral_codes rc WHERE rc.user_id = p.id LIMIT 1),
    upper(substring(md5(p.id::text || clock_timestamp()::text) for 8))
  ),
  'approved',
  now()
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = p.id)
ON CONFLICT DO NOTHING;

-- Auto-approve any existing pending affiliates
UPDATE public.affiliates SET status = 'approved', approved_at = COALESCE(approved_at, now())
 WHERE status = 'pending';

-- Update handle_new_user to also create an approved affiliate row for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code text := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  v_sponsor_id uuid;
  v_master_id uuid;
  v_aff_code text;
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

  -- Generate unique affiliate code (single source of truth)
  LOOP
    v_aff_code := upper(substring(md5(NEW.id::text || clock_timestamp()::text) for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE referral_code = v_aff_code);
  END LOOP;

  INSERT INTO public.affiliates (user_id, referral_code, status, approved_at)
  VALUES (NEW.id, v_aff_code, 'approved', now())
  ON CONFLICT DO NOTHING;

  -- Keep legacy referral_codes row in sync with the affiliate code so any
  -- remaining reader sees the same value.
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, v_aff_code);

  IF v_sponsor_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_sponsor_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Sync existing referral_codes.code values to match affiliates.referral_code
UPDATE public.referral_codes rc
   SET code = a.referral_code
  FROM public.affiliates a
 WHERE a.user_id = rc.user_id
   AND a.referral_code IS DISTINCT FROM rc.code;