-- ============================================
-- SMARTSTAY - COMPLETE DATABASE SETUP
-- ============================================
-- Single file for new developers - run this in Supabase SQL Editor
-- This includes the base schema + all fixes and migrations
-- 
-- VERSION: 1.0 (Production Ready)
-- LAST UPDATED: December 26, 2025
-- 
-- ⚠️ BEFORE RUNNING:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor
-- 3. Paste this ENTIRE file
-- 4. Click "Run"
-- 
-- ⏱️ Expected runtime: ~30 seconds
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1️⃣ PROFILES TABLE
-- ============================================
-- User profiles (extends auth.users)
-- Email is stored in auth.users, NOT duplicated here
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'owner', 'admin')) NOT NULL DEFAULT 'user',
  full_name TEXT NOT NULL,
  phone TEXT,
  profile_picture TEXT,
  
  -- User-specific fields
  college TEXT,
  preferences JSONB DEFAULT '{
    "budget": {"min": 5000, "max": 15000},
    "maxDistance": 5,
    "strictnessTolerance": "moderate",
    "amenities": [],
    "gender": "any"
  }'::jsonb,
  
  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_verified ON profiles(is_verified);

-- View for easy email access
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  p.*,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

GRANT SELECT ON user_profiles TO authenticated;

-- ============================================
-- 2️⃣ PG LISTINGS TABLE
-- ============================================
CREATE TABLE pg_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  gender TEXT CHECK (gender IN ('boys', 'girls', 'any')) NOT NULL,
  
  -- Location (JSONB for flexibility)
  address JSONB DEFAULT '{
    "street": "",
    "area": "",
    "city": "",
    "state": "",
    "pincode": "",
    "latitude": null,
    "longitude": null
  }'::jsonb,
  
  -- Distance & Travel
  distance_from_college DECIMAL(10,2),
  travel_time TEXT,
  
  -- Pricing
  rent INTEGER NOT NULL,
  deposit INTEGER,
  
  -- Capacity
  total_beds INTEGER NOT NULL,
  available_beds INTEGER NOT NULL DEFAULT 0,
  
  -- Features
  amenities TEXT[] DEFAULT '{}',
  rules JSONB DEFAULT '{
    "strictnessLevel": 3,
    "visitors": true,
    "nightStay": false,
    "smokingAllowed": false,
    "petsAllowed": false
  }'::jsonb,
  
  cleanliness_level INTEGER CHECK (cleanliness_level BETWEEN 1 AND 5),
  food_quality INTEGER CHECK (food_quality BETWEEN 1 AND 5),
  
  -- Media
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  
  -- Ratings (auto-calculated)
  average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  
  -- Contact
  contact_number TEXT,
  whatsapp_group_link TEXT,
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT CHECK (status IN ('active', 'inactive', 'under_review', 'rejected')) DEFAULT 'active',
  
  -- Metadata
  views INTEGER DEFAULT 0,
  last_availability_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pg_listings_owner ON pg_listings(owner_id);
CREATE INDEX idx_pg_listings_city ON pg_listings((address->>'city'));
CREATE INDEX idx_pg_listings_gender ON pg_listings(gender);
CREATE INDEX idx_pg_listings_rent ON pg_listings(rent);
CREATE INDEX idx_pg_listings_verified ON pg_listings(is_verified);
CREATE INDEX idx_pg_listings_available ON pg_listings(is_available, available_beds);
CREATE INDEX idx_pg_listings_status ON pg_listings(status);
CREATE INDEX idx_pg_listings_distance ON pg_listings(distance_from_college);
CREATE INDEX idx_pg_amenities_gin ON pg_listings USING GIN(amenities);
CREATE INDEX idx_pg_address_city ON pg_listings((address->>'city'));
CREATE INDEX idx_pg_search_composite ON pg_listings(status, is_verified, is_available, average_rating DESC, created_at DESC);

-- ============================================
-- 3️⃣ REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  title TEXT,
  review_text TEXT NOT NULL,
  
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
  
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  is_anonymous BOOLEAN DEFAULT FALSE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(pg_id, user_id)
);

