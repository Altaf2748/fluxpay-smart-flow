-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mcc TEXT NOT NULL,
  reward_percent NUMERIC NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policy for reading offers (all authenticated users can view active offers)
CREATE POLICY "Users can view active offers"
ON public.offers
FOR SELECT
TO authenticated
USING (active = true);

-- Seed sample offers
INSERT INTO public.offers (title, description, mcc, reward_percent, valid_from, valid_to, active, terms)
VALUES 
  ('Coffee Shop Cashback', 'Get extra cashback at all coffee shops', 'coffee', 10, NOW(), NOW() + INTERVAL '30 days', true, 'Valid at all coffee shops. Maximum cashback ₹100 per transaction.'),
  ('Restaurant Dining', 'Enjoy more savings when dining out', 'restaurants', 8, NOW(), NOW() + INTERVAL '60 days', true, 'Applicable on dining transactions. Maximum ₹150 cashback per transaction.'),
  ('Grocery Super Saver', 'Save on your daily grocery shopping', 'groceries', 5, NOW(), NOW() + INTERVAL '90 days', true, 'Valid on grocery purchases above ₹500. Max cashback ₹200.'),
  ('Fuel Rewards', 'Earn rewards on every fuel fill', 'fuel', 3, NOW(), NOW() + INTERVAL '30 days', true, 'Get cashback on fuel purchases. Maximum ₹75 per transaction.'),
  ('Online Shopping Bonanza', 'Biggest cashback on online shopping', 'online', 12, NOW(), NOW() + INTERVAL '15 days', true, 'Exclusive online shopping offer. Max cashback ₹500.');