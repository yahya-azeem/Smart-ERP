-- Phase 2: Transaction Workflows

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- Estimates / Quotes
CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    estimate_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'EXPIRED')),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, estimate_number)
);
CREATE INDEX IF NOT EXISTS idx_estimates_tenant ON estimates(tenant_id, status);

CREATE TABLE IF NOT EXISTS estimate_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Bills (Vendor Invoices)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    bill_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    terms VARCHAR(50) DEFAULT 'Net 30',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, bill_number)
);
CREATE INDEX IF NOT EXISTS idx_bills_tenant ON bills(tenant_id, status);

CREATE TABLE IF NOT EXISTS bill_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Bill Payments
CREATE TABLE IF NOT EXISTS bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
    reference VARCHAR(100),
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales Receipts (immediate payment, no AR)
CREATE TABLE IF NOT EXISTS sales_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    deposit_to_account UUID REFERENCES accounts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS sales_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES sales_receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Credit Memos
CREATE TABLE IF NOT EXISTS credit_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    memo_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'APPLIED', 'REFUNDED')),
    applied_to_invoice UUID REFERENCES invoices(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, memo_number)
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    memo TEXT,
    is_adjusting BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, entry_number)
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    memo TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_je_lines_entry ON journal_entry_lines(entry_id);

-- Checks / Expenses
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    payee_type VARCHAR(20) NOT NULL DEFAULT 'VENDOR' CHECK (payee_type IN ('VENDOR', 'EMPLOYEE', 'OTHER')),
    payee_id UUID,
    payee_name VARCHAR(255) NOT NULL,
    check_number VARCHAR(20),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    memo TEXT,
    is_printed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Enhance customers table for QB parity
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed demo data
INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, amount) 
SELECT i.id, 'Premium Leather Hides', 10, 150.00, 1500.00 FROM invoices i WHERE i.invoice_number = 'INV-1001'
ON CONFLICT DO NOTHING;

INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, amount) 
SELECT i.id, 'Custom Tanning Service', 1, 2500.00, 2500.00 FROM invoices i WHERE i.invoice_number = 'INV-1001'
ON CONFLICT DO NOTHING;

INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, amount) 
SELECT i.id, 'Chrome Tanned Leather Roll', 5, 450.00, 2250.00 FROM invoices i WHERE i.invoice_number = 'INV-1002'
ON CONFLICT DO NOTHING;

INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, amount) 
SELECT i.id, 'Vegetable Tanned Samples', 20, 75.00, 1500.00 FROM invoices i WHERE i.invoice_number = 'INV-1003'
ON CONFLICT DO NOTHING;

-- Seed a few estimates  
INSERT INTO estimates (tenant_id, customer_id, estimate_number, date, expiration_date, status, total_amount, notes) 
SELECT '11111111-1111-1111-1111-111111111111', c.id, 'EST-001', '2025-01-15', '2025-02-15', 'ACCEPTED', 8500.00, 'Custom leather order for spring collection'
FROM customers c WHERE c.name = 'Luxury Bags Inc' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO estimates (tenant_id, customer_id, estimate_number, date, expiration_date, status, total_amount, notes) 
SELECT '11111111-1111-1111-1111-111111111111', c.id, 'EST-002', '2025-02-01', '2025-03-01', 'PENDING', 3200.00, 'Upholstery leather samples'
FROM customers c WHERE c.name = 'AutoTrim Solutions' LIMIT 1
ON CONFLICT DO NOTHING;

-- Seed a few bills
INSERT INTO bills (tenant_id, supplier_id, bill_number, date, due_date, status, total_amount) 
SELECT '11111111-1111-1111-1111-111111111111', s.id, 'BILL-001', '2025-01-10', '2025-02-10', 'OPEN', 12500.00
FROM suppliers s WHERE s.name = 'Texas Cattle Ranch' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bills (tenant_id, supplier_id, bill_number, date, due_date, status, total_amount, amount_paid) 
SELECT '11111111-1111-1111-1111-111111111111', s.id, 'BILL-002', '2025-01-20', '2025-02-20', 'PAID', 4800.00, 4800.00
FROM suppliers s WHERE s.name = 'ChemCo Industrial' LIMIT 1
ON CONFLICT DO NOTHING;

-- Seed journal entries
INSERT INTO journal_entries (tenant_id, entry_number, date, memo) VALUES
('11111111-1111-1111-1111-111111111111', 'JE-001', '2025-01-01', 'Opening balances')
ON CONFLICT DO NOTHING;
