#!/bin/ksh
# =============================================================================
# Unix Chroot Container — PostgreSQL Database Container
# =============================================================================
# Creates an isolated chroot running PostgreSQL.
# Equivalent to the 'db' service in docker-compose.yml
#
# Docker equivalent:
#   image: postgres:16-alpine
#   environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   ports: 5432:5432
#   volumes: postgres_data:/var/lib/postgresql/data
#   healthcheck: pg_isready
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "${SCRIPT_DIR}/../lib/chroot_base.sh"

CONTAINER_NAME="smarterp-db"
DB_USER="_postgresql"
APP_DB_USER="${SMARTERP_DB_USER:-_smarterp_db}"
APP_DB_NAME="${SMARTERP_DB_NAME:-smart_erp}"
APP_DB_PASS="${SMARTERP_DB_PASS:-smarterp_secure_pass}"
DB_PORT=5432

# Source directory (project root)
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

build_db_container() {
    log_step "DB" "Building PostgreSQL container: ${CONTAINER_NAME}"

    # --- FROM openbsd:latest (slim, no compiler) ---
    # DB only runs PostgreSQL at runtime — no need for comp.tgz
    create_chroot "${CONTAINER_NAME}" "nocomp"

    # --- RUN pkg_add postgresql-server ---
    log_info "Installing PostgreSQL server..."
    chroot_pkg_add "${CONTAINER_NAME}" "postgresql-server"

    # Strip unnecessary bloat (man pages, docs, locale, pkg cache)
    strip_chroot_bloat "${CONTAINER_NAME}"

    # --- Create data directory (persistent volume equivalent) ---
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"

    # Create PostgreSQL data directory inside chroot
    install -d -o 503 -g 503 "${chroot_dir}/var/postgresql/data"
    install -d -o 503 -g 503 "${chroot_dir}/var/postgresql/backups"
    install -d -o 503 -g 503 "${chroot_dir}/run/postgresql"

    # --- Initialize PostgreSQL cluster if not exists ---
    if [ ! -f "${chroot_dir}/var/postgresql/data/PG_VERSION" ]; then
        log_info "Initializing PostgreSQL cluster..."
        chroot "${chroot_dir}" su -s /bin/sh ${DB_USER} -c \
            "/usr/local/bin/initdb -D /var/postgresql/data -U postgres -A trust -E UTF8"

        # Configure PostgreSQL to listen on loopback only
        cat >> "${chroot_dir}/var/postgresql/data/postgresql.conf" <<PGCONF

# === Unix Chroot Container Configuration ===
listen_addresses = '127.0.0.1'
port = ${DB_PORT}
max_connections = 50
shared_buffers = 128MB
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/postgresql/backups'
log_filename = 'postgresql-%Y-%m-%d.log'
PGCONF

        # Configure pg_hba.conf for local and loopback access
        cat > "${chroot_dir}/var/postgresql/data/pg_hba.conf" <<PGHBA
# TYPE  DATABASE  USER       ADDRESS        METHOD
local   all       postgres                  trust
local   all       ${APP_DB_USER}            trust
host    all       ${APP_DB_USER}  127.0.0.1/32   md5
host    all       postgres        127.0.0.1/32   trust
PGHBA
    else
        log_info "PostgreSQL cluster already initialized."
    fi

    # --- Copy migration files into chroot ---
    log_info "Copying migration files..."
    install -d "${chroot_dir}/migrations"
    cp "${PROJECT_ROOT}/backend/migrations/"*.sql "${chroot_dir}/migrations/"

    log_info "PostgreSQL container ${CONTAINER_NAME} built successfully."
}

# Start PostgreSQL inside the chroot
start_db_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    log_info "Starting PostgreSQL in chroot ${CONTAINER_NAME}..."

    _ensure_devfs "${chroot_dir}"

    chroot "${chroot_dir}" su -s /bin/sh ${DB_USER} -c \
        "/usr/local/bin/pg_ctl -D /var/postgresql/data -l /var/postgresql/backups/startup.log start"

    # Health check — wait for PostgreSQL to accept connections
    wait_for_port "127.0.0.1" "${DB_PORT}" 30
}

# Stop PostgreSQL inside the chroot
stop_db_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    log_info "Stopping PostgreSQL in chroot ${CONTAINER_NAME}..."

    chroot "${chroot_dir}" su -s /bin/sh ${DB_USER} -c \
        "/usr/local/bin/pg_ctl -D /var/postgresql/data stop -m fast" || true
}

# Initialize the application database and run migrations
init_app_database() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    log_step "DB" "Initializing application database..."

    # Create application user if not exists
    chroot "${chroot_dir}" su -s /bin/sh ${DB_USER} -c "
        /usr/local/bin/psql -U postgres -tc \"SELECT 1 FROM pg_roles WHERE rolname='${APP_DB_USER}'\" \
            | grep -q 1 \
            || /usr/local/bin/psql -U postgres -c \"CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASS}';\"
    "

    # Create database if not exists
    chroot "${chroot_dir}" su -s /bin/sh ${DB_USER} -c "
        /usr/local/bin/psql -U postgres -lqt | cut -d '|' -f 1 | grep -qw ${APP_DB_NAME} \
            || /usr/local/bin/psql -U postgres -c \"CREATE DATABASE ${APP_DB_NAME} OWNER ${APP_DB_USER};\"
    "

    # Apply migrations
    log_info "Applying database migrations..."
    for migration in "${chroot_dir}/migrations/"*.sql; do
        local fname="$(basename ${migration})"
        log_info "  Applying: ${fname}"
        chroot "${chroot_dir}" su -s /bin/sh ${DB_USER} -c \
            "/usr/local/bin/psql -U ${APP_DB_USER} -d ${APP_DB_NAME} -f /migrations/${fname}" \
            2>/dev/null || log_warn "  Migration ${fname} may have already been applied."
    done

    log_info "Application database initialized."
}

# Health check
check_db_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    chroot "${chroot_dir}" /usr/local/bin/pg_isready -h 127.0.0.1 -p ${DB_PORT} >/dev/null 2>&1
}
