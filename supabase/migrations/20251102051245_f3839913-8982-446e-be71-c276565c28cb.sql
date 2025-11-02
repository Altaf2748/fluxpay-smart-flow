-- Insert sample offers for testing
INSERT INTO offers (title, description, mcc, reward_percent, redeem_code, valid_from, valid_to, active)
VALUES
  ('Amazon 15% Cashback', 'Get 15% cashback on all Amazon purchases', '5311', 0.15, 'AMAZON15', NOW(), NOW() + INTERVAL '90 days', true),
  ('Starbucks 20% Off', 'Save 20% on your Starbucks orders', '5814', 0.20, 'COFFEE20', NOW(), NOW() + INTERVAL '90 days', true),
  ('Zomato 10% Cashback', 'Get 10% cashback on food delivery', '5812', 0.10, 'FOOD10', NOW(), NOW() + INTERVAL '90 days', true),
  ('Flipkart 12% Discount', 'Special discount on all Flipkart purchases', '5311', 0.12, 'FLIP12', NOW(), NOW() + INTERVAL '90 days', true),
  ('Netflix 25% Off', 'Get 25% off on Netflix subscription', '4899', 0.25, 'STREAM25', NOW(), NOW() + INTERVAL '90 days', true),
  ('Uber 15% Cashback', 'Save on your next Uber ride', '4121', 0.15, 'RIDE15', NOW(), NOW() + INTERVAL '90 days', true),
  ('Swiggy 18% Off', 'Get 18% off on food delivery', '5812', 0.18, 'SWIGGY18', NOW(), NOW() + INTERVAL '90 days', true),
  ('BookMyShow 10% Discount', 'Movie tickets with special discount', '7832', 0.10, 'MOVIE10', NOW(), NOW() + INTERVAL '90 days', true)
ON CONFLICT (redeem_code) DO NOTHING;