-- Create a function to fetch IG organic data
CREATE OR REPLACE FUNCTION get_ig_organic_data(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  date DATE,
  reach INTEGER,
  profile_views INTEGER,
  website_clicks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.date,
    i.reach,
    i.profile_views,
    i.website_clicks
  FROM ig_organic_insights i
  WHERE i.date >= start_date 
    AND i.date <= end_date
  ORDER BY i.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for the last 30 days if table is empty
DO $$
DECLARE
  sample_date DATE;
  i INTEGER;
BEGIN
  -- Check if table has any valid data
  IF NOT EXISTS (SELECT 1 FROM ig_organic_insights WHERE date IS NOT NULL LIMIT 1) THEN
    -- Clear existing null data
    DELETE FROM ig_organic_insights WHERE date IS NULL;
    
    -- Insert sample data for last 30 days
    FOR i IN 1..30 LOOP
      sample_date := CURRENT_DATE - INTERVAL '30 days' + (i || ' days')::INTERVAL;
      
      INSERT INTO ig_organic_insights (date, reach, profile_views, website_clicks)
      VALUES (
        sample_date,
        1000 + FLOOR(RANDOM() * 4000), -- reach between 1000-5000
        100 + FLOOR(RANDOM() * 400),   -- profile_views between 100-500
        20 + FLOOR(RANDOM() * 80)      -- website_clicks between 20-100
      );
    END LOOP;
  END IF;
END;
$$;