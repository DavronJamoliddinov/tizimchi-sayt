#!/usr/bin/env bash
# dist/ ni o'z serverga joylash — tizimchi.com (serverdagi Caddy /etc/caddy/sites/*.caddy ni import qiladi).
#
#   npm run build
#   SERVER=root@109.199.101.152 KEY=~/.ssh/tizimchi_vps bash deploy/deploy-vps.sh
#
# Nima qiladi:
#   - dist/ → /var/www/tizimchi-sayt: avval yangi papkaga yuklanadi, so'ng bir zumda almashtiriladi (yarim yuklangan sayt
#     ko'rinmaydi, eski fayllar qolmaydi);
#   - Caddy sayt fayli: CSP — dist/.csp dan (build bilan doim bir xil), /ilova/* → ilovaning amaldagi joyi
#     (app.tizimchi.com ishlayotgan bo'lsa — o'sha, aks holda APP_OLD);
#   - tizimchi-app-switch taymeri: app.tizimchi.com ishga tushishi bilan /ilova o'zi unga o'tadi;
#   - Caddy uzilishsiz qayta yuklanadi (caddy-sites-reload — Tizimchi ilovasining deploy/server-setup.sh o'rnatgan).
set -euo pipefail
cd "$(dirname "$0")/.."
SERVER="${SERVER:?SERVER=root@<server IP> bering}"
KEY="${KEY:-}"
APP_NEW="${APP_NEW:-https://app.tizimchi.com}"
APP_OLD="${APP_OLD:-https://dukonuz-app.netlify.app}"

[[ -f dist/index.html && -f dist/.csp ]] || { echo "dist/ yo'q — avval: npm run build" >&2; exit 1; }
grep -q '<link rel="canonical" href="https://tizimchi.com/"' dist/index.html \
  || { echo "dist/ production build emas (canonical tizimchi.com emas) — npm run build" >&2; exit 1; }
SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
[[ -n "$KEY" ]] && SSH+=(-i "${KEY/#\~/$HOME}" -o IdentitiesOnly=yes)
SSH+=("$SERVER")

if curl -fsS --max-time 10 "$APP_NEW/config.js" 2>/dev/null | grep -q APP_VERSION; then TARGET="$APP_NEW"; else TARGET="$APP_OLD"; fi
CSP="$(tr -d '\r\n' < dist/.csp)"
[[ "$CSP" != *"|"* && "$CSP" != *"&"* ]] || { echo "dist/.csp da kutilmagan belgi" >&2; exit 1; }
CADDY="$(sed -e "s|__CSP__|$CSP|" -e "s|__APP_TARGET__|$TARGET|" deploy/Caddyfile)"

echo "▶ fayllar → /var/www/tizimchi-sayt"
tar -C dist --exclude=./_headers --exclude=./_redirects --exclude=./.csp -czf - . | "${SSH[@]}" '
  set -e; D=/var/www/tizimchi-sayt
  rm -rf "$D.new"; mkdir -p "$D.new"; tar -C "$D.new" --no-same-owner -xzf -
  find "$D.new" -type d -exec chmod 755 {} +; find "$D.new" -type f -exec chmod 644 {} +
  rm -rf "$D.old"; if [ -d "$D" ]; then mv "$D" "$D.old"; fi; mv "$D.new" "$D"; rm -rf "$D.old"'

echo "▶ tizimchi-app-switch (app.tizimchi.com ga o'z-o'zidan o'tish)"
tar -C deploy/server -czf - . | "${SSH[@]}" '
  set -e; T=$(mktemp -d); tar -C "$T" -xzf -; sed -i "s/\r$//" "$T"/*
  install -m 0755 "$T/tizimchi-app-switch" /usr/local/sbin/tizimchi-app-switch
  install -m 0644 "$T/tizimchi-app-switch.service" "$T/tizimchi-app-switch.timer" /etc/systemd/system/
  rm -rf "$T"; systemctl daemon-reload'

echo "▶ Caddy: tizimchi.com (/ilova → $TARGET)"
printf '%s\n' "$CADDY" | "${SSH[@]}" '
  set -e; mkdir -p /etc/caddy/sites
  cp -a /etc/caddy/sites /tmp/caddy-sites.bak.$$ 2>/dev/null || true
  cat > /etc/caddy/sites/tizimchi.com.caddy
  # Ilova avval shu domenda edi (dokon_app: /etc/caddy/sites/tizimchi.caddy) — endi app.tizimchi.com da
  if [ -f /etc/caddy/sites/tizimchi.caddy ] && grep -q "^tizimchi.com {" /etc/caddy/sites/tizimchi.caddy; then rm -f /etc/caddy/sites/tizimchi.caddy; fi
  if ! /usr/local/sbin/caddy-sites-reload; then
    echo "! Caddy sozlamasi xato — avvalgi holat tiklandi" >&2
    rm -rf /etc/caddy/sites && mv /tmp/caddy-sites.bak.$$ /etc/caddy/sites && /usr/local/sbin/caddy-sites-reload; exit 1
  fi
  rm -rf /tmp/caddy-sites.bak.$$
  if grep -q "redir https://app.tizimchi.com{uri} 302" /etc/caddy/sites/tizimchi.com.caddy; then
    systemctl disable --now tizimchi-app-switch.timer >/dev/null 2>&1 || true
  else
    systemctl enable --now tizimchi-app-switch.timer >/dev/null
  fi'

echo "✓ https://tizimchi.com (ilova: $TARGET)"
