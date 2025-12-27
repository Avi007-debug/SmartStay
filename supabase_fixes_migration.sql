-- ============================================
-- SUPABASE SCHEMA FIXES & IMPROVEMENTS
-- Run this AFTER the main schema
-- ============================================

-- 🔧 FIX 1: Remove email duplication from profiles
-- Email is already in auth.users, no need to duplicate
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Add a view to easily access user email from auth
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  p.*,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;

-- ============================================
-- 🔧 FIX 2: Prevent non-owners from creating PGs
-- Extra safety check to ensure only owners can post
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Only owners can create PGs" ON pg_listings;

-- Create new strict policy
CREATE POLICY "Only owners can create PGs" ON pg_listings
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- ============================================
-- 🔧 FIX 3: Enable RLS for recently_viewed
-- This was missing from original schema
-- ============================================

-- Enable RLS
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users manage own recently viewed" ON recently_viewed;

-- Users can only see/manage their own viewed items
CREATE POLICY "Users manage own recently viewed" ON recently_viewed
FOR ALL 
USING (user_id = auth.uid());

-- ============================================
-- 🔧 FIX 4: Add function to auto-create profile on signup
-- This ensures every new user gets a profile row
-- ============================================

-- Create function to handle new user signup
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

-- Create trigger to run function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 🔧 FIX 5: Add helper function for PG search with filters
-- Optimized search query for frontend
-- ============================================

CREATE OR REPLACE FUNCTION search_pgs(
  search_city TEXT DEFAULT NULL,
  search_gender TEXT DEFAULT NULL,
  min_rent_amount INTEGER DEFAULT NULL,
  max_rent_amount INTEGER DEFAULT NULL,
  search_amenities TEXT[] DEFAULT NULL,
  only_verified BOOLEAN DEFAULT FALSE,
  only_available BOOLEAN DEFAULT FALSE,
  max_distance_km INTEGER DEFAULT NULL,
  user_lat DECIMAL DEFAULT NULL,
  user_lng DECIMAL DEFAULT NULL
)
RETURNS SETOF pg_listings AS $$
BEGIN
  RETURN QUERY
  SELECT pl.*
  FROM pg_listings pl
  WHERE 
    pl.status = 'active'
    AND (search_city IS NULL OR pl.address->>'city' ILIKE '%' || search_city || '%')
    AND (search_gender IS NULL OR pl.gender = search_gender OR pl.gender = 'any')
    AND (min_rent_amount IS NULL OR pl.rent >= min_rent_amount)
    AND (max_rent_amount IS NULL OR pl.rent <= max_rent_amount)
    AND (search_amenities IS NULL OR pl.amenities @> search_amenities)
    AND (only_verified = FALSE OR pl.is_verified = TRUE)
    AND (only_available = FALSE OR (pl.is_available = TRUE AND pl.available_beds > 0))
    AND (max_distance_km IS NULL OR pl.distance_from_college <= max_distance_km)
  ORDER BY 
    pl.is_verified DESC,
    pl.average_rating DESC NULLS LAST,
    pl.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION search_pgs TO authenticated;

-- ============================================
-- 🔧 FIX 6: Add function to get personalized recommendations
-- Based on user preferences
-- ============================================

