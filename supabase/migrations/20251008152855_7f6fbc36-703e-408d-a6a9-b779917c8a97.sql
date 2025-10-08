-- Allow users to view basic profile info (names) of other users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles basic info"
ON public.profiles
FOR SELECT
USING (true);

-- Add card_balance column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS card_balance numeric DEFAULT 5000;