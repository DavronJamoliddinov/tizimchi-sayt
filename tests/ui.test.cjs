// Brauzer testi: build (--dev, namunaviy videolar) → lokal server (sayt CSP'si bilan) → headless Edge/Chrome.
// Har bir sahifaga tests/ui-flow.js qo'shiladi: menyu, tablar, FAQ, forma, video filtrlari, pleyer va /admin/ tekshiriladi,
// natija POST /__result orqali keladi. Demo forma /__dev/lead sinov manziliga yuboriladi (hech qayerga ketmaydi).
// /admin/ uchun backend taqlidi (tests/mock-backend.cjs): /__supa/auth/v1/* va /__supa/rest/v1/rpc/* — xotirada.
// Ishlatish: npm run test:ui
const { spawn, spawnSync } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { pathToFileURL } = require("node:url");
const { mockBackend, ANON } = require("./mock-backend.cjs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".test-dist-ui");
const TIMEOUT_MS = Number(process.env.UI_TIMEOUT) || 180000;
const BROWSERS = [
  process.env.BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

function killTree(proc) {
  if (!proc || proc.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
  else proc.kill("SIGKILL");
}

(async () => {
  const browser = BROWSERS.find((b) => fs.existsSync(b));
  if (!browser) {
    if (process.env.CI) { console.log("Brauzer topilmadi (CI)"); process.exit(1); }
    console.log("Brauzer topilmadi — UI testi o'tkazib yuborildi");
    return;
  }
  const T = await import(pathToFileURL(path.join(ROOT, "frontend", "src", "client", "tutorials.js")).href);
  const supa = mockBackend(T);
  const flow = fs.readFileSync(path.join(__dirname, "ui-flow.js"));
  let csp = "";

  const pages = [];
  let finish;
  const done = new Promise((r) => { finish = r; });
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const send = (status, obj) => {
      res.writeHead(status, obj === null ? {} : { "Content-Type": "application/json" });
      res.end(obj === null ? "" : JSON.stringify(obj));
    };
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        let j = {};
        try { j = body ? JSON.parse(body) : {}; } catch { /* bo'sh */ }
        if (url.pathname.startsWith("/__supa/")) { const [s, o] = supa.handle(url, req.headers, j); return send(s, o); }
        if (url.pathname === "/__dev/lead") return send(200, { ok: true, dev: true });
        res.end("ok");
        if (url.pathname === "/__result") { pages.push(j); if (!j.next) finish(); }
      });
      return;
    }
    if (url.pathname === "/__site-flow.js") { res.writeHead(200, { "Content-Type": "text/javascript" }); return res.end(flow); }
    let file = path.normalize(path.join(OUT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(OUT)) { res.writeHead(403); return res.end(); }
    if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      const ext = path.extname(file);
      const headers = { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "no-cache" };
      if (ext === ".html") {
        headers["Content-Security-Policy"] = csp;
        data = Buffer.from(String(data).replace("</body>", '<script src="/__site-flow.js" defer></script></body>'));
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://localhost:${server.address().port}`;

  const b = spawnSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs"), "--dev", "--tutorials=tests/fixtures/tutorials.json", "--out=.test-dist-ui"],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, SITE_URL: "", APP_URL: "", SUPABASE_URL: `${base}/__supa`, SUPABASE_ANON_KEY: ANON } });
  if (b.status !== 0) { console.log(`build xatosi:\n${b.stdout}\n${b.stderr}`); server.close(); process.exit(1); }
  csp = fs.readFileSync(path.join(OUT, ".csp"), "utf8").trim().replace("; upgrade-insecure-requests", "");

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "tizimchi-sayt-ui-"));
  const proc = spawn(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--force-prefers-reduced-motion",
    ...(process.env.CI ? ["--no-sandbox", "--disable-dev-shm-usage"] : []),
    `--user-data-dir=${profile}`, "--window-size=1000,900", `${base}/`,
  ], { stdio: "ignore" });

  let timer;
  const outcome = await Promise.race([
    done.then(() => "ok"),
    new Promise((r) => { timer = setTimeout(() => r(`${TIMEOUT_MS / 1000} s ichida tugamadi`), TIMEOUT_MS); }),
    new Promise((r) => proc.on("exit", (code) => r(`brauzer yopildi (kod ${code})`))),
  ]);
  clearTimeout(timer);
  killTree(proc);
  server.close();
  for (let i = 0; i < 10; i++) { try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch (_) { await new Promise((r) => setTimeout(r, 300)); } }
  fs.rmSync(OUT, { recursive: true, force: true });

  // Backend taqlidi holati: brauzerdagi amallar haqiqatan serverga yetib borganmi
  const st = supa.state;
  const added = st.tutorials.find((t) => t.title === "Ombor kirimi — nakladnoydan");
  const serverChecks = [
    [!!added && added.product_section === "ombor" && added.capability === "ai-kirim" && added.industries.join() === "restoran,dokon" && added.is_published === true
      && added.difficulty === "intermediate" && added.duration_sec === 275 && added.steps.length === 2,
      `yangi video serverda to'g'ri maydonlar bilan saqlangan — ${JSON.stringify(added && { s: added.product_section, c: added.capability, i: added.industries, p: added.is_published, d: added.difficulty, t: added.duration_sec, st: added.steps })}`],
    [st.leads.find((l) => l.id === "l1")?.status === "contacted", "so'rov holati serverda o'zgargan"],
    [st.leads.find((l) => l.id === "l2")?.note === "Ertaga 15:00 da demo", "izoh serverda saqlangan"],
    [st.settings.chats === "123456789" && /^123456789:/.test(st.settings.token) && /^http:\/\/localhost:\d+$/.test(st.settings.site_url), "Telegram sozlamasi serverda saqlangan"],
  ];

  let passed = 0, failed = 0;
  for (const p of pages) {
    console.log(p.page);
    for (const [ok, name] of p.results) { ok ? passed++ : failed++; console.log(`  ${ok ? "✓" : "✗"} ${name}`); }
  }
  if (outcome !== "ok") { failed++; console.log(`  ✗ ${outcome} (oxirgi sahifa: ${(pages[pages.length - 1] || {}).page || "—"})`); }
  else {
    console.log("backend taqlidi");
    for (const [ok, name] of serverChecks) { ok ? passed++ : failed++; console.log(`  ${ok ? "✓" : "✗"} ${name}`); }
  }
  console.log(`\n${passed} ta o'tdi, ${failed} ta xato`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
