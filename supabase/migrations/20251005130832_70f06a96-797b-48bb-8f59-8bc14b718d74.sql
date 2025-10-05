-- Add phone field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create rewards_ledger table
CREATE TABLE IF NOT EXISTS public.rewards_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  cashback DECIMAL(10,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rewards_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards_ledger
CREATE POLICY "Users can view their own rewards" 
  ON public.rewards_ledger 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards" 
  ON public.rewards_ledger 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add reward_amount column to transactions if not exists
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(10,2) DEFAULT 0;

-- Enable realtime for rewards_ledger
ALTER TABLE public.rewards_ledger REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.rewards_ledger;