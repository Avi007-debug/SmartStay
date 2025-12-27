-- ============================================
-- 🔧 UPDATE: Fix Phone Number Storage
-- Run this to update the trigger to save phone numbers
-- ============================================

-- Update handle_new_user function to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    -- Only allow 'owner' or default to 'user'. Admin must be manually promoted.
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'owner'
      ELSE 'user'
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ That's it! Now phone numbers will be saved when users sign up.

-- Test it:
-- 1. Sign up a new user with a phone number
-- 2. Run this query:
-- SELECT id, role, full_name, phone FROM profiles ORDER BY created_at DESC LIMIT 1;
