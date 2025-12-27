-- Fix increment_views RPC function
-- This fixes the 404 Not Found error

-- Drop existing function if it exists (to avoid signature conflicts)
DROP FUNCTION IF EXISTS increment_views(UUID);
DROP FUNCTION IF EXISTS public.increment_views(UUID);

-- Create the function with correct signature
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon;

-- Verify function exists in public schema
SELECT 
  routine_name, 
  routine_schema,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'increment_views';

-- Test the function (optional - comment out if you want)
-- SELECT public.increment_views('00000000-0000-0000-0000-000000000000'::uuid);
