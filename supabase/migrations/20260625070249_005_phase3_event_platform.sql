-- NCDEP Phase 3: Event & Discovery Activation Platform
-- Creates tables and functions for events, participation, campaigns, and analytics

-- =====================================================
-- EVENT REFERENCE DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS event_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO event_types (id, name, description, sort_order) VALUES
(1, 'Discovery Event', 'Product discovery and market validation events', 1),
(2, 'Product Showcase', 'Focused product exhibition events', 2),
(3, 'Innovation Fair', 'Innovation and technology showcase events', 3),
(4, 'Trade Fair', 'Trade and commerce fairs', 4),
(5, 'Cooperative Expo', 'Cooperative-focused exhibitions', 5),
(6, 'Retail Activation', 'Retail point discovery activations', 6),
(7, 'County Fair', 'County-level cooperative fairs', 7),
(8, 'National Event', 'National-level discovery events', 8)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_event_types" ON event_types FOR SELECT
    TO public USING (true);

-- =====================================================
-- EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL REFERENCES event_types(name),
    county TEXT,
    venue TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    cover_image_url TEXT,
    banner_image_url TEXT,
    organizer TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(start_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_county_idx ON events(county) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type) WHERE deleted_at IS NULL;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "public_read_published_events" ON events FOR SELECT
    TO public
    USING (status IN ('scheduled', 'active', 'completed') AND deleted_at IS NULL);

CREATE POLICY "admin_all_events" ON events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

CREATE POLICY "cooperative_user_read_events" ON events FOR SELECT
    TO authenticated
    USING (status IN ('scheduled', 'active', 'completed') AND deleted_at IS NULL);

-- =====================================================
-- EVENT PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
    products_count INTEGER DEFAULT 0,
    notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, cooperative_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS event_participants_event_idx ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS event_participants_cooperative_idx ON event_participants(cooperative_id);
CREATE INDEX IF NOT EXISTS event_participants_status_idx ON event_participants(status);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_approved_participants" ON event_participants FOR SELECT
    TO public
    USING (status IN ('approved', 'active'));

CREATE POLICY "admin_all_participants" ON event_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "cooperative_own_participation" ON event_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = event_participants.cooperative_id 
            AND cooperatives.user_id = auth.uid()
        )
    );

CREATE POLICY "cooperative_apply_event" ON event_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = event_participants.cooperative_id 
            AND cooperatives.user_id = auth.uid()
        )
    );

CREATE POLICY "cooperative_update_own_participation" ON event_participants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cooperatives WHERE cooperatives.id = event_participants.cooperative_id 
            AND cooperatives.user_id = auth.uid()
        )
    );

-- =====================================================
-- EVENT PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS event_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES event_participants(id) ON DELETE CASCADE,
    featured BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS event_products_event_idx ON event_products(event_id);
CREATE INDEX IF NOT EXISTS event_products_product_idx ON event_products(product_id);
CREATE INDEX IF NOT EXISTS event_products_participant_idx ON event_products(participant_id);

ALTER TABLE event_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_event_products" ON event_products FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM events WHERE events.id = event_products.event_id 
            AND events.status IN ('scheduled', 'active', 'completed')
            AND events.deleted_at IS NULL
        )
    );

CREATE POLICY "admin_all_event_products" ON event_products FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

CREATE POLICY "cooperative_own_event_products" ON event_products FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN cooperatives c ON c.id = p.cooperative_id
            WHERE p.id = event_products.product_id AND c.user_id = auth.uid()
        )
    );

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS campaigns_event_idx ON campaigns(event_id) WHERE deleted_at IS NULL;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_campaigns" ON campaigns FOR SELECT
    TO public
    USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "admin_all_campaigns" ON campaigns FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        ) AND deleted_at IS NULL
    );

-- =====================================================
-- CAMPAIGN PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS campaign_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, product_id)
);

CREATE INDEX IF NOT EXISTS campaign_products_campaign_idx ON campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_products_product_idx ON campaign_products(product_id);

ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_campaign_products" ON campaign_products FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = campaign_products.campaign_id 
            AND campaigns.status = 'active' AND campaigns.deleted_at IS NULL
        )
    );

CREATE POLICY "admin_all_campaign_products" ON campaign_products FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.deleted_at IS NULL
        )
    );

-- =====================================================
-- UPDATE QR SCANS TO SUPPORT EVENTS
-- =====================================================

ALTER TABLE qr_scans ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
CREATE INDEX IF NOT EXISTS qr_scans_event_idx ON qr_scans(event_id) WHERE event_id IS NOT NULL;

-- =====================================================
-- UPDATE PRODUCT INTEREST TO SUPPORT EVENTS
-- =====================================================

ALTER TABLE product_interest ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
CREATE INDEX IF NOT EXISTS product_interest_event_idx ON product_interest(event_id) WHERE event_id IS NOT NULL;

-- =====================================================
-- UPDATE PRODUCT RATINGS TO SUPPORT EVENTS
-- =====================================================