CREATE OR REPLACE FUNCTION get_recommendations(target_user_id UUID)
RETURNS TABLE (
  pg_id UUID,
  match_score INTEGER,
  pg_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_prefs AS (
    SELECT preferences FROM profiles WHERE id = target_user_id
  )
  SELECT 
    pl.id,
    -- Calculate match score (0-100)
    (
      CASE 
        WHEN pl.rent BETWEEN 
          COALESCE((up.preferences->'budget'->>'min')::INTEGER, 0) AND 
          COALESCE((up.preferences->'budget'->>'max')::INTEGER, 999999)
        THEN 30 ELSE 0 
      END +
      CASE 
        WHEN pl.gender = COALESCE(up.preferences->>'preferred_gender', 'any') 
        THEN 20 ELSE 0 
      END +
      CASE 
        WHEN 'Food' = ANY(pl.amenities)
        THEN 15 ELSE 0 
      END +
      CASE 
        WHEN pl.is_verified THEN 20 ELSE 0 
      END +
      CASE 
        WHEN pl.average_rating >= 4 THEN 15 ELSE 0 
      END
    )::INTEGER AS match_score,
    row_to_json(pl)::JSONB AS pg_data
  FROM pg_listings pl
  CROSS JOIN user_prefs up
  WHERE 
    pl.status = 'active'
    AND pl.is_available = TRUE
    AND pl.available_beds > 0
  ORDER BY match_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execution
GRANT EXECUTE ON FUNCTION get_recommendations TO authenticated;

-- ============================================
-- 🔧 FIX 7: Add notification trigger for vacancy alerts
-- Auto-notify users when PG becomes available
-- ============================================

CREATE OR REPLACE FUNCTION notify_vacancy_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- If available_beds increased from 0 to >0
  IF OLD.available_beds = 0 AND NEW.available_beds > 0 THEN
    -- Create notifications for all users with alerts for this PG
    INSERT INTO notifications (user_id, type, title, message, payload)
    SELECT 
      va.user_id,
      'vacancy',
      'Vacancy Available!',
      'A room is now available at ' || NEW.name,
      jsonb_build_object('pg_id', NEW.id, 'pg_name', NEW.name)
    FROM vacancy_alerts va
    WHERE 
      va.pg_id = NEW.id 
      AND va.is_enabled = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS vacancy_alert_trigger ON pg_listings;

CREATE TRIGGER vacancy_alert_trigger
  AFTER UPDATE OF available_beds ON pg_listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_vacancy_alerts();

-- ============================================
-- 🔧 FIX 8: Add indexes for better performance
-- Additional indexes based on common queries
-- ============================================

-- Index for search function
CREATE INDEX IF NOT EXISTS idx_pg_search_composite 
ON pg_listings(status, is_verified, is_available, average_rating DESC, created_at DESC);

-- Index for user notifications (for real-time)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = FALSE;

-- Index for chat messages (for real-time)
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON messages(chat_id, created_at ASC);

-- Index for vacancy alerts
CREATE INDEX IF NOT EXISTS idx_vacancy_alerts_pg_enabled 
ON vacancy_alerts(pg_id, is_enabled) 
WHERE is_enabled = TRUE;

-- GIN index for amenities array search
CREATE INDEX IF NOT EXISTS idx_pg_amenities_gin 
ON pg_listings USING GIN(amenities);

-- JSONB index for address search
CREATE INDEX IF NOT EXISTS idx_pg_address_city 
ON pg_listings((address->>'city'));

-- ============================================
-- 🔧 FIX 9: Add storage bucket RLS policies
-- Run these in Supabase Dashboard → Storage → Policies
-- ============================================

-- Note: These need to be run in the Supabase Dashboard UI
-- Storage → pg-images → Policies → New Policy

-- Policy 1: Public read access to PG images
-- SELECT: Allow public read
-- Storage path pattern: *
-- Policy definition: true

-- Policy 2: Only owners can upload PG images
-- INSERT: Allow authenticated users to upload to their PG folders
-- Storage path pattern: {owner_id}/*
-- Policy definition: auth.uid() = bucket_id

-- Policy 3: Only owners can delete their PG images
-- DELETE: Allow authenticated users to delete from their PG folders
-- Storage path pattern: {owner_id}/*
-- Policy definition: auth.uid() = bucket_id

-- ============================================
-- ✅ VERIFICATION QUERIES
-- Run these to verify everything works
-- ============================================

-- Check if triggers are created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check if functions exist
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'handle_new_user',
  'search_pgs',
  'get_recommendations',
  'notify_vacancy_alerts'
);

-- Check if indexes are created
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('pg_listings', 'notifications', 'messages', 'vacancy_alerts')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 📝 MANUAL STEPS REQUIRED
-- ============================================

/*
AFTER RUNNING THIS SQL, YOU MUST:

1. Enable Realtime (Supabase Dashboard → Database → Replication)
   ✅ messages
   ✅ notifications
   ✅ chats

2. Create Storage Buckets (Supabase Dashboard → Storage)
   ✅ pg-images (public)
   ✅ verification-docs (private)
   ✅ profile-pictures (public)

3. Set up Storage Policies (for each bucket)
   - Public read for pg-images and profile-pictures
   - Authenticated upload/delete for own files
   - Admin access for verification-docs

4. Test the auto-signup trigger:
   - Create a new user via Supabase Auth
   - Check if profile row is auto-created
   - Verify role assignment works

5. Generate TypeScript types (optional but recommended):
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
*/
