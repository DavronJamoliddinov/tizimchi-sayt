// tizimchi_sayt — statik build: frontend/ → dist/
//
//   node scripts/build.mjs                 production → dist/ (hostingga shu papka yuklanadi)
//   node scripts/build.mjs --dev           lokal ko'rinish → .dev-dist/: demo forma sinov rejimida (/__dev/lead), «Lokal ko'rinish» belgisi
//   --tutorials=live|none|<fayl.json>      video qo'llanmalar manbai (standart: live — backend ulangan bo'lsa; javob bermasa — bo'sh;
//                                          backend ulanmagan bo'lsa — frontend/content/tutorials.json, uni «npm run videos» yozadi)
//   --downloads=none|<fayl.json>           ilovani yuklab olish fayllari (standart: frontend/content/downloads.json — npm run yuklab yozadi)
//   --out=<papka>                          boshqa joyga (testlar uchun)
//
// Sozlamalar: frontend/site.config.mjs (muhit o'zgaruvchilari ustun: SITE_URL, APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY).
// Natija: har bir sahifa — tayyor HTML (SEO), CSS va JS — xeshli nomli fayllar (1 yil kesh), sitemap.xml, robots.txt,
// _headers (Netlify/Cloudflare: CSP va kesh), _redirects, 404.html va /admin/ (sayt boshqaruvi, indekslanmaydi).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRONT = join(ROOT, "frontend");
const argv = process.argv.slice(2);
const opt = (k) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const DEV = argv.includes("--dev");
const OUT = opt("out") ? join(ROOT, opt("out")) : join(ROOT, DEV ? ".dev-dist" : "dist");
const TUT_SRC = opt("tutorials") || "live";
const t0 = Date.now();

const { Assets } = await import("../frontend/src/build/assets.mjs");
const { makeIcon } = await import("../frontend/src/build/kit.mjs");
const { renderPage } = await import("../frontend/src/build/layout.mjs");
const { homePage } = await import("../frontend/src/build/pages-home.mjs");
const { industriesIndex, industryPage } = await import("../frontend/src/build/pages-industry.mjs");
const misc = await import("../frontend/src/build/pages-misc.mjs");
const { renderAdmin, ADMIN_ICONS } = await import("../frontend/src/build/pages-admin.mjs");
const T = await import("../frontend/src/client/tutorials.js");
const { typo } = await import("../frontend/src/client/util.js");
const { INDUSTRY_PAGES } = await import("../frontend/content/industries.mjs");
const { INDUSTRIES, SECTIONS, LEVELS } = await import("../frontend/content/taxonomy.mjs");
const { CAPABILITY_GROUPS } = await import("../frontend/content/capabilities.mjs");
const { SHOTS } = await import("../frontend/content/shots.mjs");
const { LEGAL_DOCS } = await import("../frontend/content/legal.mjs");
const SITE_CFG = (await import("../frontend/site.config.mjs")).default;

/* ---------- 1. Sozlamalar ---------- */
const pick = (/** @type {string} */ k) => String(process.env[k] ?? "").trim() || String(SITE_CFG[k] ?? "").trim();
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/; // faqat lokal sinov (testlar)
const siteUrl = pick("SITE_URL").replace(/\/+$/, "");
const appBase = pick("APP_URL").replace(/\/+$/, "") + "/";
const supabaseUrl = pick("SUPABASE_URL").replace(/\/+$/, "");
const anonKey = pick("SUPABASE_ANON_KEY");
if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(siteUrl) && !LOCAL.test(siteUrl)) throw new Error(`SITE_URL noto'g'ri: «${siteUrl}» (masalan https://tizimchi.com)`);
if (!/^https:\/\/\S+$/.test(appBase)) throw new Error(`APP_URL noto'g'ri: «${appBase}»`);
if (supabaseUrl && !/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(supabaseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[\w-]+)?$/.test(supabaseUrl)) {
  throw new Error(`SUPABASE_URL noto'g'ri: «${supabaseUrl}» (masalan https://abcdefgh.supabase.co)`);
}
if (supabaseUrl && !anonKey) throw new Error("SUPABASE_URL berilgan, lekin SUPABASE_ANON_KEY bo'sh");
assertPublicKey(anonKey);
const CONTACT = SITE_CFG.CONTACT || {};

