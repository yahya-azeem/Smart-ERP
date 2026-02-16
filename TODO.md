# Smart ERP Rust Rewrite - Master Plan

## 🎯 Goal
Rewrite the Smart ERP system in **Rust** (Backend) and **React** (Frontend) to achieve high performance, type safety, and a **QuickBooks Desktop-like** user experience. The system must be containerized with **Docker** and tailored for **Leather Manufacturing**.

## 🛠 Tech Stack
- **Backend**: Rust, Axum (Web Framework), SQLx (Database), key-value store (Redis - optional for caching)
- **Frontend**: React, TypeScript, TanStack Table (Data Grid), Mantine (UI Component Library), React Query
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose (Multi-stage builds)

## 📦 Phase 0: Foundation & Infrastructure
- [ ] **Project Setup**
    - [ ] Initialize Rust Workspace (`backend`, `core`, `api`, `migration`)
    - [ ] Set up `cargo.toml` with dependencies (tokio, axum, sqlx, serde, tracing, etc.)
    - [ ] Initialize React Frontend (Vite + TypeScript)
- [ ] **Docker Configuration**
    - [ ] Create `Dockerfile.backend` (Multi-stage Rust build: chef -> planner -> builder -> runtime)
    - [ ] Create `Dockerfile.frontend` (Multi-stage Node build: deps -> builder -> nginx)
    - [ ] Create `docker-compose.yml` for dev (Hot reload) and prod
- [ ] **Database Architecture**
    - [ ] Design Multi-tenant Schema Strategy (Row-level Security vs Schema-per-tenant)
    - [ ] Initialize SQLx migrations
    - [ ] Create `tenants` table and basic `users` auth system (Argon2, JWT)

## 🧱 Phase 1: Core Domain (Inventory & Products)
*Goal: Move away from simple counters to transaction-based inventory for auditability.*
- [ ] **Product Model**
    - [ ] Define `Product` struct (Base for Raw Leather and Finished Goods)
    - [ ] Add `UnitOfMeasure` (sq ft, pieces, kg)
- [ ] **Inventory System**
    - [ ] Design `InventoryTransaction` model (product_id, location, qty, type: PURCHASE, SALE, ADJUSTMENT, PRODUCTION)
    - [ ] Implement `InventoryService` trait in Rust to handle stock updates safely
    - [ ] Create DB constraints to prevent negative stock (optional, depending on business rules)

## 🧶 Phase 2: Purchasing (Raw Leather)
*Goal: Port `raw_leather` and add "Receiving" logic.*
- [ ] **Supplier Management**
    - [ ] Port `LeatherSupplier` model and CRUD API
- [ ] **Purchase Orders (PO)**
    - [ ] Design `PurchaseOrder` and `PurchaseOrderLine` structs
    - [ ] Implement "Type State Pattern" for PO Status (Draft -> Ordered -> Received)
    - [ ] Implement `ReceiveOrder` handler:
        - [ ] Validates PO status
        - [ ] Creates `InventoryTransaction` (Type: PURCHASE)
        - [ ] Updates Product Stock (Atomic Transaction)

## 🏭 Phase 3: Manufacturing (Processing)
*Goal: New module to handle Raw Leather -> Finished Goods conversion.*
- [ ] **Recipes / BOM (Bill of Materials)**
    - [ ] Design `Recipe` model (Input: Raw Leather, Chemicals -> Output: Finished Leather)
- [ ] **Work Orders**
    - [ ] Design `WorkOrder` struct (Status: Planned -> In Progress -> Completed)
    - [ ] Implement `CompleteWorkOrder` handler:
        - [ ] Consumes Raw Materials (InventoryTransaction: PRODUCTION_OUT)
        - [ ] Produces Finished Goods (InventoryTransaction: PRODUCTION_IN)
        - [ ] Calculates Cost of Goods Sold (COGS)

## 💰 Phase 4: Sales & Accounting
- [ ] **Sales Orders (SO)**
    - [ ] Port `SalesOrder` logic
    - [ ] Implement `ShipOrder` handler (InventoryTransaction: SALE)
- [ ] **Invoicing & Payments**
    - [ ] Port `Invoice` and `Payment` models
    - [ ] Implement basic General Ledger (GL) entries for financial tracking

## 🖥 Phase 5: Frontend (QuickBooks UI)
*Goal: High-density, keyboard-driven UI.*
- [ ] **Shell Layout**
    - [ ] Create "Desktop" layout (Sidebar, Tab Bar for open windows/modules)
    - [ ] Implement Global Command Palette (Ctrl+K)
- [ ] **Data Grids**
    - [ ] Implement `TanStack Table` wrapper for "Excel-like" editing
    - [ ] Support keyboard navigation (Arrow keys, Enter to edit)
- [ ] **Forms**
    - [ ] Create dense form layouts (Minimize whitespace)
    - [ ] Implement "Modal Manager" for stacking windows (e.g., Open Customer -> Open Invoice -> Open Payment)

## 🚀 Phase 6: Migration & Cutover
- [ ] Write migration scripts (Python -> Rust DB)
- [ ] Perform parallel run verification
- [ ] Final cutover

