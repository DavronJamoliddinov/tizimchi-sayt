#!/usr/bin/env bash
# dist/ ni o'z serverga joylash — tizimchi.com (serverdagi Caddy /etc/caddy/sites/*.caddy ni import qiladi).
#
#   npm run build
#   SERVER=root@109.199.101.152 KEY=~/.ssh/tizimchi_vps bash deploy/deploy-vps.sh
#
# Nima qiladi:
#   - media/ (video qo'llanmalar, npm run video) → /var/www/tizimchi-media — saytdan OLDIN (yangi sahifa yo'q videoga ishora
#     qilmasin); media/ bo'lmasa (yangi klon) serverdagisi tegilmaydi;
#   - yuklab/ (Windows va Android ilovasi, npm run yuklab) → /var/www/tizimchi-yuklab — faqat serverda yo'q yoki boshqacha
#     fayllar; so'ng serverda SHA-256 tekshiriladi; eski versiyalar o'chirilmaydi (ulashilgan havolalar ishlayveradi);
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

# Saytdagi har bir /media/ havola media/ da bo'lishi shart: aks holda almashtirishda serverdagi video o'chib ketardi
MEDIA_REFS="$(grep -rohE 'https://tizimchi\.com/media/[^"?&<> ]+' dist | sed 's|^https://tizimchi\.com/media/||' | sort -u || true)"
if [[ -d media ]]; then
  missing="$(while read -r f; do [[ -z "$f" || -f "media/$f" ]] || echo "$f"; done <<< "$MEDIA_REFS")"
  [[ -z "$missing" ]] || { echo "media/ da yo'q (npm run video -- add …):"$'\n'"$missing" >&2; exit 1; }
  echo "▶ videolar → /var/www/tizimchi-media ($(du -sh media | cut -f1))"
  tar -C media -cf - . | "${SSH[@]}" '
    set -e; D=/var/www/tizimchi-media
    rm -rf "$D.new"; mkdir -p "$D.new"; tar -C "$D.new" --no-same-owner -xf -
    find "$D.new" -type d -exec chmod 755 {} +; find "$D.new" -type f -exec chmod 644 {} +
    rm -rf "$D.old"; if [ -d "$D" ]; then mv "$D" "$D.old"; fi; mv "$D.new" "$D"; rm -rf "$D.old"'
elif [[ -n "$MEDIA_REFS" ]]; then
  echo "  ! media/ yo'q — serverdagi videolar ishlatiladi (/var/www/tizimchi-media)"
fi

