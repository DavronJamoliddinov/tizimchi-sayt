// Skrinshot vositalari uchun umumiy yordamchilar: Tizimchi ilovasini lokal ochish (demo.html), headless Chrome, sahifa sozlamasi.
// Ilova manzili: APP_DIR (standart: ../dokon_app — shu papka yonidagi ilova loyihasi). Chrome: CHROME (standart: Windows'dagi Chrome).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
export const APP_DIR = path.resolve(ROOT, process.env.APP_DIR || "../dokon_app");
export const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".json": "application/json",
};

/** Ilovaning web/ papkasini lokal ochish (demo.html shu yerdan ishlaydi — internet va server kerak emas) */
export function startServer(port = 5612) {
  const web = path.join(APP_DIR, "web");
  if (!fs.existsSync(path.join(web, "demo.html"))) {
    throw new Error(`Ilova topilmadi: ${web}\\demo.html — APP_DIR=<Tizimchi ilovasi papkasi> bilan ishga tushiring`);
  }
  const serve = (req, res) => {
    let url = decodeURIComponent(req.url.split("?")[0]);
    if (url.endsWith("/")) url += "index.html";
    const file = path.normalize(path.join(web, url));
    if (!file.startsWith(web)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end("Topilmadi"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(data);
    });
  };
  return new Promise((resolve) => {
    const srv = http.createServer(serve).listen(port, () => resolve({ srv, base: `http://localhost:${port}` }));
  });
}

export async function launch() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--font-render-hinting=none", "--disable-features=Translate", "--lang=uz-UZ"],
    defaultViewport: null,
  });
}

// Kadrlarda demo panel va kursor ko'rinmasin
const HIDE_CSS = `
  .demo-bar { display: none !important; }
  * { caret-color: transparent !important; }
  ::-webkit-scrollbar { display: none !important; }
`;

export async function newPage(browser, { width, height, dpr, theme = "light", mobile = false, clock = "14:20" }) {
  // Har bir sahifa — alohida toza kontekst (localStorage'dagi demo baza boshqasiga aralashmasin)
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on("close", () => ctx.close().catch(() => {}));
  await page.setViewport({ width, height, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }, { name: "prefers-reduced-motion", value: "reduce" }]);
  await page.evaluateOnNewDocument((css, theme, clock) => {
    // Soat va sana qotiriladi: 2026-10-10 (shanba), kunduzgi ish vaqti — barcha kadrlarda bir xil
    const [h, m] = clock.split(":").map(Number);
    const Real = Date;
    const target = new Real(2026, 9, 10, h, m, 0, 0);
    const offset = target.getTime() - Real.now();
    class FixedDate extends Real {
      constructor(...a) { if (a.length === 0) super(Real.now() + offset); else super(...a); }
      static now() { return Real.now() + offset; }
    }
    window.Date = FixedDate;
    try { localStorage.setItem("dokon.theme", theme); } catch (_) { /* ignore */ }
    const add = () => { const s = document.createElement("style"); s.id = "shots-css"; s.textContent = css; document.documentElement.appendChild(s); };
    if (document.documentElement) add(); else document.addEventListener("DOMContentLoaded", add);
  }, HIDE_CSS, theme, clock);
  page.on("pageerror", (e) => console.log("  [sahifa xatosi]", e.message));
  return page;
}

/** Ilova to'liq chizilguncha kutish (yuklanish belgisi yo'qolsin, tarmoq tinchisin) */
export async function settle(page, ms = 450) {
  await page.waitForFunction(() => !document.querySelector(".loading-screen"), { timeout: 20000 });
  await sleep(ms);
}
