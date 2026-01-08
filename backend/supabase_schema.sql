-- ============================================
-- SMARTSTAY - COMPLETE SUPABASE DATABASE SCHEMA
-- ============================================
-- This schema supports all frontend features including:
-- - User/Owner/Admin roles
-- - PG Listings with full details
-- - Reviews with upvote/downvote
-- - Anonymous chat system
-- - Vacancy alerts
-- - Saved PGs
-- - Verification system
-- - Q&A system
-- - Reports/Moderation
-- - User preferences
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1️⃣ PROFILES TABLE
-- ============================================
-- Extends Supabase Auth with role-based profiles
-- NOTE: Email is stored in auth.users, not here (to avoid duplication)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'owner', 'admin')) NOT NULL DEFAULT 'user',
  full_name TEXT NOT NULL,
  phone TEXT,
  profile_picture TEXT,
  
  -- User/Student specific fields
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

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- 2️⃣ PG LISTINGS TABLE
-- ============================================
CREATE TABLE pg_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Address & Location
  address JSONB NOT NULL, -- {full, street, area, city, state, pincode}
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  -- Proximity
  nearest_college TEXT,
  distance_from_college NUMERIC(5, 2), -- in km
  travel_time TEXT, -- e.g., "10 min walk"
  
  -- Property Details
  gender TEXT CHECK (gender IN ('boys', 'girls', 'any')) NOT NULL,
  room_type TEXT CHECK (room_type IN ('single', 'double', 'triple', 'quad')) NOT NULL,
  
  -- Pricing
  rent INTEGER NOT NULL,
  deposit INTEGER NOT NULL,
  maintenance_charges INTEGER DEFAULT 0,
  electricity_charges TEXT, -- "Included" or amount
  
  -- Availability
  total_beds INTEGER NOT NULL,
  available_beds INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  last_availability_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Features & Rules
  amenities TEXT[] DEFAULT '{}', -- ["Wi-Fi", "Food", "Hot Water", "Laundry", etc.]
  rules JSONB DEFAULT '{
    "curfewTime": null,
    "guestsAllowed": false,
    "smokingAllowed": false,
    "petsAllowed": false
  }'::jsonb,
  
  -- Ratings & Levels
  cleanliness_level INTEGER CHECK (cleanliness_level >= 1 AND cleanliness_level <= 5) DEFAULT 3,
  strictness_level INTEGER CHECK (strictness_level >= 1 AND strictness_level <= 5) DEFAULT 3,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Media
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  
  -- Community
  whatsapp_group_link TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Metrics
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  
  -- Status & Moderation
  status TEXT CHECK (status IN ('active', 'inactive', 'flagged', 'removed')) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for search & filters
CREATE INDEX idx_pg_owner ON pg_listings(owner_id);
CREATE INDEX idx_pg_city ON pg_listings((address->>'city'));
CREATE INDEX idx_pg_gender ON pg_listings(gender);
CREATE INDEX idx_pg_rent ON pg_listings(rent);
CREATE INDEX idx_pg_verified ON pg_listings(is_verified);
CREATE INDEX idx_pg_status ON pg_listings(status);
CREATE INDEX idx_pg_available ON pg_listings(is_available);
CREATE INDEX idx_pg_distance ON pg_listings(distance_from_college);
CREATE INDEX idx_pg_location ON pg_listings(latitude, longitude);

-- ============================================
-- 3️⃣ REVIEWS TABLE (Reddit-style voting)
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Review Content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  review_text TEXT NOT NULL,
  
  -- Detailed Ratings
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Reddit-style Voting
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- AI Sentiment Analysis (to be populated by backend)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  -- Flags
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified_stay BOOLEAN DEFAULT FALSE, -- User actually stayed here
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: One review per user per PG
  UNIQUE(pg_id, user_id)
);

-- Indexes
CREATE INDEX idx_reviews_pg ON reviews(pg_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment);

