-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL,
    price DECIMAL NOT NULL,
    stock_quantity DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create inventory_transactions table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'PRODUCTION_IN', 'PRODUCTION_OUT')),
    quantity DECIMAL NOT NULL,
    unit_price DECIMAL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
