# 🚀 SmartStay Complete Setup Guide

## 📋 Complete Step-by-Step Setup Checklist

### ✅ Step 1: Database Schema Setup

**Status: DONE** ✅

1. ✅ Ran `SMARTSTAY_COMPLETE_SCHEMA.sql` (or base schema + migration)
2. ✅ Created 15 tables (profiles, pg_listings, reviews, etc.)
3. ✅ Enabled RLS on all tables
4. ✅ Created all functions (search_pgs, get_recommendations, etc.)
5. ✅ Created all triggers (auto-signup, rating updates, vacancy alerts)

**Verification:**
```sql
-- Should return 15 tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

---

### ✅ Step 2: Bug Fixes Applied

**Status: DONE** ✅

1. ✅ Fixed index using `average_rating` instead of `rating`
2. ✅ Fixed JSON paths in `get_recommendations()` function
3. ✅ Fixed notification payload in `notify_vacancy_alerts()`
4. ✅ Fixed security in `handle_new_user()` trigger
5. ✅ Updated phone number storage

**Files Modified:**
- [supabase_fixes_migration.sql](supabase_fixes_migration.sql)
- [fix_phone_number.sql](fix_phone_number.sql)

---

### ✅ Step 3: Authentication Configuration

**Status: DONE** ✅

1. ✅ Disabled email confirmation in Supabase
   - Dashboard → Authentication → Settings
   - "Enable email confirmations" → OFF
2. ✅ Configured frontend signup with metadata
3. ✅ Auto-profile creation trigger working

**Test:**
```
Go to /auth → Sign up → Check Supabase Authentication → Users
```

---

### ✅ Step 4: Realtime Enabled

**Status: DONE** ✅

**Tables with Realtime:**
- ✅ messages
- ✅ notifications  
- ✅ chats

**How to verify:**
1. Supabase Dashboard → Database → Replication
2. Check that these 3 tables are listed

**Frontend Integration:**
```typescript
// Already implemented in frontend/src/lib/supabase.ts
chatService.subscribeToMessages(chatId, callback)
notificationsService.subscribeToNotifications(callback)
```

---

### ✅ Step 5: Storage Buckets Created

**Status: DONE** ✅

**Buckets:**
- ✅ `pg-images` (public) - For PG listing photos
- ✅ `profile-pictures` (public) - For user avatars
- ✅ `verification-docs` (private) - For owner verification documents

**How to verify:**
1. Supabase Dashboard → Storage
2. Should see 3 buckets listed

**Storage Policies Added:**
- Users can upload to profile-pictures (own only)
- Owners can upload to pg-images (own PGs only)
- Owners can upload to verification-docs (own only)
- Everyone can read public buckets

---

### ✅ Step 6: Frontend-Backend Integration

**Status: DONE** ✅

**Supabase Client:** [frontend/src/lib/supabase.ts](frontend/src/lib/supabase.ts)

**Services Implemented:**

| Service | Functions | Status |
|---------|-----------|--------|
| **authService** | signUp, signIn, signOut, getCurrentUser | ✅ |
| **pgService** | getAll, getById, create, update, search | ✅ |
| **savedPGsService** | toggle, getAll | ✅ |
| **reviewsService** | create, getByPG, vote | ✅ |
| **chatService** | create, getAll, sendMessage, **subscribeToMessages** | ✅ |
| **notificationsService** | getAll, markAsRead, **subscribeToNotifications** | ✅ |
| **vacancyAlertsService** | toggle, isEnabled | ✅ |
| **preferencesService** | update, get | ✅ |
| **storageService** | uploadPGImage, uploadProfilePicture, uploadVerificationDoc | ✅ |

---

## 🧪 Complete Testing Guide

### Test 1: Authentication Flow

**Sign Up:**
```
1. Go to http://localhost:8080/auth
2. Click "Sign Up"
3. Fill: Name, Email, Password, Phone (optional)
4. Select role: Student or Owner
5. Click "Sign Up"
```

**Verify:**
```sql
SELECT u.email, p.role, p.full_name, p.phone
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC LIMIT 5;
```

**Expected:** New user with correct role and phone

---

### Test 2: Realtime Messages

**Setup:**
```typescript
import { chatService } from '@/lib/supabase'

// Subscribe to chat messages
const subscription = chatService.subscribeToMessages(chatId, (message) => {
  console.log('New message:', message)
})