-- ============================================
-- 4️⃣ REVIEW VOTES TABLE (Track who voted)
-- ============================================
CREATE TABLE review_votes (
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (review_id, user_id)
);

-- ============================================
-- 5️⃣ Q&A SYSTEM (Questions & Answers)
-- ============================================
-- NOTE: This Q&A system is defined in CREATE_QNA_TABLE.sql
-- If you need Q&A, run that file after this schema
-- Old pg_questions/pg_answers tables have been removed to avoid duplication

-- ============================================
-- 6️⃣ CHATS TABLE (Anonymous & Normal)
-- ============================================
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  is_anonymous BOOLEAN DEFAULT TRUE,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'archived', 'blocked')) DEFAULT 'active',
  
  -- Last message info
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_chats_owner ON chats(owner_id);
CREATE INDEX idx_chats_pg ON chats(pg_id);

-- ============================================
-- 7️⃣ MESSAGES TABLE (Real-time with Supabase)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  message_text TEXT NOT NULL,
  
  -- Media attachments (optional)
  attachments TEXT[] DEFAULT '{}',
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- 8️⃣ NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification Type
  type TEXT CHECK (type IN (
    'vacancy', 
    'price_drop', 
    'message', 
    'review_reply', 
    'verification_approved',
    'verification_rejected',
    'listing_approved',
    'listing_flagged'
  )) NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Link/Action
  link TEXT, -- e.g., /pg/123, /chat/456
  payload JSONB, -- Additional data
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 9️⃣ VACANCY ALERTS TABLE
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

-- ============================================
-- 🔟 SAVED PGs TABLE (Bookmarks)
-- ============================================
CREATE TABLE saved_pgs (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (user_id, pg_id)
);

CREATE INDEX idx_saved_pgs_user ON saved_pgs(user_id);

-- ============================================
-- 1️⃣1️⃣ RECENTLY VIEWED TABLE
-- ============================================
CREATE TABLE recently_viewed (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (user_id, pg_id)
);

CREATE INDEX idx_recently_viewed_user ON recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_date ON recently_viewed(viewed_at DESC);

-- Enable RLS
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recently viewed"
  ON recently_viewed
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- 1️⃣2️⃣ VERIFICATION DOCUMENTS TABLE
-- ============================================
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE, -- Optional: link to specific PG
  
  -- Document Info
  document_type TEXT CHECK (document_type IN (
    'trade_license',
    'occupancy_certificate',
    'shop_establishment',
    'fire_noc',
    'identity_proof',
    'other'
  )) NOT NULL,
  
  file_url TEXT NOT NULL,
  file_name TEXT,
  
  -- Verification
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who reviewed
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_owner ON verification_documents(owner_id);
CREATE INDEX idx_verification_status ON verification_documents(status);
CREATE INDEX idx_verification_type ON verification_documents(document_type);

-- ============================================
-- 1️⃣3️⃣ REPORTS/FLAGS TABLE (Moderation)
-- ============================================
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- What's being reported
  content_type TEXT CHECK (content_type IN ('listing', 'review', 'user', 'message')) NOT NULL,
  content_id UUID NOT NULL, -- ID of the reported item
  
  -- Report Details
  reason TEXT CHECK (reason IN (
    'spam',
    'misleading_info',
    'inappropriate_content',
    'fraud',
    'harassment',
    'other'
  )) NOT NULL,
  description TEXT,
  
  -- Moderation
  status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_reports_status ON content_reports(status);
CREATE INDEX idx_reports_type ON content_reports(content_type);
CREATE INDEX idx_reports_reporter ON content_reports(reporter_id);

-- ============================================
-- 1️⃣4️⃣ ANALYTICS/METRICS TABLE (Optional)
-- ============================================
CREATE TABLE pg_metrics (
  pg_id UUID REFERENCES pg_listings(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  PRIMARY KEY (pg_id, date)
);

CREATE INDEX idx_metrics_pg ON pg_metrics(pg_id);
CREATE INDEX idx_metrics_date ON pg_metrics(date DESC);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pg_listings_updated_at BEFORE UPDATE ON pg_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Auto-update review count and average rating
-- ============================================
CREATE OR REPLACE FUNCTION update_pg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pg_listings
  SET 
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE pg_id = NEW.pg_id),
    average_rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE pg_id = NEW.pg_id)
  WHERE id = NEW.pg_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pg_rating_on_review AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pg_rating();

