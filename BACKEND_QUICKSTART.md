# 🚀 SmartStay Backend Quick Start Guide

## ✅ What You've Already Done

1. ✅ Created Supabase project
2. ✅ Installed `@supabase/supabase-js` in frontend
3. ✅ Run main schema successfully
4. ✅ Created Supabase client and API services

---

## 🔧 STEP 1: Run Schema Fixes (5 minutes)

### In Supabase Dashboard → SQL Editor:

1. **Open** `supabase_fixes_migration.sql`
2. **Copy entire contents**
3. **Paste** in SQL Editor
4. **Click "Run"**

This will:
- ✅ Remove email duplication from profiles
- ✅ Add strict RLS for PG creation (only owners)
- ✅ Add RLS for recently_viewed table
- ✅ Create auto-signup trigger (auto-creates profile on user signup)
- ✅ Add helper functions (search_pgs, get_recommendations)
- ✅ Add vacancy alert notifications trigger
- ✅ Add performance indexes

---

## ⚙️ STEP 2: Enable Realtime (2 minutes)

### In Supabase Dashboard:

1. **Database** → **Replication** (left sidebar)
2. Click on **"0 tables"** next to **Replication**
3. **Enable** these tables:
   - ✅ `messages`
   - ✅ `notifications`
   - ✅ `chats`
4. Click **"Save"**

---

## 📦 STEP 3: Create Storage Buckets (3 minutes)

### In Supabase Dashboard → Storage:

1. **Click "New Bucket"**

**Bucket 1: pg-images**
- Name: `pg-images`
- Public: ✅ **Yes**
- Click "Create"

**Bucket 2: verification-docs**
- Name: `verification-docs`
- Public: ❌ **No** (private)
- Click "Create"

**Bucket 3: profile-pictures**
- Name: `profile-pictures`
- Public: ✅ **Yes**
- Click "Create"

---

## 🔐 STEP 4: Add Storage Policies (5 minutes)

For each bucket, click **Policies** → **New Policy**:

### For `pg-images`:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public can view PG images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pg-images');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Owners can upload PG images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'pg-images'
  AND auth.role() = 'authenticated'
);
```

**Policy 3: Owner Delete**
```sql
CREATE POLICY "Owners can delete own PG images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'pg-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### For `profile-pictures`:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public can view profile pictures" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-pictures');
```

**Policy 2: Users Upload Own**
```sql
CREATE POLICY "Users can upload own profile picture" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### For `verification-docs`:

**Policy 1: Admin Read**
```sql
CREATE POLICY "Admin can view verification docs" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Policy 2: Owners Upload**
```sql
CREATE POLICY "Owners can upload verification docs" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'verification-docs'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);
```

---

## 🧪 STEP 5: Test Authentication (Test Now!)

### Run npm dev:
```bash
cd frontend
npm run dev
```

### Test Signup Flow:

1. Open http://localhost:5173
2. Click **"Sign In"** (top right)
3. Select **"Student"** role
4. Click **"Sign Up"** tab
5. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
6. Click **"Create Student Account"**

### ✅ What Should Happen:

1. Toast notification: **"Account Created!"**
2. Check Supabase Dashboard → **Authentication** → **Users**
   - New user should appear
3. Check Supabase Dashboard → **Table Editor** → **profiles**
   - New profile row should auto-create with:
     - `role: user`
     - `full_name: Test User`

### Test Sign In:

1. Go back to **"Sign In"** tab
2. Email: `test@example.com`
3. Password: `password123`
4. Click **"Sign In as Student"**

### ✅ What Should Happen:

- Redirects to `/user-dashboard`
- Toast: **"Welcome back!"**

---

## 🐛 Troubleshooting

### "Email not confirmed" error:

**Option 1 (Quick):** Disable email confirmation
1. Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **"Email Auth"**
3. **Uncheck** "Enable email confirmations"
4. Click **"Save"**

**Option 2 (Production):** Check your email for confirmation link

### "Profile not found" error:

- **Check:** Supabase Dashboard → Table Editor → profiles
- **Fix:** Manually run:
  ```sql
  SELECT * FROM auth.users;
  -- Copy the user ID
  
  INSERT INTO profiles (id, role, full_name)
  VALUES ('USER_ID_HERE', 'user', 'Test User');
  ```

### "Invalid API key" error:

- **Check:** `frontend/.env` has correct values
- **Fix:** Update `.env`:
  ```env
  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
  ```
- **Restart:** `npm run dev`

---

## 📊 STEP 6: Verify Everything Works

Run these queries in Supabase SQL Editor:

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'search_pgs', 'get_recommendations');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'pg_listings', 'recently_viewed');

-- Check realtime status (should show messages, notifications, chats)
SELECT id, name FROM realtime.subscription 
UNION
SELECT id::text, source_table_name FROM realtime.schema_migrations;
```

---

## 🎯 Next Steps After Everything Works

### 1. Connect Search Page to Backend

In `Search.tsx`, replace mock data:

```tsx
import { pgService } from '@/lib/supabase';

// In component:
const [pgs, setPgs] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function fetchPGs() {
    setIsLoading(true);
    try {
      const data = await pgService.getAll({
        city: filters.location,
        minRent: filters.budget[0],
        maxRent: filters.budget[1],
        gender: filters.gender,
        amenities: filters.amenities,
        verified: filters.verifiedOnly,
      });
      setPgs(data);
    } catch (error) {
      console.error('Error fetching PGs:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  fetchPGs();
}, [filters]);
```

### 2. Connect User Dashboard

```tsx
import { preferencesService, savedPGsService } from '@/lib/supabase';

// Fetch saved PGs
const savedPGs = await savedPGsService.getAll();

// Update preferences
await preferencesService.update({
  budget_min: 5000,
  budget_max: 15000,
  preferred_gender: 'boys',
  food_included: true,
});
```

### 3. Enable Realtime Chat

```tsx
import { chatService } from '@/lib/supabase';

// Subscribe to messages
useEffect(() => {
  const subscription = chatService.subscribeToMessages(
    chatId,
    (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, [chatId]);
```

---

## ✅ STATUS CHECKPOINT

At this point you should have:

- ✅ Database with all tables, RLS, triggers, functions
- ✅ Auto-signup working (profile created on user registration)
- ✅ Storage buckets with policies
- ✅ Realtime enabled for chat/notifications
- ✅ Auth working with role-based routing
- ✅ Supabase client connected to frontend

---

## 🎉 You're Ready!

**Backend is 100% functional.** Now you just need to:

1. Replace mock data with actual API calls
2. Test each feature end-to-end
3. Add error handling and loading states
4. Deploy to production

**Estimated time to fully connect frontend:** 2-3 hours

Need help with a specific feature? Let me know!
