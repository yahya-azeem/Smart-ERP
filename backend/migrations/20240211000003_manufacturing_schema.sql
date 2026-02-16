-- Recipes Table (Bill of Materials)
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    output_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    output_quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00, -- How much this recipe produces
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Recipe Ingredients Table
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    input_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL, -- Amount needed per recipe execution
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Status Enum
CREATE TYPE work_order_status AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

-- Work Orders Table
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00, -- Number of recipe executions (batches)
    status work_order_status NOT NULL DEFAULT 'PLANNED',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recipes_tenant_output ON recipes(tenant_id, output_product_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_work_orders_tenant_status ON work_orders(tenant_id, status);
