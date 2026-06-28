/*
# NCDEP Phase 2 - Engagement & Market Validation Tables

This migration creates tables for:
- QR Engagement (qr_scans)
- Product Ratings (product_ratings)
- Product Reviews (product_reviews)
- Product Interest Signals (product_interest)
- Product Views (product_views)

These tables enable market validation and consumer engagement tracking.
*/

-- Create product_views table for tracking product views
CREATE TABLE IF NOT EXISTS product_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    viewed_at timestamptz DEFAULT now(),
    referrer text,
    device_type text,
    ip_hash text
);

-- Create qr_scans table for QR engagement tracking
CREATE TABLE IF NOT EXISTS qr_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    scanned_at timestamptz DEFAULT now(),
    device_type text,
    location_country text,
    location_region text,
    location_city text,
    referrer text,
    session_id text,
    event_id uuid
);

-- Create product_ratings table
CREATE TABLE IF NOT EXISTS product_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (product_id, user_id),
    UNIQUE (product_id, session_id)
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reviewer_name text NOT NULL,
    reviewer_email text,
    review_text text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    approved_at timestamptz,
    approved_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create product_interest table for demand signals
CREATE TABLE IF NOT EXISTS product_interest (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (product_id, user_id),
    UNIQUE (product_id, session_id)
);

-- Enable RLS on all new tables
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interest ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_session_id ON product_views(session_id);

CREATE INDEX IF NOT EXISTS idx_qr_scans_product_id ON qr_scans(product_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_event_id ON qr_scans(event_id);

CREATE INDEX IF NOT EXISTS idx_product_ratings_product_id ON product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_rating ON product_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_product_ratings_created_at ON product_ratings(created_at);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_product_interest_product_id ON product_interest(product_id);
CREATE INDEX IF NOT EXISTS idx_product_interest_created_at ON product_interest(created_at);

-- PRODUCT_VIEWS POLICIES
-- Public can insert views (for tracking)
DROP POLICY IF EXISTS "public_insert_product_views" ON product_views;
CREATE POLICY "public_insert_product_views" ON product_views FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins can read all views
DROP POLICY IF EXISTS "admins_read_all_product_views" ON product_views;
CREATE POLICY "admins_read_all_product_views" ON product_views FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read their own product views
DROP POLICY IF EXISTS "owners_read_own_product_views" ON product_views;
CREATE POLICY "owners_read_own_product_views" ON product_views FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_views.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- QR_SCANS POLICIES
-- Public can insert scans (for tracking)
DROP POLICY IF EXISTS "public_insert_qr_scans" ON qr_scans;
CREATE POLICY "public_insert_qr_scans" ON qr_scans FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins can read all scans
DROP POLICY IF EXISTS "admins_read_all_qr_scans" ON qr_scans;
CREATE POLICY "admins_read_all_qr_scans" ON qr_scans FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read their own product scans
DROP POLICY IF EXISTS "owners_read_own_qr_scans" ON qr_scans;
CREATE POLICY "owners_read_own_qr_scans" ON qr_scans FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = qr_scans.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- PRODUCT_RATINGS POLICIES
-- Public can read ratings for active products
DROP POLICY IF EXISTS "public_read_product_ratings" ON product_ratings;
CREATE POLICY "public_read_product_ratings" ON product_ratings FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_ratings.product_id 
            AND products.status = 'active'
            AND products.deleted_at IS NULL
        )
    );

-- Authenticated users can insert own ratings
DROP POLICY IF EXISTS "users_insert_product_ratings" ON product_ratings;
CREATE POLICY "users_insert_product_ratings" ON product_ratings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Anonymous users can insert ratings with session_id
DROP POLICY IF EXISTS "anon_insert_product_ratings" ON product_ratings;
CREATE POLICY "anon_insert_product_ratings" ON product_ratings FOR INSERT
    TO anon
    WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Users can delete own ratings
DROP POLICY IF EXISTS "users_delete_own_ratings" ON product_ratings;
CREATE POLICY "users_delete_own_ratings" ON product_ratings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins can read all ratings
DROP POLICY IF EXISTS "admins_read_all_product_ratings" ON product_ratings;
CREATE POLICY "admins_read_all_product_ratings" ON product_ratings FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- PRODUCT_REVIEWS POLICIES
-- Public can read approved reviews
DROP POLICY IF EXISTS "public_read_approved_reviews" ON product_reviews;
CREATE POLICY "public_read_approved_reviews" ON product_reviews FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

-- Anyone can insert reviews (pending approval)
DROP POLICY IF EXISTS "public_insert_product_reviews" ON product_reviews;
CREATE POLICY "public_insert_product_reviews" ON product_reviews FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending');

