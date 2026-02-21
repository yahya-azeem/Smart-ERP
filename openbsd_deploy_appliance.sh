#!/bin/ksh
set -e

# =============================================================================
# Smart ERP - OpenBSD Appliance Deployer
# =============================================================================
# This script deploys the entire stack (DB, Backend, Frontend) as a secured,
# integrated service appliance on OpenBSD.
#
# Usage: doas ./openbsd_deploy_appliance.sh
# =============================================================================

APP_USER="_smarterp"
APP_DIR="/var/www/smart-erp"
DB_USER="_smarterp_db"
DB_NAME="smart_erp"
API_PORT=3000

echo ">>> [1/7] Installing System Dependencies..."
pkg_add rust node postgresql-server nginx

echo ">>> [2/7] Creating Service User..."
if ! id $APP_USER > /dev/null 2>&1; then
    useradd -d $APP_DIR -s /sbin/nologin -c "Smart ERP Daemon" $APP_USER
fi

echo ">>> [3/7] Building Application..."
# Build Backend
echo "    - Building Rust Backend..."
cd backend
# OpenBSD requires specific pg_config if not in path
export PQ_LIB_DIR="/usr/local/lib"
cargo build --release --bin api
cd ..

# Build Frontend
echo "    - Building React Frontend..."
cd web-client
npm install
npm run build
cd ..

echo ">>> [4/7] Installing Binaries & Assets..."
install -d -o $APP_USER -g $APP_USER $APP_DIR
install -d -o $APP_USER -g $APP_USER $APP_DIR/bin
install -d -o $APP_USER -g $APP_USER $APP_DIR/htdocs
install -d -o $APP_USER -g $APP_USER $APP_DIR/logs

# Install Binary
install -o root -g bin -m 755 backend/target/release/api $APP_DIR/bin/smart-erp-api

# Install Frontend
cp -R web-client/dist/* $APP_DIR/htdocs/
chown -R $APP_USER:$APP_USER $APP_DIR/htdocs

echo ">>> [5/7] Configuring Database..."
# Enable and start postgres
rcctl enable postgresql
rcctl start postgresql

# Wait for DB to start
sleep 5

# Setup DB (Idempotent)
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "    - Creating User and DB..."
    psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD 'password';" || true
    psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    echo "    - Applying Migrations..."
    cat backend/migrations/*.sql | psql -U $DB_USER -d $DB_NAME
else
    echo "    - Database exists. Skipping init."
fi

echo ">>> [6/7] Configuring Nginx (Reverse Proxy)..."
cat > /etc/nginx/nginx.conf <<EOF
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;
        root         $APP_DIR/htdocs;
        index        index.html;

        location / {
            try_files \$uri \$uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:$API_PORT;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}
EOF

rcctl enable nginx
rcctl reload nginx || rcctl start nginx

echo ">>> [7/7] Installing RC.D Script..."
cat > /etc/rc.d/smarterp <<EOF
#!/bin/ksh

daemon="$APP_DIR/bin/smart-erp-api"
daemon_user="$APP_USER"

. /etc/rc.d/rc.subr

pexp="$APP_DIR/bin/smart-erp-api"
rc_bg=YES
rc_reload=NO

rc_start() {
    export DATABASE_URL="postgres://$DB_USER:password@127.0.0.1:5432/$DB_NAME"
    export JWT_SECRET="change_this_secret_in_prod"
    export RUST_LOG="info"
    export APP_HOME="$APP_DIR"
    
    # Run the daemon
    \${rcexec} "\${daemon}"
}

rc_cmd \$1
EOF

chmod 0555 /etc/rc.d/smarterp
rcctl enable smarterp
rcctl restart smarterp

echo "============================================================"
echo "DEPLOYMENT COMPLETE!"
echo "App is running at: http://localhost"
echo "Backend API at:    http://localhost/api"
echo "============================================================"
