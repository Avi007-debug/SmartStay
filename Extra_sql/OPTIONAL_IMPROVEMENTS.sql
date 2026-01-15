-- ============================================
-- OPTIONAL FUTURE IMPROVEMENTS
-- SmartStay Database Enhancements
-- ============================================
-- These are NOT implemented in the main schema
-- Add them only if you need the specific functionality

-- ============================================
-- 1️⃣ AUTO-UPDATE REVIEW VOTES (OPTIONAL)
-- ============================================

/*
CURRENT APPROACH (IMPLEMENTED):
  Frontend explicitly calls RPC after inserting/updating vote:
  
  await supabase.from('review_votes').insert(...)
  await supabase.rpc('update_review_votes', { p_review_id })

This is clean, predictable, and easier to debug.

OPTIONAL AUTOMATIC APPROACH:
  Add this trigger to automatically update vote counts without frontend RPC call.
*/

-- Drop existing function/trigger if implementing
DROP TRIGGER IF EXISTS auto_update_votes_trigger ON review_votes;
DROP FUNCTION IF EXISTS auto_update_review_votes();

-- Create automatic vote count update function
CREATE OR REPLACE FUNCTION auto_update_review_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT and UPDATE, use NEW.review_id
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_review_votes(NEW.review_id);
  END IF;
  
  -- For DELETE, use OLD.review_id
  IF TG_OP = 'DELETE' THEN
    PERFORM update_review_votes(OLD.review_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on review_votes table
CREATE TRIGGER auto_update_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_review_votes();

/*
⚠️ TRADEOFF ANALYSIS:

PROS:
  - Fully automatic - no frontend RPC call needed
  - Vote counts always synchronized
  - Simpler frontend code

CONS:
  - Less explicit - harder to understand data flow
  - Harder to debug when issues occur
  - Slight performance overhead (trigger fires on every vote change)
  - May complicate testing

RECOMMENDATION: 
  Keep current manual approach unless you have specific need for automation.
  The explicit RPC call makes the code more maintainable and debuggable.
*/

-- ============================================
-- 2️⃣ ADVANCED ANALYTICS VIEWS (OPTIONAL)
-- ============================================

/*
Create materialized views for complex analytics queries.
Useful for owner dashboard statistics.
*/

-- Owner statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS owner_stats AS
SELECT 
  p.id as owner_id,
  p.full_name as owner_name,
  COUNT(DISTINCT pg.id) as total_listings,
  SUM(pg.views) as total_views,
  SUM(pg.inquiries) as total_inquiries,
  AVG(pg.average_rating) as avg_rating,
  COUNT(DISTINCT r.id) as total_reviews,
  SUM(pg.available_beds) as total_available_beds,
  SUM(pg.total_beds) as total_beds
FROM profiles p
LEFT JOIN pg_listings pg ON pg.owner_id = p.id
LEFT JOIN reviews r ON r.pg_id = pg.id
WHERE p.role = 'owner'
GROUP BY p.id, p.full_name;

-- Create index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_stats_owner_id ON owner_stats(owner_id);

-- Refresh function (call periodically or on-demand)
CREATE OR REPLACE FUNCTION refresh_owner_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY owner_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT SELECT ON owner_stats TO authenticated;

/*
USAGE:
  -- Get stats for specific owner
  SELECT * FROM owner_stats WHERE owner_id = 'UUID';
  
  -- Refresh stats (run daily via cron or manually)
  SELECT refresh_owner_stats();
*/

-- ============================================
-- 3️⃣ INTELLIGENT NOTIFICATION THROTTLING (OPTIONAL)
-- ============================================

/*
Prevent notification spam by tracking last notification time
and implementing cooldown periods.
*/

-- Add last_notified_at column to vacancy_alerts
ALTER TABLE vacancy_alerts 
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

-- Update vacancy alert function with throttling
CREATE OR REPLACE FUNCTION notify_vacancy_alerts_throttled()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.available_beds = 0 AND NEW.available_beds > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, payload)
    SELECT
      va.user_id,
      'vacancy',
      'Vacancy Available',
      'A room is now available at ' || NEW.name,
      jsonb_build_object('pg_id', NEW.id)
    FROM vacancy_alerts va
    WHERE va.pg_id = NEW.id 
      AND va.is_enabled = true
      -- Only notify if last notification was more than 24 hours ago (or never)
      AND (va.last_notified_at IS NULL OR va.last_notified_at < NOW() - INTERVAL '24 hours');
    
    -- Update last notification time
    UPDATE vacancy_alerts
    SET last_notified_at = NOW()
    WHERE pg_id = NEW.id AND is_enabled = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
