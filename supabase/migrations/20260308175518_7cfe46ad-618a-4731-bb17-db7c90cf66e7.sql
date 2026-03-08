
CREATE OR REPLACE FUNCTION public.atomic_deduct_card_balance(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET card_balance = card_balance - p_amount
  WHERE user_id = p_user_id
    AND card_balance >= p_amount;

  RETURN FOUND;
END;
$$;
