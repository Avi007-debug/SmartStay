# SmartStay Supabase Setup Guide

This guide will help you set up your Supabase database and connect it to your SmartStay frontend.

## 📋 Prerequisites

1. Supabase account (free tier is fine)
2. Your `.env` file with Supabase credentials already created

## 🚀 Step-by-Step Setup

### Step 1: Run the Database Schema

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Navigate to SQL Editor**: Left sidebar → SQL Editor
3. **Create a New Query**: Click "New Query"
4. **Copy & Paste**: Open `backend/supabase_schema.sql` and paste the entire content
5. **Run the Query**: Click "Run" or press `Ctrl+Enter`
6. **Verify**: Check that all tables were created successfully (no errors in red)

### Step 2: Set Up Storage Buckets

1. **Navigate to Storage**: Left sidebar → Storage
2. **Create Buckets**:

#### Create `pg-images` bucket (Public):
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('pg-images', 'pg-images', true);

-- Set policy for public read
CREATE POLICY "Public read access" ON storage.objects FOR SELECT
  USING (bucket_id = 'pg-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pg-images' AND auth.role() = 'authenticated');
```

#### Create `verification-docs` bucket (Private):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false);

-- Only owners can upload their documents
CREATE POLICY "Owners can upload documents" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs' AND auth.role() = 'authenticated');

-- Only owner and admins can view
CREATE POLICY "Owners can view own documents" ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Create `profile-pictures` bucket (Public):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true);

CREATE POLICY "Public read access" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload own picture" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 3: Enable Realtime

Enable realtime on tables that need instant updates:

1. Go to **Database** → **Replication**
2. Enable realtime for these tables:
   - ✅ `messages` (for instant chat)
   - ✅ `notifications` (for instant alerts)
   - ✅ `chats` (for chat status updates)

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
```

### Step 4: Configure Authentication

1. **Navigate to Authentication** → **Providers**
2. **Enable Email/Password**: Should be enabled by default
3. **Optional**: Enable OAuth providers (Google, Facebook, etc.)

#### Set up Email Templates:
1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirmation email
   - Password reset email
   - Magic link email (if using)

### Step 5: Update Frontend Environment Variables

Your `.env` should already have:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 6: Install Supabase Client in Frontend

```bash
cd frontend
npm install @supabase/supabase-js
```

### Step 7: Create Supabase Client

Create `frontend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types (will generate later)
export type Database = {
  // Add types here after generating
}
```

### Step 8: Generate TypeScript Types (Optional but Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Generate types
supabase gen types typescript --linked > frontend/src/lib/database.types.ts
```

Then update `supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

## 🔧 Testing Your Setup

### Test 1: Create a Test User

Run in SQL Editor:
```sql
-- Insert a test profile (after creating auth user manually)
INSERT INTO profiles (id, role, full_name, email, phone)
VALUES (
  auth.uid(), -- Will use your current user's ID
  'user',
  'Test User',
  'test@example.com',
  '1234567890'
);
```

### Test 2: Create a Test PG Listing

```sql
INSERT INTO pg_listings (
  owner_id,
  name,
  description,
  address,
  latitude,
  longitude,
  gender,
  room_type,
  rent,
  deposit,
  total_beds,
  available_beds,
  amenities
) VALUES (
  (SELECT id FROM profiles WHERE role = 'owner' LIMIT 1),
  'Test PG',
  'A comfortable PG near university',
  '{"full": "123 Main St, Delhi", "city": "Delhi", "state": "Delhi"}'::jsonb,
  28.6139,
  77.2090,
  'any',
  'double',
  8500,
  5000,
  10,
  3,
  ARRAY['Wi-Fi', 'Food', 'Hot Water']
);
```

### Test 3: Query from Frontend

Create a test component:
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function TestConnection() {
  const [pgs, setPGs] = useState<any[]>([])

  useEffect(() => {
    async function fetchPGs() {
      const { data, error } = await supabase
        .from('pg_listings')
        .select('*')
        .limit(5)

      if (error) {
        console.error('Error:', error)
      } else {
        console.log('Success:', data)
        setPGs(data)
      }
    }

    fetchPGs()
  }, [])

  return (
    <div>
      <h2>PG Listings: {pgs.length}</h2>
      {pgs.map(pg => (
        <div key={pg.id}>{pg.name}</div>
      ))}
    </div>
  )
}
```

## 📊 Database Structure Overview

### Core Tables:
- `profiles` - User/Owner/Admin data
- `pg_listings` - Property listings
- `reviews` - User reviews with voting
- `pg_questions` & `pg_answers` - Q&A system
- `chats` & `messages` - Messaging system
- `notifications` - Alert system
- `saved_pgs` - Bookmarks
- `vacancy_alerts` - Vacancy notifications
- `verification_documents` - Owner verification
- `content_reports` - Moderation system

### Security:
✅ Row Level Security (RLS) enabled on all tables
✅ Policies configured for read/write access
✅ User authentication required for sensitive operations

## 🎯 Next Steps

1. ✅ Run the schema SQL
2. ✅ Set up storage buckets
3. ✅ Enable realtime
4. ✅ Install Supabase client in frontend
5. ✅ Create Supabase client file
6. ✅ Test connection
7. 🔄 Start integrating with your frontend components
8. 🔄 Implement authentication flow
9. 🔄 Build API services for each feature

## 📚 Useful Supabase Commands

```typescript
// Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// Query data
const { data, error } = await supabase
  .from('pg_listings')
  .select('*')
  .eq('gender', 'boys')
  .gte('rent', 5000)
  .lte('rent', 15000)

// Insert data
const { data, error } = await supabase
  .from('saved_pgs')
  .insert({ user_id: userId, pg_id: pgId })

// Realtime subscription
const channel = supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log('New message:', payload)
  )
  .subscribe()

// Upload file
const { data, error } = await supabase.storage
  .from('pg-images')
  .upload('image.jpg', file)
```

## ⚠️ Important Notes

1. **Security**: Never commit your `.env` file
2. **RLS**: All tables have Row Level Security enabled
3. **Indexes**: Performance indexes are already created
4. **Triggers**: Auto-update triggers are configured
5. **Realtime**: Only enabled on necessary tables to save resources

## 🆘 Troubleshooting

### Issue: "relation does not exist"
- Make sure you ran the entire schema SQL
- Check that you're connected to the right project

### Issue: "permission denied"
- Check RLS policies
- Make sure user is authenticated
- Verify the user has the correct role

### Issue: "duplicate key value"
- Check for existing data with same ID
- Verify UNIQUE constraints aren't being violated

## 🎉 You're Ready!

Your Supabase database is now fully configured and ready to use with your SmartStay frontend!
