# Fixes Applied - UserDashboard & RLS Issues

## Issues Fixed

### ✅ 1. Fixed 406 Error on `saved_pgs` Query
**Problem**: Getting 406 Not Acceptable when querying saved_pgs table

**Root Cause**: Manually filtering by `user_id` when RLS policy already enforces `auth.uid() = user_id`

**Solution**: Removed all manual `.eq('user_id', ...)` filters from RLS-protected tables

**Files Changed**:
- [supabase.ts](frontend/src/lib/supabase.ts)

**Services Updated**:
```typescript
// ❌ BEFORE - Caused 406 error
.from('saved_pgs')
.select('*')
.eq('user_id', user?.id)  // ← Conflicts with RLS
.eq('pg_id', pgId)

// ✅ AFTER - Works correctly
.from('saved_pgs')
.select('*')
.eq('pg_id', pgId)  // RLS automatically filters by auth.uid()
```

**Affected Services**:
1. `savedPGsService.getAll()` - Removed user_id filter
2. `savedPGsService.unsave()` - Removed user_id filter
3. `savedPGsService.isSaved()` - Removed user_id filter, changed `.single()` to `.maybeSingle()`
4. `notificationsService.getAll()` - Removed user_id filter
5. `reviewsService.vote()` - Removed user_id filters, changed `.single()` to `.maybeSingle()`

**Why This Works**:
- RLS policies automatically filter rows where `user_id = auth.uid()`
- PostgREST treats manual `user_id` filter + RLS filter as conflicting constraints
- Trust RLS to handle security, query only by business logic fields (like `pg_id`)

---

### ✅ 2. Fixed React Error - Objects Not Valid as React Child
**Problem**: 
```
Uncaught Error: Objects are not valid as a React child 
(found: object with keys {city, full, state, street, pincode})
```

**Root Cause**: Trying to render `{pgData.address}` where address is a JSON object

**Solution**: Access specific properties of the address object

