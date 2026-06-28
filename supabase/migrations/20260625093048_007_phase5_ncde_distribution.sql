-- NCDEP Phase 5: National Cooperative Distribution Exchange (NCDE)
-- Creates tables for distribution visibility, retail outlets, aggregation centers, and distribution intelligence

-- =====================================================
-- RETAIL OUTLET TYPES REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS retail_outlet_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO retail_outlet_types (id, name, description, sort_order) VALUES
(1, 'Supermarket', 'Large retail chain supermarkets', 1),
(2, 'Mini Market', 'Medium-sized retail stores', 2),
(3, 'Convenience Store', 'Small convenience retail stores', 3),
(4, 'Specialty Retailer', 'Specialized product retailers', 4),
(5, 'Cooperative Outlet', 'Cooperative-owned retail outlets', 5),
(6, 'Open Air Market', 'Open air markets and trading centers', 6),
(7, 'Kiosk', 'Small retail kiosks', 7),
(8, 'Other', 'Other retail outlet types', 99)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE retail_outlet_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_retail_outlet_types" ON retail_outlet_types FOR SELECT
    TO public USING (true);

-- =====================================================
-- DISTRIBUTION PARTNER TYPES REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS distribution_partner_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO distribution_partner_types (id, name, description, sort_order) VALUES
(1, 'Cooperative Distributor', 'Cooperative-owned distribution operations', 1),
(2, 'Private Distributor', 'Private sector distribution companies', 2),
(3, 'Logistics Partner', 'Third-party logistics providers', 3),
(4, 'Regional Distributor', 'Regional distribution networks', 4),
(5, 'National Distributor', 'National-scale distribution', 5),
(6, 'Export Distributor', 'Export and international distribution', 6),
(7, 'Other', 'Other distribution types', 99)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE distribution_partner_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_distribution_partner_types" ON distribution_partner_types FOR SELECT
    TO public USING (true);

-- =====================================================
-- AVAILABILITY STATUS REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS availability_statuses (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO availability_statuses (id, name, description, sort_order) VALUES
(1, 'Available', 'Product is in stock and available', 1),
(2, 'Limited Stock', 'Low stock - limited availability', 2),
(3, 'Out of Stock', 'Currently out of stock', 3),
(4, 'Seasonal', 'Available seasonally only', 4),
(5, 'Discontinued', 'Product no longer carried', 5)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE availability_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_availability_statuses" ON availability_statuses FOR SELECT
    TO public USING (true);

-- =====================================================
-- QUANTITY RANGES REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS quantity_ranges (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    min_value INTEGER,
    max_value INTEGER,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO quantity_ranges (id, name, description, min_value, max_value, sort_order) VALUES
(1, 'Low', 'Small quantity', 1, 100, 1),
(2, 'Medium', 'Moderate quantity', 101, 1000, 2),
(3, 'High', 'Large quantity', 1001, 10000, 3),
(4, 'Bulk', 'Bulk quantity', 10001, NULL, 4)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE quantity_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_quantity_ranges" ON quantity_ranges FOR SELECT
    TO public USING (true);

-- =====================================================
-- DISTRIBUTION REQUEST TYPES REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS distribution_request_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO distribution_request_types (id, name, description, sort_order) VALUES
(1, 'Product Request', 'Request for product availability', 1),
(2, 'Distribution Request', 'Request for distribution to a location', 2),
(3, 'Retail Supply Request', 'Request from retailer for supply', 3),
(4, 'Aggregation Request', 'Request for aggregation center access', 4)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE distribution_request_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_distribution_request_types" ON distribution_request_types FOR SELECT
    TO public USING (true);

-- =====================================================
-- REQUESTOR TYPES REFERENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS requestor_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO requestor_types (id, name, description, sort_order) VALUES
(1, 'Consumer', 'Individual consumer', 1),
(2, 'Retailer', 'Retail business', 2),
(3, 'Buyer', 'Institutional or commercial buyer', 3),
(4, 'Distributor', 'Distribution company', 4),
(5, 'Cooperative', 'Cooperative organization', 5),
(6, 'Other', 'Other requestor type', 99)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE requestor_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_requestor_types" ON requestor_types FOR SELECT
    TO public USING (true);

-- =====================================================
-- RETAIL OUTLETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS retail_outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    outlet_type TEXT NOT NULL,
    county TEXT,
    town TEXT,
    address TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    opening_hours TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS retail_outlets_county_idx ON retail_outlets(county) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS retail_outlets_type_idx ON retail_outlets(outlet_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS retail_outlets_status_idx ON retail_outlets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS retail_outlets_town_idx ON retail_outlets(town) WHERE deleted_at IS NULL;

ALTER TABLE retail_outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_outlets" ON retail_outlets FOR SELECT
    TO public USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "admin_all_outlets" ON retail_outlets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

-- =====================================================
-- PRODUCT AVAILABILITY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    outlet_type TEXT NOT NULL DEFAULT 'retail_outlet',
    outlet_id UUID REFERENCES retail_outlets(id),
    cooperative_id UUID REFERENCES cooperatives(id),
    status TEXT NOT NULL DEFAULT 'available',
    quantity_range TEXT DEFAULT 'medium',
    price_range_low NUMERIC,
    price_range_high NUMERIC,
    notes TEXT,
    last_verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, outlet_type, outlet_id, cooperative_id)
);

CREATE INDEX IF NOT EXISTS product_availability_product_idx ON product_availability(product_id);
CREATE INDEX IF NOT EXISTS product_availability_outlet_idx ON product_availability(outlet_id);
CREATE INDEX IF NOT EXISTS product_availability_cooperative_idx ON product_availability(cooperative_id);
CREATE INDEX IF NOT EXISTS product_availability_status_idx ON product_availability(status);

ALTER TABLE product_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_availability" ON product_availability FOR SELECT
    TO public USING (true);

CREATE POLICY "admin_all_availability" ON product_availability FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "cooperative_own_availability" ON product_availability FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = product_availability.cooperative_id 
            AND cooperatives.user_id = auth.uid()
        )
    );

