# Supabase Database - Quick Reference

## 📋 Complete Database Schema

**Location**: `backend/supabase_schema.sql` (645 lines)

This is the **single source of truth** for the entire database schema. It includes:

### ✅ What's Included

1. **All Tables** (10 core tables):
   - profiles (users, owners, admins with roles)
   - pg_listings (property listings)
   - reviews (with upvote/downvote)
   - saved_pgs (bookmarks)
   - chats (anonymous chat system)
   - messages (chat messages)
   - notifications (real-time alerts)
   - verification_documents (owner verification)
   - vacancy_alerts (user subscriptions)
   - user_preferences (filters & settings)

2. **Row Level Security (RLS)**:
   - All tables have RLS policies
   - Users can only access their own data
   - Owners can manage their listings
   - Admins have full access

3. **Functions & Triggers**:
   - Auto-update timestamps
   - Notification creation on events
   - View count incrementing
   - Real-time subscriptions

4. **Indexes**:
   - Optimized queries on all foreign keys
   - Search performance indexes
   - Location-based indexes

5. **Storage Buckets**:
   - pg-images (public)
   - verification-docs (private)
   - profile-pictures (public)

---

## 🎯 How to Use

### Initial Setup (One Time)

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Go to SQL Editor**: Left sidebar → SQL Editor
3. **Create New Query**: Click "New Query"
4. **Copy Schema**: Open `backend/supabase_schema.sql` and copy ALL content
5. **Paste & Run**: Paste in editor and click "Run" (or Ctrl+Enter)
6. **Verify**: Check for success messages, no red errors

That's it! Your entire database is ready.

---

## 📊 Database Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | User accounts | Roles (user/owner/admin), verification status |
| **pg_listings** | Properties | Full details, images, amenities, location |
| **reviews** | User feedback | Rating, text, upvotes/downvotes, anonymous option |
| **saved_pgs** | Favorites | User bookmarks for later viewing |
| **chats** | Conversations | Anonymous messaging between users & owners |
| **messages** | Chat messages | Real-time messaging with read status |
| **notifications** | Alerts | Reviews, messages, verifications, system alerts |
| **verification_documents** | Owner docs | Upload verification, admin approval workflow |
| **vacancy_alerts** | Subscriptions | User alerts when vacancies open |
| **user_preferences** | Settings | Search filters, budget, amenities preferences |

---

## 🔧 Additional SQL Files

### Q&A Feature (Optional)
**File**: `CREATE_QNA_TABLE.sql` (root directory)

If you want to add Q&A functionality (users ask questions, owners answer):

1. Open Supabase SQL Editor
2. Copy content from `CREATE_QNA_TABLE.sql`
3. Run the query
4. Creates `qna` table with:
   - User questions
   - Owner answers
   - Timestamps
   - RLS policies

**Note**: This is already integrated in the frontend, just needs the table created.

---

## 🚀 Frontend Database Service

**Location**: `frontend/src/lib/supabase.ts` (1000+ lines)

This file contains ALL database operations used by the frontend:

### Available Services

```typescript
import supabaseService from '@/lib/supabase';

// Authentication
await supabaseService.auth.signUp(email, password, role);
await supabaseService.auth.signIn(email, password);
await supabaseService.auth.signOut();

// PG Listings
await supabaseService.pg.getAll(filters);
await supabaseService.pg.getById(id);
await supabaseService.pg.create(data);
await supabaseService.pg.update(id, data);

// Reviews
await supabaseService.reviews.getByPGId(pgId);
await supabaseService.reviews.create(reviewData);
await supabaseService.reviews.upvote(reviewId);
await supabaseService.reviews.downvote(reviewId);

// Saved PGs
await supabaseService.savedPGs.toggle(pgId);
await supabaseService.savedPGs.getAll();

// Chat
await supabaseService.chat.createChat(pgId);
await supabaseService.chat.sendMessage(chatId, content);
await supabaseService.chat.getMessages(chatId);

// Notifications
await supabaseService.notifications.getAll();
await supabaseService.notifications.markAsRead(id);

// Q&A
await supabaseService.qna.getByPGId(pgId);
await supabaseService.qna.askQuestion(pgId, question);
await supabaseService.qna.answerQuestion(questionId, answer);

// Verification (Admin)
await supabaseService.verification.getPendingVerifications();
await supabaseService.verification.approveVerification(docId);
await supabaseService.verification.rejectVerification(docId);

// Admin
await supabaseService.admin.getStats();
await supabaseService.admin.getAllUsers();
await supabaseService.admin.getAllListings();
```

---

## 🔐 Row Level Security (RLS) Patterns

### Users Can:
- View all published PG listings
- Create/edit/delete their own reviews
- Save/unsave any PG
- Send messages in their chats
- View their own notifications

### Owners Can:
- All user permissions +
- Create/edit/delete their own listings
- View all messages in their listing chats
- Submit verification documents
- Answer Q&A for their listings

### Admins Can:
- All permissions
- Approve/reject verifications
- Manage any user/listing
- View all system data

---

## 🧪 Testing Database

### View Data in Supabase
1. Dashboard → Table Editor
2. Select any table
3. View/Edit rows

### Insert Test Data
```sql
-- Create test user (run in SQL Editor)
INSERT INTO profiles (id, role, full_name, email)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'user',
  'Test User',
  'test@example.com'
);

-- Create test PG listing
INSERT INTO pg_listings (
  owner_id, name, location, rent, room_type, gender, description
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Test PG',
  'Koramangala, Bangalore',
  12000,
  'single',
  'any',
  'Great place for students'
);
```

### Reset Database
```sql
-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Re-run backend/supabase_schema.sql
```

---

## 📝 Schema Updates

If you need to modify the database:

1. **Never edit existing tables directly** - create migrations
2. **Add new tables**: Append to `backend/supabase_schema.sql`
3. **Modify columns**: Create separate migration file
4. **Test locally first** in Supabase SQL Editor
5. **Update frontend service** in `frontend/src/lib/supabase.ts`

---

## 💡 Quick Tips

- ✅ Always run `backend/supabase_schema.sql` for initial setup
- ✅ RLS policies automatically enforce security - no manual checks needed
- ✅ Foreign keys ensure data integrity
- ✅ Indexes are already optimized - no manual indexing needed
- ✅ Real-time works out of the box for chat & notifications
- ✅ Storage buckets need manual creation (see main README.md)

---

## 🆘 Common Issues

### Schema errors when running SQL
- **Solution**: Drop all tables first, then re-run full schema
- Use: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`

### RLS policy blocking queries
- **Solution**: Check user is authenticated and has correct role
- Admins bypass most RLS policies

### Foreign key constraint errors
- **Solution**: Ensure referenced records exist (e.g., owner_id must exist in profiles)

---

**For full setup instructions, see main README.md**