/** @type {import("../frontend/src/build/kit.mjs").Cfg} */
const cfg = {
  site: siteUrl, app: appBase, supabaseUrl, anonKey,
  phone: String(CONTACT.PHONE || ""), telegram: String(CONTACT.TELEGRAM || "").replace(/^@/, ""),
  leadEndpoint: DEV ? "/__dev/lead" : (supabaseUrl ? `${supabaseUrl}/rest/v1/rpc/site_lead_submit` : ""),
  tutorialsLive: SITE_CFG.TUTORIALS_LIVE !== false && !!supabaseUrl && !TUT_SRC.endsWith(".json"),
  dev: DEV, year: new Date().getFullYear(), buildDate: new Date().toISOString().slice(0, 10),
  legal: SITE_CFG.LEGAL || {}, social: SITE_CFG.SOCIAL || {},
};
if (!cfg.phone || !cfg.telegram) throw new Error("frontend/site.config.mjs: CONTACT.PHONE va CONTACT.TELEGRAM to'ldirilishi shart");
if (!supabaseUrl) console.log("  ! backend ulanmagan (SUPABASE_URL bo'sh): video qo'llanmalar frontend/content/tutorials.json dan (bo'lmasa «tez orada»), forma telefon/Telegram'ni taklif qiladi, /admin/ sozlash yo'riqnomasini ko'rsatadi");

