# 🎯 SmartStay Backend Setup - Quick Checklist

Use this checklist to ensure everything is set up correctly.

---

## 📋 Pre-Setup Checklist

- [ ] Supabase project created
- [ ] `@supabase/supabase-js` installed (`npm install @supabase/supabase-js`)
- [ ] `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `npm run dev` is working

---

## 🗄️ Database Setup

### Step 1: Run Main Schema
- [ ] Open Supabase Dashboard
- [ ] Go to **SQL Editor**
- [ ] Open `supabase_schema.sql`
- [ ] Copy entire file content
- [ ] Paste in SQL Editor
- [ ] Click **"Run"**
- [ ] Verify: No errors shown
- [ ] Check **Table Editor** - should see 14 tables

### Step 2: Run Fixes & Enhancements
- [ ] Still in **SQL Editor**
- [ ] Open `supabase_fixes_migration.sql`
- [ ] Copy entire file content
- [ ] Paste in SQL Editor
- [ ] Click **"Run"**
- [ ] Verify: No errors shown

### Step 3: Verify Database
Run this query in SQL Editor:
```sql
-- Should return 14 tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```
- [ ] Query returns 14 tables

---

## ⚡ Realtime Setup

- [ ] Go to **Database** → **Replication**
- [ ] Click on table count (should show "0 tables")
- [ ] Find and enable:
  - [ ] `messages`
  - [ ] `notifications`
  - [ ] `chats`
- [ ] Click **"Save"**
- [ ] Verify: Shows "3 tables" enabled

---

## 📦 Storage Setup

### Step 1: Create Buckets
- [ ] Go to **Storage**
- [ ] Click **"New Bucket"**
- [ ] Create **pg-images** (Public ✅)
- [ ] Create **verification-docs** (Private ❌)
- [ ] Create **profile-pictures** (Public ✅)
- [ ] Verify: 3 buckets visible in Storage

### Step 2: Add Policies
For each bucket, click **Policies** → **New Policy**:

#### pg-images Policies:
- [ ] "Public can view PG images" (SELECT)
- [ ] "Owners can upload PG images" (INSERT)
- [ ] "Owners can delete own PG images" (DELETE)

#### profile-pictures Policies:
- [ ] "Public can view profile pictures" (SELECT)
- [ ] "Users can upload own profile picture" (INSERT)

#### verification-docs Policies:
- [ ] "Admin can view verification docs" (SELECT)
- [ ] "Owners can upload verification docs" (INSERT)

*See BACKEND_QUICKSTART.md for exact SQL for each policy*

---

## 🧪 Testing Setup

### Step 1: Test Database Connection
- [ ] Open browser
- [ ] Navigate to `http://localhost:5173`
- [ ] Open DevTools (F12) → Console
- [ ] Paste:
```js
import { testConnection } from '@/lib/supabase.test'
testConnection()
```
- [ ] Verify: Console shows "✅ Database connected successfully"

### Step 2: Test Auto-Signup Trigger
- [ ] In Console, run:
```js
import { testSignup } from '@/lib/supabase.test'
testSignup()
```
- [ ] Verify: Console shows "✅ Profile auto-created successfully!"
- [ ] Go to Supabase Dashboard → **Authentication** → **Users**
- [ ] Verify: Test user appears
- [ ] Go to **Table Editor** → **profiles**
- [ ] Verify: Profile row with same user ID exists

### Step 3: Manual Sign Up Test
- [ ] Go to Auth page (`/auth`)
- [ ] Select **"Student"** role
- [ ] Click **"Sign Up"** tab
- [ ] Fill in:
  - Full Name: `Test User`
  - Email: `test@example.com`
  - Password: `password123`
- [ ] Click **"Create Student Account"**
- [ ] Verify: Toast shows "Account Created!"
- [ ] Check Supabase Dashboard → **Users** (user created)
- [ ] Check **profiles** table (profile auto-created)

### Step 4: Manual Sign In Test
- [ ] Go to **"Sign In"** tab
- [ ] Email: `test@example.com`
- [ ] Password: `password123`
- [ ] Click **"Sign In as Student"**
- [ ] Verify: Redirects to `/user-dashboard`
- [ ] Verify: Toast shows "Welcome back!"

---

## ⚙️ Development Settings (Optional but Recommended)

### Disable Email Confirmation (for testing)
- [ ] Supabase Dashboard → **Authentication** → **Settings**
- [ ] Scroll to **"Email Auth"**
- [ ] **Uncheck** "Enable email confirmations"
- [ ] Click **"Save"**

### Enable Auto-refresh tokens
- [ ] Same page, scroll to **"JWT Settings"**
- [ ] JWT expiry time: `3600` (1 hour)
- [ ] **Enable** "Refresh token rotation"

---

## 🔍 Verification Queries

Run these in SQL Editor to verify everything:

```sql
-- 1. Check all tables exist (should return 14)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Check RLS is enabled (should return 14)
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 3. Check triggers exist (should return 4+)
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 4. Check functions exist (should return 4+)
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'handle_new_user',
  'search_pgs',
  'get_recommendations',
  'notify_vacancy_alerts'
);

-- 5. Check indexes exist (should return 30+)
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';

-- 6. Check storage buckets (should return 3)
SELECT COUNT(*) FROM storage.buckets;
```

- [ ] All queries return expected counts

---

## 🎯 Final Checklist

Before integrating with frontend:

- [ ] All SQL migrations run successfully
- [ ] 14 tables visible in Table Editor
- [ ] Realtime enabled for 3 tables
- [ ] 3 storage buckets created
- [ ] Storage policies configured
- [ ] Auto-signup trigger working (test user created with profile)
- [ ] Manual signup works
- [ ] Manual signin works and redirects correctly
- [ ] No errors in browser console
- [ ] No errors in Supabase logs

---

## ✅ You're Done!

If all checkboxes are ✅, your backend is **100% ready**!

**Next Steps:**
1. Read `BACKEND_IMPLEMENTATION_COMPLETE.md` for feature overview
2. Start connecting frontend components to Supabase
3. Replace mock data with real API calls

**Need Help?**
- 📚 See `BACKEND_QUICKSTART.md` for troubleshooting
- 🧪 Use `/test` route with SupabaseTest component
- 🔍 Check Supabase Dashboard → API → Logs for errors

---

## 🚀 Ready to Build!

Your SmartStay backend is fully functional with:
- ✅ Authentication & authorization
- ✅ Database with RLS
- ✅ Realtime chat & notifications
- ✅ File storage
- ✅ Auto-signup
- ✅ Search functions
- ✅ Recommendations engine

**Time to connect your beautiful frontend to this powerful backend!** 🎉