// Cleanup
subscription.unsubscribe()
```

**Test:**
1. Open chat in one browser tab
2. Send message from another tab
3. First tab should receive message instantly via realtime

---

### Test 3: Realtime Notifications

**Setup:**
```typescript
import { notificationsService } from '@/lib/supabase'

// Subscribe to notifications
const subscription = await notificationsService.subscribeToNotifications((notification) => {
  console.log('New notification:', notification)
})

// Cleanup
subscription?.unsubscribe()
```

**Test:**
1. Create a vacancy alert for a PG with 0 beds
2. Update PG to have 1 available bed
3. Notification should appear instantly

---

### Test 4: Storage Upload

**Upload PG Image:**
```typescript
import { storageService } from '@/lib/supabase'

const handleUpload = async (file: File) => {
  const { url } = await storageService.uploadPGImage(file, pgId)
  console.log('Uploaded to:', url)
}
```

**Upload Profile Picture:**
```typescript
const { url } = await storageService.uploadProfilePicture(file)
console.log('Profile picture:', url)
```

**Verify:**
1. Supabase Dashboard → Storage → pg-images
2. Should see uploaded files

---

### Test 5: Search Functionality

**Backend Function:**
```sql
SELECT * FROM search_pgs(
  search_city := 'Bangalore',
  only_verified := true,
  only_available := true
) LIMIT 10;
```

**Frontend:**
```typescript
import { pgService } from '@/lib/supabase'

const results = await pgService.getAll({
  city: 'Bangalore',
  verified: true,
  available: true
})
```

---

### Test 6: Recommendations

**Backend:**
```sql
-- Get user ID first
SELECT id FROM profiles WHERE role = 'user' LIMIT 1;

-- Then get recommendations
SELECT * FROM get_recommendations('<USER_ID>'::UUID);
```

**Frontend:**
```typescript
const recommendations = await pgService.getRecommendations(userId)
```

---

### Test 7: Vacancy Alerts

**Test Flow:**
1. User creates alert for a PG with 0 beds
2. Owner updates PG to 1+ beds
3. Trigger fires `notify_vacancy_alerts()`
4. Notification inserted with JSONB payload
5. User receives realtime notification

**Verify:**
```sql
SELECT * FROM notifications 
WHERE type = 'vacancy' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📱 Frontend Pages Status

| Page | Route | Status | Integration |
|------|-------|--------|-------------|
| Auth | `/auth` | ✅ Working | Uses authService |
| User Dashboard | `/user-dashboard` | ⚠️ Needs data | Connect to pgService |
| Owner Dashboard | `/owner-dashboard` | ⚠️ Needs data | Connect to pgService |
| Admin Dashboard | `/admin-dashboard` | ⚠️ Needs data | Admin-specific queries |
| PG Listings | `/listings` | ⚠️ Needs data | Use search_pgs() |
| PG Detail | `/pg/:id` | ⚠️ Needs data | Use pgService.getById() |
| Chat | `/chat` | ⚠️ Needs realtime | Use chatService + subscribeToMessages |
| Profile | `/profile` | ⚠️ Needs data | Use authService.getCurrentUser() |

---

## 🎯 Next Implementation Steps

### Priority 1: Connect Dashboard Pages

**User Dashboard:**
```typescript
// frontend/src/pages/UserDashboard.tsx
import { pgService, savedPGsService } from '@/lib/supabase'

const UserDashboard = () => {
  const [savedPGs, setSavedPGs] = useState([])
  const [recommendations, setRecommendations] = useState([])
  
  useEffect(() => {
    const loadData = async () => {
      const saved = await savedPGsService.getAll()
      const recs = await pgService.getRecommendations()
      setSavedPGs(saved)
      setRecommendations(recs)
    }
    loadData()
  }, [])
  
  // ... render UI
}
```

**Owner Dashboard:**
```typescript
// frontend/src/pages/OwnerDashboard.tsx
import { pgService } from '@/lib/supabase'

const OwnerDashboard = () => {
  const [myPGs, setMyPGs] = useState([])
  
  useEffect(() => {
    const loadPGs = async () => {
      const pgs = await pgService.getAll() // Will filter by owner_id automatically
      setMyPGs(pgs)
    }
    loadPGs()
  }, [])
  
  // ... render UI with storageService for image uploads
}
```