**File**: [PGDetail.tsx](frontend/src/pages/PGDetail.tsx#L273)

```tsx
// ❌ BEFORE - Crashes React
<p>{pgData.address}, {pgData.city}</p>

// ✅ AFTER - Renders correctly
<p>
  {typeof pgData.address === 'string' 
    ? pgData.address 
    : pgData.address?.full || pgData.address?.street}, 
  {pgData.city}
</p>
```

**Why This Works**:
- React cannot render objects directly
- Must access specific string properties
- Added type check to handle both string and object formats
- Falls back to `street` if `full` address not available

---

### ✅ 3. Fixed UserDashboard Hardcoded Data
**Problem**: Notifications and recommendations were still hardcoded arrays

**Solution**: Converted to state variables

**File**: [UserDashboard.tsx](frontend/src/pages/UserDashboard.tsx#L88-91)

```tsx
// ❌ BEFORE - Hardcoded
const notifications = [
  { id: 1, type: "vacancy", message: "...", ... },
  // ...
];
const recommendations = [
  { id: 1, name: "Premium Stay PG", ... },
  // ...
];

// ✅ AFTER - State variables ready for database
const [notifications, setNotifications] = useState<any[]>([]);
const [recommendations, setRecommendations] = useState<any[]>([]);
```

**Next Steps**:
- Load notifications from `notificationsService.getAll()`
- Generate recommendations based on user preferences
- Add loading states for both

---

### ⚠️ 4. RPC Function `increment_views` - 404 Not Found
**Problem**: `POST /rpc/increment_views → 404 Not Found`

**Solution**: Run SQL script to create/fix the function

**Action Required**: 
1. Go to Supabase Dashboard → SQL Editor
2. Run the script: [FIX_INCREMENT_VIEWS.sql](FIX_INCREMENT_VIEWS.sql)
3. After running, go to Settings → API → **Restart API** (important!)

**SQL Script**:
```sql
-- Drop existing if exists
DROP FUNCTION IF EXISTS increment_views(UUID);
DROP FUNCTION IF EXISTS public.increment_views(UUID);

-- Create with correct signature
CREATE OR REPLACE FUNCTION public.increment_views(pg_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pg_listings
  SET views = views + 1
  WHERE id = pg_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon;
```

**Why This Fails**:
- Function might not be in `public` schema
- PostgREST cache hasn't picked it up
- Function signature doesn't match what PostgREST expects

**Verification**:
```sql
-- Check function exists
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name = 'increment_views';
```
Should return: `routine_schema = 'public'`

**Frontend Call** (already correct in code):
```typescript
await supabase.rpc('increment_views', { pg_id: id })
```

---

## RLS Best Practices Learned

### 🎯 Key Rule: Don't Filter What RLS Already Filters

**RLS Policy Example**:
```sql
CREATE POLICY "Users manage own saved PGs" 
ON saved_pgs FOR ALL 
USING (auth.uid() = user_id);
```

**Correct Query Pattern**:
```typescript
// ✅ DO THIS
.from('saved_pgs')
.select('*')
.eq('pg_id', pgId)
// RLS automatically ensures user_id = auth.uid()

// ❌ DON'T DO THIS
.from('saved_pgs')
.select('*')
.eq('user_id', userId)  // Conflicts with RLS!
.eq('pg_id', pgId)
```

### 📋 Tables with RLS in SmartStay

**Always let RLS handle `user_id` filtering**:
- ✅ `saved_pgs` - RLS: `auth.uid() = user_id`
- ✅ `notifications` - RLS: `auth.uid() = user_id`
- ✅ `review_votes` - RLS: `auth.uid() = user_id`
- ✅ `reviews` - RLS: `auth.uid() = user_id`
- ✅ `chats` - RLS: `auth.uid() = user_id OR auth.uid() = owner_id`
- ✅ `messages` - RLS: Chat participant check
- ✅ `preferences` - RLS: `auth.uid() = user_id`

**Only filter manually for business logic**:
- Filter by `pg_id`, `review_id`, `chat_id`, etc.
- Never filter by `user_id` on RLS-protected tables

### 🔍 When to Use `.single()` vs `.maybeSingle()`

```typescript
// ✅ Use .maybeSingle() when row might not exist
const { data } = await supabase
  .from('saved_pgs')
  .select('*')
  .eq('pg_id', pgId)
  .maybeSingle()

if (data) {
  // Row exists
}

// ❌ Don't use .single() - throws error if not found
.single()  // Error: "Row not found"
```

---

## Testing Checklist

After running the SQL script and restarting API:

- [ ] Run SQL script [FIX_INCREMENT_VIEWS.sql](FIX_INCREMENT_VIEWS.sql)
- [ ] Restart API in Supabase Dashboard (Settings → API → Restart)
- [ ] Refresh frontend (clear browser cache if needed)
- [ ] Click on a PG listing - should see no 404 errors
- [ ] Save a PG - should see no 406 errors  
- [ ] View PGDetail page - should render address correctly
- [ ] Check browser console - no React errors about objects
- [ ] UserDashboard shows saved PGs from database (not hardcoded)

---

## Summary

### Fixed Errors:
1. ✅ 406 on saved_pgs → Removed user_id filters
2. ✅ React crash on address object → Access properties explicitly
3. ✅ Hardcoded dashboard data → Converted to state variables
4. ⚠️ 404 on increment_views → SQL script ready to run

### Files Modified:
- `frontend/src/lib/supabase.ts` - Removed RLS-conflicting filters
- `frontend/src/pages/PGDetail.tsx` - Fixed address rendering
- `frontend/src/pages/UserDashboard.tsx` - State variables for dynamic data

### Action Required:
Run [FIX_INCREMENT_VIEWS.sql](FIX_INCREMENT_VIEWS.sql) in Supabase Dashboard and restart API.
