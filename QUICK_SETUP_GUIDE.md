# 🎯 SmartStay - 15 Minute Setup Guide

Follow these steps in order. Total time: ~15 minutes.

---

## ⏱️ STEP 1: Database Setup (5 min)

### 1.1 Run Main Schema
1. Open **Supabase Dashboard** (https://app.supabase.com)
2. Select your SmartStay project
3. Click **SQL Editor** (left sidebar)
4. Click **"+ New Query"**
5. Open `supabase_schema.sql` in VS Code
6. **Copy ALL** (Ctrl+A, Ctrl+C)
7. **Paste** in Supabase SQL Editor
8. Click **"Run"** (or F5)
9. **Wait** ~10 seconds
10. ✅ Should see "Success. No rows returned"

### 1.2 Run Fixes & Enhancements
1. Still in SQL Editor
2. Click **"+ New Query"** (new tab)
3. Open `supabase_fixes_migration.sql` in VS Code
4. **Copy ALL**
5. **Paste** in Supabase
6. Click **"Run"**
7. ✅ Should see "Success. No rows returned"

### 1.3 Verify
1. Click **Table Editor** (left sidebar)
2. ✅ Should see 14 tables:
   - chats
   - content_reports
   - messages
   - notifications
   - pg_answers
   - pg_listings
   - pg_metrics
   - pg_questions
   - profiles
   - recently_viewed
   - review_votes
   - reviews
   - saved_pgs
   - vacancy_alerts
   - verification_documents

---

## ⚡ STEP 2: Enable Realtime (1 min)

1. Click **Database** → **Replication** (left sidebar)
2. Scroll down to **"Tables"** section
3. Toggle **ON** for:
   - ✅ messages
   - ✅ notifications
   - ✅ chats
4. Click **"Save"** (top right)
5. ✅ Should see "Replication updated"

---

## 📦 STEP 3: Storage Setup (3 min)

### 3.1 Create Buckets
1. Click **Storage** (left sidebar)
2. Click **"New bucket"**

**Bucket 1:**
- Name: `pg-images`
- Public: **✅ ON**
- Click "Create bucket"

**Bucket 2:**
- Name: `verification-docs`  
- Public: **❌ OFF**
- Click "Create bucket"

**Bucket 3:**
- Name: `profile-pictures`
- Public: **✅ ON**
- Click "Create bucket"

✅ You should now see 3 buckets

### 3.2 Add Basic Policy (Quick Method)
1. Click **pg-images** bucket
2. Click **Policies** tab
3. Click **"New policy"**
4. Select **"For full customization"**
5. Policy name: `Public Access`
6. **Check all** operations (SELECT, INSERT, UPDATE, DELETE)
7. **Target roles:** `public` and `authenticated`
8. Leave policy definition as `true`
9. Click **"Save policy"**

Repeat for **profile-pictures** bucket.

*(For production, use specific policies from BACKEND_QUICKSTART.md)*

---

## ⚙️ STEP 4: Auth Settings (1 min)

1. Click **Authentication** → **Settings** (left sidebar under Auth section)
2. Scroll to **"Email Auth"** section
3. **Uncheck** ❌ "Enable email confirmations" (for development only)
4. Scroll to bottom, click **"Save"**

---

## 🧪 STEP 5: Test Everything (5 min)

### 5.1 Check Environment
1. Open VS Code
2. Check `frontend/.env` file exists with:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```
3. If not, create it with your Supabase credentials

### 5.2 Start Dev Server
```bash
cd frontend
npm run dev
```

### 5.3 Test Signup
1. Open http://localhost:5173
2. Click **"Sign In"** (top right)
3. Select **"Student"** role
4. Click **"Sign Up"** tab
5. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
6. Click **"Create Student Account"**
7. ✅ Should show toast: "Account Created!"

### 5.4 Verify in Supabase
1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. ✅ Should see `test@example.com` user
4. Copy the user ID (long string like `a1b2c3...`)
5. Click **Table Editor** → **profiles**
6. ✅ Should see profile row with same user ID
7. ✅ Check `role` column shows `user`
8. ✅ Check `full_name` column shows `Test User`

### 5.5 Test Sign In
1. Back to your app
2. Click **"Sign In"** tab
3. Email: `test@example.com`
4. Password: `password123`
5. Click **"Sign In as Student"**
6. ✅ Should redirect to `/user-dashboard`
7. ✅ Should show toast: "Welcome back!"

---

## ✅ Success Criteria

All of these should be true:

- ✅ 14 tables in Supabase Table Editor
- ✅ 3 tables with realtime enabled
- ✅ 3 storage buckets created
- ✅ Can sign up new user
- ✅ Profile auto-created on signup
- ✅ Can sign in with credentials
- ✅ Redirects to correct dashboard
- ✅ No errors in browser console
- ✅ No errors in Supabase logs

---

## 🎉 You're Done!

Your SmartStay backend is now **fully functional**!

### What's Working Now:
- ✅ User authentication (signup/signin/signout)
- ✅ Auto-profile creation on signup
- ✅ Role-based access (user/owner/admin)
- ✅ Database with 14 tables
- ✅ Row Level Security on all tables
- ✅ Realtime chat & notifications
- ✅ File storage
- ✅ Search functions
- ✅ Recommendation engine

### Next Steps:
1. **Connect Search Page** - Replace mock data with `pgService.getAll()`
2. **Connect PG Detail** - Use `pgService.getById()`
3. **Connect User Dashboard** - Use `savedPGsService`, `preferencesService`
4. **Enable Chat** - Use `chatService` with realtime
5. **Add Notifications** - Use `notificationsService`

### Need Help?
- 📚 **BACKEND_QUICKSTART.md** - Detailed guide with troubleshooting
- 📋 **SETUP_CHECKLIST.md** - Step-by-step verification
- 📖 **BACKEND_IMPLEMENTATION_COMPLETE.md** - Full feature overview
- 🧪 **SupabaseTest.tsx** - Use `/test` route to run automated tests

---

## 🚀 Ready to Build!

Your frontend is already beautiful. Now it has a **powerful backend** to match!

**Estimated time to full integration:** 2-3 hours

Start with Search.tsx and work your way through each component. All the API services are ready in `supabase.ts`!

**Happy coding!** 🎊