-- ============================================
-- Update last_message in chats
-- ============================================
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

CREATE TRIGGER update_chat_on_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PG Listings: Public read, owners can manage their own
CREATE POLICY "PG listings are viewable by everyone" ON pg_listings
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid());

CREATE POLICY "Owners can insert listings" ON pg_listings
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own listings" ON pg_listings
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own listings" ON pg_listings
  FOR DELETE USING (owner_id = auth.uid());

-- Reviews: Public read, users can manage their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Chats: Only participants can access
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (user_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages: Only chat participants can access
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.user_id = auth.uid() OR chats.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their chats" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_id 
      AND (chats.user_id = auth.uid() OR chats.owner_id = auth.uid())
    )
  );

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Saved PGs: Users can manage their own
CREATE POLICY "Users can view own saved PGs" ON saved_pgs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can save PGs" ON saved_pgs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave PGs" ON saved_pgs
  FOR DELETE USING (user_id = auth.uid());

-- Vacancy Alerts: Users can manage their own
CREATE POLICY "Users can view own alerts" ON vacancy_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create alerts" ON vacancy_alerts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own alerts" ON vacancy_alerts
  FOR UPDATE USING (user_id = auth.uid());

-- Verification Documents: Owners can manage their own
CREATE POLICY "Owners can view own documents" ON verification_documents
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can upload documents" ON verification_documents
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================
-- You can add sample data here for development

-- ============================================
-- NOTES FOR BACKEND IMPLEMENTATION
-- ============================================
/*
REALTIME SETUP:
Enable realtime for tables that need it:
- messages (for chat)
- notifications (for instant alerts)

SUPABASE STORAGE:
Create buckets for:
- pg-images (public)
- verification-docs (private)
- profile-pictures (public)

EDGE FUNCTIONS (Optional):
- AI Sentiment Analysis for reviews
- Travel Time Calculation
- Recommendation Algorithm
- Email/SMS notifications

INDEXES:
All necessary indexes are created above for optimal performance.

SECURITY:
Row Level Security (RLS) policies are configured.
Always use authenticated requests from frontend.
*/

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- 1️⃣ Auto-create profile on user signup
-- SECURITY: Admin role cannot be set via signup (must be manually promoted in DB)
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

-- 2️⃣ Increment PG listing views
DROP FUNCTION IF EXISTS public.increment_views(UUID);

CREATE OR REPLACE FUNCTION public.increment_views(pg_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pg_listings
  SET views = views + 1
  WHERE id = pg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon;

-- 3️⃣ Search PGs with filters
CREATE OR REPLACE FUNCTION search_pgs(
  search_city TEXT DEFAULT NULL,
  min_rent INTEGER DEFAULT NULL,
  max_rent INTEGER DEFAULT NULL,
  search_gender TEXT DEFAULT NULL,
  search_room_type TEXT DEFAULT NULL
)
RETURNS SETOF pg_listings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM pg_listings
  WHERE status = 'active'
    AND (search_city IS NULL OR address->>'city' ILIKE '%' || search_city || '%')
    AND (min_rent IS NULL OR rent >= min_rent)
    AND (max_rent IS NULL OR rent <= max_rent)
    AND (search_gender IS NULL OR gender = search_gender OR gender = 'any')
    AND (search_room_type IS NULL OR room_type = search_room_type)
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION search_pgs TO authenticated;
GRANT EXECUTE ON FUNCTION search_pgs TO anon;

-- 4️⃣ Helper view to get user profiles with email from auth.users
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  p.*,
  u.email,
  u.email_confirmed_at,
  u.created_at as auth_created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

