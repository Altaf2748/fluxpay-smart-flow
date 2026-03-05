
-- Create a security definer function to get basic user name info for P2P display
CREATE OR REPLACE FUNCTION public.get_user_display_name(target_user_id uuid)
RETURNS TABLE(first_name text, last_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.first_name, p.last_name
  FROM public.profiles p
  WHERE p.user_id = target_user_id
  LIMIT 1;
$$;