CREATE INDEX idx_reviews_pg ON reviews(pg_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- ============================================
-- 4️⃣ REVIEW VOTES TABLE
-- ============================================
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_votes_review ON review_votes(review_id);
CREATE INDEX idx_review_votes_user ON review_votes(user_id);

-- ============================================
-- 5️⃣ PG QUESTIONS TABLE
-- ============================================
CREATE TABLE pg_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pg_questions_pg ON pg_questions(pg_id);
CREATE INDEX idx_pg_questions_user ON pg_questions(user_id);

-- ============================================
-- 6️⃣ PG ANSWERS TABLE
-- ============================================
CREATE TABLE pg_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES pg_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answer_text TEXT NOT NULL,
  is_owner BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pg_answers_question ON pg_answers(question_id);
CREATE INDEX idx_pg_answers_user ON pg_answers(user_id);

-- ============================================
-- 7️⃣ CHATS TABLE
-- ============================================
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  unread_count_user INTEGER DEFAULT 0,
  unread_count_owner INTEGER DEFAULT 0,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pg_id)
);

CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_chats_owner ON chats(owner_id);
CREATE INDEX idx_chats_pg ON chats(pg_id);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);

-- ============================================
-- 8️⃣ MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at ASC);

-- ============================================
-- 9️⃣ NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('vacancy', 'price_drop', 'message', 'review', 'verification', 'system')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;

-- ============================================
-- 🔟 VACANCY ALERTS TABLE
-- ============================================
CREATE TABLE vacancy_alerts (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, pg_id)
);

CREATE INDEX idx_vacancy_alerts_user ON vacancy_alerts(user_id);
CREATE INDEX idx_vacancy_alerts_pg ON vacancy_alerts(pg_id);
CREATE INDEX idx_vacancy_alerts_pg_enabled ON vacancy_alerts(pg_id, is_enabled) WHERE is_enabled = TRUE;

-- ============================================
-- 1️⃣1️⃣ SAVED PGS TABLE
-- ============================================
CREATE TABLE saved_pgs (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, pg_id)
);

CREATE INDEX idx_saved_pgs_user ON saved_pgs(user_id);
CREATE INDEX idx_saved_pgs_pg ON saved_pgs(pg_id);

-- ============================================
-- 1️⃣2️⃣ RECENTLY VIEWED TABLE
-- ============================================
CREATE TABLE recently_viewed (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, pg_id)
);

CREATE INDEX idx_recently_viewed_user ON recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);

-- ============================================
-- 1️⃣3️⃣ VERIFICATION DOCUMENTS TABLE
-- ============================================
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('aadhar', 'pan', 'property_ownership', 'electricity_bill', 'water_bill', 'other')) NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_docs_owner ON verification_documents(owner_id);
CREATE INDEX idx_verification_docs_pg ON verification_documents(pg_id);
CREATE INDEX idx_verification_docs_status ON verification_documents(status);

-- ============================================
-- 1️⃣4️⃣ CONTENT REPORTS TABLE
-- ============================================
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content_type TEXT CHECK (content_type IN ('pg', 'review', 'user')) NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT CHECK (reason IN ('inappropriate', 'spam', 'fraud', 'wrong_info', 'other')) NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_content_reports_type_id ON content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);

-- ============================================
-- 1️⃣5️⃣ PG METRICS TABLE
-- ============================================
CREATE TABLE pg_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pg_id, metric_date)
);

CREATE INDEX idx_pg_metrics_pg ON pg_metrics(pg_id);
CREATE INDEX idx_pg_metrics_date ON pg_metrics(metric_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PG Listings
CREATE POLICY "PG listings viewable by everyone" ON pg_listings FOR SELECT USING (true);
CREATE POLICY "Only owners can create PGs" ON pg_listings FOR INSERT WITH CHECK (
  owner_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "Owners update own listings" ON pg_listings FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners delete own listings" ON pg_listings FOR DELETE USING (owner_id = auth.uid());

-- Reviews
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Review Votes
CREATE POLICY "Users manage own votes" ON review_votes FOR ALL USING (auth.uid() = user_id);

-- Questions & Answers
CREATE POLICY "Questions viewable by everyone" ON pg_questions FOR SELECT USING (true);
CREATE POLICY "Users create questions" ON pg_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Answers viewable by everyone" ON pg_answers FOR SELECT USING (true);
CREATE POLICY "Users create answers" ON pg_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chats
CREATE POLICY "Users view own chats" ON chats FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id);
CREATE POLICY "Users create chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages
CREATE POLICY "Users view messages in their chats" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user_id = auth.uid() OR chats.owner_id = auth.uid()))
);
CREATE POLICY "Users send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Vacancy Alerts
CREATE POLICY "Users manage own vacancy alerts" ON vacancy_alerts FOR ALL USING (auth.uid() = user_id);

