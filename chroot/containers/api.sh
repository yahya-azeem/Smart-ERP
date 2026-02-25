#!/bin/ksh
# =============================================================================
# Unix Chroot Container — Rust API Container
# =============================================================================
# Creates an isolated chroot running the Smart ERP Rust API.
# Equivalent to the 'api' service in docker-compose.yml
#
# Docker equivalent:
#   build: ./backend (Dockerfile.backend)
#   ports: 3000:3000
#   environment: DATABASE_URL, JWT_SECRET, RUST_LOG
#   depends_on: db (service_healthy)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "${SCRIPT_DIR}/../lib/chroot_base.sh"

CONTAINER_NAME="smarterp-api"
API_USER="_smarterp_api"
API_PORT=3000

# Database connection (connects to DB chroot via loopback)
DB_USER="${SMARTERP_DB_USER:-_smarterp_db}"
DB_PASS="${SMARTERP_DB_PASS:-smarterp_secure_pass}"
DB_NAME="${SMARTERP_DB_NAME:-smart_erp}"
DB_PORT=5432

# Security
JWT_SECRET="${SMARTERP_JWT_SECRET:-$(openssl rand -hex 32)}"

# Source directory (project root)
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

build_api_container() {
    log_step "API" "Building Rust API container: ${CONTAINER_NAME}"

    # --- FROM openbsd:latest ---
    create_chroot "${CONTAINER_NAME}"

    # --- RUN pkg_add rust ---
    log_info "Installing Rust toolchain and build dependencies..."
    chroot_pkg_add "${CONTAINER_NAME}" "rust" "gmake" "git"

    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"

    # --- COPY backend source into chroot for building ---
    log_info "Copying backend source code into chroot..."
    install -d "${chroot_dir}/build"
    cp -R "${PROJECT_ROOT}/backend/" "${chroot_dir}/build/backend/"

    # --- RUN cargo build --release ---
    log_info "Building Rust API binary inside chroot (this may take several minutes)..."
    chroot "${chroot_dir}" /bin/ksh -c "
        export PQ_LIB_DIR=/usr/local/lib
        export HOME=/tmp
        cd /build/backend
        cargo build --release --bin api
    "

    # --- Install binary to /app ---
    log_info "Installing API binary..."
    install -d -o root -g wheel "${chroot_dir}/app"
    install -m 755 "${chroot_dir}/build/backend/target/release/api" "${chroot_dir}/app/smart-erp-api"

    # --- Create non-root service user (CVE-09 equivalent) ---
    chroot_adduser "${CONTAINER_NAME}" "${API_USER}" "/app"

    # Ensure the API user owns the app directory
    chroot "${chroot_dir}" chown -R "${API_USER}" /app

    # --- Create log directory ---
    install -d -o root -g wheel "${chroot_dir}/var/log/smarterp"
    chroot "${chroot_dir}" chown "${API_USER}" /var/log/smarterp

    # --- Write environment config ---
    cat > "${chroot_dir}/app/env.conf" <<ENVCONF
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
RUST_LOG=info
APP_ENVIRONMENT=production
ENVCONF
    chmod 0600 "${chroot_dir}/app/env.conf"
    chroot "${chroot_dir}" chown "${API_USER}" /app/env.conf

    # --- Cleanup build artifacts to save space (like Docker multi-stage) ---
    log_info "Cleaning up build artifacts..."
    rm -rf "${chroot_dir}/build"
    rm -rf "${chroot_dir}/tmp/.cargo"

    log_info "API container ${CONTAINER_NAME} built successfully."
}

# Start the API server inside the chroot
start_api_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    log_info "Starting Smart ERP API in chroot ${CONTAINER_NAME}..."

    _ensure_devfs "${chroot_dir}"

    # Load environment and start as the service user
    chroot "${chroot_dir}" su -s /bin/sh "${API_USER}" -c "
        set -a
        . /app/env.conf
        set +a
        /app/smart-erp-api >> /var/log/smarterp/api.log 2>&1 &
    "

    # Health check
    wait_for_port "127.0.0.1" "${API_PORT}" 15
}

# Stop the API server
stop_api_container() {
    log_info "Stopping Smart ERP API in chroot ${CONTAINER_NAME}..."
    pkill -f "smart-erp-api" 2>/dev/null || true
}

# Health check
check_api_container() {
    echo "" | nc -w 1 127.0.0.1 "${API_PORT}" >/dev/null 2>&1
}
