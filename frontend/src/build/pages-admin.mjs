// @ts-check
/* /admin/ — sayt boshqaruvi: video qo'llanmalar, demo so'rovlari, Telegram bildirishnomalari.
   Bu yerda faqat sahifa qobig'i (SEO'siz, indekslanmaydi); interfeysni frontend/src/client/admin.js chizadi.
   Kirish — backend'dagi Supabase Auth hisobi; huquq — backend/schema.sql → site_private.admins ro'yxati. */
import { esc } from "../client/util.js";

/** admin.js ishlatadigan ikonkalar (build shu ro'yxat bo'yicha admin-data'ga qo'shadi) */
export const ADMIN_ICONS = ["lock", "log-out", "external-link", "plus", "refresh-cw", "pencil", "trash-2", "eye", "eye-off", "arrow-up", "arrow-down",
  "film", "x", "phone", "square-pen", "download", "bell", "user", "send", "check", "circle-check", "circle-alert", "info", "chevron-down", "inbox",
  "star", "copy", "settings", "database-backup", "key-round", "circle-play", "mail"];

/**
 * @param {import("./kit.mjs").Ctx} c
 * @param {{ css: string[], js: string, modules: string[], data: object }} b
 */
export function renderAdmin(c, b) {
  return `<!doctype html>
<html lang="uz" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sayt boshqaruvi — Tizimchi</title>
<meta name="description" content="Tizimchi sayti boshqaruvi: video qo‘llanmalar, demo so‘rovlari va Telegram bildirishnomalari. Faqat sayt adminlari uchun.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${esc(c.url("/admin/"))}">
<meta name="theme-color" content="#FCFCFB">
<meta name="color-scheme" content="light">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="${c.asset("img/favicon.svg")}" type="image/svg+xml">
<link rel="icon" href="${c.asset("img/favicon-32.png")}" type="image/png" sizes="32x32">
<link rel="preload" href="${c.asset("fonts/inter-latin.woff2")}" as="font" type="font/woff2" crossorigin>
${b.css.map((h) => `<link rel="stylesheet" href="${h}">`).join("\n")}
${b.modules.map((m) => `<link rel="modulepreload" href="${m}">`).join("\n")}
<script type="module" src="${b.js}"></script>
</head>
<body class="adm">
<a class="skip" href="#main">Asosiy mazmunga o‘tish</a>
${c.cfg.dev ? `<div class="devbar" role="note">${c.icon("info")}<span><b>Lokal ko‘rinish.</b> Sayt boshqaruvi ${c.cfg.supabaseUrl ? "haqiqiy backend’ga ulangan — o‘zgarishlar saytda ko‘rinadi." : "backend’siz ochilgan."}</span></div>` : ""}
<header class="adm-hdr">
  <div class="wrap adm-hdr-in">
    <a class="brand" href="/" aria-label="Tizimchi — saytning bosh sahifasi"><img src="${c.asset("img/logo.svg")}" alt="" width="30" height="30"><span>Tizimchi</span></a>
    <span class="adm-tag">Admin</span>
    <div class="adm-hdr-end">
      <a class="btn btn-ghost btn-sm adm-site-link" href="/" target="_blank" rel="noopener">${c.icon("external-link")}<span>Saytni ochish</span><span class="sr-only"> (yangi oynada ochiladi)</span></a>
      <div class="adm-user" data-user hidden>
        <span class="adm-avatar" aria-hidden="true" data-user-initial></span>
        <span class="adm-email" data-user-email></span>
        <button class="btn btn-secondary btn-sm adm-logout" type="button" data-act="logout" aria-label="Chiqish">${c.icon("log-out")}<span class="adm-hide-sm">Chiqish</span></button>
      </div>
    </div>
  </div>
</header>
<main id="main" class="adm-main" tabindex="-1">
  <div class="wrap">
    <div class="adm-head">
      <h1 class="adm-h1">Sayt boshqaruvi</h1>
      <p class="adm-lead">Video qo‘llanmalar, demo so‘rovlari va bildirishnomalar</p>
    </div>
    <div data-admin-root>
      <div class="adm-loading" role="status"><span class="spinner" aria-hidden="true"></span>Yuklanmoqda…</div>
      <noscript><p class="dform-alert">Sayt boshqaruvi ishlashi uchun brauzeringizda JavaScript yoqilgan bo‘lishi kerak.</p></noscript>
    </div>
  </div>
</main>
<div class="adm-toasts" role="status" aria-live="polite" data-toasts></div>
<dialog class="adm-dialog" data-dialog aria-labelledby="dlg-title"></dialog>
<dialog class="adm-dialog adm-dialog--sm" data-confirm aria-labelledby="cfm-title"></dialog>
<script type="application/json" id="admin-data">${JSON.stringify(b.data).replace(/</g, "\\u003c")}</script>
</body>
</html>
`;
}
