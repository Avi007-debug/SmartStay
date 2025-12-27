# 📱 Phone Number Fix Applied

## ✅ What Was Fixed

The phone number wasn't being saved because:
1. ❌ Frontend wasn't passing phone to the signup function
2. ❌ Phone wasn't included in Supabase metadata
3. ❌ Database trigger wasn't extracting phone from metadata

**All three are now fixed!**

---

## 🔧 Update Your Database

### Run this SQL in Supabase SQL Editor:

```sql
-- Update handle_new_user function to save phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
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
```

---

## 🧪 Test It

1. **Sign up a new user** with phone number: `1234567890`

2. **Verify in SQL Editor:**

```sql
SELECT 
  u.email,
  p.full_name,
  p.phone,
  p.role
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 5;
```

**✅ Expected:** Phone number should show in the `phone` column

---

## 📝 Note

Phone numbers from **existing users** won't be retroactively filled. Only **new signups** after running the SQL update will have phone numbers saved.

To update existing users' phone numbers, they would need to edit their profile through the app.

---

**Next:** After running the SQL, test signup with a phone number! 🎉
