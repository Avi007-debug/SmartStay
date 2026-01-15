-- ============================================
-- SMARTSTAY - COMPLETE DATABASE SETUP GUIDE
-- ============================================
-- This file provides instructions for setting up all database tables
-- ============================================

-- STEP 1: Run the main schema
-- File: backend/supabase_schema.sql
-- This creates all core tables:
--   ✓ profiles (with roles and preferences)
--   ✓ pg_listings (PG/hostel listings)
--   ✓ reviews (with upvote/downvote)
--   ✓ review_votes
--   ✓ saved_pgs
--   ✓ chats (anonymous chat system)
--   ✓ messages
--   ✓ notifications
--   ✓ vacancy_alerts
--   ✓ verification_documents
--   ✓ reports
--   ✓ All RLS policies
--   ✓ All functions and triggers

-- STEP 2: Run additional table schemas
-- These are kept separate for modularity

-- 2A. Q&A System
-- File: CREATE_QNA_TABLE.sql
-- Run this to enable Questions & Answers feature
-- Creates:
--   ✓ qna table with questions/answers
--   ✓ RLS policies for Q&A
--   ✓ Auto-set answered_at trigger

-- 2B. Price Drop Alerts  
-- File: backend/CREATE_PRICE_DROP_ALERTS.sql
-- Run this to enable price drop notifications
-- Creates:
--   ✓ price_drop_alerts table
--   ✓ RLS policies for price alerts
--   ✓ Auto-notification trigger on price drops
--   ✓ Integrates with notifications table

-- ============================================
-- EXECUTION ORDER
-- ============================================
/*
1. In Supabase Dashboard > SQL Editor:
   
   a) Run: backend/supabase_schema.sql (REQUIRED - Main schema)
   b) Run: CREATE_QNA_TABLE.sql (REQUIRED - Q&A feature)
   c) Run: backend/CREATE_PRICE_DROP_ALERTS.sql (NEW - Price alerts)

2. Verify in Database > Tables:
   You should see all tables created

3. Test RLS policies:
   - Try accessing tables as authenticated user
   - Verify row-level security works

4. Optional: Run FIELD_VALIDATION.sql to check data integrity
*/

-- ============================================
-- QUICK REFERENCE: ALL TABLES
-- ============================================
/*
Core Tables (supabase_schema.sql):
  1. profiles
  2. pg_listings  
  3. reviews
  4. review_votes
  5. saved_pgs
  6. chats
  7. messages
  8. notifications
  9. vacancy_alerts
  10. verification_documents
  11. reports

Additional Tables:
  12. qna (CREATE_QNA_TABLE.sql)
  13. price_drop_alerts (CREATE_PRICE_DROP_ALERTS.sql)
*/

-- ============================================
-- FRONTEND INTEGRATION STATUS
-- ============================================
/*
✅ FULLY CONNECTED:
  - User Registration/Login (Supabase Auth)
  - PG Listings (pgService)
  - Reviews with Upvote/Downvote (reviewsService)
  - Q&A System (qnaService)
  - Saved PGs (savedPGsService)
  - Vacancy Alerts (vacancyAlertsService)
  - Anonymous Chat (chatService) - NOW CONNECTED
  - Verification (verificationService)
  - Admin Panel (adminService)

🆕 NEW FEATURES:
  - Personalized Recommendations (AI endpoint + PersonalizedRecommendations component)
  - Customer Support Chatbot (AI endpoint + ChatbotWidget component)
  - Price Drop Alerts (priceDropAlertsService + PriceDropAlertSettings component)

🤖 AI FEATURES (backend/app.py):
  - Sentiment Analysis (/api/ai/sentiment-analysis)
  - Hidden Charges Detection (/api/ai/hidden-charges)
  - Travel Time Estimation (/api/ai/travel-time)
  - Description Generator (/api/ai/generate-description)
  - Personalized Recommendations (/api/ai/personalized-recommendations) NEW
  - Support Chatbot (/api/ai/chatbot) NEW
*/

-- ============================================
-- NOTES
-- ============================================
/*
- All tables have Row Level Security (RLS) enabled
- Triggers handle automatic notifications
- Foreign keys ensure referential integrity
- Indexes optimize query performance
- JSONB fields (preferences, payload) allow flexible data storage
*/