-- =====================================================
-- DISTRIBUTION PARTNERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS distribution_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    partner_type TEXT NOT NULL,
    description TEXT,
    coverage_counties TEXT[],
    national_coverage BOOLEAN DEFAULT false,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS distribution_partners_type_idx ON distribution_partners(partner_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS distribution_partners_status_idx ON distribution_partners(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS distribution_partners_coverage_idx ON distribution_partners USING GIN(coverage_counties);

ALTER TABLE distribution_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_partners" ON distribution_partners FOR SELECT
    TO public USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "admin_all_partners" ON distribution_partners FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

-- =====================================================
-- PRODUCT DISTRIBUTORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    distributor_id UUID NOT NULL REFERENCES distribution_partners(id),
    exclusive BOOLEAN DEFAULT false,
    coverage_counties TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, distributor_id)
);

CREATE INDEX IF NOT EXISTS product_distributors_product_idx ON product_distributors(product_id);
CREATE INDEX IF NOT EXISTS product_distributors_distributor_idx ON product_distributors(distributor_id);
CREATE INDEX IF NOT EXISTS product_distributors_coverage_idx ON product_distributors USING GIN(coverage_counties);

ALTER TABLE product_distributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_product_distributors" ON product_distributors FOR SELECT
    TO public USING (true);

CREATE POLICY "admin_all_product_distributors" ON product_distributors FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- AGGREGATION CENTERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS aggregation_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    county TEXT NOT NULL,
    town TEXT,
    address TEXT,
    capacity_description TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    operating_hours TEXT,
    managed_by UUID REFERENCES cooperatives(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'planned', 'inactive', 'under_construction')),
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS aggregation_centers_county_idx ON aggregation_centers(county) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS aggregation_centers_status_idx ON aggregation_centers(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS aggregation_centers_managed_idx ON aggregation_centers(managed_by);

ALTER TABLE aggregation_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_centers" ON aggregation_centers FOR SELECT
    TO public USING (status IN ('active', 'planned') AND deleted_at IS NULL);

CREATE POLICY "admin_all_centers" ON aggregation_centers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

-- =====================================================
-- AGGREGATION PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS aggregation_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES aggregation_centers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_range TEXT DEFAULT 'medium',
    handling_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(center_id, product_id)
);

CREATE INDEX IF NOT EXISTS aggregation_products_center_idx ON aggregation_products(center_id);
CREATE INDEX IF NOT EXISTS aggregation_products_product_idx ON aggregation_products(product_id);

