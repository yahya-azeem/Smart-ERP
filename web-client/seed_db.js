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

        console.log('Creating tables if they do not exist...');
        const createStatements = [
            `CREATE TABLE IF NOT EXISTS tenants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
                account_number VARCHAR(20),
                name VARCHAR(255) NOT NULL,
                account_type VARCHAR(50) NOT NULL,
                detail_type VARCHAR(100),
                description TEXT,
                balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                is_system BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, account_number)
            )`,
            `CREATE TABLE IF NOT EXISTS suppliers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                contact_person VARCHAR(255),
                tax_id VARCHAR(20),
                terms VARCHAR(50) DEFAULT 'Net 30',
                account_number VARCHAR(50),
                balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                notes TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                address TEXT,
                company_name VARCHAR(255),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                terms VARCHAR(50) DEFAULT 'Net 30',
                balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                notes TEXT,
                tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(100) NOT NULL,
                unit_of_measure VARCHAR(50) NOT NULL,
                price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                stock_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                attributes JSONB DEFAULT '{}'::jsonb,
                item_type VARCHAR(30) NOT NULL DEFAULT 'INVENTORY',
                income_account VARCHAR(20),
                expense_account VARCHAR(20),
                asset_account VARCHAR(20),
                reorder_point DECIMAL(10, 2) DEFAULT 0,
                preferred_vendor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, sku)
            )`,
            `CREATE TABLE IF NOT EXISTS sales_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id UUID NOT NULL REFERENCES customers(id),
                order_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
                total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, order_number)
            )`,
            `CREATE TABLE IF NOT EXISTS invoices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                customer_id UUID NOT NULL REFERENCES customers(id),
                sales_order_id UUID REFERENCES sales_orders(id),
                invoice_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                due_date DATE NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'SENT',
                total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, invoice_number)
            )`,
            `CREATE TABLE IF NOT EXISTS bills (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                supplier_id UUID NOT NULL REFERENCES suppliers(id),
                bill_number VARCHAR(50) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                due_date DATE NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
                total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(tenant_id, bill_number)
            )`,
            `CREATE TABLE IF NOT EXISTS employees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                department VARCHAR(100),
                job_title VARCHAR(100),
                pay_type VARCHAR(20) NOT NULL DEFAULT 'HOURLY',
                pay_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`
        ];

        for (let stmt of createStatements) {
            try {
                await client.query(stmt);
                console.log('✅ Table verified/created');
            } catch (err) {
                console.warn(`⚠️ Table check failed: ${err.message}`);
            }
        }

        console.log('Seeding data from master SQL file...');
        const sqlPath = path.join(__dirname, '..', 'backend', 'migrations', 'master_seed_rich.sql');
        let seedSql = fs.readFileSync(sqlPath, 'utf8');

        // Execute statement by statement
        const statements = seedSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let statement of statements) {
            try {
                await client.query(statement + ';');
                process.stdout.write('.');
            } catch (err) {
                console.warn(`\n⚠️ Statement failed: ${err.message}`);
                console.log(`Failed statement: ${statement.substring(0, 100)}...`);
            }
        }

        console.log('\n✅ Seeding process finished!');
    } catch (err) {
        console.error('❌ Fatal error:', err);
    } finally {
        await client.end();
    }
}

seed();
