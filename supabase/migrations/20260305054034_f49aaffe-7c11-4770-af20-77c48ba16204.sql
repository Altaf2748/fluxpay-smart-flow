
-- Drop the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles basic info" ON public.profiles;

-- Create a restrictive policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
