
-- Admin requests table for password reset requests and eKYC submissions
CREATE TABLE public.admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('password_reset', 'ekyc_verification')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
  ON public.admin_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON public.admin_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON public.admin_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
  ON public.admin_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
