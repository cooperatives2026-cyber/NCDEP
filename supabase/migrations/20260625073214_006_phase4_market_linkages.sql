-- NCDEP Phase 4: Buyer Opportunities & Market Linkages Platform
-- Creates tables for buyers, opportunities, responses, and market analytics

-- =====================================================
-- BUYER TYPES REFERENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS buyer_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO buyer_types (id, name, description, sort_order) VALUES
(1, 'Retailer', 'Retail businesses including supermarkets and shops', 1),
(2, 'Wholesaler', 'Wholesale distribution businesses', 2),
(3, 'Distributor', 'Product distribution companies', 3),
(4, 'Institutional Buyer', 'Schools, hospitals, government institutions', 4),
(5, 'Hotel', 'Hotels and hospitality establishments', 5),
(6, 'Restaurant', 'Restaurants and food service establishments', 6),
(7, 'Processor', 'Food processing companies', 7),
(8, 'Export Buyer', 'Export and international trade buyers', 8),
(9, 'Cooperative', 'Cooperatives seeking products from other cooperatives', 9),
(10, 'Other', 'Other buyer types', 99)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE buyer_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_buyer_types" ON buyer_types FOR SELECT
    TO public USING (true);

-- =====================================================
-- OPPORTUNITY CATEGORIES REFERENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS opportunity_categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO opportunity_categories (id, name, description, sort_order) VALUES
(1, 'Agricultural Products', 'Fresh produce and agricultural commodities', 1),
(2, 'Dairy Products', 'Milk, cheese, yogurt and dairy items', 2),
(3, 'Coffee', 'Green and roasted coffee beans', 3),
(4, 'Tea', 'Tea leaves and tea products', 4),
(5, 'Honey', 'Honey and bee products', 5),
(6, 'Cereals & Grains', 'Maize, rice, wheat and other grains', 6),
(7, 'Vegetables', 'Fresh vegetables', 7),
(8, 'Fruits', 'Fresh fruits', 8),
(9, 'Meat & Poultry', 'Meat and poultry products', 9),
(10, 'Fish & Seafood', 'Fresh and processed fish', 10),
(11, 'Handicrafts', 'Artisan and handicraft products', 11),
(12, 'Textiles', 'Fabric and textile products', 12),
(13, 'Other', 'Other product categories', 99)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE opportunity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_opportunity_categories" ON opportunity_categories FOR SELECT
    TO public USING (true);

-- =====================================================
-- BUYERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_name TEXT NOT NULL,
    buyer_type TEXT NOT NULL,
    description TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    county TEXT,
    town TEXT,
    address TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS buyers_user_idx ON buyers(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS buyers_type_idx ON buyers(buyer_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS buyers_county_idx ON buyers(county) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS buyers_status_idx ON buyers(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS buyers_verified_idx ON buyers(verified) WHERE deleted_at IS NULL;

ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Buyers Policies
CREATE POLICY "public_read_active_buyers" ON buyers FOR SELECT
    TO public
    USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "admin_all_buyers" ON buyers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

CREATE POLICY "buyer_own_profile" ON buyers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "buyer_create_profile" ON buyers FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "buyer_update_own_profile" ON buyers FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- OPPORTUNITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyers(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    quantity_required NUMERIC,
    quantity_unit TEXT,
    quality_requirements TEXT,
    delivery_location TEXT,
    county TEXT,
    buyer_type TEXT,
    submission_deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'under_review', 'awarded', 'closed', 'cancelled')),
    featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    responses_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    awarded_to UUID REFERENCES cooperatives(id),
    awarded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS opportunities_buyer_idx ON opportunities(buyer_id);
CREATE INDEX IF NOT EXISTS opportunities_category_idx ON opportunities(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS opportunities_county_idx ON opportunities(county) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS opportunities_deadline_idx ON opportunities(submission_deadline) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS opportunities_featured_idx ON opportunities(featured) WHERE deleted_at IS NULL AND status = 'open';

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Opportunities Policies
CREATE POLICY "public_read_open_opportunities" ON opportunities FOR SELECT
    TO public
    USING (status IN ('open', 'under_review', 'awarded') AND deleted_at IS NULL);

CREATE POLICY "admin_all_opportunities" ON opportunities FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "buyer_own_opportunities" ON opportunities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM buyers WHERE buyers.id = opportunities.buyer_id AND buyers.user_id = auth.uid()
        )
    );

CREATE POLICY "buyer_create_opportunity" ON opportunities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM buyers WHERE buyers.id = opportunities.buyer_id AND buyers.user_id = auth.uid()
        )
    );

