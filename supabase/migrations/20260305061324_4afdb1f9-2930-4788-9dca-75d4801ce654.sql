
-- Seed admin role for the initial admin user
INSERT INTO public.user_roles (user_id, role) VALUES ('559a7814-d42d-45e2-bc2e-172faaa2439d', 'admin') ON CONFLICT DO NOTHING;
