# Smart ERP (Rust Edition)

A high-performance, **QuickBooks Desktop-grade** ERP system tailored for **Leather Manufacturing**.
Built with **Rust** (Backend) and **Next.js** (Frontend) for maximum speed, safety, and scalability.

## Quick Start

### Local Development (Docker)

```bash
docker compose up --build -d
```

| Service | URL |
|---|---|
| **Web App** | [http://localhost:8080](http://localhost:8080) |
| **API** | [http://localhost:3000](http://localhost:3000) |

**Login:** `admin` / `admin123`

## Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Rust (Axum + SQLx + Argon2 + JWT) |
| **Frontend** | Next.js 14 + React 18 + Mantine v7 |
| **Database** | Supabase (PostgreSQL) |
| **API Hosting** | Google Cloud Run |
| **Frontend Hosting** | GitHub Pages |
| **Docker** | Multi-stage Alpine builds |

## Deployment (CI/CD)

Pushes to `main` trigger automatic deployments:

1. **API** → Builds Docker image → Deploys to Google Cloud Run (updates existing service)
2. **Frontend** → Builds Next.js static site → Pushes to `frontend-build` branch → GitHub Pages

### First-Time Setup (Important!)

After deploying, you need to create the admin user in Supabase:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:

```sql
-- Create default tenant
INSERT INTO tenants (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Default Tenant')
ON CONFLICT DO NOTHING;

-- Create admin user (username: admin, password: admin123)
INSERT INTO users (id, tenant_id, username, password_hash, role) VALUES 
  ('11111111-1111-1111-1111-000000000001', 
   '11111111-1111-1111-1111-111111111111', 
   'admin', 
   '$argon2id$v=19$m=65536,t=3,p=4$abcdefghijklmnopqrstu$xyz1234567890abcdefghijklmnopqrstu', 
   'ADMIN')
ON CONFLICT DO NOTHING;
```

**Then login with:** `admin` / `admin123`

Note: The password hash above is a placeholder. Run this in Supabase to generate the correct hash:

```sql
-- Generate proper hash for 'admin123' (run in Supabase SQL Editor)
SELECT 
  'admin123' as password,
  '$argon2id$v=19$m=65536,t=3,p=4$' || 
  encode(gen_random_bytes(16), 'hex') || 
  '$' || 
  encode(gen_random_bytes(32), 'hex') as hash_to_use;
```

Actually, easier method - use the API to register the first user, or modify the code to auto-create admin on first run.

### Quick Setup (No Service Account Keys!)

Run this locally - it uses your Google login:

```bash
chmod +x setup-gcp-workload-identity.sh
./setup-gcp-workload-identity.sh
```

Follow the prompts. It will ask for:
- GCP Project ID
- GCP Region
- GitHub Username

Then add the 4 printed secrets to GitHub (Settings → Secrets → Actions).

### Manual Setup (if needed)

```bash
# 1. Login to GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Run the setup script
./setup-gcp-workload-identity.sh
```

## Features

- **Manufacturing & Inventory** — Recipe/BOM, work orders, multi-unit tracking
- **Sales & Purchasing** — Order-to-cash workflow, PO receiving
- **Accounting** — Invoices, payments, journal entries, chart of accounts
- **Reports** — P&L, balance sheet, trial balance, AR/AP aging, general ledger
- **Analytics** — Real-time dashboards, sales trends
- **Security** — RBAC, rate limiting, CORS, JWT auth, non-root containers

## Project Structure

```
smart-erp/
├── backend/                    # Rust Workspace
│   ├── api/                   # REST API (Axum handlers, middleware, routing)
│   ├── core/                  # Domain models & business logic
│   ├── infrastructure/        # Database repositories (SQLx)
│   ├── shared/                # Shared utilities
│   ├── migrations/            # SQL schema migrations
│   └── Dockerfile.backend     # Multi-stage Alpine Docker build
├── web-client/                # Next.js Frontend
│   ├── app/                   # Next.js App Router pages
│   ├── src/components/        # Layout, data tables
│   ├── src/context/          # Auth, window manager
│   ├── src/api/              # API client
│   ├── next.config.js        # Static export config
│   └── Dockerfile.frontend   # Next.js build
├── .github/
│   └── workflows/
│       ├── deploy-api.yml    # Cloud Run deployment
│       └── deploy-frontend.yml # GitHub Pages deployment
├── docker-compose.yml          # Local development
└── docker-compose.prod.yml     # Production (pre-built images)
```

## License

Proprietary software for Leather Manufacturing optimization.
