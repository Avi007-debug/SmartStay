-- Fix RLS policies for recently_viewed and pg_metrics tables

-- Recently Viewed table - allow users to insert/update their own views
DROP POLICY IF EXISTS "Users can insert their own recently viewed" ON recently_viewed;
CREATE POLICY "Users can insert their own recently viewed" 
ON recently_viewed FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own recently viewed" ON recently_viewed;
CREATE POLICY "Users can update their own recently viewed" 
ON recently_viewed FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Users can view their own recently viewed" ON recently_viewed;
CREATE POLICY "Users can view their own recently viewed" 
ON recently_viewed FOR SELECT 
USING (auth.uid() = user_id);

-- PG Metrics table - allow anyone to increment metrics
DROP POLICY IF EXISTS "Anyone can insert pg metrics" ON pg_metrics;
CREATE POLICY "Anyone can insert pg metrics" 
ON pg_metrics FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update pg metrics" ON pg_metrics;
CREATE POLICY "Anyone can update pg metrics" 
ON pg_metrics FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Anyone can view pg metrics" ON pg_metrics;
CREATE POLICY "Anyone can view pg metrics" 
ON pg_metrics FOR SELECT 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE pg_metrics ENABLE ROW LEVEL SECURITY;
