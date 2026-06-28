/*
# NCDEP Stabilization Sprint - Database Fixes

This migration addresses issues identified in the implementation audit:
1. Centralized reference tables (counties, categories)
2. Aggregated analytics functions
3. User profile auto-creation trigger
4. Anonymous interest removal fix
5. Engagement tracking integrity
6. Storage permissions fix
7. Review moderation tracking fix
*/

-- =====================================================
-- 1. CENTRALIZED REFERENCE TABLES
-- =====================================================

-- Create counties table
CREATE TABLE IF NOT EXISTS counties (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert all 47 Kenyan counties
INSERT INTO counties (id, name, code) VALUES
(1, 'Baringo', 'BA'),
(2, 'Bomet', 'BM'),
(3, 'Bungoma', 'BG'),
(4, 'Busia', 'BS'),
(5, 'Elgeyo-Marakwet', 'EM'),
(6, 'Embu', 'EB'),
(7, 'Garissa', 'GA'),
(8, 'Homa Bay', 'HB'),
(9, 'Isiolo', 'IS'),
(10, 'Kajiado', 'KJ'),
(11, 'Kakamega', 'KK'),
(12, 'Kericho', 'KE'),
(13, 'Kiambu', 'KB'),
(14, 'Kilifi', 'KF'),
(15, 'Kirinyaga', 'KR'),
(16, 'Kisii', 'KS'),
(17, 'Kisumu', 'KM'),
(18, 'Kitui', 'KT'),
(19, 'Kwale', 'KW'),
(20, 'Laikipia', 'LK'),
(21, 'Lamu', 'LA'),
(22, 'Machakos', 'MC'),
(23, 'Makueni', 'MK'),
(24, 'Mandera', 'MD'),
(25, 'Marsabit', 'MR'),
(26, 'Meru', 'ME'),
(27, 'Migori', 'MI'),
(28, 'Mombasa', 'MO'),
(29, 'Murang''a', 'MU'),
(30, 'Nairobi', 'NA'),
(31, 'Nakuru', 'NK'),
(32, 'Nandi', 'ND'),
(33, 'Narok', 'NR'),
(34, 'Nyamira', 'NM'),
(35, 'Nyandarua', 'NY'),
(36, 'Nyeri', 'NI'),
(37, 'Samburu', 'SB'),
(38, 'Siaya', 'SI'),
(39, 'Taita-Taveta', 'TT'),
(40, 'Tana River', 'TR'),
(41, 'Tharaka-Nithi', 'TN'),
(42, 'Trans Nzoia', 'TZ'),
(43, 'Turkana', 'TU'),
(44, 'Uasin Gishu', 'UG'),
(45, 'Vihiga', 'VI'),
(46, 'Wajir', 'WJ'),
(47, 'West Pokot', 'WP')
ON CONFLICT (id) DO NOTHING;

-- Create categories tables for cooperatives and products
CREATE TABLE IF NOT EXISTS cooperative_categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO cooperative_categories (id, name, description, sort_order) VALUES
(1, 'Agriculture', 'Agricultural cooperatives', 1),
(2, 'Dairy', 'Dairy farming and processing cooperatives', 2),
(3, 'Coffee', 'Coffee farming and processing cooperatives', 3),
(4, 'Tea', 'Tea farming and processing cooperatives', 4),
(5, 'Savings & Credit (SACCO)', 'Savings and credit cooperative societies', 5),
(6, 'Housing', 'Housing cooperatives', 6),
(7, 'Consumer', 'Consumer cooperatives', 7),
(8, 'Transport', 'Transport cooperatives', 8),
(9, 'Fisheries', 'Fishing and fish processing cooperatives', 9),
(10, 'Handicraft', 'Handicraft and artisan cooperatives', 10),
(11, 'Other', 'Other types of cooperatives', 99)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO product_categories (id, name, description, sort_order) VALUES
(1, 'Agricultural Products', 'Fresh and processed agricultural products', 1),
(2, 'Dairy Products', 'Milk, cheese, yogurt and other dairy items', 2),
(3, 'Coffee', 'Raw and processed coffee products', 3),
(4, 'Tea', 'Raw and processed tea products', 4),
(5, 'Handicrafts', 'Handmade artisan products', 5),
(6, 'Textiles', 'Textile and fabric products', 6),
(7, 'Food & Beverages', 'Processed food and beverages', 7),
(8, 'Honey', 'Honey and bee products', 8),
(9, 'Fish', 'Fresh and processed fish', 9),
(10, 'Vegetables', 'Fresh vegetables', 10),
(11, 'Fruits', 'Fresh fruits', 11),
(12, 'Other', 'Other products', 99)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on reference tables
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "public_read_counties" ON counties FOR SELECT
    TO public
    USING (true);

CREATE POLICY "public_read_cooperative_categories" ON cooperative_categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "public_read_product_categories" ON product_categories FOR SELECT
    TO public
    USING (true);

-- =====================================================
-- 2. AGGREGATED ANALYTICS FUNCTIONS
-- =====================================================

-- Replace N+1 analytics with efficient batch function
CREATE OR REPLACE FUNCTION get_products_with_stats(p_product_ids uuid[])
RETURNS TABLE (
    product_id uuid,
    total_views bigint,
    total_scans bigint,
    total_ratings bigint,
    avg_rating numeric,
    total_reviews bigint,
    total_interest bigint,
    demand_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        COALESCE(v.view_count, 0) as total_views,
        COALESCE(s.scan_count, 0) as total_scans,
        COALESCE(r.rating_count, 0) as total_ratings,
        COALESCE(r.avg_rating, 0) as avg_rating,
        COALESCE(rev.review_count, 0) as total_reviews,
        COALESCE(i.interest_count, 0) as total_interest,
        ROUND((
            COALESCE(v.view_count, 0) * 1.0 +
            COALESCE(s.scan_count, 0) * 2.0 +
            COALESCE(r.rating_count, 0) * 3.0 +
            COALESCE(rev.review_count, 0) * 5.0 +
            COALESCE(i.interest_count, 0) * 4.0
        )::numeric, 2) as demand_score
    FROM products p
    LEFT JOIN (
        SELECT product_id, COUNT(*) as view_count
        FROM product_views
        WHERE product_id = ANY(p_product_ids)
        GROUP BY product_id
    ) v ON v.product_id = p.id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as scan_count
        FROM qr_scans
        WHERE product_id = ANY(p_product_ids)
        GROUP BY product_id
    ) s ON s.product_id = p.id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as rating_count, AVG(rating) as avg_rating
        FROM product_ratings
        WHERE product_id = ANY(p_product_ids)
        GROUP BY product_id
    ) r ON r.product_id = p.id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as review_count
        FROM product_reviews
        WHERE product_id = ANY(p_product_ids) AND status = 'approved'
        GROUP BY product_id
    ) rev ON rev.product_id = p.id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as interest_count
        FROM product_interest
        WHERE product_id = ANY(p_product_ids)
        GROUP BY product_id
    ) i ON i.product_id = p.id
    WHERE p.id = ANY(p_product_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Efficient platform-wide analytics function
CREATE OR REPLACE FUNCTION get_platform_analytics()
RETURNS TABLE (
    total_cooperatives bigint,
    active_cooperatives bigint,
    total_products bigint,
    active_products bigint,
    total_users bigint,
    total_views bigint,
    total_scans bigint,
    total_ratings bigint,
    total_reviews bigint,
    total_interest bigint,
    top_scanned_products jsonb,
    top_rated_products jsonb,
    most_demanded_products jsonb
) AS $$
DECLARE
    v_total_coops bigint;
    v_active_coops bigint;
    v_total_prods bigint;
    v_active_prods bigint;
    v_total_users bigint;
    v_total_views bigint;
    v_total_scans bigint;
    v_total_ratings bigint;
    v_total_reviews bigint;
    v_total_interest bigint;
BEGIN
    -- Get basic counts
    SELECT COUNT(*) INTO v_total_coops FROM cooperatives WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_active_coops FROM cooperatives WHERE deleted_at IS NULL AND status = 'active';
    SELECT COUNT(*) INTO v_total_prods FROM products WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_active_prods FROM products WHERE deleted_at IS NULL AND status = 'active';
    SELECT COUNT(*) INTO v_total_users FROM users WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_total_views FROM product_views;
    SELECT COUNT(*) INTO v_total_scans FROM qr_scans;
    SELECT COUNT(*) INTO v_total_ratings FROM product_ratings;
    SELECT COUNT(*) INTO v_total_reviews FROM product_reviews WHERE status = 'approved';
    SELECT COUNT(*) INTO v_total_interest FROM product_interest;

    RETURN QUERY
    SELECT 
        v_total_coops, v_active_coops, v_total_prods, v_active_prods, v_total_users,
        v_total_views, v_total_scans, v_total_ratings, v_total_reviews, v_total_interest,
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'product_id', qs.product_id,
                'product_name', p.name,
                'cooperative', jsonb_build_object('id', c.id, 'name', c.name),
                'scan_count', qs.scan_count
            )
            FROM (
                SELECT product_id, COUNT(*) as scan_count
                FROM qr_scans
                GROUP BY product_id
                ORDER BY scan_count DESC
                LIMIT 10
            ) qs
            JOIN products p ON p.id = qs.product_id
            LEFT JOIN cooperatives c ON c.id = p.cooperative_id
        ) t) as top_scanned_products,
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'product_id', pr.product_id,
                'product_name', p.name,
                'cooperative', jsonb_build_object('id', c.id, 'name', c.name),
                'avg_rating', pr.avg_rating,
                'total_ratings', pr.total_ratings
            )
            FROM (
                SELECT product_id, AVG(rating) as avg_rating, COUNT(*) as total_ratings
                FROM product_ratings
                GROUP BY product_id
                HAVING COUNT(*) >= 3
                ORDER BY avg_rating DESC
                LIMIT 10
            ) pr
            JOIN products p ON p.id = pr.product_id
            LEFT JOIN cooperatives c ON c.id = p.cooperative_id
        ) t) as top_rated_products,
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'product_id', p.id,
                'product_name', p.name,
                'cooperative', jsonb_build_object('id', c.id, 'name', c.name),
                'demand_score', get_product_engagement_stats.product_demand
            )
            FROM products p
            LEFT JOIN cooperatives c ON c.id = p.cooperative_id
            CROSS JOIN LATERAL (
                SELECT (
                    COALESCE((SELECT COUNT(*) FROM product_views WHERE product_id = p.id), 0) * 1.0 +
                    COALESCE((SELECT COUNT(*) FROM qr_scans WHERE product_id = p.id), 0) * 2.0 +
                    COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = p.id), 0) * 3.0 +
                    COALESCE((SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND status = 'approved'), 0) * 5.0 +
                    COALESCE((SELECT COUNT(*) FROM product_interest WHERE product_id = p.id), 0) * 4.0
                ) as product_demand
            ) get_product_engagement_stats
            WHERE p.status = 'active' AND p.deleted_at IS NULL
            ORDER BY product_demand DESC
            LIMIT 10
        ) t) as most_demanded_products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. USER PROFILE AUTO-CREATION TRIGGER
