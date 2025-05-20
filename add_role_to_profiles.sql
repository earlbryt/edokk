-- Add role column to profiles table if it doesn't exist
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Update any existing profiles to have 'user' role if not set
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Add index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