USAGE:
  Replace vacancy_alert_trigger with throttled version:
  
  DROP TRIGGER IF EXISTS vacancy_alert_trigger ON pg_listings;
  
  CREATE TRIGGER vacancy_alert_trigger_throttled
    AFTER UPDATE OF available_beds ON pg_listings
    FOR EACH ROW
    EXECUTE FUNCTION notify_vacancy_alerts_throttled();
*/

-- ============================================
-- 4️⃣ SMART SEARCH WITH FULL-TEXT INDEXING (OPTIONAL)
-- ============================================

/*
Improve search performance with PostgreSQL full-text search.
*/

-- Add tsvector column to pg_listings
ALTER TABLE pg_listings 
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_pg_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.address->>'city', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.address->>'area', '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.nearest_college, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
CREATE TRIGGER update_pg_search_vector_trigger
  BEFORE INSERT OR UPDATE ON pg_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_pg_search_vector();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_pg_search_vector ON pg_listings USING GIN(search_vector);

-- Enhanced search function
CREATE OR REPLACE FUNCTION search_pgs_fulltext(
  search_query TEXT,
  search_city TEXT DEFAULT NULL,
  min_rent INTEGER DEFAULT NULL,
  max_rent INTEGER DEFAULT NULL,
  search_gender TEXT DEFAULT NULL,
  search_room_type TEXT DEFAULT NULL
)
RETURNS SETOF pg_listings
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM pg_listings
  WHERE status = 'active'
    AND is_available = true
    -- Full-text search
    AND (search_query IS NULL OR search_vector @@ plainto_tsquery('english', search_query))
    -- Regular filters
    AND (search_city IS NULL OR address->>'city' = search_city)
    AND (min_rent IS NULL OR rent >= min_rent)
    AND (max_rent IS NULL OR rent <= max_rent)
    AND (search_gender IS NULL OR gender = search_gender OR gender = 'any')
    AND (search_room_type IS NULL OR room_type = search_room_type)
  ORDER BY 
    -- Rank by search relevance
    CASE WHEN search_query IS NOT NULL 
      THEN ts_rank(search_vector, plainto_tsquery('english', search_query))
      ELSE 0 
    END DESC,
    created_at DESC;
END;
$$;

/*
USAGE:
  -- Search for "near RV College with WiFi"
  SELECT * FROM search_pgs_fulltext('RV College WiFi', 'Bangalore', 5000, 15000);
  
  -- Search by city only
  SELECT * FROM search_pgs_fulltext(NULL, 'Bangalore');
*/

-- ============================================
-- 5️⃣ AUDIT LOG SYSTEM (OPTIONAL)
-- ============================================

/*
Track all changes to critical tables for security and debugging.
*/

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Generic audit function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  changed TEXT[];
BEGIN
  -- Calculate changed fields for UPDATE
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key)
    INTO changed
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key;
  END IF;

  INSERT INTO audit_log (
    table_name,
    record_id,
    operation,
    user_id,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    changed
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
USAGE - Add audit triggers to important tables:

CREATE TRIGGER audit_pg_listings
  AFTER INSERT OR UPDATE OR DELETE ON pg_listings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_reviews
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_profiles
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
*/

-- ============================================
-- IMPLEMENTATION NOTES
-- ============================================

/*
BEFORE IMPLEMENTING ANY OF THESE:

1. Review performance implications
2. Test thoroughly in development environment
3. Consider maintenance overhead
4. Document any changes for your team
5. Monitor query performance after deployment

RECOMMENDED ORDER (if implementing):
1. Analytics views (immediate value, low risk)
2. Full-text search (improves UX significantly)
3. Notification throttling (prevents spam)
4. Auto-update triggers (convenience, slight complexity)
5. Audit logging (adds overhead, use only if needed)

NOT RECOMMENDED FOR SMALL APPS:
- Audit logging adds significant overhead
- Auto-update triggers reduce code clarity
- Only add if you have specific compliance/debugging needs
*/
