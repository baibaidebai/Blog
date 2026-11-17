#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="deploy"
DEPLOY_PATH="/var/www/bibaidebai"
PUBLIC_KEY="${1:-}"

if [[ -z "$PUBLIC_KEY" ]]; then
  echo "Usage: sudo bash ubuntu-setup.sh 'ssh-ed25519 AAAA... github-actions-bibaidebai'"
  exit 1
fi

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

$SUDO apt update
$SUDO apt install -y nginx rsync

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  $SUDO useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi

$SUDO install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
$SUDO touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
$SUDO grep -qxF "$PUBLIC_KEY" "/home/$DEPLOY_USER/.ssh/authorized_keys" || $SUDO sh -c "printf '%s\\n' '$PUBLIC_KEY' >> '/home/$DEPLOY_USER/.ssh/authorized_keys'"
$SUDO chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
$SUDO chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

$SUDO install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_PATH"

$SUDO tee /etc/nginx/sites-available/bibaidebai >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name 101.132.178.161;

    root /var/www/bibaidebai;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|glb|gltf|stl)$ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=604800, immutable";
    }
}
NGINX

$SUDO ln -sfn /etc/nginx/sites-available/bibaidebai /etc/nginx/sites-enabled/bibaidebai
$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO nginx -t
$SUDO systemctl enable --now nginx
$SUDO systemctl reload nginx

echo "Server setup complete. Website root: $DEPLOY_PATH"
