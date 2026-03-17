CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FOR 8)));
    
    RETURN NEW;
END;
$function$;