-- Insert sample offers with future expiry dates (valid for 1 year)
INSERT INTO public.offers (title, description, mcc, reward_percent, redeem_code, valid_from, valid_to, active) VALUES
('Amazon 15% Cashback', 'Get 15% cashback on Amazon purchases', '5311', 0.15, 'AMAZON15', NOW(), NOW() + INTERVAL '1 year', true),
('Starbucks 20% Off', 'Enjoy 20% discount at Starbucks', '5814', 0.20, 'COFFEE20', NOW(), NOW() + INTERVAL '1 year', true),
('Zomato 10% Cashback', 'Order food with 10% cashback', '5812', 0.10, 'FOOD10', NOW(), NOW() + INTERVAL '1 year', true),
('Swiggy 12% Off', 'Get 12% off on Swiggy orders', '5812', 0.12, 'SWIGGY12', NOW(), NOW() + INTERVAL '1 year', true),
('Flipkart 18% Cashback', '18% cashback on Flipkart shopping', '5399', 0.18, 'FLIP18', NOW(), NOW() + INTERVAL '1 year', true),
('Netflix 25% Off', 'Subscribe to Netflix with 25% discount', '7832', 0.25, 'NETFLIX25', NOW(), NOW() + INTERVAL '1 year', true),
('Uber 15% Cashback', 'Travel with 15% cashback on Uber', '4121', 0.15, 'UBER15', NOW(), NOW() + INTERVAL '1 year', true),
('Nike 20% Off', 'Shop Nike with 20% discount', '5651', 0.20, 'NIKE20', NOW(), NOW() + INTERVAL '1 year', true)
ON CONFLICT (redeem_code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward_percent = EXCLUDED.reward_percent,
  valid_from = EXCLUDED.valid_from,
  valid_to = EXCLUDED.valid_to,
  active = EXCLUDED.active;