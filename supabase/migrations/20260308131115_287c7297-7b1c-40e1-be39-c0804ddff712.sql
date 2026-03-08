CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));