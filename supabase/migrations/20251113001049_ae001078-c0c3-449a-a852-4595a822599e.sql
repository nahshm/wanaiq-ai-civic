
-- Backfill profiles for existing users who don't have one
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
