#!/usr/bin/env bash
# One-shot Ubuntu deploy: Django (Gunicorn) + Vite frontend + Nginx
# Domain: yourbrand.intvice.com
#
# On the VPS (as root), from the Django backend folder:
#   sudo bash deploy.sh
#
# Optional:
#   DOMAIN=yourbrand.intvice.com EMAIL=you@example.com sudo -E bash deploy.sh

set -euo pipefail

DOMAIN="${DOMAIN:-yourbrand.intvice.com}"
APP_NAME="${APP_NAME:-yourbrand}"
APP_USER="${APP_USER:-www-data}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
WORKERS="${WORKERS:-$(( $(nproc) * 2 + 1 ))}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"
FRONTEND_DIR="${APP_DIR}/frontend"
VENV_DIR="${APP_DIR}/.venv"
ENV_FILE="${APP_DIR}/.env"
SOCKET_PATH="/run/${APP_NAME}/${APP_NAME}.sock"
SERVICE_NAME="${APP_NAME}"
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"

if [[ ! -f "${APP_DIR}/manage.py" ]]; then
  echo "manage.py not found in ${APP_DIR}"
  echo "Copy the backend folder to the VPS and run this script from inside it."
  exit 1
fi

echo "==> Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
  python3 python3-venv python3-pip python3-dev \
  build-essential libsqlite3-dev \
  nginx curl ca-certificates gnupg \
  certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE 'v(1[89]|2[0-9])'; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Creating Python venv + installing deps"
python3 -m venv "${VENV_DIR}"
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"
pip install --upgrade pip wheel
pip install -r "${APP_DIR}/requirements.txt"

if [[ ! -f "${ENV_FILE}" ]]; then
  SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')"
  cat > "${ENV_FILE}" <<EOF
DJANGO_SECRET_KEY=${SECRET}
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},127.0.0.1,localhost
DJANGO_CSRF_TRUSTED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN}
ADMIN_PIN=1234
LEAD_VALUE_RUPEES=50
EOF
  echo "==> Wrote ${ENV_FILE}"
else
  echo "==> Using existing ${ENV_FILE}"
fi

chmod 640 "${ENV_FILE}"
chown root:"${APP_USER}" "${ENV_FILE}"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

mkdir -p "${APP_DIR}/media" "${APP_DIR}/staticfiles" "${APP_DIR}/logs"
# App user needs read on code and write on db/media/logs
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
chmod 640 "${ENV_FILE}"
chown root:"${APP_USER}" "${ENV_FILE}"

echo "==> Django migrate + collectstatic"
cd "${APP_DIR}"
python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
  echo "Frontend not found at ${FRONTEND_DIR}"
  exit 1
fi

echo "==> Building frontend"
cd "${FRONTEND_DIR}"
npm ci || npm install
VITE_API_URL=/api npm run build
chown -R "${APP_USER}:${APP_USER}" "${FRONTEND_DIR}/dist"

echo "==> Writing Gunicorn systemd unit"
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Gunicorn for ${APP_NAME} (${DOMAIN})
After=network.target

[Service]
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
RuntimeDirectory=${APP_NAME}
RuntimeDirectoryMode=0755
ExecStart=${VENV_DIR}/bin/gunicorn \\
  --workers ${WORKERS} \\
  --bind unix:${SOCKET_PATH} \\
  --access-logfile ${APP_DIR}/logs/gunicorn-access.log \\
  --error-logfile ${APP_DIR}/logs/gunicorn-error.log \\
  --timeout 120 \\
  config.wsgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "==> Writing Nginx site for ${DOMAIN}"
cat > "${NGINX_SITE}" <<EOF
upstream ${APP_NAME}_app {
    server unix:${SOCKET_PATH} fail_timeout=0;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 25M;

    root ${FRONTEND_DIR}/dist;
    index index.html;

    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log  /var/log/nginx/${APP_NAME}.error.log;

    location /api/ {
        proxy_pass http://${APP_NAME}_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location /admin/ {
        proxy_pass http://${APP_NAME}_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias ${APP_DIR}/staticfiles/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /media/ {
        alias ${APP_DIR}/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sfn "${NGINX_SITE}" "/etc/nginx/sites-enabled/${APP_NAME}"
rm -f /etc/nginx/sites-enabled/default

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  echo "==> Opening firewall for Nginx"
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
fi

echo "==> Starting services"
systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"
# Wait briefly for socket
sleep 2
nginx -t
systemctl reload nginx

echo "==> Attempting Let's Encrypt SSL (DNS A record for ${DOMAIN} must point here)"
if certbot --nginx -d "${DOMAIN}" \
    --non-interactive --agree-tos -m "${EMAIL}" --redirect; then
  echo "SSL enabled: https://${DOMAIN}"
else
  echo "WARN: Certbot failed (DNS not ready yet?). Site is on http://${DOMAIN}"
  echo "Later run:"
  echo "  certbot --nginx -d ${DOMAIN} -m ${EMAIL} --agree-tos --non-interactive --redirect"
fi

systemctl restart "${SERVICE_NAME}"
systemctl reload nginx

echo
echo "============================================"
echo " Deploy complete"
echo " URL:     https://${DOMAIN}  (or http:// if SSL pending)"
echo " API:     /api/"
echo " Django:  /admin/"
echo " App:     ${APP_DIR}"
echo " Env:     ${ENV_FILE}"
echo " Logs:    ${APP_DIR}/logs/"
echo " Status:  systemctl status ${SERVICE_NAME}"
echo "============================================"
echo "1) Point ${DOMAIN} A record to this VPS IP"
echo "2) Change ADMIN_PIN in ${ENV_FILE}, then: systemctl restart ${SERVICE_NAME}"
