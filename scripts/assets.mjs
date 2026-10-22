// Sayt uchun tashqi resurslarni bir marta yuklab, loyihaga yozadi — build internetsiz ishlashi uchun.
//   - Inter shrifti (SIL Open Font License 1.1): o'zgaruvchan woff2 (opsz + wght), lotin, lotin-kengaytirilgan va kirill
//   - Lucide ikonkalari (ISC License): frontend/assets/icons.json
// Ishlatish: npm run assets [-- fonts] [-- icons]   (argumentsiz — hammasi)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "frontend", "assets");
const want = new Set(process.argv.slice(2));
const all = want.size === 0;
// Google Fonts woff2 faqat zamonaviy brauzer belgisi bilan beriladi
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36";

async function get(url, as = "text") {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return as === "buffer" ? Buffer.from(await r.arrayBuffer()) : r.text();
}

/* ---------- Inter ---------- */
if (all || want.has("fonts")) {
  const dir = join(ASSETS, "fonts");
  mkdirSync(dir, { recursive: true });
  const css = await get("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap");
  const faces = {};
  // /* latin */ @font-face { ... src: url(...) format('woff2'); unicode-range: ...; }
  for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    const [, subset, body] = m;
    // kirill — matndagi ruscha atamalar uchun (МНН, «кв.м»): unicode-range tufayli faqat kerak bo'lgan sahifada yuklanadi
    if (!["latin", "latin-ext", "cyrillic"].includes(subset)) continue;
    const url = (body.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!url || !range) throw new Error(`Inter ${subset}: url yoki unicode-range topilmadi`);
    const file = `inter-${subset}.woff2`;
    writeFileSync(join(dir, file), await get(url, "buffer"));
    faces[subset] = { file, unicodeRange: range.trim() };
    console.log(`  ✓ ${file}`);
  }
  if (!faces.latin || !faces["latin-ext"]) throw new Error("Inter: latin va latin-ext kerak");
  // O'zbek lotin yozuvi uchun kerakli belgilar lotin to'plamida bo'lishi shart: ʻ (U+02BB), ʼ (U+02BC), ‘ ’ (U+2018/2019)
  if (!/U\+02BB-02BC/.test(faces.latin.unicodeRange) || !/U\+2000-206F/.test(faces.latin.unicodeRange)) {
    throw new Error("Inter latin to'plamida o'zbekcha tutuq belgilari yo'q — unicode-range ni tekshiring");
  }
  writeFileSync(join(dir, "fonts.json"), JSON.stringify({ family: "Inter", weight: "400 800", faces }, null, 2) + "\n");
  writeFileSync(join(dir, "OFL.txt"), await get("https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt"));
  console.log("  ✓ fonts.json, OFL.txt");
}

/* ---------- Lucide ---------- */
const LUCIDE = "0.544.0";
const ICONS = [
  // interfeys
  "menu", "x", "arrow-right", "arrow-left", "arrow-up-right", "chevron-down", "chevron-right", "chevron-left", "check", "circle-check",
  "play", "circle-play", "search", "sliders-horizontal", "clock", "external-link", "phone", "send", "log-in", "sparkles", "info",
  "triangle-alert", "circle-alert", "loader-circle", "copy", "list-checks", "circle-help", "message-circle", "life-buoy",
  "mouse-pointer-click", "rocket", "settings", "video", "film", "book-open", "graduation-cap", "user-round-check", "calendar-clock",
  // biznes turlari
  "utensils", "store", "shopping-cart", "pill", "car", "brick-wall", "paint-roller", "warehouse", "hotel", "bed-double", "layout-grid", "shapes",
  // imkoniyatlar
  "scan-barcode", "receipt", "wallet", "banknote", "credit-card", "qr-code", "printer", "undo-2", "clipboard-list", "package", "package-plus",
  "boxes", "map-pin", "arrow-right-left", "clipboard-check", "tag", "percent", "file-spreadsheet", "hourglass", "truck", "handshake",
  "users", "user-cog", "shield-check", "history", "chart-column", "chart-line", "chart-pie", "trending-up", "calculator", "bot", "bell",
  "wifi-off", "cloud-off", "smartphone", "monitor", "laptop", "languages", "lock", "key-round", "refresh-cw", "archive", "database-backup",
  "circle-dollar-sign", "chef-hat", "armchair", "bike", "scan-qr-code", "utensils-crossed", "layout-dashboard", "flame",
  "thermometer-snowflake", "replace", "factory", "tablets", "gift", "zap", "gauge", "timer", "list-ordered", "hand-platter", "building-2",
  "coins", "eye-off", "fingerprint", "layers", "file-text", "mic", "camera", "scale", "ruler", "badge-percent", "hammer", "spray-can",
  "shirt", "flower-2", "smartphone-charging", "notebook-pen", "box", "route", "workflow", "circle-x", "minus", "plus", "message-square-text",
  // /admin/ (sayt boshqaruvi)
  "pencil", "trash-2", "eye", "arrow-up", "arrow-down", "log-out", "download", "user", "square-pen", "inbox", "star", "mail",
];
if (all || want.has("icons")) {
  const out = {};
  const missing = [];
  for (const name of ICONS) {
    try {
      const svg = await get(`https://cdn.jsdelivr.net/npm/lucide-static@${LUCIDE}/icons/${name}.svg`);
      out[name] = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>[\s\S]*$/, "")
        .replace(/\s+/g, " ").replace(/> </g, "><").trim();
    } catch (e) { missing.push(`${name} (${e.message})`); }
  }
  const doc = { license: `Lucide ${LUCIDE} — ISC License (https://lucide.dev/license)`, icons: out };
  writeFileSync(join(ASSETS, "icons.json"), JSON.stringify(doc, null, 0).replace(/","/g, '",\n"') + "\n");
  console.log(`  ✓ icons.json: ${Object.keys(out).length}/${ICONS.length}`);
  if (missing.length) { console.log("  ! topilmadi:\n    " + missing.join("\n    ")); process.exitCode = 1; }
}