ALTER TABLE product_ratings ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
CREATE INDEX IF NOT EXISTS product_ratings_event_idx ON product_ratings(event_id) WHERE event_id IS NOT NULL;

-- =====================================================
-- UPDATE PRODUCT REVIEWS TO SUPPORT EVENTS
-- =====================================================

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
CREATE INDEX IF NOT EXISTS product_reviews_event_idx ON product_reviews(event_id) WHERE event_id IS NOT NULL;

-- =====================================================
-- EVENT ANALYTICS FUNCTIONS
-- =====================================================

-- Get event summary statistics
CREATE OR REPLACE FUNCTION get_event_stats(p_event_id UUID)
RETURNS TABLE (
    total_participants bigint,
    approved_participants bigint,
    total_products bigint,
    total_scans bigint,
    total_ratings bigint,
    total_reviews bigint,
    total_interest bigint,
    avg_rating numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM event_participants WHERE event_id = p_event_id), 0),
        COALESCE((SELECT COUNT(*) FROM event_participants WHERE event_id = p_event_id AND status IN ('approved', 'active')), 0),
        COALESCE((SELECT COUNT(*) FROM event_products WHERE event_id = p_event_id), 0),
        COALESCE((SELECT COUNT(*) FROM qr_scans WHERE event_id = p_event_id), 0),
        COALESCE((SELECT COUNT(*) FROM product_ratings WHERE event_id = p_event_id), 0),
        COALESCE((SELECT COUNT(*) FROM product_reviews WHERE event_id = p_event_id AND status = 'approved'), 0),
        COALESCE((SELECT COUNT(*) FROM product_interest WHERE event_id = p_event_id), 0),
        (SELECT COALESCE(AVG(rating), 0) FROM product_ratings WHERE event_id = p_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get event product rankings
CREATE OR REPLACE FUNCTION get_event_product_rankings(p_event_id UUID)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    cooperative_name TEXT,
    scan_count bigint,
    rating_count bigint,
    avg_rating numeric,
    review_count bigint,
    interest_count bigint,
    demand_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.product_id,
        p.name,
        c.name,
        COALESCE((SELECT COUNT(*) FROM qr_scans q WHERE q.product_id = ep.product_id AND q.event_id = p_event_id), 0),
        COALESCE((SELECT COUNT(*) FROM product_ratings r WHERE r.product_id = ep.product_id AND r.event_id = p_event_id), 0),
        COALESCE((SELECT AVG(rating) FROM product_ratings r WHERE r.product_id = ep.product_id AND r.event_id = p_event_id), 0),
        COALESCE((SELECT COUNT(*) FROM product_reviews rv WHERE rv.product_id = ep.product_id AND rv.event_id = p_event_id AND rv.status = 'approved'), 0),
        COALESCE((SELECT COUNT(*) FROM product_interest i WHERE i.product_id = ep.product_id AND i.event_id = p_event_id), 0),
        ROUND((
            COALESCE((SELECT COUNT(*) FROM qr_scans q WHERE q.product_id = ep.product_id AND q.event_id = p_event_id), 0) * 2.0 +
            COALESCE((SELECT COUNT(*) FROM product_ratings r WHERE r.product_id = ep.product_id AND r.event_id = p_event_id), 0) * 3.0 +
            COALESCE((SELECT COUNT(*) FROM product_reviews rv WHERE rv.product_id = ep.product_id AND rv.event_id = p_event_id AND rv.status = 'approved'), 0) * 5.0 +
            COALESCE((SELECT COUNT(*) FROM product_interest i WHERE i.product_id = ep.product_id AND i.event_id = p_event_id), 0) * 4.0
        )::numeric, 2)
    FROM event_products ep
    JOIN products p ON p.id = ep.product_id
    LEFT JOIN cooperatives c ON c.id = p.cooperative_id
    WHERE ep.event_id = p_event_id
    ORDER BY demand_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get platform-wide event analytics
CREATE OR REPLACE FUNCTION get_platform_event_analytics()
RETURNS TABLE (
    total_events bigint,
    active_events bigint,
    scheduled_events bigint,
    completed_events bigint,
    total_participants bigint,
    total_event_products bigint,
    total_event_scans bigint,
    total_event_ratings bigint,
    total_event_reviews bigint,
    top_events_by_engagement jsonb
) AS $$
DECLARE
    v_total bigint;
    v_active bigint;
    v_scheduled bigint;
    v_completed bigint;
    v_participants bigint;
    v_products bigint;
    v_scans bigint;
    v_ratings bigint;
    v_reviews bigint;
BEGIN
    SELECT COUNT(*) INTO v_total FROM events WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_active FROM events WHERE status = 'active' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_scheduled FROM events WHERE status = 'scheduled' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_completed FROM events WHERE status = 'completed' AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_participants FROM event_participants;
    SELECT COUNT(*) INTO v_products FROM event_products;
    SELECT COUNT(*) INTO v_scans FROM qr_scans WHERE event_id IS NOT NULL;
    SELECT COUNT(*) INTO v_ratings FROM product_ratings WHERE event_id IS NOT NULL;
    SELECT COUNT(*) INTO v_reviews FROM product_reviews WHERE event_id IS NOT NULL AND status = 'approved';

    RETURN QUERY
    SELECT 
        v_total, v_active, v_scheduled, v_completed, v_participants, v_products, v_scans, v_ratings, v_reviews,
        (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT jsonb_build_object(
                'event_id', e.id,
                'event_name', e.name,
                'event_type', e.event_type,
                'start_date', e.start_date,
                'scan_count', COALESCE(s.scan_count, 0),
                'rating_count', COALESCE(r.rating_count, 0),
                'product_count', COALESCE(p.product_count, 0)
            )
            FROM events e
            LEFT JOIN (
                SELECT event_id, COUNT(*) as scan_count
                FROM qr_scans
                GROUP BY event_id
            ) s ON s.event_id = e.id
            LEFT JOIN (
                SELECT event_id, COUNT(*) as rating_count
                FROM product_ratings
                GROUP BY event_id
            ) r ON r.event_id = e.id
            LEFT JOIN (
                SELECT event_id, COUNT(*) as product_count
                FROM event_products
                GROUP BY event_id
            ) p ON p.event_id = e.id
            WHERE e.deleted_at IS NULL AND e.status IN ('active', 'completed')
            ORDER BY COALESCE(s.scan_count, 0) + COALESCE(r.rating_count, 0) DESC
            LIMIT 10
        ) t);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get discovery leaderboard