# Ilovani yuklab olish fayllari: dist/.yuklab — sahifalar ishora qilgan fayllar («platforma fayl sha256 bayt»)
YUKLAB_REDIRS=""
if [[ -s dist/.yuklab ]]; then
  REMOTE_SUMS="$("${SSH[@]}" 'mkdir -p /var/www/tizimchi-yuklab && chmod 755 /var/www/tizimchi-yuklab && cd /var/www/tizimchi-yuklab && (sha256sum -- Tizimchi* 2>/dev/null || true)')"
  need=(); expect=""
  while read -r plat file sum _bytes; do
    [[ -n "$file" ]] || continue
    YUKLAB_REDIRS+=$'\t'"redir /yuklab/$plat /yuklab/$file 302"$'\n'
    expect+="$sum  $file"$'\n'
    grep -qxF "$sum  $file" <<< "$REMOTE_SUMS" && continue # serverda bor va aynan shu
    [[ -f "yuklab/$file" ]] || { echo "yuklab/$file yo'q — avval: npm run yuklab" >&2; exit 1; }
    [[ "$(sha256sum "yuklab/$file" | cut -d' ' -f1)" == "$sum" ]] \
      || { echo "yuklab/$file — SHA-256 sahifadagidan farq qiladi: npm run yuklab, so'ng npm run build" >&2; exit 1; }
    need+=("$file")
  done < dist/.yuklab
  if (( ${#need[@]} )); then
    echo "▶ yuklab olish → /var/www/tizimchi-yuklab: ${need[*]} ($(cd yuklab && du -ch -- "${need[@]}" | tail -1 | cut -f1))"
    # Avval .incoming/ ga, so'ng bir zumda o'z joyiga (yarim yuklangan fayl hech qachon ko'rinmaydi)
    tar -C yuklab -cf - -- "${need[@]}" | "${SSH[@]}" '
      set -e; D=/var/www/tizimchi-yuklab; I="$D/.incoming"
      rm -rf "$I"; mkdir -p "$I"; tar -C "$I" --no-same-owner -xf -
      chmod 644 "$I"/*; mv -f "$I"/* "$D"/; rmdir "$I"'
  fi
  printf '%s' "$expect" | "${SSH[@]}" 'cd /var/www/tizimchi-yuklab && sha256sum --quiet -c -' \
    || { echo "! serverdagi fayl buzilgan (SHA-256 mos emas) — qayta urinib ko'ring" >&2; exit 1; }
  echo "  ✓ yuklab olish fayllari serverda, SHA-256 mos"
fi
# Faqat o'z qatoridagi to'ldirgich (sharhlarga tegilmaydi); qo'shtirnoq: bash 5.2+ da almashtirishdagi & maxsus emas
CADDY="${CADDY//$'\n'__YUKLAB_REDIRS__$'\n'/$'\n'"$YUKLAB_REDIRS"}"
if grep -v '^[[:space:]]*#' <<< "$CADDY" | grep -qE '__[A-Z_]+__'; then
  echo "! Caddy shablonida to'ldirilmagan joy qoldi — deploy/Caddyfile ni tekshiring" >&2; exit 1
fi

echo "▶ fayllar → /var/www/tizimchi-sayt"
tar -C dist --exclude=./_headers --exclude=./_redirects --exclude=./.csp --exclude=./.yuklab -czf - . | "${SSH[@]}" '
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
# /etc/caddy/sites ni Caddy konteyneri to'g'ridan-to'g'ri ulagan (bind mount): papkaning o'zini HECH QACHON almashtirmang
# (rm + mv) — konteyner o'chirilgan eski papkani ko'rib qoladi va qayta yuklashda BARCHA saytlar tushadi. Shuning uchun
# zaxira — fayllar nusxasi, yozish — shu papka ichida vaqtinchalik fayl + mv, tiklash — fayllarni joyiga qaytarish.
printf '%s\n' "$CADDY" | "${SSH[@]}" '
  set -e; S=/etc/caddy/sites; B=$(mktemp -d); mkdir -p "$S"
  cp -a "$S"/. "$B"/
  cat > "$S/.tizimchi.com.caddy.tmp"; mv -f "$S/.tizimchi.com.caddy.tmp" "$S/tizimchi.com.caddy"
  # Ilova avval shu domenda edi (dokon_app: tizimchi.caddy) — endi app.tizimchi.com da
  if [ -f "$S/tizimchi.caddy" ] && grep -q "^tizimchi.com {" "$S/tizimchi.caddy"; then rm -f "$S/tizimchi.caddy"; fi
  if ! /usr/local/sbin/caddy-sites-reload; then
    echo "! Caddy sozlamasi xato — avvalgi fayllar joyiga qaytarildi (ishlab turgan sozlama o'\''zgarmagan)" >&2
    find "$S" -maxdepth 1 -type f -delete; cp -a "$B"/. "$S"/; rm -rf "$B"
    /usr/local/sbin/caddy-sites-reload || true; exit 1
  fi
  rm -rf "$B"
  if grep -q "redir https://app.tizimchi.com{uri} 302" /etc/caddy/sites/tizimchi.com.caddy; then
    systemctl disable --now tizimchi-app-switch.timer >/dev/null 2>&1 || true
  else
    systemctl enable --now tizimchi-app-switch.timer >/dev/null
  fi'

echo "✓ https://tizimchi.com (ilova: $TARGET)"
