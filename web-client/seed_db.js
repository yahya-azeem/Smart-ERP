const { Client } = require('./node_modules/pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || "postgres://postgres.fnirqccmtjzibjhgzyay:mU4c7H5fK9l2@aws-0-us-west-1.pooler.supabase.com:5432/postgres";

async function seed() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();

        console.error('--- CLEANING TABLES ---');
        const tablesToDrop = [
            'invoice_lines', 'bill_lines', 'journal_entry_lines', 'bill_payments',
            'invoices', 'bills', 'sales_orders', 'journal_entries', 'employees',
            'products', 'customers', 'suppliers', 'accounts', 'tenants'
        ];
        for (const table of tablesToDrop) {
            try {
                await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.error(`- Dropped ${table}`);
            } catch (e) {
                console.error(`- FAILED to drop ${table}: ${e.message}`);
            }
        }
        console.error('✅ Cleanup completed');

        console.error('--- RECONSTRUCTING SCHEMA ---');
        const schema = [
            `CREATE TABLE tenants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                account_number VARCHAR(50),
                name VARCHAR(255) NOT NULL,
                account_type VARCHAR(50) NOT NULL,
                balance DECIMAL(19, 4) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE suppliers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                contact_person VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                terms VARCHAR(50) DEFAULT 'Net 30',
                balance DECIMAL(19, 4) NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                notes TEXT,
                tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(50) NOT NULL,
                description TEXT,
                unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'UNIT',
                price DECIMAL(19, 4) NOT NULL DEFAULT 0,
                cost_price DECIMAL(19, 4) NOT NULL DEFAULT 0,
                stock_quantity DECIMAL(19, 4) NOT NULL DEFAULT 0,
                attributes JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, sku)
            )`,
            `CREATE TABLE sales_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id UUID NOT NULL REFERENCES customers(id),
                order_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
                total_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, order_number)
            )`,
            `CREATE TABLE invoices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id UUID NOT NULL REFERENCES customers(id),
                invoice_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                due_date DATE NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'SENT',
                total_amount DECIMAL(19, 4) NOT NULL,
                amount_paid DECIMAL(19, 4) DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, invoice_number)
            )`,
            `CREATE TABLE invoice_lines (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                description TEXT NOT NULL,
                quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
                unit_price DECIMAL(19, 4) NOT NULL DEFAULT 0,
                amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
                account_id UUID REFERENCES accounts(id),
                sort_order INTEGER NOT NULL DEFAULT 0
            )`,
            `CREATE TABLE bills (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                supplier_id UUID NOT NULL REFERENCES suppliers(id),
                bill_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                due_date DATE NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
                total_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
                amount_paid DECIMAL(19, 4) NOT NULL DEFAULT 0,
                terms VARCHAR(50) DEFAULT 'Net 30',
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, bill_number)
            )`,
            `CREATE TABLE bill_lines (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                account_id UUID REFERENCES accounts(id),
                description TEXT NOT NULL,
                quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
                unit_price DECIMAL(19, 4) NOT NULL DEFAULT 0,
                amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0
            )`,
            `CREATE TABLE employees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
                job_title VARCHAR(100),
                department VARCHAR(100),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                pay_type VARCHAR(20) DEFAULT 'SALARY',
                pay_rate DECIMAL(19, 4) DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE journal_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                entry_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                memo TEXT,
                is_adjusting BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, entry_number)
            )`,
            `CREATE TABLE journal_entry_lines (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
                account_id UUID NOT NULL REFERENCES accounts(id),
                debit DECIMAL(19, 4) NOT NULL DEFAULT 0,
                credit DECIMAL(19, 4) NOT NULL DEFAULT 0,
                memo TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0
            )`
        ];

        for (const stmt of schema) {
            try {
                await client.query(stmt);
                console.error(`+ Executed schema statement: ${stmt.substring(0, 30)}...`);
            } catch (e) {
                console.error(`+ FAILED schema statement: ${stmt.substring(0, 30)}... Error: ${e.message}`);
            }
        }
        console.error('✅ Schema reconstruction completed');

        console.error('Creating default tenant...');
        await client.query("INSERT INTO tenants (id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'Default Tenant')");

        console.error('Seeding data from master SQL file...');
        const sqlPath = path.join(__dirname, '..', 'backend', 'migrations', 'master_seed_rich.sql');
        let seedSql = fs.readFileSync(sqlPath, 'utf8');

        const statements = seedSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let statement of statements) {
            try {
                console.error(`Running: ${statement.substring(0, 50)}...`);
                await client.query(statement + ';');
            } catch (e) {
                console.error(`⚠️ Statement failed: ${e.message}\nStatement: ${statement.substring(0, 100)}...`);
            }
        }

        console.error('✅ Seeding process fully finished!');
    } catch (err) {
        console.error('\n❌ Fatal error:', err);
    } finally {
        await client.end();
    }
}

seed();
