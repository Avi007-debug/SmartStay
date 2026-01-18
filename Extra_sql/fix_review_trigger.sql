-- ============================================
-- FIX REVIEW TRIGGER TO HANDLE DELETE OPERATIONS
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_pg_rating_on_review ON reviews;

-- Recreate function to handle both NEW and OLD rows
CREATE OR REPLACE FUNCTION update_pg_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_pg_id UUID;
BEGIN
  -- Determine which PG to update
  IF TG_OP = 'DELETE' THEN
    target_pg_id := OLD.pg_id;
  ELSE
    target_pg_id := NEW.pg_id;
  END IF;
  
  -- Update the pg_listing stats
  UPDATE pg_listings
  SET 
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE pg_id = target_pg_id),
    average_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE pg_id = target_pg_id), 0)
  WHERE id = target_pg_id;
  
  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT, UPDATE, and DELETE
CREATE TRIGGER update_pg_rating_on_review 
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pg_rating();

-- Test: Run the sync script to update existing data
UPDATE pg_listings
SET 
  total_reviews = COALESCE(review_stats.count, 0),
  average_rating = COALESCE(review_stats.avg_rating, 0)
FROM (
  SELECT 
    pg_id,
    COUNT(*)::INTEGER as count,
    AVG(rating)::NUMERIC(3,2) as avg_rating
  FROM reviews
  GROUP BY pg_id
) as review_stats
WHERE pg_listings.id = review_stats.pg_id;

-- Reset counts to 0 for PGs with no reviews
UPDATE pg_listings
SET 
  total_reviews = 0,
  average_rating = 0
WHERE id NOT IN (SELECT DISTINCT pg_id FROM reviews);

COMMENT ON FUNCTION update_pg_rating() IS 'Updates total_reviews and average_rating in pg_listings table whenever reviews are inserted, updated, or deleted';
