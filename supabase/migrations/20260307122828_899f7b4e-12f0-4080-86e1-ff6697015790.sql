
-- 1. Add CHECK constraint to prevent negative amounts
ALTER TABLE public.transactions ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);

-- 2. Update the trigger to also validate amount > 0
CREATE OR REPLACE FUNCTION public.update_balance_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reject negative or zero amounts
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be positive';
  END IF;

  IF NEW.transaction_type = 'p2p' AND NEW.status = 'success' THEN
    UPDATE public.profiles
    SET balance = balance - NEW.amount
    WHERE user_id = NEW.user_id;
    
    IF NEW.recipient_id IS NOT NULL THEN
      UPDATE public.profiles
      SET balance = balance + NEW.amount
      WHERE user_id = NEW.recipient_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Create a trigger to prevent users from updating sensitive profile columns
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
$function$;

CREATE TRIGGER trg_prevent_sensitive_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_sensitive_profile_update();
