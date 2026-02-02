-- ============================================
-- SMARTSTAY - COMPLETE RLS & STORAGE POLICIES
-- ============================================
-- File: backend/rls_and_storage_policies.sql
-- Purpose: Enforces role-based security for database tables and Supabase Storage
-- Run this in Supabase SQL editor (or via psql with service role key)
--
-- Coverage:
-- ✅ All database tables (profiles, pg_listings, reviews, qna, chats, etc.)
-- ✅ Storage buckets (verification-docs, pg-images)
-- ✅ Role-based access (users, owners, admins)
-- ============================================

-- ============================================
-- 0️⃣ PRE-REQUISITES: ENABLE RLS ON ALL TABLES
-- ============================================
-- These are likely already enabled in supabase_schema.sql but included for completeness

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_drop_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1️⃣ PROFILES TABLE
-- ============================================
-- Public can view all profiles (for owner info display)
CREATE POLICY IF NOT EXISTS "Profiles viewable by all"
ON profiles FOR SELECT
USING (true);

-- Users can update only their own profile
CREATE POLICY IF NOT EXISTS "Users update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- 2️⃣ PG LISTINGS TABLE
-- ============================================
-- Public can view active listings, owners can view their own (any status)
CREATE POLICY IF NOT EXISTS "Public view active PGs"
ON pg_listings FOR SELECT
USING (status = 'active' OR owner_id = auth.uid());

-- Only owners can create listings
CREATE POLICY IF NOT EXISTS "Owners create PGs"
ON pg_listings FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- Owners can update their own listings
CREATE POLICY IF NOT EXISTS "Owners update own PGs"
ON pg_listings FOR UPDATE
USING (owner_id = auth.uid());

-- Owners can delete their own listings
CREATE POLICY IF NOT EXISTS "Owners delete own PGs"
ON pg_listings FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- 3️⃣ REVIEWS TABLE
-- ============================================
-- Anyone can read reviews (public)
CREATE POLICY IF NOT EXISTS "Public read reviews"
ON reviews FOR SELECT
USING (true);

-- Authenticated users can insert reviews
CREATE POLICY IF NOT EXISTS "Users insert reviews"
ON reviews FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY IF NOT EXISTS "Users update own reviews"
ON reviews FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY IF NOT EXISTS "Users delete own reviews"
ON reviews FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 4️⃣ REVIEW VOTES TABLE
-- ============================================
-- Public can read all votes
CREATE POLICY IF NOT EXISTS "Public read review votes"
ON review_votes FOR SELECT
USING (true);

-- Users can vote (insert)
CREATE POLICY IF NOT EXISTS "Users vote"
ON review_votes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own votes
CREATE POLICY IF NOT EXISTS "Users update vote"
ON review_votes FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY IF NOT EXISTS "Users delete vote"
ON review_votes FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 5️⃣ Q&A SYSTEM (QNA TABLE)
-- ============================================
-- Public can read all Q&A
CREATE POLICY IF NOT EXISTS "Public read QnA"
ON qna FOR SELECT
USING (true);

-- Users can ask questions
CREATE POLICY IF NOT EXISTS "Users ask questions"
ON qna FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can edit/delete their own unanswered questions
CREATE POLICY IF NOT EXISTS "Users update own unanswered QnA"
ON qna FOR UPDATE
USING (user_id = auth.uid() AND answer IS NULL);

CREATE POLICY IF NOT EXISTS "Users delete own unanswered QnA"
ON qna FOR DELETE
USING (user_id = auth.uid() AND answer IS NULL);

-- Owners can answer questions on their PG listings
CREATE POLICY IF NOT EXISTS "Owners answer QnA"
ON qna FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pg_listings
    WHERE id = qna.pg_id AND owner_id = auth.uid()
  )
)
WITH CHECK (answered_by = auth.uid());

-- ============================================
-- 6️⃣ CHATS TABLE
-- ============================================
-- Chat participants (user or owner) can view
CREATE POLICY IF NOT EXISTS "Chat participants read"
ON chats FOR SELECT
USING (user_id = auth.uid() OR owner_id = auth.uid());

-- Users can create chats
CREATE POLICY IF NOT EXISTS "Users create chats"
ON chats FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Participants can update chat status
CREATE POLICY IF NOT EXISTS "Participants update chats"
ON chats FOR UPDATE
USING (user_id = auth.uid() OR owner_id = auth.uid());

