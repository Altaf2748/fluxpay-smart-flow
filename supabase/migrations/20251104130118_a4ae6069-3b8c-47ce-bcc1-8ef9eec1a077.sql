-- Insert active offers with proper rewards
INSERT INTO offers (title, description, mcc, reward_percent, redeem_code, active, valid_to) VALUES
('Amazon 15% Cashback', 'Get 15% cashback on all Amazon purchases', 'Shopping', 0.15, 'AMAZON15', true, NOW() + INTERVAL '1 year'),
('Flipkart 20% Off', 'Save 20% on Flipkart orders', 'Shopping', 0.20, 'FLIP20', true, NOW() + INTERVAL '1 year'),
('Swiggy 10% Cashback', 'Enjoy 10% cashback on food delivery', 'Food', 0.10, 'SWIGGY10', true, NOW() + INTERVAL '1 year'),
('Zomato 12% Off', 'Get 12% off on your next meal', 'Food', 0.12, 'ZOMATO12', true, NOW() + INTERVAL '1 year'),
('Starbucks 25% Cashback', 'Premium 25% cashback at Starbucks', 'Food', 0.25, 'STARBUCKS25', true, NOW() + INTERVAL '1 year'),
('Netflix 8% Discount', 'Save 8% on Netflix subscription', 'Entertainment', 0.08, 'NETFLIX8', true, NOW() + INTERVAL '1 year'),
('Uber 18% Off', 'Get 18% off on Uber rides', 'Travel', 0.18, 'UBER18', true, NOW() + INTERVAL '1 year'),
('BigBasket 15% Cashback', '15% cashback on grocery orders', 'Grocery', 0.15, 'BIGBASKET15', true, NOW() + INTERVAL '1 year')
ON CONFLICT (redeem_code) DO UPDATE SET
  active = true,
  valid_to = NOW() + INTERVAL '1 year';