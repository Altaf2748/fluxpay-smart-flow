ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS original_amount numeric NULL,
ADD COLUMN IF NOT EXISTS discount_amount numeric NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code text NULL;