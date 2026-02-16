-- RICH SHOWCASE DATA
-- Tenant: 11111111-1111-1111-1111-111111111111

-- 1. More Products (Leather Variations)
INSERT INTO products (id, tenant_id, name, sku, unit_of_measure, price, cost_price, stock_quantity, attributes) VALUES
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Italian Calfskin - Black', 'CALF-BLK-01', 'SQ_FT', 12.50, 6.00, 1500.00, '{"grade": "Premium", "origin": "Italy"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Italian Calfskin - Brown', 'CALF-BRN-01', 'SQ_FT', 12.50, 6.00, 1200.00, '{"grade": "Premium", "origin": "Italy"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Italian Calfskin - Burgundy', 'CALF-BUR-01', 'SQ_FT', 13.00, 6.20, 800.00, '{"grade": "Premium", "origin": "Italy"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Veg Tan Shoulder - Natural', 'VEG-NAT-SH', 'SQ_FT', 9.00, 4.50, 500.00, '{"grade": "A", "thickness": "8oz"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Chrome Excel - Teacore', 'CXL-TEA', 'SQ_FT', 11.00, 5.50, 600.00, '{"tannery": "Horween", "grade": "Select"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Bison Leather - Chocolate', 'BISON-CHOC', 'SQ_FT', 8.00, 3.80, 2000.00, '{"texture": "Shrunken Grain"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Suede - Sand', 'SUEDE-SND', 'SQ_FT', 5.50, 2.50, 900.00, '{"finish": "Velvet"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Shell Cordovan - Color 8', 'SHELL-8', 'SQ_FT', 105.00, 50.00, 50.00, '{"grade": "Elite", "origin": "USA"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Upholstery Leather - Cream', 'UPH-CRM', 'SQ_FT', 4.50, 2.00, 5000.00, '{"use": "Furniture"}'::jsonb),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Exotic - Alligator Belly', 'GATOR-BLK', 'SQ_FT', 80.00, 40.00, 20.00, '{"cites": "Certified"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 2. Historical Sales Orders (Last 12 Months) for Chart Data
-- Generate ~50 orders spread over the year
INSERT INTO sales_orders (id, tenant_id, customer_id, order_number, date, status, total_amount)
SELECT 
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111',
    '33333333-0001-0000-0000-000000000001',
    'SO-HIST-' || generate_series,
    CURRENT_DATE - (generate_series * 7 || ' days')::interval, -- Every week
    'SHIPPED',
    (random() * 5000 + 1000)::decimal(12,2) -- Random amount 1000-6000
FROM generate_series(1, 50);

