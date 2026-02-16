# Smart ERP (Rust Edition)

A high-performance, **QuickBooks Desktop-grade** ERP system tailored for **Leather Manufacturing**.
Rewritten in **Rust (Backend)** and **React (Frontend)** for maximum speed, safety, and scalability.

## 🚀 Key Features

### 🏭 Manufacturing & Inventory
- **Recipe/BOM Management**: Track "Raw Hide" to "Finished Leather" conversions.
- **Work Orders**: Manage production cycles with atomic inventory updates.
- **Multi-Level Units**: Handle Pieces, Sq Ft, and KGs seamlessly.

### 💰 Sales & Purchasing
- **Workflow-Driven UI**: Visual dashboards mapping the entire Order-to-Cash cycle.
- **Purchase Orders**: Auto-update inventory upon receipt.
- **Sales Orders**: "Pick, Pack, Ship" workflow with backorder tracking.

### 📊 Accounting & Insights
- **Real-Time Dashboards**: "Income Trend", "Sales by Customer", and "Inventory Valuation" charts.
- **Dense Data Grids**: Keyboard-friendly, spreadsheet-like interface for power users.

## 🛠 Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Backend** | **Rust** (Axum + SQLx) | Ultra-fast, type-safe, low-latency API. |
| **Frontend** | **React** (Vite + Mantine) | Dense, desktop-like UI with fast rendering. |
| **Database** | **PostgreSQL 16** | Transactional integrity for all financial data. |
| **Infra** | **Docker** | One-command deployment. |

## 🏁 Quick Start

1. **Start the System**
   ```bash
   docker-compose -f docker-compose.new.yml up --build
   ```

2. **Access the App**
   - **Frontend**: [http://localhost:8080](http://localhost:8080)
   - **Backend API**: [http://localhost:3000](http://localhost:3000)

3. **Login Credentials** (Pre-seeded)
   - **Admin**: `admin` / `admin123`
   - **Staff**: `worker` / `worker123`

## 📂 Project Structure

```
smart-erp/
├── backend/                  # Rust Workspace
│   ├── api/                  # REST API Handlers & Routing
│   ├── core/                 # Domain Logic & Type Definitions
│   ├── infrastructure/       # Database Repositories (SQLx)
│   └── migrations/           # SQL Database Schemas
├── web-client/               # React Frontend
│   ├── src/components/       # High-density UI components
│   ├── src/pages/            # Feature-specific pages
│   └── src/context/          # State Management
```

## 📜 License
Proprietary software for Leather Manufacturing optimization.
