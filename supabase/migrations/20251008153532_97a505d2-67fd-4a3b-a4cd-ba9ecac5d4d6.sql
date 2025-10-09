-- Add redeem_code column to offers table
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS redeem_code text UNIQUE;

-- Generate unique redeem codes for existing offers
UPDATE public.offers
SET redeem_code = 'OFFER' || UPPER(SUBSTR(MD5(id::text || title), 1, 8))
WHERE redeem_code IS NULL;