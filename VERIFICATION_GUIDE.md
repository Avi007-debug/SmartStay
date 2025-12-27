# 🧪 SmartStay Database Verification Guide

## ✅ Step 3: Verify Everything is Working

You've run the migration. Now let's verify step-by-step.

---

## 🔍 PART 1: Database Structure Verification

### Test 1: Check Table Count

**Run in Supabase SQL Editor:**
```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**✅ Expected Result:**
```
15 tables total:
- chats (9 columns)
- content_reports (9 columns)
- messages (5 columns)
- notifications (8 columns)
- pg_answers (6 columns)
- pg_listings (30+ columns)
- pg_metrics (6 columns)
- pg_questions (6 columns)
- profiles (12 columns) ⚠️ No email column!
- recently_viewed (3 columns)
- review_votes (4 columns)
- reviews (12 columns)
- saved_pgs (3 columns)
- vacancy_alerts (4 columns)
- verification_documents (9 columns)
```

**❌ If less than 15 tables:** Re-run the migration SQL

---

### Test 2: Check Email Column Was Removed

**Run:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'email';
```

**✅ Expected Result:** `0 rows` (email column should NOT exist)

**❌ If email column exists:** You didn't run the migration file, only the base schema

---

### Test 3: Check user_profiles View Exists

**Run:**
```sql
SELECT * FROM user_profiles LIMIT 1;
```

**✅ Expected Result:** 
- If users exist: Shows profile data WITH email from auth.users
- If no users: `0 rows` (but no error)

**❌ If error "relation does not exist":** View wasn't created, re-run migration

---

### Test 4: Verify RLS is Enabled

**Run:**
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**✅ Expected Result:** All 15 tables show `rls_enabled = true`

**❌ If any show false:** Run this for each table:
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

---

## 🔧 PART 2: Function & Trigger Verification

### Test 5: Check Auto-Signup Trigger Exists

**Run:**
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**✅ Expected Result:** 
```
trigger_name: on_auth_user_created
event_object_table: users
action_statement: EXECUTE FUNCTION handle_new_user()
```

**❌ If 0 rows:** Trigger missing, run this:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Test 6: Check All Functions Exist

**Run:**
```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'handle_new_user',
  'search_pgs',
  'get_recommendations',
  'notify_vacancy_alerts',
  'update_pg_rating',
  'update_chat_last_message',
  'update_updated_at_column',
  'increment_views'
)
ORDER BY routine_name;
```

**✅ Expected Result:** 8 functions listed

**❌ If missing:** Re-run migration SQL file

---

### Test 7: Verify Index on average_rating (Not rating)

**Run:**
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pg_listings'
AND indexname = 'idx_pg_search_composite';
```

**✅ Expected Result:**
```
indexdef should contain: "average_rating DESC"
```

**❌ If contains "rating DESC":** Bug not fixed, run:
```sql
DROP INDEX IF EXISTS idx_pg_search_composite;
CREATE INDEX idx_pg_search_composite 
ON pg_listings(status, is_verified, is_available, average_rating DESC, created_at DESC);
```

---

## 🧪 PART 3: Functional Testing

### Test 8: Test Auto-Signup (CRITICAL)

**Step 1:** Go to Supabase Dashboard → Authentication → Users

**Step 2:** Click **"Invite User"** or use the signup in your app

**Step 3:** Create test user:
```
Email: test@smartstay.com
Password: test123456
```

**Step 4:** In SQL Editor, check if profile was auto-created:
```sql
SELECT 
  p.*,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'test@smartstay.com';
```

**✅ Expected Result:**
```
id: <some UUID>
role: user
full_name: User (or what you provided)
email: test@smartstay.com
created_at: <timestamp>
```

**❌ If 0 rows:** 
1. Check auth.users has the user
2. Manually insert profile:
```sql
INSERT INTO profiles (id, role, full_name)
SELECT 
  id,
  'user',
  'Test User'
FROM auth.users 
WHERE email = 'test@smartstay.com';
```
3. Verify trigger exists (Test 5)

---

### Test 9: Test Search Function

**Run:**
```sql
-- Should work without errors
SELECT * FROM search_pgs(
  search_city := 'Bangalore',
  only_verified := false,
  only_available := false
) LIMIT 5;
```

**✅ Expected Result:** 
- If PG listings exist: Returns rows
- If no listings: `0 rows` (but NO ERROR)

**❌ If error "column does not exist":** 
- Check error message
- If mentions "rating": Index bug, see Test 7
- If mentions other column: Schema mismatch

---

### Test 10: Test Recommendations Function

**First, get a user ID:**
```sql
SELECT id FROM profiles LIMIT 1;
```

**Then test recommendations:**
```sql
SELECT * FROM get_recommendations('<USER_ID_HERE>'::UUID);
```

**✅ Expected Result:** 
- Returns table with columns: pg_id, match_score, pg_data
- If no PGs: 0 rows
- If PGs exist but don't match: 0 rows

**❌ If error about budget/preferences:** JSON path bug, verify migration ran

---

### Test 11: Test Vacancy Alert Trigger

**Step 1:** Create a test PG with 0 beds:
```sql
INSERT INTO pg_listings (
  owner_id, 
  name, 
  description, 
  gender, 
  rent, 
  deposit, 
  total_beds, 
  available_beds
)
SELECT 
  id,
  'Test PG',
  'For testing',
  'any',
  10000,
  5000,
  5,
  0
FROM profiles 
WHERE role = 'owner'
LIMIT 1;
```

**Step 2:** Get the PG ID and create an alert:
```sql
-- Get PG ID
SELECT id FROM pg_listings WHERE name = 'Test PG';

