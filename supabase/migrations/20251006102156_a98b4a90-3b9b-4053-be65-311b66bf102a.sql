-- Add MPIN and balance fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mpin_hash text,
ADD COLUMN IF NOT EXISTS failed_mpin_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_attempt timestamp with time zone,
ADD COLUMN IF NOT EXISTS mpin_locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 10000;

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Update transactions table to support P2P transfers
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS recipient_id uuid,
ADD COLUMN IF NOT EXISTS transaction_type text DEFAULT 'payment';

-- Create a function to update balance
CREATE OR REPLACE FUNCTION public.update_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'p2p' AND NEW.status = 'success' THEN
    -- Deduct from sender
    UPDATE public.profiles
    SET balance = balance - NEW.amount
    WHERE user_id = NEW.user_id;
    
    -- Add to recipient
    IF NEW.recipient_id IS NOT NULL THEN
      UPDATE public.profiles
      SET balance = balance + NEW.amount
      WHERE user_id = NEW.recipient_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for balance updates
DROP TRIGGER IF EXISTS trigger_update_balance ON public.transactions;
CREATE TRIGGER trigger_update_balance
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_balance_on_transaction();