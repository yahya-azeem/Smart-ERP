-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    account_number VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
        'BANK', 'ACCOUNTS_RECEIVABLE', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_ASSET',
        'ACCOUNTS_PAYABLE', 'CREDIT_CARD', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
        'EQUITY',
        'INCOME', 'OTHER_INCOME',
        'COST_OF_GOODS_SOLD',
        'EXPENSE', 'OTHER_EXPENSE'
    )),
    detail_type VARCHAR(100),
    description TEXT,
    balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, account_number)
);

CREATE INDEX idx_accounts_tenant_type ON accounts(tenant_id, account_type);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);

-- Seed default Chart of Accounts for existing tenant
INSERT INTO accounts (tenant_id, account_number, name, account_type, is_system) VALUES
-- Assets
('11111111-1111-1111-1111-111111111111', '1000', 'Checking Account', 'BANK', true),
('11111111-1111-1111-1111-111111111111', '1100', 'Savings Account', 'BANK', false),
('11111111-1111-1111-1111-111111111111', '1200', 'Accounts Receivable', 'ACCOUNTS_RECEIVABLE', true),
('11111111-1111-1111-1111-111111111111', '1300', 'Inventory Asset', 'OTHER_CURRENT_ASSET', true),
('11111111-1111-1111-1111-111111111111', '1400', 'Undeposited Funds', 'OTHER_CURRENT_ASSET', true),
('11111111-1111-1111-1111-111111111111', '1500', 'Prepaid Expenses', 'OTHER_CURRENT_ASSET', false),
('11111111-1111-1111-1111-111111111111', '1600', 'Machinery & Equipment', 'FIXED_ASSET', false),
('11111111-1111-1111-1111-111111111111', '1700', 'Accumulated Depreciation', 'FIXED_ASSET', false),
-- Liabilities
('11111111-1111-1111-1111-111111111111', '2000', 'Accounts Payable', 'ACCOUNTS_PAYABLE', true),
('11111111-1111-1111-1111-111111111111', '2100', 'Credit Card', 'CREDIT_CARD', false),
('11111111-1111-1111-1111-111111111111', '2200', 'Sales Tax Payable', 'OTHER_CURRENT_LIABILITY', true),
('11111111-1111-1111-1111-111111111111', '2300', 'Payroll Liabilities', 'OTHER_CURRENT_LIABILITY', false),
('11111111-1111-1111-1111-111111111111', '2500', 'Loan Payable', 'LONG_TERM_LIABILITY', false),
-- Equity
('11111111-1111-1111-1111-111111111111', '3000', 'Opening Balance Equity', 'EQUITY', true),
('11111111-1111-1111-1111-111111111111', '3100', 'Retained Earnings', 'EQUITY', true),
('11111111-1111-1111-1111-111111111111', '3200', 'Owner''s Equity', 'EQUITY', false),
-- Income
('11111111-1111-1111-1111-111111111111', '4000', 'Sales Revenue', 'INCOME', true),
('11111111-1111-1111-1111-111111111111', '4100', 'Service Revenue', 'INCOME', false),
('11111111-1111-1111-1111-111111111111', '4200', 'Discounts Given', 'INCOME', false),
('11111111-1111-1111-1111-111111111111', '4900', 'Interest Income', 'OTHER_INCOME', false),
-- COGS
('11111111-1111-1111-1111-111111111111', '5000', 'Cost of Goods Sold', 'COST_OF_GOODS_SOLD', true),
('11111111-1111-1111-1111-111111111111', '5100', 'Raw Materials', 'COST_OF_GOODS_SOLD', false),
('11111111-1111-1111-1111-111111111111', '5200', 'Direct Labor', 'COST_OF_GOODS_SOLD', false),
('11111111-1111-1111-1111-111111111111', '5300', 'Manufacturing Overhead', 'COST_OF_GOODS_SOLD', false),
-- Expenses
('11111111-1111-1111-1111-111111111111', '6000', 'Advertising & Marketing', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6100', 'Auto Expenses', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6200', 'Bank Service Charges', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6300', 'Depreciation Expense', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6400', 'Insurance', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6500', 'Office Supplies', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6600', 'Payroll Expenses', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6700', 'Rent or Lease', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6800', 'Repairs & Maintenance', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '6900', 'Utilities', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7000', 'Telephone & Internet', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7100', 'Travel & Entertainment', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7200', 'Professional Fees', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7300', 'Taxes & Licenses', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7400', 'Shipping & Delivery', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7500', 'Tanning Supplies', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '7600', 'Chemical Disposal', 'EXPENSE', false),
('11111111-1111-1111-1111-111111111111', '9000', 'Interest Expense', 'OTHER_EXPENSE', false)
ON CONFLICT DO NOTHING;

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    ssn_last4 VARCHAR(4),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    termination_date DATE,
    department VARCHAR(100),
    job_title VARCHAR(100),
    pay_type VARCHAR(20) NOT NULL DEFAULT 'HOURLY' CHECK (pay_type IN ('HOURLY', 'SALARY')),
    pay_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_tenant_status ON employees(tenant_id, status);
CREATE INDEX idx_employees_tenant_name ON employees(tenant_id, last_name, first_name);

-- Seed some employees for demo
INSERT INTO employees (tenant_id, first_name, last_name, email, department, job_title, pay_type, pay_rate, hire_date) VALUES
('11111111-1111-1111-1111-111111111111', 'John', 'Martinez', 'john.m@smarterp.com', 'Manufacturing', 'Tanning Operator', 'HOURLY', 28.50, '2023-03-15'),
('11111111-1111-1111-1111-111111111111', 'Sarah', 'Johnson', 'sarah.j@smarterp.com', 'Quality Control', 'QC Inspector', 'HOURLY', 24.00, '2023-06-01'),
('11111111-1111-1111-1111-111111111111', 'Mike', 'Williams', 'mike.w@smarterp.com', 'Manufacturing', 'Lead Craftsman', 'SALARY', 62000.00, '2022-11-10'),
('11111111-1111-1111-1111-111111111111', 'Emily', 'Chen', 'emily.c@smarterp.com', 'Sales', 'Account Manager', 'SALARY', 55000.00, '2024-01-20'),
('11111111-1111-1111-1111-111111111111', 'David', 'Garcia', 'david.g@smarterp.com', 'Warehouse', 'Shipping Clerk', 'HOURLY', 18.50, '2024-05-01'),
('11111111-1111-1111-1111-111111111111', 'Lisa', 'Thompson', 'lisa.t@smarterp.com', 'Accounting', 'Bookkeeper', 'SALARY', 48000.00, '2023-09-15')
ON CONFLICT DO NOTHING;

-- Add more columns to suppliers for full Vendor Center
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add more columns to products for full Item types
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_type VARCHAR(30) NOT NULL DEFAULT 'INVENTORY'
    CHECK (item_type IN ('INVENTORY', 'NON_INVENTORY', 'SERVICE', 'ASSEMBLY', 'GROUP'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS income_account VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expense_account VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS asset_account VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS preferred_vendor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;
