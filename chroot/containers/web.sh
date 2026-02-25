#!/bin/ksh
# =============================================================================
# Unix Chroot Container — Nginx Web Container
# =============================================================================
# Creates an isolated chroot running Nginx + the React frontend.
# Equivalent to the 'web' service in docker-compose.yml
#
# Docker equivalent:
#   build: ./web-client (Dockerfile.frontend)
#   ports: 8080:80
#   depends_on: api
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "${SCRIPT_DIR}/../lib/chroot_base.sh"

CONTAINER_NAME="smarterp-web"
WEB_USER="_smarterp_web"
WEB_PORT=80
API_PORT=3000

# Source directory (project root)
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

build_web_container() {
    log_step "WEB" "Building Nginx web container: ${CONTAINER_NAME}"

    # --- FROM openbsd:latest ---
    create_chroot "${CONTAINER_NAME}"

    # --- RUN pkg_add nginx node ---
    log_info "Installing Nginx and Node.js..."
    chroot_pkg_add "${CONTAINER_NAME}" "nginx" "node" "npm"

    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"

    # --- Build frontend inside chroot ---
    log_info "Copying frontend source into chroot for building..."
    install -d "${chroot_dir}/build"
    cp -R "${PROJECT_ROOT}/web-client/" "${chroot_dir}/build/web-client/"

    log_info "Building React frontend inside chroot..."
    chroot "${chroot_dir}" /bin/ksh -c "
        export HOME=/tmp
        cd /build/web-client
        npm install --prefer-offline 2>/dev/null || npm install
        npm run build
    "

    # --- Install static files to htdocs ---
    log_info "Installing frontend assets..."
    install -d "${chroot_dir}/var/www/htdocs/smarterp"
    cp -R "${chroot_dir}/build/web-client/dist/"* "${chroot_dir}/var/www/htdocs/smarterp/"

    # --- Create non-root user ---
    chroot_adduser "${CONTAINER_NAME}" "${WEB_USER}" "/var/www"

    # Set ownership
    chroot "${chroot_dir}" chown -R "${WEB_USER}" /var/www/htdocs/smarterp

    # --- Configure Nginx ---
    log_info "Configuring Nginx..."
    install -d "${chroot_dir}/etc/nginx"
    install -d "${chroot_dir}/var/log/nginx"
    install -d "${chroot_dir}/run/nginx"
    install -d -m 1777 "${chroot_dir}/var/www/tmp"

    cat > "${chroot_dir}/etc/nginx/nginx.conf" <<'NGINXCONF'
worker_processes  1;
error_log  /var/log/nginx/error.log;
pid        /run/nginx/nginx.pid;

events {
    worker_connections  512;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout  65;

    # CVE-08: Rate limiting for login endpoint
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;

    access_log  /var/log/nginx/access.log;

    server {
        listen       80;
        server_name  localhost;

        # CVE-10: Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

        server_tokens off;

        root /var/www/htdocs/smarterp;
        index index.html;

        # Serve static frontend
        location / {
            try_files $uri $uri/ /index.html;
        }

        # CVE-08: Rate-limited login endpoint
        location /api/auth/login {
            limit_req zone=login burst=10 nodelay;
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Reverse proxy to API container (via loopback)
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # CVE-07: Body size limit
            client_max_body_size 2m;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /var/www/htdocs;
        }
    }
}
NGINXCONF

    # Copy mime.types
    if [ ! -f "${chroot_dir}/etc/nginx/mime.types" ]; then
        chroot "${chroot_dir}" /bin/ksh -c "
            test -f /etc/nginx/mime.types || cp /usr/local/share/examples/nginx/mime.types /etc/nginx/mime.types 2>/dev/null || true
        "
    fi

    # --- Cleanup build artifacts ---
    log_info "Cleaning up build artifacts..."
    rm -rf "${chroot_dir}/build"

    log_info "Web container ${CONTAINER_NAME} built successfully."
}

# Start Nginx inside the chroot
start_web_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    log_info "Starting Nginx in chroot ${CONTAINER_NAME}..."

    _ensure_devfs "${chroot_dir}"

    chroot "${chroot_dir}" /usr/local/sbin/nginx -c /etc/nginx/nginx.conf

    wait_for_port "127.0.0.1" "${WEB_PORT}" 10
}

# Stop Nginx
stop_web_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    log_info "Stopping Nginx in chroot ${CONTAINER_NAME}..."
    chroot "${chroot_dir}" /usr/local/sbin/nginx -s stop 2>/dev/null || true
}

# Reload Nginx config
reload_web_container() {
    local chroot_dir="$(chroot_path ${CONTAINER_NAME})"
    chroot "${chroot_dir}" /usr/local/sbin/nginx -s reload
}

# Health check
check_web_container() {
    echo "" | nc -w 1 127.0.0.1 "${WEB_PORT}" >/dev/null 2>&1
}
