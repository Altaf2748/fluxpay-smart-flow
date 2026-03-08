CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service role / security definer context (auth.uid() is null)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- If the caller is an admin, allow all updates
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For regular users, prevent changes to sensitive columns
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    RAISE EXCEPTION 'Cannot modify balance directly';
  END IF;
  IF NEW.card_balance IS DISTINCT FROM OLD.card_balance THEN
    RAISE EXCEPTION 'Cannot modify card_balance directly';
  END IF;
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
    RAISE EXCEPTION 'Cannot modify kyc_status directly';
  END IF;
  IF NEW.tier_status IS DISTINCT FROM OLD.tier_status THEN
    RAISE EXCEPTION 'Cannot modify tier_status directly';
  END IF;

  RETURN NEW;
END;
$function$