-- ============================================
-- 7️⃣ MESSAGES TABLE
-- ============================================
-- Only chat participants can read messages
CREATE POLICY IF NOT EXISTS "Read chat messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND (chats.user_id = auth.uid() OR chats.owner_id = auth.uid())
  )
);

-- Chat participants can send messages
CREATE POLICY IF NOT EXISTS "Send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_id
    AND (chats.user_id = auth.uid() OR chats.owner_id = auth.uid())
  )
);

-- ============================================
-- 8️⃣ SAVED PGS TABLE
-- ============================================
-- Users can manage their own saved PGs (all operations)
CREATE POLICY IF NOT EXISTS "Users manage saved PGs"
ON saved_pgs FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 9️⃣ VACANCY ALERTS TABLE
-- ============================================
-- Users can manage their own vacancy alerts
CREATE POLICY IF NOT EXISTS "Users manage vacancy alerts"
ON vacancy_alerts FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 🔟 PRICE DROP ALERTS TABLE
-- ============================================
-- Users can manage their own price drop alerts
CREATE POLICY IF NOT EXISTS "Users manage price alerts"
ON price_drop_alerts FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 1️⃣1️⃣ NOTIFICATIONS TABLE
-- ============================================
-- Users can only read their own notifications
CREATE POLICY IF NOT EXISTS "Users read own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY IF NOT EXISTS "Users update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- 1️⃣2️⃣ VERIFICATION DOCUMENTS TABLE
-- ============================================
-- Owners can view their own verification documents
CREATE POLICY IF NOT EXISTS "Owners view verification docs"
ON verification_documents FOR SELECT
USING (owner_id = auth.uid());

-- Owners can upload verification documents
CREATE POLICY IF NOT EXISTS "Owners insert verification docs"
ON verification_documents FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Owners can update only their pending documents
CREATE POLICY IF NOT EXISTS "Owners update pending docs"
ON verification_documents FOR UPDATE
USING (owner_id = auth.uid() AND status = 'pending');

-- Admins have full access to all verification documents
CREATE POLICY IF NOT EXISTS "Admins manage verification docs"
ON verification_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 1️⃣3️⃣ CONTENT REPORTS TABLE
-- ============================================
-- Users can view their own reports
CREATE POLICY IF NOT EXISTS "Users view own reports"
ON content_reports FOR SELECT
USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY IF NOT EXISTS "Users create reports"
ON content_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid());

-- Admins can view and manage all reports
CREATE POLICY IF NOT EXISTS "Admins manage reports"
ON content_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 1️⃣4️⃣ RECENTLY VIEWED TABLE
-- ============================================
-- Users can manage their own recently viewed items
CREATE POLICY IF NOT EXISTS "Users manage recently viewed"
ON recently_viewed FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 1️⃣5️⃣ STORAGE: verification-docs BUCKET
-- ============================================
-- Owners can upload files to their own folder
CREATE POLICY IF NOT EXISTS "Owners upload verification files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- Owners can read their own files
CREATE POLICY IF NOT EXISTS "Owners read verification files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- Owners can delete their own files
CREATE POLICY IF NOT EXISTS "Owners delete verification files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-docs'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- Admins have full access to verification storage
CREATE POLICY IF NOT EXISTS "Admins manage verification storage"
ON storage.objects FOR ALL
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 1️⃣6️⃣ STORAGE: pg-images BUCKET (Optional)
-- ============================================
-- Public can view all PG images
CREATE POLICY IF NOT EXISTS "Public view PG images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pg-images');

-- Owners can upload PG images
CREATE POLICY IF NOT EXISTS "Owners upload PG images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pg-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- Owners can delete their own PG images
CREATE POLICY IF NOT EXISTS "Owners delete PG images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pg-images'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- ============================================
-- NOTES & INSTRUCTIONS
-- ============================================
/*
1. Run this file from Supabase SQL editor (Dashboard → SQL Editor → New Query)
2. These policies assume the following folder structure:
   - verification-docs: verification/{owner_id}/{filename}
   - pg-images: {owner_id}/{pg_id}/{filename}
   
3. Storage buckets must be created in Supabase Dashboard → Storage:
   - verification-docs (private)
   - pg-images (public)
   
4. IF NOT EXISTS prevents errors when re-running this file
5. Some operations (vote counting, metrics) use backend service role to bypass RLS
6. Admins bypass most restrictions via role check in profiles table

TROUBLESHOOTING:
- If policies conflict, drop existing ones: DROP POLICY "policy_name" ON table_name;
- Check active policies: SELECT * FROM pg_policies WHERE schemaname = 'public';
- Test with different users to verify access control
*/
