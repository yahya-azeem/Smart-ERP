-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER', -- ADMIN, USER
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

-- Add Attributes to Products (for Leather specifics)
ALTER TABLE products ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;

-- Indexes
CREATE INDEX idx_users_tenant_username ON users(tenant_id, username);
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