CREATE POLICY "buyer_update_own_opportunity" ON opportunities FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM buyers WHERE buyers.id = opportunities.buyer_id AND buyers.user_id = auth.uid()
        )
    );

-- =====================================================
-- OPPORTUNITY RESPONSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS opportunity_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id),
    products_offered TEXT,
    quantity_available NUMERIC,
    quantity_unit TEXT,
    price_per_unit NUMERIC,
    price_currency TEXT DEFAULT 'KES',
    notes TEXT,
    capacity_information TEXT,
    delivery_capability TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'shortlisted', 'rejected', 'awarded', 'withdrawn')),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(opportunity_id, cooperative_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS opportunity_responses_opportunity_idx ON opportunity_responses(opportunity_id);
CREATE INDEX IF NOT EXISTS opportunity_responses_cooperative_idx ON opportunity_responses(cooperative_id);
CREATE INDEX IF NOT EXISTS opportunity_responses_status_idx ON opportunity_responses(status);

ALTER TABLE opportunity_responses ENABLE ROW LEVEL SECURITY;

-- Response Policies
CREATE POLICY "public_read_awarded_responses" ON opportunity_responses FOR SELECT
    TO public
    USING (status = 'awarded');

CREATE POLICY "admin_all_responses" ON opportunity_responses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "buyer_own_opportunity_responses" ON opportunity_responses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM opportunities o
            JOIN buyers b ON b.id = o.buyer_id
            WHERE o.id = opportunity_responses.opportunity_id AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "cooperative_own_responses" ON opportunity_responses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = opportunity_responses.cooperative_id AND cooperatives.user_id = auth.uid()
        )
    );

CREATE POLICY "cooperative_submit_response" ON opportunity_responses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = opportunity_responses.cooperative_id AND cooperatives.user_id = auth.uid()
        )
    );

CREATE POLICY "cooperative_update_own_response" ON opportunity_responses FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = opportunity_responses.cooperative_id AND cooperatives.user_id = auth.uid()
        )
    );

-- =====================================================
-- MARKET LINKAGE ANALYTICS FUNCTIONS
-- =====================================================

-- Get platform market linkage statistics
CREATE OR REPLACE FUNCTION get_market_linkage_stats()
RETURNS TABLE (
    total_buyers bigint,
    verified_buyers bigint,
    total_opportunities bigint,
    open_opportunities bigint,
    total_responses bigint,
    shortlisted_responses bigint,
    awarded_responses bigint,
    most_requested_categories jsonb,
    top_buyer_counties jsonb,
    top_supplier_counties jsonb
) AS $$
DECLARE
    v_total_buyers bigint;
    v_verified_buyers bigint;
    v_total_opps bigint;
    v_open_opps bigint;
    v_total_responses bigint;
    v_shortlisted bigint;
    v_awarded bigint;
BEGIN
    SELECT COUNT(*) INTO v_total_buyers FROM buyers WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_verified_buyers FROM buyers WHERE verified = true AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_total_opps FROM opportunities WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_open_opps FROM opportunities WHERE status = 'open' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_total_responses FROM opportunity_responses;
    SELECT COUNT(*) INTO v_shortlisted FROM opportunity_responses WHERE status = 'shortlisted';
    SELECT COUNT(*) INTO v_awarded FROM opportunity_responses WHERE status = 'awarded';

    RETURN QUERY
    SELECT 
        v_total_buyers, v_verified_buyers, v_total_opps, v_open_opps, v_total_responses, v_shortlisted, v_awarded,
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'category', category,
                'count', opp_count
            )
            FROM (
                SELECT category, COUNT(*) as opp_count
                FROM opportunities
                WHERE deleted_at IS NULL AND status IN ('open', 'under_review', 'awarded')
                GROUP BY category
                ORDER BY opp_count DESC
                LIMIT 5
            ) cat_stats
        ) t),
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'county', county,
                'count', opp_count
            )
            FROM (
                SELECT county, COUNT(*) as opp_count
                FROM opportunities
                WHERE deleted_at IS NULL AND county IS NOT NULL AND status IN ('open', 'under_review', 'awarded')
                GROUP BY county
                ORDER BY opp_count DESC
                LIMIT 5
            ) buyer_county_stats
        ) t),
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'county', c.county,
                'awarded_count', award_count
            )
            FROM (
                SELECT cooperative_id, COUNT(*) as award_count
                FROM opportunity_responses
                WHERE status = 'awarded'
                GROUP BY cooperative_id
                ORDER BY award_count DESC
                LIMIT 5
            ) award_stats
            JOIN cooperatives c ON c.id = award_stats.cooperative_id
            WHERE c.county IS NOT NULL
        ) t);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get opportunity statistics