-- =====================================================

-- Function to automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'cooperative_user')::text
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 4. ANONYMOUS INTEREST REMOVAL FIX
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "users_delete_own_interest" ON product_interest;

-- Create new policy that handles both authenticated and anonymous
CREATE POLICY "users_delete_own_interest" ON product_interest FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add policy for anonymous users to delete by session_id
CREATE POLICY "anon_delete_own_interest" ON product_interest FOR DELETE
    TO anon
    USING (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::jsonb->>'x-session-id');

-- Similar fix for ratings
DROP POLICY IF EXISTS "users_delete_own_ratings" ON product_ratings;

CREATE POLICY "users_delete_own_ratings" ON product_ratings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "anon_delete_own_ratings" ON product_ratings FOR DELETE
    TO anon
    USING (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::jsonb->>'x-session-id');

-- =====================================================
-- 5. ENGAGEMENT TRACKING INTEGRITY
-- =====================================================

-- Drop conflicting unique constraints
ALTER TABLE product_ratings DROP CONSTRAINT IF EXISTS product_ratings_product_id_user_id_key;
ALTER TABLE product_ratings DROP CONSTRAINT IF EXISTS product_ratings_product_id_session_id_key;

-- Add single partial unique constraint that handles both cases
CREATE UNIQUE INDEX IF NOT EXISTS product_ratings_unique_user 
    ON product_ratings (product_id, user_id) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_ratings_unique_session 
    ON product_ratings (product_id, session_id) 
    WHERE user_id IS NULL AND session_id IS NOT NULL;

