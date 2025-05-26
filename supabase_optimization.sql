-- Optimized SQL function for Supabase to get latest player ratings
-- This function should be created in your Supabase database to optimize rankings queries

-- Function to get the latest rating for each player
CREATE OR REPLACE FUNCTION get_latest_player_ratings()
RETURNS TABLE (
    id UUID,
    rating_0_10 DECIMAL,
    date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT DISTINCT ON (r.id) 
        r.id,
        r.rating_0_10,
        r.date
    FROM ratings r
    ORDER BY r.id, r.date DESC;
$$;

-- Alternative version using window functions (may be more efficient for large datasets)
CREATE OR REPLACE FUNCTION get_latest_player_ratings_windowed()
RETURNS TABLE (
    id UUID,
    rating_0_10 DECIMAL,
    date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH latest_ratings AS (
        SELECT 
            r.id,
            r.rating_0_10,
            r.date,
            ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY r.date DESC) as rn
        FROM ratings r
    )
    SELECT 
        lr.id,
        lr.rating_0_10,
        lr.date
    FROM latest_ratings lr
    WHERE lr.rn = 1;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_player_ratings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_player_ratings_windowed() TO authenticated;

-- Instructions:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. The dashboard will automatically try to use get_latest_player_ratings() 
-- 3. If the function doesn't exist, it will fall back to the manual processing method
-- 4. This reduces the data transfer from potentially 1000+ records to just the unique latest ratings 