
-- Atomic balance deduction function to prevent double-spend race conditions
CREATE OR REPLACE FUNCTION public.atomic_deduct_balance(
  p_user_id uuid,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atomically deduct balance only if sufficient funds exist
  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE user_id = p_user_id
    AND balance >= p_amount;

  -- Return whether the deduction succeeded
  RETURN FOUND;
END;
$$;

-- Atomic P2P transfer function: deducts from sender and credits recipient atomically
CREATE OR REPLACE FUNCTION public.atomic_p2p_transfer(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Deduct from sender (fails if insufficient balance)
  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE user_id = p_sender_id
    AND balance >= p_amount;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Credit recipient
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE user_id = p_recipient_id;

  RETURN TRUE;
END;
$$;
