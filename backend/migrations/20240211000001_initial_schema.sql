-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'UNIT', -- e.g., SQ_FT, KG, PIECE
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, sku)
);

-- Inventory Transaction Type Enum
CREATE TYPE transaction_type AS ENUM (
    'PURCHASE', 
    'SALE', 
    'ADJUSTMENT', 
    'PRODUCTION_IN', 
    'PRODUCTION_OUT'
);

-- Inventory Transactions Table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL, -- Positive for add, negative for remove
    transaction_type transaction_type NOT NULL,
    reference_id UUID, -- Links to PO, SO, or Work Order ID
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_tenant_sku ON products(tenant_id, sku);
CREATE INDEX idx_inventory_product_date ON inventory_transactions(product_id, created_at DESC);