---

### Priority 2: Implement Chat with Realtime

```typescript
// frontend/src/pages/Chat.tsx
import { chatService } from '@/lib/supabase'

const Chat = ({ chatId }) => {
  const [messages, setMessages] = useState([])
  
  useEffect(() => {
    // Load existing messages
    chatService.getMessages(chatId).then(setMessages)
    
    // Subscribe to new messages
    const subscription = chatService.subscribeToMessages(chatId, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })
    
    return () => subscription.unsubscribe()
  }, [chatId])
  
  const sendMessage = async (text) => {
    await chatService.sendMessage(chatId, text)
  }
  
  // ... render chat UI
}
```

---

### Priority 3: Add Storage Upload Components

**Image Upload Component:**
```typescript
// frontend/src/components/ImageUpload.tsx
import { storageService } from '@/lib/supabase'

const ImageUpload = ({ onUpload, bucket = 'pg-images' }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const { url } = bucket === 'pg-images' 
        ? await storageService.uploadPGImage(file, pgId)
        : await storageService.uploadProfilePicture(file)
      
      onUpload(url)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
  
  return <input type="file" accept="image/*" onChange={handleFileChange} />
}
```

---

### Priority 4: Implement Notifications UI

```typescript
// frontend/src/components/NotificationBell.tsx
import { notificationsService } from '@/lib/supabase'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    // Load existing notifications
    notificationsService.getAll().then(data => {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    })
    
    // Subscribe to new notifications
    const subscription = notificationsService.subscribeToNotifications((newNotif) => {
      setNotifications(prev => [newNotif, ...prev])
      setUnreadCount(prev => prev + 1)
    })
    
    return () => subscription?.unsubscribe()
  }, [])
  
  // ... render bell icon with badge
}
```

---

## 🔐 Security Checklist

- ✅ RLS enabled on all tables
- ✅ Users can only see/edit their own data
- ✅ Owners can only manage their own PGs
- ✅ Admin role cannot be set via signup
- ✅ Storage policies restrict uploads to authenticated users
- ✅ Verification docs bucket is private
- ⚠️ **TODO:** Review and test all RLS policies thoroughly

---

## 🚨 Known Issues & Limitations

### Email Confirmation Disabled
- **Current:** Email confirmation is OFF for development
- **Production:** Must re-enable and configure email templates

### Storage Bucket Policies
- **Current:** Basic policies in place
- **Production:** Review file size limits, allowed file types

### Realtime Connections
- **Limit:** Supabase free tier has connection limits
- **Production:** Monitor connection usage

---

## 📊 Environment Variables

**Required in `.env`:**
```env
VITE_SUPABASE_URL=https://idlhbhxqtzgyjygklttr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Optional for production:**
```env
VITE_SUPABASE_SERVICE_ROLE_KEY=... # For admin operations
VITE_APP_URL=https://smartstay.com
```

---

## 🎉 Summary

### ✅ Completed
1. Database schema with 15 tables
2. All bug fixes applied
3. Authentication working (signup, signin, auto-profile)
4. Realtime enabled (messages, notifications, chats)
5. Storage buckets created (pg-images, profile-pictures, verification-docs)
6. Frontend services implemented (auth, pgs, chat, storage, etc.)
7. Phone number storage fixed

### 🚧 Next Steps
1. Connect dashboard pages to backend data
2. Implement chat UI with realtime subscriptions
3. Add image upload components
4. Build notification bell UI
5. Create PG listing pages
6. Test all features end-to-end

### 📚 Documentation
- [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) - Database verification steps
- [SIGNUP_LOGIN_TESTING.md](SIGNUP_LOGIN_TESTING.md) - Auth testing guide
- [SIGNUP_FIX_INSTRUCTIONS.md](SIGNUP_FIX_INSTRUCTIONS.md) - Email confirmation setup
- [PHONE_FIX_README.md](PHONE_FIX_README.md) - Phone number fix details
- [BUG_FIXES_APPLIED.md](BUG_FIXES_APPLIED.md) - All bug fixes documented

---

**Your SmartStay backend is now fully configured and ready for frontend development!** 🚀

**Start building features by importing services:**
```typescript
import { 
  authService, 
  pgService, 
  chatService, 
  notificationsService,
  storageService 
} from '@/lib/supabase'
```
