-- Signup uses the built-in sponsor code only.
INSERT INTO public.master_referral_codes (code, label, is_active)
VALUES ('SHREE08', 'Official', true)
ON CONFLICT (code) DO UPDATE
SET is_active = true,
    label = EXCLUDED.label;

CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _code IS DISTINCT FROM 'SHREE08' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid referral code');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'type', 'master',
    'sponsor_name', 'Official',
    'code', 'SHREE08'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_code text := NEW.raw_user_meta_data->>'referral_code';
  v_master_id uuid;
  v_aff_code text;
BEGIN
  IF v_code IS DISTINCT FROM 'SHREE08' THEN
    RAISE EXCEPTION 'A valid SHREE08 referral code is required';
  END IF;

  SELECT id INTO v_master_id
    FROM public.master_referral_codes
   WHERE code = 'SHREE08' AND is_active = true
   LIMIT 1;

  IF v_master_id IS NULL THEN
    RAISE EXCEPTION 'The SHREE08 referral code is not active';
  END IF;

  UPDATE public.master_referral_codes
     SET use_count = use_count + 1
   WHERE id = v_master_id;

  INSERT INTO public.profiles (id, email, full_name, phone, sponsor_id, referral_code_used)
  VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NULL,
    v_code
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');

  LOOP
    v_aff_code := upper(substring(md5(NEW.id::text || clock_timestamp()::text) for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE referral_code = v_aff_code);
  END LOOP;

  INSERT INTO public.affiliates (user_id, referral_code, status, approved_at)
  VALUES (NEW.id, v_aff_code, 'approved', now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, v_aff_code);

  RETURN NEW;
END;
$function$;