-- Same for product_interest
ALTER TABLE product_interest DROP CONSTRAINT IF EXISTS product_interest_product_id_user_id_key;
ALTER TABLE product_interest DROP CONSTRAINT IF EXISTS product_interest_product_id_session_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS product_interest_unique_user 
    ON product_interest (product_id, user_id) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_interest_unique_session 
    ON product_interest (session_id, product_id) 
    WHERE user_id IS NULL AND session_id IS NOT NULL;

-- =====================================================
-- 6. STORAGE PERMISSIONS FIX
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Create folder-scoped upload policy
CREATE POLICY "Authenticated users can upload to own folder" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow uploads to products folder for any authenticated user (for product images)
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'images' 
        AND (storage.foldername(name))[1] = 'products'
    );

-- Allow uploads to logos folder
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'images' 
        AND (storage.foldername(name))[1] = 'logos'
    );

-- Allow uploads to cooperatives folder
CREATE POLICY "Authenticated users can upload cooperative images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'images' 
        AND (storage.foldername(name))[1] = 'cooperatives'
    );

-- =====================================================
-- 7. REVIEW MODERATION TRACKING FIX
-- =====================================================

-- Create function to get current user id safely
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Note: approved_by is already in schema but the frontend needs to pass admin user id
-- The hook useReviewModeration.ts needs updating to pass the approved_by field