/* ---------- 2. Video qo'llanmalar nusxasi ---------- */
const LOCAL_TUTORIALS = join(FRONT, "content", "tutorials.json"); // tools/videos.mjs yozadi (o'z serverdagi videolar)
async function loadTutorials() {
  let rows = [];
  let source = TUT_SRC;
  if (TUT_SRC === "none") rows = [];
  else if (TUT_SRC.endsWith(".json")) rows = JSON.parse(readFileSync(join(ROOT, TUT_SRC), "utf8"));
  else if (!supabaseUrl && existsSync(LOCAL_TUTORIALS)) {
    rows = JSON.parse(readFileSync(LOCAL_TUTORIALS, "utf8"));
    source = "backend ulanmagan — frontend/content/tutorials.json";
  } else if (!supabaseUrl) source = "backend ulanmagan, bo'sh ro'yxat";
  else {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/rpc/site_tutorials_public`, { headers: apiHeaders(anonKey), signal: AbortSignal.timeout(8000) });
      if (r.ok) rows = await r.json();
      else source = `live → HTTP ${r.status} (backend/schema.sql o'rnatilmagan bo'lsa normal), bo'sh ro'yxat`;
    } catch (e) { source = `live → ${e.message}, bo'sh ro'yxat`; }
  }
  const valid = (Array.isArray(rows) ? rows : []).filter((r) => T.normalize(r));
  const list = T.sortTutorials(valid.map(T.normalize));
  console.log(`  video qo'llanmalar: ${list.length} ta (${source})`);
  return { rows: valid, list };
}
const { rows: tutorialRows, list: tutorials } = await loadTutorials();
/** Nusxa imzosi: brauzer jonli ma'lumot bir xil bo'lsa qayta chizmaydi */
const tutorialsSig = (list) => list.map((t) => `${t.slug}@${t.updatedAt}`).join("|");
const pretty = new Set(tutorials.map((t) => t.slug)); // oldindan chizilgan sahifalar

/* ---------- 2b. Ilovani yuklab olish fayllari (fayllarning o'zi — yuklab/, serverda tizimchi.com/yuklab/) ---------- */
const DL_FILE = { windows: /^Tizimchi-Setup-\d+\.\d+\.\d+\.exe$/, android: /^Tizimchi-\d+\.\d+\.\d+\.apk$/ };
/** @returns {import("../frontend/src/build/kit.mjs").Downloads} */
function loadDownloads() {
  const src = opt("downloads");
  if (src === "none") return {};
  const file = src ? resolve(ROOT, src) : join(FRONT, "content", "downloads.json");
  if (!existsSync(file)) return {};
  const raw = JSON.parse(readFileSync(file, "utf8"));
  for (const [k, d] of Object.entries(raw)) {
    if (!DL_FILE[k]) throw new Error(`downloads.json: noma'lum platforma «${k}» (windows | android)`);
    if (!DL_FILE[k].test(d.file) || !/^\d+\.\d+\.\d+$/.test(d.version) || !d.file.includes(d.version) || !(d.bytes > 0) || !/^[0-9a-f]{64}$/.test(d.sha256)) {
      throw new Error(`downloads.json: «${k}» yozuvi noto'g'ri — npm run yuklab bilan qayta yarating`);
    }
  }
  console.log(`  yuklab olish: ${Object.values(raw).map((d) => d.file).join(", ") || "fayl yo'q (brauzer orqali o'rnatish)"}`);
  return raw;
}
const downloads = loadDownloads();

/* ---------- 3. Asset'lar ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const A = new Assets(OUT);
const ASSETS = join(FRONT, "assets");
const fonts = JSON.parse(readFileSync(join(ASSETS, "fonts", "fonts.json"), "utf8"));
for (const f of Object.values(fonts.faces)) A.add(`fonts/${f.file}`, readFileSync(join(ASSETS, "fonts", f.file)));
A.add("fonts/OFL.txt", readFileSync(join(ASSETS, "fonts", "OFL.txt")));
A.addDir(join(ASSETS, "shots"), "shots", (f) => f.endsWith(".webp"));
for (const [name, s] of Object.entries(SHOTS)) for (const d of s.dprs) A.url(`shots/${name}@${d}x.webp`); // har bir kadr bor-yo'qligi
A.add("img/logo.svg", readFileSync(join(ASSETS, "img", "logo.svg")));
A.add("img/favicon.svg", readFileSync(join(ASSETS, "img", "logo.svg")));
A.add("img/favicon-32.png", readFileSync(join(ASSETS, "img", "favicon-32.png")));
A.add("img/apple-touch-icon.png", readFileSync(join(ASSETS, "img", "apple-touch-icon.png")));
A.add("img/logo-512.png", readFileSync(join(ASSETS, "img", "logo-512.png")));
// Open Graph rasmlari (1200×630): npm run og
if (existsSync(join(ASSETS, "og"))) A.addDir(join(ASSETS, "og"), "og", (f) => f.endsWith(".jpg"));

/* CSS: tokenlar → asos → komponentlar → bo'limlar (bitta fayl). Shrift manzillari — xeshli. Admin uslubi — alohida fayl. */
const STYLES = join(FRONT, "src", "styles");
const CSS_FILES = ["tokens.css", "base.css", "components.css", "sections.css", "pages.css"];
const fontFace = Object.values(fonts.faces).map((f) => `@font-face{font-family:"Inter";font-style:normal;font-weight:${fonts.weight};font-display:swap;src:url(${A.url(`fonts/${f.file}`)}) format("woff2");unicode-range:${f.unicodeRange}}`).join("\n");
const css = minifyCss([fontFace, ...CSS_FILES.map((f) => readFileSync(join(STYLES, f), "utf8"))].join("\n"));
const cssUrl = A.add("site.css", css);
const adminCss = minifyCss(readFileSync(join(STYLES, "admin.css"), "utf8"));
const adminCssUrl = A.add("admin.css", adminCss);

/* JS: ES modullar; ichki import'lar xeshli nomlarga almashtiriladi */
const jsDir = join(FRONT, "src", "client");
const js = (/** @type {string} */ f) => readFileSync(join(jsDir, f), "utf8");
const utilUrl = A.add("js/util.js", js("util.js"));
const tutsUrl = A.add("js/tutorials.js", js("tutorials.js").replace(`"./util.js"`, `"${utilUrl}"`));
const mainUrl = A.add("js/main.js", js("main.js").replace(`"./util.js"`, `"${utilUrl}"`).replace(`"./tutorials.js"`, `"${tutsUrl}"`));
const adminUrl = A.add("js/admin.js", js("admin.js").replace(`"./util.js"`, `"${utilUrl}"`).replace(`"./tutorials.js"`, `"${tutsUrl}"`));
for (const [name, url] of [["main.js", mainUrl], ["admin.js", adminUrl], ["tutorials.js", tutsUrl]]) {
  const src = readFileSync(join(OUT, url), "utf8");
  if (/from "\.\//.test(src)) throw new Error(`${name}: almashtirilmagan ichki import qoldi`);
}

/* Video qo'llanmalar nusxasi (brauzer jonli ma'lumot kelmaguncha va backend javob bermasa ishlatadi) */
const snapshotUrl = A.add("data/tutorials.json", JSON.stringify(tutorialRows));

/* ---------- 4. Kontekst ---------- */
const icons = JSON.parse(readFileSync(join(ASSETS, "icons.json"), "utf8")).icons;
const icon = makeIcon(icons);
const labels = {
  industries: Object.fromEntries(INDUSTRIES), sections: Object.fromEntries(SECTIONS), levels: Object.fromEntries(LEVELS),
};
const tutHref = (t) => (pretty.has(t.slug) ? `/video-qollanmalar/${t.slug}/` : `/video-qollanmalar/korish/?v=${encodeURIComponent(t.slug)}`);
/** @type {import("../frontend/src/client/tutorials.js").Ctx} */
const tctx = {
  icon, href: tutHref,
  label: { industry: (c) => labels.industries[c] || c, section: (c) => labels.sections[c] || c, level: (c) => labels.levels[c] || c },
  sectionHref: (s) => (s === "boshlash" ? "/#qanday-boshlash" : `/imkoniyatlar/#${s}`),
  industryHref: (i) => `/biznes-turlari/${i}/`,
};
/** @type {import("../frontend/src/build/kit.mjs").Ctx} */
const ctx = {
  cfg, tutorials, tctx, icon, downloads,
  asset: (p) => A.url(p),
  url: (p) => (p.startsWith("http") ? p : siteUrl + (p.startsWith("/") ? p : "/" + p)),
  appUrl: (p = "") => appBase + p.replace(/^\/+/, ""),
};
// Brauzer uchun ma'lumot (har sahifada <script type="application/json" id="site-data">)
const CLIENT_ICONS = ["play", "arrow-right", "arrow-left", "arrow-up-right", "chevron-right", "clock", "film", "circle-play", "layers", "graduation-cap",
  "x", "search", "circle-check", "circle-alert", "loader-circle", "info"];
const pickIcons = (/** @type {string[]} */ names) => Object.fromEntries(names.map((n) => {
  if (!icons[n]) throw new Error(`Ikonka topilmadi: ${n} (scripts/assets.mjs ro'yxatiga qo'shing va npm run assets -- icons)`);
  return [n, icons[n]];
}));
const data = {
  supabaseUrl, anonKey, leadEndpoint: cfg.leadEndpoint, tutorialsLive: cfg.tutorialsLive, dev: cfg.dev,
  app: cfg.app, snapshot: snapshotUrl, snapshotSig: tutorialsSig(tutorials), pretty: [...pretty], labels, contact: { phone: cfg.phone, telegram: cfg.telegram },
  icons: pickIcons(CLIENT_ICONS), analytics: SITE_CFG.ANALYTICS || "none",
};
const build = { css: cssUrl, js: mainUrl, modules: [utilUrl, tutsUrl], data };

/* ---------- 5. Sahifalar ---------- */
const pages = [
  await homePage(ctx),
  industriesIndex(ctx),
  ...(await Promise.all(INDUSTRY_PAGES.map((i) => industryPage(ctx, i)))),
  await misc.capabilitiesPage(ctx),
  misc.tutorialsLibraryPage(ctx),
  ...tutorials.map((t) => misc.tutorialPage(ctx, t)),
  misc.tutorialViewerPage(ctx),
  misc.contactPage(ctx),
  misc.downloadPage(ctx),
  misc.legalPage(ctx, "maxfiylik", LEGAL_DOCS.maxfiylik),
  misc.legalPage(ctx, "oferta", LEGAL_DOCS.oferta),
  misc.notFoundPage(ctx),
];
const titles = new Map();
for (const p of pages) {
  if (p.og && !A.has(p.og)) {
    console.log(`  ! OG rasm yo'q: ${p.og} (npm run og) — umumiy rasm ishlatildi`);
    p.og = A.has("og/home.jpg") ? "og/home.jpg" : "img/logo-512.png";
  }
  const html = minifyHtml(renderPage(ctx, p, build));
  writePage(p.path, html);
  const title = typo(p.fullTitle || p.title);
  if (titles.has(title) && !p.noindex) throw new Error(`Takroriy sarlavha: «${title}» (${p.path} va ${titles.get(title)})`);
  titles.set(title, p.path);
}

// Sayt boshqaruvi (/admin/): video qo'llanmalar, demo so'rovlari, Telegram — backend'dagi admin hisoblar bilan
const caps = Object.fromEntries(CAPABILITY_GROUPS.map((g) => [g.id, g.items.map((x) => [x.id, x.title])]));
writePage("/admin/", minifyHtml(renderAdmin(ctx, {
  css: [cssUrl, adminCssUrl], js: adminUrl, modules: [utilUrl, tutsUrl],
  data: { supabaseUrl, anonKey, site: siteUrl, dev: DEV, labels, order: { industries: INDUSTRIES.map(([c]) => c), sections: SECTIONS.map(([c]) => c), levels: LEVELS.map(([c]) => c) },
    caps, icons: pickIcons(ADMIN_ICONS) },
})));

/* ---------- 6. SEO va hosting fayllari ---------- */
const indexable = pages.filter((p) => !p.noindex);
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${cfg.buildDate}</lastmod></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(OUT, "robots.txt"), DEV ? "User-agent: *\nDisallow: /\n"
  : `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /video-qollanmalar/korish/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

const supa = supabaseUrl ? new URL(supabaseUrl).origin : "";
const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self'", "font-src 'self'",
  "img-src 'self' data: https:", "media-src 'self' https:", `connect-src 'self'${supa ? ` ${supa}` : ""}`,
  "frame-src https://www.youtube-nocookie.com", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
writeFileSync(join(OUT, "_headers"), `# Netlify / Cloudflare Pages. O'z serveringiz (Caddy) uchun: deploy/Caddyfile
/*
  Content-Security-Policy: ${CSP}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: no-cache

/admin/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-cache

/video-qollanmalar/korish/*
  X-Robots-Tag: noindex
`);
writeFileSync(join(OUT, "_redirects"), `# Netlify / Cloudflare Pages
/biznes-turlari/ombor-ulgurji/*  /biznes-turlari/ombor/  301
/index.html  /  301
`);
writeFileSync(join(OUT, ".csp"), CSP + "\n"); // deploy/Caddyfile, lokal server va testlar uchun
// deploy/deploy-vps.sh uchun: sahifalar ishora qilgan fayllar (serverda bo'lishi va SHA-256 mos kelishi shart)
writeFileSync(join(OUT, ".yuklab"), Object.entries(downloads).map(([k, d]) => `${k} ${d.file} ${d.sha256} ${d.bytes}\n`).join(""));

/* ---------- 7. Hisobot ---------- */
const kb = (n) => `${Math.round(n / 1024)} KB`;
const jsBytes = ["main", "tutorials", "util"].reduce((s, f) => s + A.files.find((x) => x.path.startsWith(`/assets/js/${f}.`)).bytes, 0);
console.log(`  sahifalar: ${pages.length} + /admin/ · CSS ${kb(Buffer.byteLength(css))} · JS ${kb(jsBytes)} · assets ${kb(A.totalBytes)}`);
console.log(`  ${DEV ? "[DEV] " : ""}→ ${OUT.replace(ROOT, ".")} (${Date.now() - t0} ms)`);

/* ---------- yordamchilar ---------- */
function writePage(/** @type {string} */ path, /** @type {string} */ html) {
  const file = path.endsWith(".html") ? join(OUT, path) : join(OUT, ...path.split("/").filter(Boolean), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

/** Supabase so'rov sarlavhalari: apikey doim; Authorization — kalit JWT bo'lsa (eski «anon» kalit). Yangi «sb_publishable_» kalitda shart emas. */
function apiHeaders(/** @type {string} */ key) {
  return /^eyJ/.test(key) ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

/** Saytga faqat ochiq kalit tushishi mumkin: service_role / sb_secret_ kalit brauzerga chiqsa — butun baza ochiladi */
function assertPublicKey(/** @type {string} */ key) {
  if (!key) return;
  if (/^sb_secret_/.test(key)) throw new Error("SUPABASE_ANON_KEY o'rniga maxfiy (sb_secret_) kalit yozilgan — saytga faqat «publishable» yoki «anon» kalit qo'yiladi!");
  if (/^eyJ/.test(key)) {
    let role = "";
    try { role = JSON.parse(Buffer.from(key.split(".")[1] || "", "base64url").toString("utf8")).role || ""; } catch { /* JWT emas */ }
    if (role && role !== "anon") throw new Error(`SUPABASE_ANON_KEY o'rniga «${role}» kaliti yozilgan — saytga faqat «anon» kalit qo'yiladi!`);
  }
}

/** Xavfsiz CSS siqish: izohlar va ortiqcha bo'shliqlar (satr ichidagi qiymatlarga tegmaydi) */
function minifyCss(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}").trim() + "\n";
}

/** HTML: teglar orasidagi bo'shliqlar (pre/textarea yo'q — kontentga ta'sir qilmaydi) */
function minifyHtml(s) {
  return s.replace(/>\s*\n\s*</g, "><").replace(/\n\s+/g, "\n").replace(/[ \t]{2,}/g, " ");
}