-- Admins can read and manage all reviews
DROP POLICY IF EXISTS "admins_manage_product_reviews" ON product_reviews;
CREATE POLICY "admins_manage_product_reviews" ON product_reviews
    FOR ALL
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read reviews for their products
DROP POLICY IF EXISTS "owners_read_own_product_reviews" ON product_reviews;
CREATE POLICY "owners_read_own_product_reviews" ON product_reviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_reviews.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- PRODUCT_INTEREST POLICIES
-- Public can insert interest signals
DROP POLICY IF EXISTS "public_insert_product_interest" ON product_interest;
CREATE POLICY "public_insert_product_interest" ON product_interest FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins can read all interest signals
DROP POLICY IF EXISTS "admins_read_all_product_interest" ON product_interest;
CREATE POLICY "admins_read_all_product_interest" ON product_interest FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read interest for their products
DROP POLICY IF EXISTS "owners_read_own_product_interest" ON product_interest;
CREATE POLICY "owners_read_own_product_interest" ON product_interest FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_interest.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- Users can remove their own interest
DROP POLICY IF EXISTS "users_delete_own_interest" ON product_interest;
CREATE POLICY "users_delete_own_interest" ON product_interest FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger for product_reviews updated_at
DROP TRIGGER IF EXISTS product_reviews_updated_at ON product_reviews;
CREATE TRIGGER product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Function to get product engagement stats
CREATE OR REPLACE FUNCTION get_product_engagement_stats(p_product_id uuid)
RETURNS TABLE (
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
        (SELECT COUNT(*) FROM product_views WHERE product_id = p_product_id) as total_views,
        (SELECT COUNT(*) FROM qr_scans WHERE product_id = p_product_id) as total_scans,
        (SELECT COUNT(*) FROM product_ratings WHERE product_id = p_product_id) as total_ratings,
        (SELECT ROUND(COALESCE(AVG(rating), 0)::numeric, 2) FROM product_ratings WHERE product_id = p_product_id) as avg_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p_product_id AND status = 'approved') as total_reviews,
        (SELECT COUNT(*) FROM product_interest WHERE product_id = p_product_id) as total_interest,
        ROUND((
            COALESCE((SELECT COUNT(*) FROM product_views WHERE product_id = p_product_id), 0) * 1.0 +
            COALESCE((SELECT COUNT(*) FROM qr_scans WHERE product_id = p_product_id), 0) * 2.0 +
            COALESCE((SELECT COUNT(*) FROM product_ratings WHERE product_id = p_product_id), 0) * 3.0 +
            COALESCE((SELECT COUNT(*) FROM product_reviews WHERE product_id = p_product_id AND status = 'approved'), 0) * 5.0 +
            COALESCE((SELECT COUNT(*) FROM product_interest WHERE product_id = p_product_id), 0) * 4.0
        )::numeric, 2) as demand_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get cooperative engagement stats
CREATE OR REPLACE FUNCTION get_cooperative_engagement_stats(p_cooperative_id uuid)
RETURNS TABLE (
    total_products bigint,
    total_views bigint,
    total_scans bigint,
    total_ratings bigint,
    avg_rating numeric,
    total_reviews bigint,
    total_interest bigint,
    total_demand_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM products WHERE cooperative_id = p_cooperative_id AND deleted_at IS NULL), 0) as total_products,
        COALESCE((SELECT COUNT(*) FROM product_views pv JOIN products p ON pv.product_id = p.id WHERE p.cooperative_id = p_cooperative_id), 0) as total_views,
        COALESCE((SELECT COUNT(*) FROM qr_scans qs JOIN products p ON qs.product_id = p.id WHERE p.cooperative_id = p_cooperative_id), 0) as total_scans,
        COALESCE((SELECT COUNT(*) FROM product_ratings pr JOIN products p ON pr.product_id = p.id WHERE p.cooperative_id = p_cooperative_id), 0) as total_ratings,
        COALESCE((SELECT ROUND(AVG(pr.rating)::numeric, 2) FROM product_ratings pr JOIN products p ON pr.product_id = p.id WHERE p.cooperative_id = p_cooperative_id), 0) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM product_reviews pr JOIN products p ON pr.product_id = p.id WHERE p.cooperative_id = p_cooperative_id AND pr.status = 'approved'), 0) as total_reviews,
        COALESCE((SELECT COUNT(*) FROM product_interest pi JOIN products p ON pi.product_id = p.id WHERE p.cooperative_id = p_cooperative_id), 0) as total_interest,
        COALESCE((
            SELECT ROUND(SUM(
                pv_count * 1.0 +
                qs_count * 2.0 +
                pr_count * 3.0 +
                review_count * 5.0 +
                interest_count * 4.0
            )::numeric, 2)
            FROM (
                SELECT 
                    p.id as product_id,
                    (SELECT COUNT(*) FROM product_views WHERE product_id = p.id) as pv_count,
                    (SELECT COUNT(*) FROM qr_scans WHERE product_id = p.id) as qs_count,
                    (SELECT COUNT(*) FROM product_ratings WHERE product_id = p.id) as pr_count,
                    (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND status = 'approved') as review_count,
                    (SELECT COUNT(*) FROM product_interest WHERE product_id = p.id) as interest_count
                FROM products p
                WHERE p.cooperative_id = p_cooperative_id AND p.deleted_at IS NULL
            ) stats
        ), 0) as total_demand_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to insert a product view
CREATE OR REPLACE FUNCTION track_product_view(
    p_product_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_referrer text DEFAULT NULL,
    p_device_type text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO product_views (product_id, user_id, session_id, referrer, device_type)
    VALUES (p_product_id, p_user_id, p_session_id, p_referrer, p_device_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert a QR scan
CREATE OR REPLACE FUNCTION track_qr_scan(
    p_product_id uuid,
    p_device_type text DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_referrer text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO qr_scans (product_id, device_type, session_id, referrer)
    VALUES (p_product_id, p_device_type, p_session_id, p_referrer);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
