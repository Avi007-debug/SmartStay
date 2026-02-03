-- ============================================
-- CREATE RPC FUNCTION: update_review_votes
-- ============================================
-- This function recalculates and updates vote counts for a review
-- Called after a user votes (upvote/downvote) on a review
-- 
-- Usage from frontend:
-- await supabase.rpc('update_review_votes', { review_id: reviewId })
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_review_votes(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION public.update_review_votes(review_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the reviews table with current vote counts
  UPDATE reviews
  SET 
    upvotes = (
      SELECT COUNT(*) FROM review_votes
      WHERE review_votes.review_id = update_review_votes.review_id AND vote_type = 'up'
    ),
    downvotes = (
      SELECT COUNT(*) FROM review_votes
      WHERE review_votes.review_id = update_review_votes.review_id AND vote_type = 'down'
    )
  WHERE id = update_review_votes.review_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_review_votes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_review_votes(UUID) TO anon;

-- ============================================
-- VERIFICATION
-- ============================================
-- To test if the function was created successfully, run:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'update_review_votes';
-- 
-- To test the function (replace with actual review_id):
-- SELECT update_review_votes('your-review-id-here');
-- ============================================
