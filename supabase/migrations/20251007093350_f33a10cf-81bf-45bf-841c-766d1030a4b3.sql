-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule offer rotation to run daily at midnight
SELECT cron.schedule(
  'rotate-offers-daily',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT
    net.http_post(
        url:='https://lgwofufhtkbqcvcwsuen.supabase.co/functions/v1/rotate-offers',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd29mdWZodGticWN2Y3dzdWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTkzMDAsImV4cCI6MjA2Nzk5NTMwMH0.qjaHMwF9ej7SMm53IKmzUimuC-altGiGSqVRppJ0Aks"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Insert initial set of offers (5 random brand offers)
INSERT INTO public.offers (title, description, mcc, reward_percent, terms, valid_from, valid_to, active) VALUES
  ('Amazon Sale - 20% Cashback', 'Get 20% cashback on Amazon purchases using FluxPay', 'ecommerce', 0.20, 'Valid on purchases above ₹500. Max cashback ₹500', NOW(), NOW() + INTERVAL '24 hours', true),
  ('Swiggy Food Fest - 25% Off', 'Enjoy 25% cashback on all Swiggy orders', 'food', 0.25, 'Valid on orders above ₹200. Max cashback ₹200', NOW(), NOW() + INTERVAL '24 hours', true),
  ('Nike Store - Flat 18% Back', 'Shop Nike shoes and apparel with 18% cashback', 'retail', 0.18, 'Valid on purchases above ₹2000. Max cashback ₹1000', NOW(), NOW() + INTERVAL '24 hours', true),
  ('BookMyShow Movie Bonanza', '35% cashback on movie ticket bookings', 'entertainment', 0.35, 'Valid on bookings above ₹300. Max cashback ₹200', NOW(), NOW() + INTERVAL '24 hours', true),
  ('Nykaa Beauty Bonanza', '28% cashback on beauty and cosmetics', 'beauty', 0.28, 'Valid on purchases above ₹800. Max cashback ₹400', NOW(), NOW() + INTERVAL '24 hours', true);
