/*
# NCDEP Phase 1 - Initial Database Schema

This migration creates the foundational tables for the National Cooperative Discovery & Exchange Platform.

## Tables Created

### 1. `users`
- Stores user profile data linked to Supabase Auth
- `id` UUID PRIMARY KEY - references auth.users
- `email` TEXT - user email (synced from auth)
- `role` TEXT - 'admin' or 'cooperative_user'
- `created_at`, `updated_at`, `deleted_at` timestamps
- Soft delete support via `deleted_at`

### 2. `cooperatives`
- Stores cooperative profile information
- `id` UUID PRIMARY KEY
- `user_id` UUID - owner (cooperative user)
- `name`, `description`, `county`, `category` - basic info
- Contact info: phone, email, address
- `website` TEXT - optional website URL
- `social_links` JSONB - social media links
- `logo_url`, `cover_image_url` - image URLs
- `status` TEXT - 'active' or 'inactive'
- Timestamps and soft delete support

### 3. `products`
- Stores product listings
- `id` UUID PRIMARY KEY
- `cooperative_id` UUID - references cooperatives
- `name`, `description`, `category` - product info
- `status` TEXT - 'active', 'inactive', or 'draft'
- Timestamps and soft delete support

### 4. `product_images`
- Stores multiple images per product
- `id` UUID PRIMARY KEY
- `product_id` UUID - references products
- `image_url` TEXT - URL to image in storage
- `sort_order` INTEGER - for display ordering
- `created_at` timestamp

## Security
- RLS enabled on all tables
- Role-based access control implemented
- Users can only manage their own data
- Admins have full access to all data
- Public read access for active cooperatives/products
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'cooperative_user' CHECK (role IN ('admin', 'cooperative_user')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Create cooperatives table
CREATE TABLE IF NOT EXISTS cooperatives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    county text,
    category text,
    contact_phone text,
    contact_email text,
    contact_address text,
    website text,
    social_links jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    cover_image_url text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id uuid NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    category text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_cooperatives_user_id ON cooperatives(user_id);
CREATE INDEX IF NOT EXISTS idx_cooperatives_county ON cooperatives(county);
CREATE INDEX IF NOT EXISTS idx_cooperatives_category ON cooperatives(category);
CREATE INDEX IF NOT EXISTS idx_cooperatives_status ON cooperatives(status);
CREATE INDEX IF NOT EXISTS idx_products_cooperative_id ON products(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to get user's cooperative ID
CREATE OR REPLACE FUNCTION get_user_cooperative_id()
RETURNS uuid AS $$
BEGIN
    RETURN (
        SELECT id FROM cooperatives 
        WHERE user_id = auth.uid() 
        AND deleted_at IS NULL
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- USERS POLICIES
-- Admins can read all users
DROP POLICY IF EXISTS "admins_read_all_users" ON users;
CREATE POLICY "admins_read_all_users" ON users FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Users can read own profile
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can update own profile
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Users insert their profile on signup (via trigger or direct)
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- COOPERATIVES POLICIES
-- Public can read active cooperatives (for discovery)
DROP POLICY IF EXISTS "public_read_active_cooperatives" ON cooperatives;
CREATE POLICY "public_read_active_cooperatives" ON cooperatives FOR SELECT
    TO anon, authenticated
    USING (status = 'active' AND deleted_at IS NULL);

-- Admins can read all cooperatives
DROP POLICY IF EXISTS "admins_read_all_cooperatives" ON cooperatives;
CREATE POLICY "admins_read_all_cooperatives" ON cooperatives FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read their own cooperative
DROP POLICY IF EXISTS "owners_read_own_cooperative" ON cooperatives;
CREATE POLICY "owners_read_own_cooperative" ON cooperatives FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can create cooperatives
DROP POLICY IF EXISTS "admins_create_cooperatives" ON cooperatives;
CREATE POLICY "admins_create_cooperatives" ON cooperatives FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() = true);

-- Cooperative users can create their own cooperative
DROP POLICY IF EXISTS "owners_create_own_cooperative" ON cooperatives;
CREATE POLICY "owners_create_own_cooperative" ON cooperatives FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can update any cooperative
DROP POLICY IF EXISTS "admins_update_cooperatives" ON cooperatives;
CREATE POLICY "admins_update_cooperatives" ON cooperatives FOR UPDATE
    TO authenticated
    USING (is_admin() = true)
    WITH CHECK (is_admin() = true);

-- Cooperative owners can update their own cooperative
DROP POLICY IF EXISTS "owners_update_own_cooperative" ON cooperatives;
CREATE POLICY "owners_update_own_cooperative" ON cooperatives FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can delete cooperatives (soft delete)
DROP POLICY IF EXISTS "admins_delete_cooperatives" ON cooperatives;
CREATE POLICY "admins_delete_cooperatives" ON cooperatives FOR UPDATE
    TO authenticated
    USING (is_admin() = true AND deleted_at IS NULL)
    WITH CHECK (is_admin() = true);

-- Cooperative owners can delete their own cooperative (soft delete)
DROP POLICY IF EXISTS "owners_delete_own_cooperative" ON cooperatives;
CREATE POLICY "owners_delete_own_cooperative" ON cooperatives FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (user_id = auth.uid());

-- PRODUCTS POLICIES
-- Public can read active products (for discovery)
DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products FOR SELECT
    TO anon, authenticated
    USING (status = 'active' AND deleted_at IS NULL);

-- Admins can read all products
DROP POLICY IF EXISTS "admins_read_all_products" ON products;
CREATE POLICY "admins_read_all_products" ON products FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read their own products
DROP POLICY IF EXISTS "owners_read_own_products" ON products;
CREATE POLICY "owners_read_own_products" ON products FOR SELECT
    TO authenticated
    USING (cooperative_id = get_user_cooperative_id());

-- Admins can create products for any cooperative
DROP POLICY IF EXISTS "admins_create_products" ON products;
CREATE POLICY "admins_create_products" ON products FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() = true);

-- Cooperative owners can create products for their cooperative
DROP POLICY IF EXISTS "owners_create_own_products" ON products;
CREATE POLICY "owners_create_own_products" ON products FOR INSERT
    TO authenticated
    WITH CHECK (cooperative_id = get_user_cooperative_id());

-- Admins can update any product
DROP POLICY IF EXISTS "admins_update_products" ON products;
CREATE POLICY "admins_update_products" ON products FOR UPDATE
    TO authenticated
    USING (is_admin() = true)
    WITH CHECK (is_admin() = true);

-- Cooperative owners can update their own products
DROP POLICY IF EXISTS "owners_update_own_products" ON products;
CREATE POLICY "owners_update_own_products" ON products FOR UPDATE
    TO authenticated
    USING (cooperative_id = get_user_cooperative_id())
    WITH CHECK (cooperative_id = get_user_cooperative_id());

-- Admins can delete products (soft delete)
DROP POLICY IF EXISTS "admins_delete_products" ON products;
CREATE POLICY "admins_delete_products" ON products FOR UPDATE
    TO authenticated
    USING (is_admin() = true AND deleted_at IS NULL)
    WITH CHECK (is_admin() = true);

-- Cooperative owners can delete their own products (soft delete)
DROP POLICY IF EXISTS "owners_delete_own_products" ON products;
CREATE POLICY "owners_delete_own_products" ON products FOR UPDATE
    TO authenticated
    USING (cooperative_id = get_user_cooperative_id() AND deleted_at IS NULL)
    WITH CHECK (cooperative_id = get_user_cooperative_id());

-- PRODUCT_IMAGES POLICIES
-- Public can read product images for active products
DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.status = 'active' 
            AND products.deleted_at IS NULL
        )
    );

-- Admins can read all product images
DROP POLICY IF EXISTS "admins_read_all_product_images" ON product_images;
CREATE POLICY "admins_read_all_product_images" ON product_images FOR SELECT
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can read their own product images
DROP POLICY IF EXISTS "owners_read_own_product_images" ON product_images;
CREATE POLICY "owners_read_own_product_images" ON product_images FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- Admins can create product images
DROP POLICY IF EXISTS "admins_create_product_images" ON product_images;
CREATE POLICY "admins_create_product_images" ON product_images FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin() = true OR
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- Cooperative owners can create images for their products
DROP POLICY IF EXISTS "owners_create_own_product_images" ON product_images;
CREATE POLICY "owners_create_own_product_images" ON product_images FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- Admins can update any product image
DROP POLICY IF EXISTS "admins_update_product_images" ON product_images;
CREATE POLICY "admins_update_product_images" ON product_images FOR UPDATE
    TO authenticated
    USING (is_admin() = true)
    WITH CHECK (is_admin() = true);

-- Cooperative owners can update their own product images
DROP POLICY IF EXISTS "owners_update_own_product_images" ON product_images;
CREATE POLICY "owners_update_own_product_images" ON product_images FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- Admins can delete product images
DROP POLICY IF EXISTS "admins_delete_product_images" ON product_images;
CREATE POLICY "admins_delete_product_images" ON product_images FOR DELETE
    TO authenticated
    USING (is_admin() = true);

-- Cooperative owners can delete their own product images
DROP POLICY IF EXISTS "owners_delete_own_product_images" ON product_images;
CREATE POLICY "owners_delete_own_product_images" ON product_images FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_images.product_id 
            AND products.cooperative_id = get_user_cooperative_id()
        )
    );

-- Trigger to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS cooperatives_updated_at ON cooperatives;
CREATE TRIGGER cooperatives_updated_at
    BEFORE UPDATE ON cooperatives
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
