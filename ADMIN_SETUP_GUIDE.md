# 🔐 Admin Setup Guide - SmartStay

## Setting Up Admin Access

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your SmartStay project

2. **Navigate to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Select the `profiles` table

3. **Find Your User Profile**
   - Search for your user by email or ID
   - Your user ID matches your auth.users ID

4. **Update Role to Admin**
   - Click on your profile row
   - Find the `role` column
   - Change the value from `user` or `owner` to `admin`
   - Click "Save"

5. **Verify Admin Access**
   - Sign out and sign in again
   - Visit: `http://localhost:8080/admin-dashboard`
   - You should now have access

### Method 2: Using SQL Query

1. **Open SQL Editor in Supabase**
   - Go to SQL Editor in Supabase Dashboard

2. **Run This Query** (replace with your email):
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (
     SELECT id FROM auth.users 
     WHERE email = 'your-email@example.com'
   );
   ```

3. **Verify the Update**:
   ```sql
   SELECT 
     p.id, 
     p.role, 
     p.full_name, 
     u.email 
   FROM profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE p.role = 'admin';
   ```

### Method 3: Direct SQL (if you have your user ID)

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-uuid-here';
```

---

## 🛡️ Security & Permissions

### Admin Privileges Include:
- ✅ View all users, owners, and listings
- ✅ Approve/reject verification requests
- ✅ Manage flagged content
- ✅ View platform analytics
- ✅ Suspend/activate user accounts
- ✅ Access admin dashboard (`/admin-dashboard`)

### Admin Restrictions:
- ❌ Cannot post PG listings (only owners can)
- ❌ Cannot sign up as admin (must be manually promoted)
- ❌ Cannot demote themselves from admin role

---

## 🚀 Admin Dashboard Features

Access at: `http://localhost:8080/admin-dashboard`

### Tabs:
1. **Overview** - Platform statistics
2. **Users** - Manage all users
3. **Owners** - Manage PG owners
4. **Listings** - View/moderate all PG listings
5. **Verification** - Approve/reject verification requests
6. **Reports** - Handle flagged content
7. **Analytics** - Platform insights

---

## 🔍 Troubleshooting

### "Access Denied" Error
**Issue**: Can't access admin dashboard

**Solutions**:
1. Check your profile role in Supabase:
   ```sql
   SELECT role FROM profiles WHERE id = auth.uid();
   ```

2. Make sure you're logged in with the correct account

3. Clear browser cache and sign in again

4. Verify the role is exactly `admin` (lowercase)

### "You do not have admin privileges"
**Issue**: Role not updated properly

**Fix**:
1. Sign out completely
2. Update role in Supabase (Method 1 or 2)
3. Sign in again
4. Visit `/admin-dashboard`

### Role Not Showing in Frontend
**Issue**: Frontend doesn't detect admin role

**Debug**:
```javascript
// In browser console:
const user = await authService.getCurrentUser();
console.log(user.profile?.role);
// Should print: "admin"
```

---

## 📝 User Roles Explained

### User (Default)
- Can search and view PG listings
- Can save favorites
- Can submit reviews and Q&A
- Cannot post PG listings

### Owner
- All user privileges
- Can post PG listings
- Can manage their own listings
- Can respond to Q&A
- Access to owner dashboard

### Admin
- View all platform data
- Moderate content
- Manage users and owners
- Approve verification requests
- Access to admin dashboard
- **Cannot** post PG listings

---

## ⚠️ Important Notes

1. **Admin Role is Manual**: For security, admin role cannot be set during signup. It must be manually assigned via database.

2. **First Admin Setup**: You need database access to create the first admin. After that, admins can promote other users.

3. **Role Persistence**: Role changes require logout and login to take effect in the frontend.

4. **Security**: Never commit admin credentials to git. Use environment variables for admin accounts.

---

## 🧪 Testing Admin Access

### Quick Test:
1. Create a test account: `testadmin@example.com`
2. Update role to admin using Method 2
3. Sign in
4. Visit: `http://localhost:8080/admin-dashboard`
5. Should see admin dashboard without errors

### Expected Behavior:
- ✅ Navbar shows: Home, Search (NO "Post Room")
- ✅ Can access `/admin-dashboard`
- ✅ Can view all users and listings
- ✅ Can moderate content

### NOT Expected:
- ❌ "Post Room" button in navbar
- ❌ Access denied errors
- ❌ Redirected to home page

---

## 📧 Sample Admin Creation Script

```sql
-- Create admin user (run after signing up via UI)
-- Replace 'admin@smartstay.com' with your email

UPDATE profiles 
SET 
  role = 'admin',
  full_name = 'SmartStay Admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@smartstay.com'
);

-- Verify admin was created
SELECT 
  p.role,
  p.full_name,
  u.email,
  u.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Check current role | `SELECT role FROM profiles WHERE id = auth.uid();` |
| Make user admin | `UPDATE profiles SET role = 'admin' WHERE id = 'uuid';` |
| List all admins | `SELECT * FROM profiles WHERE role = 'admin';` |
| Remove admin | `UPDATE profiles SET role = 'user' WHERE id = 'uuid';` |
| Count by role | `SELECT role, COUNT(*) FROM profiles GROUP BY role;` |

---

Need help? Check the [main README](../README.md) or contact support.
