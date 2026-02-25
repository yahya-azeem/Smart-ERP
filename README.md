# Smart ERP (Rust Edition)

A high-performance, **QuickBooks Desktop-grade** ERP system tailored for **Leather Manufacturing**.
Built with **Rust** (Backend) and **React** (Frontend) for maximum speed, safety, and scalability.

## Quick Start

### Docker (Recommended)

```bash
docker compose up --build -d
```

| Service | URL |
|---|---|
| **Web App** | [http://localhost:8080](http://localhost:8080) |
| **API** | [http://localhost:3000](http://localhost:3000) |

**Login:** `admin` / `admin123`

### OpenBSD (Unix Chroot Container)

```bash
doas ./chroot_deploy.sh
```

See [OPENBSD_INSTALL.md](OPENBSD_INSTALL.md) for full chroot container documentation.

## Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Rust (Axum + SQLx + Argon2 + JWT) |
| **Frontend** | React + TypeScript + Mantine v7 |
| **Database** | PostgreSQL 16 |
| **Docker** | Multi-stage builds, docker compose |
| **OpenBSD** | chroot(2) + pledge(2) + unveil(2) |

## Features

- **Manufacturing & Inventory** — Recipe/BOM, work orders, multi-unit tracking
- **Sales & Purchasing** — Order-to-cash workflow, PO receiving
- **Accounting** — Invoices, payments, journal entries, chart of accounts
- **Reports** — P&L, balance sheet, trial balance, AR/AP aging, general ledger
- **Analytics** — Real-time dashboards, sales trends
- **Security** — RBAC, rate limiting, CORS, session auth, non-root containers

## Project Structure

```
smart-erp/
├── backend/                    # Rust Workspace
│   ├── api/                    # REST API (Axum handlers, middleware, routing)
│   ├── core/                   # Domain models & business logic
│   ├── infrastructure/         # Database repositories (SQLx)
│   ├── shared/                 # Shared utilities
│   └── migrations/             # SQL schema migrations
├── web-client/                 # React Frontend
│   ├── src/components/         # Layout, data tables
│   ├── src/pages/              # Feature pages
│   ├── src/context/            # Auth, window manager
│   └── src/api/                # API client
├── chroot/                     # OpenBSD Chroot Container system
│   ├── lib/                    # Chroot library functions
│   ├── containers/             # Container definitions (db, api, web)
│   └── rc.d/                   # rc.d service scripts
├── docker-compose.yml          # Docker deployment
├── docker-compose.prod.yml     # Production (pre-built images)
├── chroot_deploy.sh            # OpenBSD chroot deployment
└── publish_release.sh          # GHCR image publishing
```

## Deployment Options

| Method | Command | Best For |
|---|---|---|
| **Docker (dev)** | `docker compose up --build` | Development, testing |
| **Docker (prod)** | `docker compose -f docker-compose.prod.yml up` | Production with pre-built images |
| **OpenBSD chroot** | `doas ./chroot_deploy.sh` | Maximum security, BSD servers |

## License

Proprietary software for Leather Manufacturing optimization.