ALTER TABLE aggregation_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_aggregation_products" ON aggregation_products FOR SELECT
    TO public USING (true);

CREATE POLICY "admin_all_aggregation_products" ON aggregation_products FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- DISTRIBUTION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS distribution_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    product_name TEXT,
    county TEXT NOT NULL,
    town TEXT,
    request_type TEXT NOT NULL,
    requestor_type TEXT NOT NULL,
    requestor_name TEXT,
    requestor_email TEXT,
    requestor_phone TEXT,
    quantity_range TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'fulfilled', 'closed', 'spam')),
    user_id UUID REFERENCES users(id),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS distribution_requests_product_idx ON distribution_requests(product_id);
CREATE INDEX IF NOT EXISTS distribution_requests_county_idx ON distribution_requests(county);
CREATE INDEX IF NOT EXISTS distribution_requests_type_idx ON distribution_requests(request_type);
CREATE INDEX IF NOT EXISTS distribution_requests_status_idx ON distribution_requests(status);
CREATE INDEX IF NOT EXISTS distribution_requests_created_idx ON distribution_requests(created_at);

ALTER TABLE distribution_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_submit_request" ON distribution_requests FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "admin_all_requests" ON distribution_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "user_own_requests" ON distribution_requests FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- NCDE ANALYTICS FUNCTIONS
-- =====================================================

-- Get NCDE platform statistics
CREATE OR REPLACE FUNCTION get_ncde_stats()
RETURNS TABLE (
    total_retail_outlets bigint,
    total_distribution_partners bigint,
    total_aggregation_centers bigint,
    total_product_availability_records bigint,
    pending_distribution_requests bigint,
    active_counties bigint,
    products_with_availability bigint
) AS $$
DECLARE
    v_outlets bigint;
    v_partners bigint;
    v_centers bigint;
    v_availability bigint;
    v_requests bigint;
    v_counties bigint;
    v_products bigint;
BEGIN
    SELECT COUNT(*) INTO v_outlets FROM retail_outlets WHERE status = 'active' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_partners FROM distribution_partners WHERE status = 'active' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_centers FROM aggregation_centers WHERE status = 'active' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_availability FROM product_availability;
    SELECT COUNT(*) INTO v_requests FROM distribution_requests WHERE status = 'pending';
    SELECT COUNT(DISTINCT county)::bigint INTO v_counties FROM retail_outlets WHERE county IS NOT NULL AND deleted_at IS NULL;
    SELECT COUNT(DISTINCT product_id)::bigint INTO v_products FROM product_availability;

    RETURN QUERY
    SELECT v_outlets, v_partners, v_centers, v_availability, v_requests, v_counties, v_products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get product availability summary
