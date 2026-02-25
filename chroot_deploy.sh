#!/bin/ksh
# =============================================================================
# Unix Chroot Container — Master Deployment Script
# =============================================================================
#
#   Smart ERP OpenBSD Chroot Deployment — "docker compose up --build" equivalent
#
#   This script creates isolated chroot "containers" for each service,
#   builds the application, deploys it, and starts everything as rc.d services.
#
#   Usage:
#     doas ./chroot_deploy.sh              # Full build + deploy + start
#     doas ./chroot_deploy.sh build        # Build only (don't start)
#     doas ./chroot_deploy.sh start        # Start all containers
#     doas ./chroot_deploy.sh stop         # Stop all containers
#     doas ./chroot_deploy.sh status       # Health check all containers
#     doas ./chroot_deploy.sh destroy      # Remove all chroots
#     doas ./chroot_deploy.sh rebuild      # Destroy + full rebuild
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Source the chroot library
. "${SCRIPT_DIR}/chroot/lib/chroot_base.sh"

# Source container definitions
. "${SCRIPT_DIR}/chroot/containers/db.sh"
. "${SCRIPT_DIR}/chroot/containers/api.sh"
. "${SCRIPT_DIR}/chroot/containers/web.sh"

# ---- Configuration (override via environment) ----
export SMARTERP_DB_USER="${SMARTERP_DB_USER:-_smarterp_db}"
export SMARTERP_DB_NAME="${SMARTERP_DB_NAME:-smart_erp}"
export SMARTERP_DB_PASS="${SMARTERP_DB_PASS:-smarterp_secure_pass}"
export SMARTERP_JWT_SECRET="${SMARTERP_JWT_SECRET:-$(openssl rand -hex 32)}"

# ---- Commands ----

cmd_build() {
    echo ""
    echo "============================================================"
    echo "  Unix Chroot Container — Building Smart ERP"
    echo "  Equivalent to: docker compose build"
    echo "============================================================"
    echo ""

    require_root
    require_openbsd

    log_step "0/4" "Downloading OpenBSD distribution sets"
    download_sets

    log_step "1/4" "Building Database Container"
    build_db_container

    log_step "2/4" "Building API Container"
    build_api_container

    log_step "3/4" "Building Web Container"
    build_web_container

    log_step "4/4" "Installing rc.d service scripts"
    install_services

    echo ""
    log_info "All containers built successfully."
}

cmd_start() {
    echo ""
    echo "============================================================"
    echo "  Unix Chroot Container — Starting Smart ERP"
    echo "  Equivalent to: docker compose up -d"
    echo "============================================================"
    echo ""

    require_root

    log_step "1/3" "Starting Database Container"
    start_db_container

    log_step "DB-INIT" "Initializing Application Database"
    init_app_database

    log_step "2/3" "Starting API Container"
    start_api_container

    log_step "3/3" "Starting Web Container"
    start_web_container

    echo ""
    echo "============================================================"
    echo "  ${GREEN}DEPLOYMENT COMPLETE!${NC}"
    echo ""
    echo "  Web App:    http://localhost"
    echo "  API:        http://localhost/api"
    echo "  Database:   127.0.0.1:5432"
    echo ""
    echo "  Manage with:"
    echo "    rcctl start|stop smarterp_db"
    echo "    rcctl start|stop smarterp_api"
    echo "    rcctl start|stop smarterp_web"
    echo "============================================================"
}

cmd_stop() {
    echo ""
    log_info "Stopping all Unix Chroot Containers..."

    log_info "Stopping Web Container..."
    stop_web_container

    log_info "Stopping API Container..."
    stop_api_container

    log_info "Stopping Database Container..."
    stop_db_container

    log_info "All containers stopped."
}

cmd_status() {
    echo ""
    echo "============================================================"
    echo "  Unix Chroot Container — Status"
    echo "  Equivalent to: docker compose ps"
    echo "============================================================"
    echo ""

    printf "  %-20s  %-10s  %-10s\n" "CONTAINER" "STATUS" "PORT"
    printf "  %-20s  %-10s  %-10s\n" "─────────────────────" "──────────" "──────────"

    if check_db_container; then
        printf "  %-20s  ${GREEN}%-10s${NC}  %-10s\n" "smarterp-db" "RUNNING" ":5432"
    else
        printf "  %-20s  ${RED}%-10s${NC}  %-10s\n" "smarterp-db" "STOPPED" ":5432"
    fi

    if check_api_container; then
        printf "  %-20s  ${GREEN}%-10s${NC}  %-10s\n" "smarterp-api" "RUNNING" ":3000"
    else
        printf "  %-20s  ${RED}%-10s${NC}  %-10s\n" "smarterp-api" "STOPPED" ":3000"
    fi

    if check_web_container; then
        printf "  %-20s  ${GREEN}%-10s${NC}  %-10s\n" "smarterp-web" "RUNNING" ":80"
    else
        printf "  %-20s  ${RED}%-10s${NC}  %-10s\n" "smarterp-web" "STOPPED" ":80"
    fi

    echo ""
}

cmd_destroy() {
    echo ""
    log_warn "This will PERMANENTLY DELETE all chroot containers and data!"
    echo -n "Are you sure? (yes/no): "
    read confirm
    if [ "${confirm}" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi

    cmd_stop

    log_info "Removing chroot containers..."
    destroy_chroot "smarterp-web"
    destroy_chroot "smarterp-api"
    destroy_chroot "smarterp-db"

    log_info "Removing rc.d scripts..."
    rm -f /etc/rc.d/smarterp_db /etc/rc.d/smarterp_api /etc/rc.d/smarterp_web

    log_info "All containers destroyed."
}

cmd_rebuild() {
    log_info "Rebuilding all containers from scratch..."
    cmd_stop 2>/dev/null || true

    # Force destroy without confirmation
    destroy_chroot "smarterp-web" 2>/dev/null || true
    destroy_chroot "smarterp-api" 2>/dev/null || true
    destroy_chroot "smarterp-db"  2>/dev/null || true

    cmd_build
    cmd_start
}

# ---- Service Installation ----
install_services() {
    log_info "Installing rc.d service scripts..."

    install -o root -g wheel -m 0555 \
        "${SCRIPT_DIR}/chroot/rc.d/smarterp_db" /etc/rc.d/smarterp_db

    install -o root -g wheel -m 0555 \
        "${SCRIPT_DIR}/chroot/rc.d/smarterp_api" /etc/rc.d/smarterp_api

    install -o root -g wheel -m 0555 \
        "${SCRIPT_DIR}/chroot/rc.d/smarterp_web" /etc/rc.d/smarterp_web

    # Enable all services to start on boot
    rcctl enable smarterp_db
    rcctl enable smarterp_api
    rcctl enable smarterp_web

    log_info "Services installed and enabled for automatic start."
}

# ---- Entry Point ----
case "${1:-deploy}" in
    build)   cmd_build ;;
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    status)  cmd_status ;;
    destroy) cmd_destroy ;;
    rebuild) cmd_rebuild ;;
    deploy)  cmd_build; cmd_start ;;
    *)
        echo "Usage: $0 {deploy|build|start|stop|status|destroy|rebuild}"
        echo ""
        echo "Commands:"
        echo "  deploy   Build and start all containers (default)"
        echo "  build    Build all containers without starting"
        echo "  start    Start all containers"
        echo "  stop     Stop all containers"
        echo "  status   Show container status"
        echo "  destroy  Remove all containers and data"
        echo "  rebuild  Destroy and rebuild from scratch"
        exit 1
        ;;
esac
