-- Migration script to convert existing portfolio data to True Portfolio system
-- This script helps migrate from the old monthly portfolio sizes to the new yearly starting capital system

-- Step 1: Extract yearly starting capitals from existing monthly portfolio sizes
-- This assumes you have a 'portfolio_sizes' table with monthly data

-- Example migration (adjust based on your existing data structure):
/*
-- If you have existing monthly portfolio sizes, you can extract January values as yearly starting capitals
INSERT INTO public.yearly_starting_capitals (id, capitals)
SELECT 
    '00000000-0000-0000-0000-000000000001' as id,
    jsonb_agg(
        jsonb_build_object(
            'year', year,
            'startingCapital', size,
            'updatedAt', NOW()::text
        )
    ) as capitals
FROM (
    SELECT DISTINCT 
        year,
        FIRST_VALUE(size) OVER (PARTITION BY year ORDER BY 
            CASE month 
                WHEN 'Jan' THEN 1 
                WHEN 'Feb' THEN 2 
                WHEN 'Mar' THEN 3 
                WHEN 'Apr' THEN 4 
                WHEN 'May' THEN 5 
                WHEN 'Jun' THEN 6 
                WHEN 'Jul' THEN 7 
                WHEN 'Aug' THEN 8 
                WHEN 'Sep' THEN 9 
                WHEN 'Oct' THEN 10 
                WHEN 'Nov' THEN 11 
                WHEN 'Dec' THEN 12 
            END
        ) as size
    FROM (
        SELECT 
            (jsonb_array_elements(sizes)->>'year')::int as year,
            jsonb_array_elements(sizes)->>'month' as month,
            (jsonb_array_elements(sizes)->>'size')::numeric as size
        FROM portfolio_sizes 
        WHERE id = '00000000-0000-0000-0000-000000000001'
    ) monthly_data
    WHERE size > 0
) yearly_data
ON CONFLICT (id) DO UPDATE SET 
    capitals = EXCLUDED.capitals,
    updated_at = NOW();
*/

-- Step 2: Migrate existing capital changes if you have them
-- This assumes you have existing capital changes data

/*
-- Example migration for capital changes
INSERT INTO public.capital_changes (id, changes)
SELECT 
    '00000000-0000-0000-0000-000000000001' as id,
    COALESCE(
        (SELECT changes FROM capital_changes_old WHERE id = '00000000-0000-0000-0000-000000000001'),
        '[]'::jsonb
    ) as changes
ON CONFLICT (id) DO UPDATE SET 
    changes = EXCLUDED.changes,
    updated_at = NOW();
*/

-- Step 3: Verification queries to check the migration

-- Check yearly starting capitals
SELECT 
    'Yearly Starting Capitals' as table_name,
    jsonb_array_length(capitals) as count,
    capitals
FROM public.yearly_starting_capitals 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check capital changes
SELECT 
    'Capital Changes' as table_name,
    jsonb_array_length(changes) as count,
    changes
FROM public.capital_changes 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 4: Clean up old tables (ONLY run this after verifying the migration worked)
/*
-- Uncomment these lines only after you've verified the migration is successful
-- DROP TABLE IF EXISTS portfolio_sizes;
-- DROP TABLE IF EXISTS capital_changes_old;
*/