CREATE OR REPLACE FUNCTION get_opportunity_stats(p_opportunity_id UUID)
RETURNS TABLE (
    total_responses bigint,
    submitted_count bigint,
    shortlisted_count bigint,
    rejected_count bigint,
    awarded_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = p_opportunity_id), 0),
        COALESCE((SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = p_opportunity_id AND status = 'submitted'), 0),
        COALESCE((SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = p_opportunity_id AND status = 'shortlisted'), 0),
        COALESCE((SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = p_opportunity_id AND status = 'rejected'), 0),
        COALESCE((SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = p_opportunity_id AND status = 'awarded'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get category demand trends
CREATE OR REPLACE FUNCTION get_category_demand_trends()
RETURNS TABLE (
    category TEXT,
    total_opportunities bigint,
    total_quantity_requested numeric,
    avg_responses numeric,
    success_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.category,
        COUNT(*)::bigint as opp_count,
        COALESCE(SUM(o.quantity_required), 0) as qty_requested,
        COALESCE(AVG(o.responses_count), 0) as avg_resp,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE o.status = 'awarded')::numeric / COUNT(*)) * 100, 2)
            ELSE 0 
        END as success_rate_calc
    FROM opportunities o
    WHERE o.deleted_at IS NULL
    GROUP BY o.category
    ORDER BY opp_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get top performing cooperatives in market linkages
CREATE OR REPLACE FUNCTION get_top_supplier_cooperatives(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    cooperative_id UUID,
    cooperative_name TEXT,
    county TEXT,
    total_responses bigint,
    awarded_responses bigint,
    success_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.county,
        COUNT(r.id)::bigint as response_count,
        COUNT(r.id) FILTER (WHERE r.status = 'awarded')::bigint as awarded_count,
        CASE 
            WHEN COUNT(r.id) > 0 THEN 
                ROUND((COUNT(r.id) FILTER (WHERE r.status = 'awarded')::numeric / COUNT(r.id)) * 100, 2)
            ELSE 0 
        END
    FROM cooperatives c
    LEFT JOIN opportunity_responses r ON r.cooperative_id = c.id
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.county
    HAVING COUNT(r.id) > 0
    ORDER BY awarded_count DESC, response_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- TRIGGER TO UPDATE OPPORTUNITY RESPONSES COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION update_opportunity_responses_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE opportunities
        SET responses_count = (
            SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = NEW.opportunity_id
        )
        WHERE id = NEW.opportunity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE opportunities
        SET responses_count = (
            SELECT COUNT(*) FROM opportunity_responses WHERE opportunity_id = OLD.opportunity_id
        )
        WHERE id = OLD.opportunity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_opportunity_response_count ON opportunity_responses;
CREATE TRIGGER update_opportunity_response_count
    AFTER INSERT OR DELETE ON opportunity_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_responses_count();

-- =====================================================
-- TRIGGER TO UPDATE OPPORTUNITY VIEWS
-- =====================================================

-- Function to increment view count (called from application)
CREATE OR REPLACE FUNCTION increment_opportunity_views(p_opportunity_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE opportunities 
    SET views_count = views_count + 1 
    WHERE id = p_opportunity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER TO UPDATE BUYERS UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_buyers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS buyers_updated_at ON buyers;
CREATE TRIGGER buyers_updated_at
    BEFORE UPDATE ON buyers
    FOR EACH ROW
    EXECUTE FUNCTION update_buyers_updated_at();

-- =====================================================
-- TRIGGER TO UPDATE OPPORTUNITIES UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
CREATE TRIGGER opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_buyers_updated_at();

-- =====================================================
-- TRIGGER TO UPDATE OPPORTUNITY_RESPONSES UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS opportunity_responses_updated_at ON opportunity_responses;
CREATE TRIGGER opportunity_responses_updated_at
    BEFORE UPDATE ON opportunity_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_buyers_updated_at();