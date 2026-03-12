-- Migration: Add user_flair support to profiles table
-- File: supabase/migrations/20251121030000_add_user_flair.sql

-- Add user_flair column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_flair TEXT;

-- Add index for faster flair queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_flair 
ON profiles(user_flair) 
WHERE user_flair IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.user_flair IS 'User location flair (county name, Visiting, or Diaspora)';

-- Optional: Add check constraint to validate flair values (uncomment if you want strict validation)
-- ALTER TABLE profiles ADD CONSTRAINT valid_user_flair CHECK (
--   user_flair IS NULL OR 
--   user_flair IN (
--     'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
--     'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
--     'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
--     'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
--     'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
--     'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi',
--     'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
--     'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
--     'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
--     'Wajir', 'West Pokot', 'Visiting', 'Diaspora'
--   )
-- );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create/Update policy to allow users to update their own flair
CREATE POLICY "Users can update their own flair"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow anyone to view user flairs
CREATE POLICY "Anyone can view user flairs"
ON profiles
FOR SELECT
USING (true);