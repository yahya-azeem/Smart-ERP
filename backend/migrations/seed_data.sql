-- Seed Data
-- Tenant
INSERT INTO tenants (id, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'Default Tenant')
ON CONFLICT DO NOTHING;

-- Supplier
INSERT INTO suppliers (id, tenant_id, name, email, contact_person) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Global Hides Inc', 'supply@hides.com', 'John Skinner')
ON CONFLICT DO NOTHING;

-- Customer
INSERT INTO customers (id, tenant_id, name, email, address) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Luxury Shoes Ltd', 'buyer@shoes.com', '123 Fashion Ave')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, tenant_id, name, sku, unit_of_measure, price, cost_price, stock_quantity, attributes) VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Raw Cow Hide', 'RAW-HIDE-001', 'PIECE', 0.00, 50.00, 100.00, '{"type": "raw", "origin": "Texas"}'::jsonb),
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Tanned Leather Black', 'LEATHER-BLK-001', 'SQ_FT', 5.00, 2.50, 0.00, '{"grade": "A", "color": "black", "thickness": "1.2mm"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Recipe (1 Hide -> 45 Sq Ft)
INSERT INTO recipes (id, tenant_id, name, output_product_id, output_quantity, description) VALUES
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Standard Black Tanning', '55555555-5555-5555-5555-555555555555', 45.00, 'Process raw hide into black leather')
ON CONFLICT DO NOTHING;

-- Recipe Ingredients
INSERT INTO recipe_ingredients (id, recipe_id, input_product_id, quantity) VALUES
('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 1.00)
ON CONFLICT DO NOTHING;
