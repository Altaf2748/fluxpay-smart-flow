-- Allow REDEMPTION as a valid rail type
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_rail_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_rail_check 
CHECK (rail = ANY (ARRAY['UPI'::text, 'CARD'::text, 'REDEMPTION'::text]));