-- Create alert (replace <USER_ID> and <PG_ID>)
INSERT INTO vacancy_alerts (user_id, pg_id, is_enabled)
VALUES ('<USER_ID>'::UUID, '<PG_ID>'::UUID, true);
```

**Step 3:** Trigger the alert by updating beds:
```sql
UPDATE pg_listings 
SET available_beds = 1 
WHERE name = 'Test PG';
```

**Step 4:** Check notifications:
```sql
SELECT * FROM notifications 
WHERE type = 'vacancy' 
ORDER BY created_at DESC 
LIMIT 5;
```

**✅ Expected Result:**
```
type: vacancy
title: Vacancy Available!
message: A room is now available at Test PG
payload: {"pg_id": "<UUID>", "pg_name": "Test PG"}
```

**❌ If no notification:**
1. Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'vacancy_alert_trigger';`
2. Verify alert is enabled: `SELECT * FROM vacancy_alerts WHERE pg_id = '<PG_ID>';`

---

## 🔐 PART 4: Security Verification

### Test 12: Verify Admin Role Cannot Be Set via Signup

**Attempt to create admin via signup metadata:**
```sql
-- Try to insert a fake admin via raw_user_meta_data
-- This should create a USER, not ADMIN

SELECT * FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin';
```

**✅ Expected Result:** 
- Any users here should have role = 'user' in profiles table, NOT 'admin'

**Check profiles:**
```sql
SELECT 
  p.role,
  u.email,
  u.raw_user_meta_data->>'role' as attempted_role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.raw_user_meta_data->>'role' = 'admin';
```

**✅ Expected Result:** `role` column should show 'user', proving the security fix works

**❌ If role shows 'admin':** SECURITY BUG! Re-run migration, specifically the handle_new_user function

---

### Test 13: Verify Owner-Only PG Creation

**Try to create PG as regular user:**
```sql
-- This should FAIL
INSERT INTO pg_listings (
  owner_id,
  name,
  gender,
  rent,
  deposit,
  total_beds,
  available_beds
)
SELECT 
  id,
  'Should Fail',
  'any',
  10000,
  5000,
  5,
  5
FROM profiles 
WHERE role = 'user'
LIMIT 1;
```

**✅ Expected Result:** Error: "new row violates row-level security policy"

**❌ If it succeeds:** RLS policy missing, run:
```sql
DROP POLICY IF EXISTS "Only owners can create PGs" ON pg_listings;
CREATE POLICY "Only owners can create PGs" ON pg_listings
FOR INSERT WITH CHECK (
  owner_id = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);
```

---

## 📊 PART 5: Final Health Check

### Test 14: Run Complete Health Check

**Copy and run this entire query:**
```sql
DO $$
DECLARE
  table_count INTEGER;
  rls_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
  email_exists BOOLEAN;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count RLS enabled
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'search_pgs',
    'get_recommendations',
    'notify_vacancy_alerts'
  );
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  
  -- Check email column
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) INTO email_exists;
  
  -- Print results
  RAISE NOTICE '====================================';
  RAISE NOTICE 'SMARTSTAY DATABASE HEALTH CHECK';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Tables created: % (expected: 15)', table_count;
  RAISE NOTICE 'Tables with RLS: % (expected: 15)', rls_count;
  RAISE NOTICE 'Core functions: % (expected: 4)', function_count;
  RAISE NOTICE 'Triggers: % (expected: 7+)', trigger_count;
  RAISE NOTICE 'Email in profiles: % (expected: false)', email_exists;
  RAISE NOTICE '====================================';
  
  IF table_count = 15 AND rls_count = 15 AND function_count = 4 AND NOT email_exists THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED!';
  ELSE
    RAISE WARNING '⚠️ SOME CHECKS FAILED - Review above';
  END IF;
END $$;
```

**✅ Expected Output:**
```
Tables created: 15 (expected: 15)
Tables with RLS: 15 (expected: 15)
Core functions: 4 (expected: 4)
Triggers: 7+ (expected: 7+)
Email in profiles: false (expected: false)
✅ ALL CHECKS PASSED!
```

---

## 🎯 Summary Checklist

- [ ] **Test 1:** 15 tables exist
- [ ] **Test 2:** Email column removed from profiles
- [ ] **Test 3:** user_profiles view works
- [ ] **Test 4:** All tables have RLS enabled
- [ ] **Test 5:** Auto-signup trigger exists
- [ ] **Test 6:** All 8 functions exist
- [ ] **Test 7:** Index uses average_rating (not rating)
- [ ] **Test 8:** Profile auto-creates on signup ✨ CRITICAL
- [ ] **Test 9:** search_pgs() works
- [ ] **Test 10:** get_recommendations() works
- [ ] **Test 11:** Vacancy alert trigger works
- [ ] **Test 12:** Cannot create admin via signup (security)
- [ ] **Test 13:** Only owners can create PGs (security)
- [ ] **Test 14:** Health check passes

---

## 🚨 If Any Test Fails

### Quick Fixes:

**Missing tables:**
```
Re-run: SMARTSTAY_COMPLETE_SCHEMA.sql
```

**Email column still exists:**
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
```

**Missing trigger:**
```
Re-run migration section about handle_new_user
```

**Functions missing:**
```
Re-run entire migration SQL
```

**RLS not enabled:**
```sql
-- For each table:
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

---

## ✅ When All Tests Pass

**You're ready for:**
1. Enable Realtime (messages, notifications, chats)
2. Create Storage Buckets
3. Test frontend signup
4. Connect frontend to backend

**See:** QUICK_SETUP_GUIDE.md for next steps

---

**Need help?** Check the error message carefully. Most issues are:
- Migration not fully run
- Trigger not created
- RLS policy missing

**Run the health check (Test 14) for a quick overview!** ✅
