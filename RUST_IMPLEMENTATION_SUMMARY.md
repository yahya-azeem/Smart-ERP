# Smart ERP Rust Rewrite - Implementation Summary

## 🚀 Status: MISSION COMPLETE (With QuickBooks UI & Auth)

The Smart ERP has been successfully rewritten in Rust and React, tailored for Leather Manufacturing, with a **QuickBooks-style Desktop UI**.

## 📂 Project Structure

```
smart-erp/
├── backend/                  # Rust Workspace (Axum + SQLx)
├── web-client/               # React + Mantine Frontend
│   ├── src/
│   │   ├── components/       # Layout, DenseTable (UI Core)
│   │   ├── context/          # Auth, WindowManager (Desktop Logic)
│   │   ├── pages/            # Login, ProductList
└── migrations/               # SQLx Migrations
```

## 🛠 Tech Stack

- **Backend**: Rust (Axum, SQLx, Tokio)
- **Frontend**: React, TypeScript, TanStack Table, Mantine v7
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker
- **Auth**: Argon2 + JWT

## ✅ Completed Features

1.  **Authentication**: Secure Login/Register API + UI.
2.  **QuickBooks UI**:
    -   **Window Manager**: Open multiple tabs (Products, POs) simultaneously inside the app.
    -   **Dense Tables**: Spreadsheet-like data grids.
3.  **Domain Logic**: Inventory, Purchasing, Manufacturing, Sales, Accounting.
4.  **Seeding**: Admin/Staff accounts and Leather industry dummy data.

## 🚀 How to Run

```bash
# Start the full stack
docker-compose -f docker-compose.new.yml up --build
```

Access the application at `http://localhost:8080`.

## 🔑 Credentials

-   **Admin**: `admin` / `admin123`
-   **Staff**: `worker` / `worker123`
