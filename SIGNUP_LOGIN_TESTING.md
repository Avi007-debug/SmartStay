# ✅ SmartStay Signup & Login Testing Checklist

## 🎯 Before You Start

### 1. Disable Email Confirmation in Supabase

**CRITICAL STEP - Do this first!**

1. Go to: https://supabase.com/dashboard
2. Select your project (idlhbhxqtzgyjygklttr)
3. Click **Authentication** → **Settings**
4. Scroll to **"Enable email confirmations"**
5. **TOGGLE IT OFF** (disable it)
6. Click **Save**

✅ Without this, users won't appear in Authentication!

---

## 🧪 Test 1: Sign Up New User

### Frontend Testing:

1. **Open the website:**
   - URL: http://localhost:8080/auth
   - You should see the SmartStay logo (image.png) at the top

2. **Select User Type:**
   - Click **Student** button (should be blue/highlighted by default)

3. **Click Sign Up tab**

4. **Fill in the form:**
   - Full Name: `John Doe`
   - Email: `john.doe@test.com`
   - Phone: `1234567890` (optional)
   - Password: `password123`

5. **Click Sign Up**

### ✅ Expected Behavior:

- Toast notification: **"Account Created!"**
- Message: "Please check your email to verify your account" (you can ignore this since confirmation is disabled)
- Form should clear
- Should switch to "Sign In" tab automatically

### ❌ If Error Appears:

**"User already registered"**
- Delete the user from Supabase → Authentication → Users
- Try again with different email

**"Weak Password"**
- Password must be at least 6 characters

**"Could not create account"**
- Check browser console (F12) for errors
- Verify .env file has correct Supabase URL and key

---

## 🔍 Test 2: Verify User in Supabase

### Step 1: Check Authentication

1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. Look for: `john.doe@test.com`

**✅ Expected:**
- Email: john.doe@test.com
- Confirmed: ✅ (green checkmark - should be auto-confirmed)
- Created: Just now

**❌ If user is NOT there:**
- You didn't disable email confirmation (go back to step 1)
- Check browser console for errors

### Step 2: Check Profile Auto-Creation

1. Go to **SQL Editor**
2. Run this query:

```sql
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.phone,
  p.created_at,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'john.doe@test.com';
```

**✅ Expected Result:**

| id | role | full_name | phone | created_at | email |
|---|---|---|---|---|---|
| <uuid> | user | John Doe | 1234567890 | 2025-12-26... | john.doe@test.com |

**❌ If 0 rows returned:**

Profile wasn't auto-created. Check trigger:

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

If trigger is missing, re-run the migration SQL.

---

## 🔐 Test 3: Sign In

1. **Go back to:** http://localhost:8080/auth
2. **Click Sign In tab**
3. **Fill in:**
   - Email: `john.doe@test.com`
   - Password: `password123`
4. **Click Sign In**

### ✅ Expected Behavior:

- Toast: **"Welcome back!"**
- Redirects to: `/user-dashboard`
- You should be logged in
- Navbar should show user menu

### ❌ If Error:

**"Invalid email or password"**
- Check you typed the password correctly
- Try signing up again

**"Profile not found"**
- Profile wasn't created - check Test 2 above

---

## 👔 Test 4: Owner Sign Up

1. **Go to:** http://localhost:8080/auth
2. **Click Sign Up tab**
3. **Select "Owner" button** (Building icon)
4. **Fill in:**
   - Full Name: `Jane Smith`
   - Email: `jane.owner@test.com`
   - Password: `owner123`
5. **Click Sign Up**

### Verify Owner Profile:

```sql
SELECT 
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jane.owner@test.com';
```

**✅ Expected:**
- role: **owner** (not 'user')

**❌ If role is 'user':**
- Trigger not handling role metadata properly
- Check handle_new_user function in migration

---

## 🛡️ Test 5: Admin Access (Security Check)

**Try to create admin via signup:**

1. This should NOT be possible via the UI (no admin button in signup)
2. Admin tab only shows on Sign In

**Verify security:**

Even if someone tries to manipulate the code to send `role: 'admin'` in signup metadata, the trigger should reject it.

**Test with SQL:**

```sql
-- Try to manually create admin user (should fail or become 'user')
SELECT 
  p.role,
  u.raw_user_meta_data->>'role' as attempted_role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.raw_user_meta_data->>'role' = 'admin';
```

**✅ Expected:**
- If any rows exist, `role` column should show 'user', NOT 'admin'
- This proves the security fix works

---

## 🎨 Test 6: Favicon Check

1. **Open:** http://localhost:8080
2. **Look at browser tab**
3. **Should see:** SmartStay logo (image.png) as the favicon

**✅ Expected:**
- Tab shows image.png icon
- No broken image icon

**❌ If broken:**
- Check that `/frontend/public/image.png` exists
- Clear browser cache (Ctrl+Shift+R)

---

## 📊 Test 7: Check User Roles in Database

**Run this query to see all users:**

```sql
SELECT 
  u.email,
  p.role,
  p.full_name,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
```

**✅ Expected:**

| email | role | full_name | email_confirmed_at | created_at |
|---|---|---|---|---|
| jane.owner@test.com | owner | Jane Smith | 2025-12-26... | 2025-12-26... |
| john.doe@test.com | user | John Doe | 2025-12-26... | 2025-12-26... |

**All users should have:**
- `email_confirmed_at` filled (auto-confirmed)
- Matching profile in profiles table
- Correct role based on signup selection

---

## 🚨 Common Issues & Fixes

### Issue 1: Users Not Appearing in Authentication

**Cause:** Email confirmation is enabled

**Fix:** 
1. Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. Save

---

### Issue 2: Profile Not Auto-Created

**Cause:** Trigger doesn't exist or isn't working

**Fix:**

Check trigger:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

If missing, create it:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Issue 3: Sign In Fails After Signup

**Cause:** Wrong password or profile missing

**Fix:**
1. Check you remember the password
2. Try password reset
3. Check profile exists in database (Test 2)

---

### Issue 4: Redirect Doesn't Work After Sign In

**Cause:** React Router navigation issue

**Fix:**
- Check browser console for errors
- Verify routes are set up correctly
- Try refreshing the page

---

### Issue 5: Favicon Not Showing

**Cause:** Wrong path or cache

**Fix:**
1. Verify file exists: `/frontend/public/image.png`
2. Clear browser cache: Ctrl + Shift + R
3. Check favicon path in index.html: `<link rel="icon" type="image/png" href="/image.png" />`

---

## ✅ Final Checklist

- [ ] Email confirmation disabled in Supabase
- [ ] User signup works (john.doe@test.com)
- [ ] User appears in Authentication → Users
- [ ] Profile auto-created in profiles table
- [ ] User can sign in successfully
- [ ] Owner signup works (jane.owner@test.com)
- [ ] Owner role is correctly set
- [ ] Admin cannot be created via signup (security)
- [ ] Favicon shows correctly in browser tab
- [ ] All redirects work after sign in

---

## 🎉 Success Criteria

**All tests passing means:**
✅ Signup flow works end-to-end
✅ Trigger auto-creates profiles
✅ Roles are assigned correctly
✅ Security prevents client-side admin creation
✅ Frontend and backend are properly connected
✅ UI shows correct branding (favicon)

**You're ready to build features!** 🚀

---

**Need Help?**

Check:
1. [SIGNUP_FIX_INSTRUCTIONS.md](SIGNUP_FIX_INSTRUCTIONS.md) - Detailed signup troubleshooting
2. [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) - Database verification steps
3. Browser console (F12) - For frontend errors
4. Supabase Dashboard → Logs - For backend errors
