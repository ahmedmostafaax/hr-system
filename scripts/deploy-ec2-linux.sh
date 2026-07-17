#!/bin/bash
# ERB — Linux EC2 deploy (Ubuntu): Node + PM2 + Nginx reverse proxy
# Usage: sudo bash /opt/ERB/scripts/deploy-ec2-linux.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ERB}"
FRONTEND_PORT=3000
BACKEND_PORT=5000
NGINX_SITE="/etc/nginx/sites-available/erb"
DEPLOY_USER="${SUDO_USER:-root}"
DEPLOY_HOME=$(eval echo "~$DEPLOY_USER")

echo "=== ERB Deploy (Linux + PM2 + Nginx) ==="

# --- Node.js 22 ---
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node $(node -v) | npm $(npm -v)"

# --- Nginx ---
if ! command -v nginx &>/dev/null; then
  apt-get update -y
  apt-get install -y nginx
fi

# --- PM2 (global) ---
npm install -g pm2
echo "PM2 $(pm2 -v)"

# --- Firewall (optional ufw) ---
if command -v ufw &>/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

cd "$APP_ROOT"

# --- Backend ---
echo ">>> Backend (PM2: erb-api)"
cd "$APP_ROOT/erb"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "WARNING: Set JWT_KEY and DATABASE_URL in $APP_ROOT/erb/.env"
fi
npm ci 2>/dev/null || npm install
npm run build

# --- Frontend ---
echo ">>> Frontend (PM2: erb-web)"
cd "$APP_ROOT/newerp"
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME=ERB Payroll System
NEXT_PUBLIC_DEFAULT_LOCALE=ar
EOF
npm ci 2>/dev/null || npm install
npm run build

# --- Start both apps with PM2 ---
echo ">>> PM2 start"
cd "$APP_ROOT"
pm2 delete erb-api erb-web 2>/dev/null || true
pm2 start "$APP_ROOT/scripts/ecosystem.config.cjs"
pm2 save

# Auto-start after server reboot
echo ">>> PM2 startup (survives reboot)"
STARTUP_LINE=$(pm2 startup systemd -u "$DEPLOY_USER" --hp "$DEPLOY_HOME" | tail -1)
if [[ -n "$STARTUP_LINE" ]]; then
  eval "$STARTUP_LINE" || true
fi
pm2 save

# --- Nginx reverse proxy ---
echo ">>> Nginx"
cp "$APP_ROOT/scripts/nginx-erb.conf" "$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/erb
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl reload nginx

PUBLIC_IP=$(curl -sf --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "=== Deploy complete ==="
echo "PM2:    pm2 status"
echo "Logs:   pm2 logs"
echo "App:    http://${PUBLIC_IP}/ar/login"
echo "API:    http://${PUBLIC_IP}/api/v1"
echo "Health: http://${PUBLIC_IP}/health"
echo ""
pm2 status
