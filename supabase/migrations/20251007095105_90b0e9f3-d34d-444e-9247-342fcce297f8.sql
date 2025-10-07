-- Update RLS policy to allow users to see transactions where they are sender OR recipient
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (
  auth.uid() = user_id OR auth.uid() = recipient_id
);