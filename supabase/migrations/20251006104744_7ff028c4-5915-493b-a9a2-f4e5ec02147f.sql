-- Update the handle_new_user function to also store phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles with phone numbers from user_metadata
UPDATE public.profiles p
SET phone = (
  SELECT (au.raw_user_meta_data ->> 'phone')
  FROM auth.users au
  WHERE au.id = p.user_id
)
WHERE phone IS NULL;