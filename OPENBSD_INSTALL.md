# OpenBSD Appliance Deployment Guide

This guide allows you to deploy the entire Smart ERP stack (Database, Backend, Frontend, Web Server) as a single, integrated "Appliance" on OpenBSD with one command.

## Prerequisites

- A fresh OpenBSD install (7.4 or newer recommended).
- `doas` configured for root access.
- Internet connection (for `pkg_add` and `npm install`).

## Quick Start (One Command)

1. Copy the repository to your OpenBSD machine.
2. Run the deployment script:

```sh
chmod +x openbsd_deploy_appliance.sh
doas ./openbsd_deploy_appliance.sh
```

## What This Does

The script acts like a "Docker Build + Run" for the base system:

1.  **Dependencies**: Installs `rust`, `node`, `postgresql-server`, `nginx` via `pkg_add`.
2.  **User Isolation**: Creates `_smarterp` user (for the app) and `_smarterp_db` user (for the database).
3.  **Build**: Compiles the Rust backend and React frontend from source.
4.  **Install**:
    -   Binaries -> `/var/www/smart-erp/bin`
    -   Static Assets -> `/var/www/smart-erp/htdocs`
5.  **Database**: Initializes Postgres, creates the database, and applies migrations automatically.
6.  **Web Server**: Configures Nginx as a reverse proxy (serving frontend, proxying API to localhost:3000).
7.  **Service**: Installs and starts the `smarterp` rc.d script.

## Security Architecture

- **Pledge/Unveil**: The Rust backend uses `pledge(2)` and `unveil(2)` to restrict its own capabilities at the kernel level (Code injection in `main.rs`).
- **Privilege Separation**:
    -   App runs as `_smarterp`.
    -   DB runs as `_postgresql` (owned by `_smarterp_db`).
    -   Web Server runs as `www`.
-   **Filesystem**: The application is installed in `/var/www/smart-erp`, keeping the base system clean.

## Management

- **Start/Stop**: `rcctl start smarterp` / `rcctl stop smarterp`
- **Logs**: check `/var/log/daemon` or run manually for debug.
- **Update**: `git pull` then run the deployment script again (it handles rebuilds).
