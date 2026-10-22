// @ts-check
/* Sahifa qobig'i: <head> (SEO, Open Graph, canonical), sarlavha (navigatsiya, mobil menyu), footer. */
import { esc, tx, typo } from "../client/util.js";
import { at, jsonLd, srNew } from "./kit.mjs";
import { INDUSTRIES } from "../../content/taxonomy.mjs";

export const NAV = [
  { key: "home", label: "Bosh sahifa", href: "/" },
  { key: "imkoniyatlar", label: "Imkoniyatlar", href: "/imkoniyatlar/" },
  { key: "biznes", label: "Biznes turlari", href: "/biznes-turlari/" },
  { key: "video", label: "Video qo'llanmalar", href: "/video-qollanmalar/" },
  { key: "faq", label: "FAQ", href: "/#faq" },
  { key: "aloqa", label: "Aloqa", href: "/aloqa/" },
];

/**
 * @typedef {{
 *   path: string, nav?: string, title: string, fullTitle?: string, description: string, body: string,
 *   og?: string, ld?: object[], noindex?: boolean, bodyClass?: string, preload?: string[],
 * }} PageSpec
 */

/** @param {import("./kit.mjs").Ctx} c @param {PageSpec} p @param {{ css: string, js: string, modules: string[], data: object }} build */
export function renderPage(c, p, build) {
  const title = typo(p.fullTitle || `${p.title} — Tizimchi`);
  const canonical = c.url(p.path);
  const ogImg = p.og && c.asset(p.og);
  const ogUrl = ogImg ? c.url(ogImg) : "";
  return `<!doctype html>
<html lang="uz" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${at(p.description)}">
<link rel="canonical" href="${esc(canonical)}">
${p.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#FCFCFB">
<meta name="color-scheme" content="light">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Tizimchi">
<meta property="og:locale" content="uz_UZ">
<meta property="og:title" content="${at(p.fullTitle || p.title)}">
<meta property="og:description" content="${at(p.description)}">
<meta property="og:url" content="${esc(canonical)}">
${ogUrl ? `<meta property="og:image" content="${esc(ogUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${at(p.fullTitle || p.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(ogUrl)}">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="${at(p.fullTitle || p.title)}">
<meta name="twitter:description" content="${at(p.description)}">
<link rel="icon" href="${c.asset("img/favicon.svg")}" type="image/svg+xml">
<link rel="icon" href="${c.asset("img/favicon-32.png")}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${c.asset("img/apple-touch-icon.png")}">
<link rel="preload" href="${c.asset("fonts/inter-latin.woff2")}" as="font" type="font/woff2" crossorigin>
${(p.preload || []).join("\n")}
<link rel="stylesheet" href="${build.css}">
${build.modules.map((m) => `<link rel="modulepreload" href="${m}">`).join("\n")}
<script type="module" src="${build.js}"></script>
${jsonLd(p.ld || [])}
</head>
<body class="${esc(p.bodyClass || "")}">
<a class="skip" href="#main">Asosiy mazmunga o‘tish</a>
${c.cfg.dev ? `<div class="devbar" role="note">${c.icon("info")}<span><b>Lokal ko‘rinish.</b> Demo forma sinov rejimida — so‘rovlar serverga yuborilmaydi.${c.tutorials.some((t) => t.slug.startsWith("namuna-")) ? " Video qo‘llanmalar — namunaviy (saytga chiqmaydi)." : ""}</span></div>` : ""}
${header(c, p.nav || "")}
<main id="main" tabindex="-1">
${p.body}
</main>
${footer(c)}
<script type="application/json" id="site-data">${JSON.stringify(build.data).replace(/</g, "\\u003c")}</script>
</body>
</html>
`;
}

/** @param {import("./kit.mjs").Ctx} c @param {string} active */
function header(c, active) {
  const link = (/** @type {typeof NAV[number]} */ n, cls = "") =>
    `<a class="${cls}" href="${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${tx(n.label)}</a>`;
  return `<header class="hdr" data-header>
  <div class="hdr-in">
    <a class="brand" href="/" aria-label="Tizimchi — bosh sahifa"><img src="${c.asset("img/logo.svg")}" alt="" width="30" height="30"><span>Tizimchi</span></a>
    <nav class="nav" aria-label="Asosiy">${NAV.map((n) => link(n, "nav-link")).join("")}</nav>
    <div class="hdr-actions">
      <a class="hdr-login" href="${esc(c.appUrl())}">${c.icon("log-in")}<span>Tizimga kirish</span></a>
      <a class="btn btn-primary btn-sm hdr-cta" href="/aloqa/#demo" data-track="hero_cta_clicked" data-cta="header">Demo so‘rash</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" data-menu-btn>
        <span class="sr-only">Menyu</span><span class="menu-ic" aria-hidden="true"><i></i><i></i></span>
      </button>
    </div>
  </div>
  <div class="mnav" id="mnav" hidden data-menu>
    <nav class="mnav-in" aria-label="Mobil menyu">
      <ul class="mnav-list">${NAV.map((n) => `<li>${link(n, "mnav-link")}</li>`).join("")}</ul>
      <div class="mnav-actions">
        <a class="btn btn-primary btn-lg" href="/aloqa/#demo" data-track="hero_cta_clicked" data-cta="mobile-menu">Demo so‘rash</a>
        <a class="btn btn-secondary btn-lg" href="${esc(c.appUrl())}">${c.icon("log-in")}<span>Tizimga kirish</span></a>
      </div>
      <div class="mnav-contact">
        <a href="tel:${esc(c.cfg.phone.replace(/\s/g, ""))}">${c.icon("phone")}<span>${esc(c.cfg.phone)}</span></a>
        <a href="https://t.me/${esc(c.cfg.telegram)}" target="_blank" rel="noopener">${c.icon("send")}<span>@${esc(c.cfg.telegram)}</span>${srNew}</a>
      </div>
    </nav>
  </div>
</header>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function footer(c) {
  const col = (/** @type {string} */ title, /** @type {string[]} */ items) =>
    `<div class="ftr-col"><h2 class="ftr-h">${tx(title)}</h2><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
  const a = (/** @type {string} */ href, /** @type {string} */ label, external = false) =>
    `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${tx(label)}${external ? srNew : ""}</a>`;
  const social = Object.entries(c.cfg.social || {}).filter(([, v]) => v);
  return `<footer class="ftr">
  <div class="wrap ftr-grid">
    <div class="ftr-brand">
      <a class="brand" href="/"><img src="${c.asset("img/logo.svg")}" alt="" width="30" height="30" loading="lazy"><span>Tizimchi</span></a>
      <p>${tx("Savdo, ombor, qarzlar, xodimlar va hisobotlarni bitta tizimda yuritish uchun platforma. Restoran, do'kon, dorixona va boshqa bizneslar uchun.")}</p>
      <ul class="ftr-contact">
        <li><a href="tel:${esc(c.cfg.phone.replace(/\s/g, ""))}">${c.icon("phone")}<span>${esc(c.cfg.phone)}</span></a></li>
        <li><a href="https://t.me/${esc(c.cfg.telegram)}" target="_blank" rel="noopener">${c.icon("send")}<span>@${esc(c.cfg.telegram)}</span>${srNew}</a></li>
      </ul>
    </div>
    ${col("Sahifalar", NAV.map((n) => a(n.href, n.label)))}
    ${col("Biznes turlari", INDUSTRIES.map(([code, label]) => a(`/biznes-turlari/${code}/`, label)))}
    ${col("Ilova", [
      a(c.appUrl(), "Tizimga kirish"),
      a(c.appUrl("?signup=1"), "Bepul sinab ko'rish (14 kun)"),
      a(c.appUrl("demo.html"), "Jonli demo", true),
      a(c.appUrl("install.html"), "Ilovani o'rnatish", true),
      ...social.map(([k, v]) => a(v, k[0].toUpperCase() + k.slice(1), true)),
    ])}
  </div>
  <div class="wrap ftr-bottom">
    <p>© <span data-year>${c.cfg.year}</span> Tizimchi</p>
    <ul>
      <li><a href="/maxfiylik/">${tx("Maxfiylik siyosati")}</a></li>
      <li><a href="/oferta/">${tx("Ommaviy oferta")}</a></li>
    </ul>
  </div>
</footer>`;
}
