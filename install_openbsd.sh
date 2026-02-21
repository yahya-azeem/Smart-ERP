#!/bin/sh
set -e

# Smart ERP OpenBSD Installer

echo "Creating _smarterp user..."
useradd -d /var/www/smart-erp -s /sbin/nologin -c "Smart ERP Daemon" _smarterp || true

echo "Creating directories..."
install -d -o _smarterp -g _smarterp /var/www/smart-erp
install -d -o _smarterp -g _smarterp /var/www/smart-erp/htdocs

echo "Installing binary..."
# Assumes 'target/release/api' is available
install -o root -g bin -m 755 target/release/api /usr/local/bin/smart-erp

echo "Installing frontend..."
# Assumes 'web-client/dist' is available
cp -R web-client/dist/* /var/www/smart-erp/htdocs/
chown -R _smarterp:_smarterp /var/www/smart-erp/htdocs

echo "Installation complete."
echo "Use rc.d script to start."
