// Saytni lokal ko'rish: build + server + o'zgarishda qayta build.
//   npm run dev                                   http://localhost:5600 — lokal ko'rinish (.dev-dist/): demo forma sinov rejimida
//   npm run dev -- --tutorials=tests/fixtures/tutorials.json   namunaviy video qo'llanmalar bilan (namunadagi videolar o'ynamaydi)
//   npm run preview                               production build'ni ko'rish (dist/): forma haqiqiy backend'ga yuboradi
//   PORT=5700 npm run dev
// Server saytdagi kabi CSP sarlavhasini yuboradi — xavfsizlik siyosati buzilishi lokal ham ko'rinadi.
// POST /__dev/lead — demo forma sinovi: hech qayerga yuborilmaydi, { ok: true, dev: true } qaytaradi.
import http from "node:http";
import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { readFileSync, watch, existsSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 5600;
const argv = process.argv.slice(2);
const PROD = argv.includes("--prod");
// --out=papka — boshqa papkaga yig'ish (masalan, ikkinchi nusxani namunaviy videolar bilan parallel ko'rish uchun).
// Lokal ko'rinish .dev-dist/ ga yig'iladi: dist/ (serverga yuklanadigan) sinov rejimidagi build bilan almashib qolmasin.
const outArg = argv.find((a) => a.startsWith("--out="));
const DIST = outArg ? join(ROOT, outArg.slice(6)) : join(ROOT, PROD ? "dist" : ".dev-dist");
const buildArgs = [join(ROOT, "scripts", "build.mjs"), ...(PROD ? [] : ["--dev"]), ...argv.filter((a) => a.startsWith("--tutorials=") || a.startsWith("--out="))];

function build() {
  const r = spawnSync(process.execPath, buildArgs, { cwd: ROOT, stdio: "inherit", env: process.env });
  if (r.status !== 0) console.log("\x1b[31m  build xatosi — yuqoriga qarang\x1b[0m");
  return r.status === 0;
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};

async function serve(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (url.pathname === "/__dev/lead" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 20000) req.destroy(); });
    req.on("end", () => {
      let p = {};
      try { const j = JSON.parse(body); p = j.p || j; } catch { /* bo'sh */ }
      // Shaxsiy ma'lumot konsolga chiqarilmaydi — faqat forma ishlaganini ko'rsatamiz
      console.log(`  [demo forma] sinov so'rovi: biznes turi «${p.business_type || "?"}», izoh ${String(p.comment || "").length} belgi — serverga yuborilmadi`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, dev: true }));
    });
    return;
  }
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = normalize(join(DIST, path));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  try {
    const st = await stat(file).catch(() => null);
    if (st && st.isDirectory()) { res.writeHead(301, { Location: url.pathname + "/" }); return res.end(); }
    let status = 200;
    if (!st) { file = join(DIST, "404.html"); status = 404; }
    let data = await readFile(file);
    const headers = { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" };
    if (extname(file) === ".html" && existsSync(join(DIST, ".csp"))) {
      headers["Content-Security-Policy"] = readFileSync(join(DIST, ".csp"), "utf8").trim().replace("; upgrade-insecure-requests", "");
      headers["X-Content-Type-Options"] = "nosniff";
      headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    }
    // Hosting (Netlify, Cloudflare, Caddy) matnni siqib beradi — lokal o'lchovlar ham shunga yaqin bo'lsin
    if (/^(text\/|application\/(json|xml)|image\/svg)/.test(headers["Content-Type"]) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      data = gzipSync(data);
      headers["Content-Encoding"] = "gzip";
      headers["Vary"] = "Accept-Encoding";
    }
    res.writeHead(status, headers);
    res.end(data);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}

if (!build()) process.exit(1);
http.createServer(serve).listen(PORT, () => {
  console.log(`\n  Sayt: http://localhost:${PORT}/  ${PROD ? "(production build)" : "(lokal ko'rinish)"} · boshqaruv: http://localhost:${PORT}/admin/\n`);
});

if (!argv.includes("--no-watch")) {
  let t = null;
  const onChange = (_e, f) => {
    if (!f) return;
    clearTimeout(t);
    t = setTimeout(() => { console.log(`  o'zgardi: ${f} — qayta build`); build(); }, 200);
  };
  try { watch(join(ROOT, "frontend"), { recursive: true }, onChange); } catch { console.log("  (fayl kuzatuvi ishlamadi — o'zgarishdan keyin serverni qayta ishga tushiring)"); }
}