CREATE OR REPLACE FUNCTION get_product_availability_summary(p_product_id UUID)
RETURNS TABLE (
    total_locations bigint,
    available_count bigint,
    limited_count bigint,
    out_of_stock_count bigint,
    counties_available bigint,
    outlet_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM product_availability WHERE product_id = p_product_id), 0),
        COALESCE((SELECT COUNT(*) FROM product_availability WHERE product_id = p_product_id AND status = 'available'), 0),
        COALESCE((SELECT COUNT(*) FROM product_availability WHERE product_id = p_product_id AND status = 'limited_stock'), 0),
        COALESCE((SELECT COUNT(*) FROM product_availability WHERE product_id = p_product_id AND status = 'out_of_stock'), 0),
        COALESCE((SELECT COUNT(DISTINCT o.county) FROM product_availability pa 
            LEFT JOIN retail_outlets o ON o.id = pa.outlet_id 
            WHERE pa.product_id = p_product_id AND o.county IS NOT NULL), 0),
        (SELECT ARRAY_AGG(DISTINCT outlet_type) FROM product_availability WHERE product_id = p_product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get county availability overview
CREATE OR REPLACE FUNCTION get_county_availability(p_county TEXT)
RETURNS TABLE (
    total_products bigint,
    available_products bigint,
    total_outlets bigint,
    total_centers bigint,
    top_products jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT pa.product_id)::bigint FROM product_availability pa
         LEFT JOIN retail_outlets o ON o.id = pa.outlet_id
         WHERE o.county = p_county OR pa.cooperative_id IN (
             SELECT id FROM cooperatives WHERE county = p_county
         )),
        (SELECT COUNT(DISTINCT pa.product_id)::bigint FROM product_availability pa
         LEFT JOIN retail_outlets o ON o.id = pa.outlet_id
         WHERE (o.county = p_county OR pa.cooperative_id IN (SELECT id FROM cooperatives WHERE county = p_county))
         AND pa.status = 'available'),
        (SELECT COUNT(*)::bigint FROM retail_outlets WHERE county = p_county AND status = 'active' AND deleted_at IS NULL),
        (SELECT COUNT(*)::bigint FROM aggregation_centers WHERE county = p_county AND status = 'active' AND deleted_at IS NULL),
        (SELECT COALESCE(
            (SELECT jsonb_agg(t) FROM (
                SELECT jsonb_build_object(
                    'product_id', pa.product_id,
                    'product_name', p.name,
                    'availability_count', COUNT(*)
                )
                FROM product_availability pa
                LEFT JOIN retail_outlets o ON o.id = pa.outlet_id
                JOIN products p ON p.id = pa.product_id
                WHERE o.county = p_county AND p.status = 'active' AND p.deleted_at IS NULL
                GROUP BY pa.product_id, p.name
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) t),
            '[]'::jsonb
        ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get distribution gap analysis
CREATE OR REPLACE FUNCTION get_distribution_gaps()
RETURNS TABLE (
    county TEXT,
    high_demand_count bigint,
    low_availability_count bigint,
    gap_score numeric,
    pending_requests bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name as county_name,
        (SELECT COUNT(*) FROM distribution_requests WHERE county = c.name AND status = 'pending') as demand,
        (SELECT COUNT(DISTINCT pa.product_id) FROM product_availability pa
         LEFT JOIN retail_outlets o ON o.id = pa.outlet_id
         WHERE o.county = c.name) as availability,
        ROUND(
            GREATEST(
                (SELECT COUNT(*)::numeric FROM distribution_requests WHERE county = c.name AND status = 'pending') -
                (SELECT COUNT(DISTINCT pa.product_id)::numeric FROM product_availability pa
                 LEFT JOIN retail_outlets o ON o.id = pa.outlet_id
                 WHERE o.county = c.name) * 0.1,
                0
            )::numeric,
            2
        ) as score,
        (SELECT COUNT(*) FROM distribution_requests WHERE county = c.name AND status = 'pending') as pending
    FROM counties c
    ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get top distributed products
CREATE OR REPLACE FUNCTION get_top_distributed_products(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    cooperative_name TEXT,
    availability_count bigint,
    distributor_count bigint,
    county_coverage bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        c.name,
        (SELECT COUNT(*) FROM product_availability WHERE product_id = p.id),
        (SELECT COUNT(*) FROM product_distributors WHERE product_id = p.id),
        (SELECT COUNT(DISTINCT o.county) FROM product_availability pa
         LEFT JOIN retail_outlets o ON o.id = pa.outlet_id
         WHERE pa.product_id = p.id AND o.county IS NOT NULL)
    FROM products p
    LEFT JOIN cooperatives c ON c.id = p.cooperative_id
    WHERE p.status = 'active' AND p.deleted_at IS NULL
    ORDER BY availability_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_ncde_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS retail_outlets_updated_at ON retail_outlets;
CREATE TRIGGER retail_outlets_updated_at
    BEFORE UPDATE ON retail_outlets
    FOR EACH ROW
    EXECUTE FUNCTION update_ncde_updated_at();

DROP TRIGGER IF EXISTS distribution_partners_updated_at ON distribution_partners;
CREATE TRIGGER distribution_partners_updated_at
    BEFORE UPDATE ON distribution_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_ncde_updated_at();

DROP TRIGGER IF EXISTS aggregation_centers_updated_at ON aggregation_centers;
CREATE TRIGGER aggregation_centers_updated_at
    BEFORE UPDATE ON aggregation_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_ncde_updated_at();

DROP TRIGGER IF EXISTS distribution_requests_updated_at ON distribution_requests;
CREATE TRIGGER distribution_requests_updated_at
    BEFORE UPDATE ON distribution_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_ncde_updated_at();