-- Saved PGs
CREATE POLICY "Users manage own saved PGs" ON saved_pgs FOR ALL USING (auth.uid() = user_id);

-- Recently Viewed
CREATE POLICY "Users manage own recently viewed" ON recently_viewed FOR ALL USING (auth.uid() = user_id);

-- Verification Documents
CREATE POLICY "Owners view own documents" ON verification_documents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners create documents" ON verification_documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins view all documents" ON verification_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update documents" ON verification_documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Content Reports
CREATE POLICY "Users create reports" ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins view all reports" ON content_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update reports" ON content_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PG Metrics
CREATE POLICY "Owners view own metrics" ON pg_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM pg_listings WHERE pg_listings.id = pg_metrics.pg_id AND pg_listings.owner_id = auth.uid())
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pg_listings_updated_at BEFORE UPDATE ON pg_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-update PG rating
CREATE OR REPLACE FUNCTION update_pg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pg_listings
  SET 
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE pg_id = COALESCE(NEW.pg_id, OLD.pg_id)),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE pg_id = COALESCE(NEW.pg_id, OLD.pg_id))
  WHERE id = COALESCE(NEW.pg_id, OLD.pg_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pg_rating_on_review_insert AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pg_rating();

CREATE TRIGGER update_pg_rating_on_review_update AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pg_rating();

CREATE TRIGGER update_pg_rating_on_review_delete AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pg_rating();

-- Function: Auto-update chat last_message
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET 
    last_message = NEW.message_text,
    last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_on_new_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- Function: Auto-create profile on signup (SECURE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'owner'
      ELSE 'user'
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Search PGs with filters
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

GRANT EXECUTE ON FUNCTION search_pgs TO authenticated;

-- Function: Get recommendations
CREATE OR REPLACE FUNCTION get_recommendations(target_user_id UUID)
RETURNS TABLE (pg_id UUID, match_score INTEGER, pg_data JSONB) AS $$
BEGIN
  RETURN QUERY
  WITH user_prefs AS (
    SELECT preferences FROM profiles WHERE id = target_user_id
  )
  SELECT 
    pl.id,
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

GRANT EXECUTE ON FUNCTION get_recommendations TO authenticated;

-- Function: Notify vacancy alerts
CREATE OR REPLACE FUNCTION notify_vacancy_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.available_beds = 0 AND NEW.available_beds > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, payload)
    SELECT 
      va.user_id,
      'vacancy',
      'Vacancy Available!',
      'A room is now available at ' || NEW.name,
      jsonb_build_object('pg_id', NEW.id, 'pg_name', NEW.name)
    FROM vacancy_alerts va
    WHERE va.pg_id = NEW.id AND va.is_enabled = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vacancy_alert_trigger ON pg_listings;
CREATE TRIGGER vacancy_alert_trigger
  AFTER UPDATE OF available_beds ON pg_listings
  FOR EACH ROW EXECUTE FUNCTION notify_vacancy_alerts();

-- Function: Increment views
CREATE OR REPLACE FUNCTION increment_views(pg_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE pg_listings SET views = views + 1 WHERE id = pg_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION increment_views TO authenticated;

-- ============================================
-- ✅ SETUP COMPLETE!
-- ============================================

-- Verification: Check table count (should be 15)
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
  RAISE NOTICE '✅ Tables created: %', table_count;
  IF table_count < 15 THEN
    RAISE WARNING '⚠️ Expected 15 tables but found %', table_count;
  END IF;
END $$;

-- Verification: Check RLS enabled
DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = true;
  RAISE NOTICE '✅ Tables with RLS: %', rls_count;
  IF rls_count < 15 THEN
    RAISE WARNING '⚠️ Expected 15 tables with RLS but found %', rls_count;
  END IF;
END $$;

-- Verification: Check triggers
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  RAISE NOTICE '✅ Triggers created: %', trigger_count;
END $$;

-- ============================================
-- 📝 NEXT STEPS (REQUIRED):
-- ============================================
-- 1. Enable Realtime: Database → Replication → Enable: messages, notifications, chats
-- 2. Create Storage Buckets: Storage → New Bucket → pg-images (public), verification-docs (private), profile-pictures (public)
-- 3. Disable email confirmation (dev only): Authentication → Settings → Uncheck "Enable email confirmations"
-- 4. Test signup: Create a user and verify profile auto-creates
-- 5. Update frontend .env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- ============================================