CREATE OR REPLACE FUNCTION get_discovery_leaderboard(p_period TEXT DEFAULT 'all', p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    cooperative_name TEXT,
    category TEXT,
    total_scans bigint,
    total_ratings bigint,
    avg_rating numeric,
    total_reviews bigint,
    total_interest bigint,
    demand_score numeric,
    rank_position bigint
) AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
BEGIN
    -- Determine time period
    CASE p_period
        WHEN 'month' THEN v_start_date := now() - interval '1 month';
        WHEN 'quarter' THEN v_start_date := now() - interval '3 months';
        WHEN 'year' THEN v_start_date := now() - interval '1 year';
        ELSE v_start_date := '1970-01-01'::timestamptz;
    END CASE;

    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            p.id as prod_id,
            p.name as prod_name,
            c.name as coop_name,
            p.category as prod_category,
            COALESCE((SELECT COUNT(*) FROM qr_scans q WHERE q.product_id = p.id AND q.scanned_at >= v_start_date), 0) as scans,
            COALESCE((SELECT COUNT(*) FROM product_ratings r WHERE r.product_id = p.id AND r.created_at >= v_start_date), 0) as ratings,
            COALESCE((SELECT AVG(rating) FROM product_ratings r WHERE r.product_id = p.id AND r.created_at >= v_start_date), 0) as avg_rat,
            COALESCE((SELECT COUNT(*) FROM product_reviews rv WHERE rv.product_id = p.id AND rv.status = 'approved' AND rv.created_at >= v_start_date), 0) as reviews,
            COALESCE((SELECT COUNT(*) FROM product_interest i WHERE i.product_id = p.id AND i.created_at >= v_start_date), 0) as interest
        FROM products p
        LEFT JOIN cooperatives c ON c.id = p.cooperative_id
        WHERE p.status = 'active' AND p.deleted_at IS NULL
    )
    SELECT 
        ps.prod_id,
        ps.prod_name,
        ps.coop_name,
        ps.prod_category,
        ps.scans,
        ps.ratings,
        ps.avg_rat,
        ps.reviews,
        ps.interest,
        ROUND((ps.scans * 2.0 + ps.ratings * 3.0 + ps.reviews * 5.0 + ps.interest * 4.0)::numeric, 2) as score,
        ROW_NUMBER() OVER (ORDER BY ps.scans * 2.0 + ps.ratings * 3.0 + ps.reviews * 5.0 + ps.interest * 4.0 DESC) as pos
    FROM product_stats ps
    WHERE ps.scans > 0 OR ps.ratings > 0 OR ps.reviews > 0 OR ps.interest > 0
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- TRIGGER TO UPDATE PARTICIPANT PRODUCTS COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION update_participant_products_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE event_participants
        SET products_count = (
            SELECT COUNT(*) FROM event_products WHERE participant_id = NEW.participant_id
        )
        WHERE id = NEW.participant_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE event_participants
        SET products_count = (
            SELECT COUNT(*) FROM event_products WHERE participant_id = OLD.participant_id
        )
        WHERE id = OLD.participant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_participant_count ON event_products;
CREATE TRIGGER update_participant_count
    AFTER INSERT OR DELETE ON event_products
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_products_count();

-- =====================================================
-- TRIGGER TO UPDATE EVENTS UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();