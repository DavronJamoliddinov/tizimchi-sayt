// Sayt uchun ijtimoiy tarmoq rasmlari (Open Graph, 1200×630): frontend/assets/og/<nom>.jpg
// Har bir sahifa va biznes turi uchun — sarlavha va ilovaning haqiqiy ekrani bilan. Ishlatish: npm run og
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { launch, ROOT } from "./lib.mjs";

const SITE = path.join(ROOT, "frontend");
const OUT = path.join(SITE, "assets", "og");
fs.mkdirSync(OUT, { recursive: true });
const { INDUSTRY_PAGES } = await import(pathToFileURL(path.join(SITE, "content", "industries.mjs")).href);
const { typo, esc } = await import(pathToFileURL(path.join(SITE, "src", "client", "util.js")).href);
const icons = JSON.parse(fs.readFileSync(path.join(SITE, "assets", "icons.json"), "utf8")).icons;
const fileUrl = (p) => pathToFileURL(p).href;
const logo = fileUrl(path.join(SITE, "assets", "img", "logo.svg"));
const font = fileUrl(path.join(SITE, "assets", "fonts", "inter-latin.woff2"));
const fontExt = fileUrl(path.join(SITE, "assets", "fonts", "inter-latin-ext.woff2"));
const shot = (n) => fileUrl(path.join(SITE, "assets", "shots", `${n}@1.5x.webp`));
const TONES = { orange: ["#FFC15E", "#FF7A1A"], blue: ["#5AC8FF", "#0B6BFF"], green: ["#63E28F", "#17A84D"], teal: ["#4FE3D1", "#0EA597"], indigo: ["#9A97FF", "#4F44E6"],
  brown: ["#E3AE76", "#A5682F"], pink: ["#FF91B6", "#EC3F7A"], slate: ["#A6B4C8", "#56657C"], purple: ["#D79BFF", "#9446F5"], sky: ["#8EDCFF", "#1E95F0"], gray: ["#C8CCD3", "#868D98"] };

/** @param {{ eyebrow: string, title: string, shot: string, icon?: string, tone?: string }} o */
function html(o) {
  const [a, b] = TONES[o.tone || "blue"];
  const tile = o.icon ? `<span class="tile" style="background:linear-gradient(140deg,${a},${b})"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[o.icon]}</svg></span>` : "";
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><style>
    @font-face { font-family: Inter; src: url(${font}) format("woff2"); font-weight: 400 800; }
    @font-face { font-family: Inter; src: url(${fontExt}) format("woff2"); font-weight: 400 800; unicode-range: U+0100-024F; }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: #1D1D1F; -webkit-font-smoothing: antialiased;
      background: radial-gradient(60% 70% at 85% 85%, rgba(11,92,255,.22), transparent 70%), radial-gradient(40% 50% at 100% 30%, rgba(18,201,155,.16), transparent 70%),
        radial-gradient(40% 60% at 0% 100%, rgba(54,198,255,.16), transparent 70%), #FCFCFB; position: relative; }
    .copy { position: absolute; left: 72px; top: 64px; width: 560px; }
    .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 700; letter-spacing: -.03em; }
    .brand img { width: 46px; height: 46px; }
    .eyebrow { display: flex; align-items: center; gap: 14px; margin-top: 64px; font-size: 24px; font-weight: 600; color: #0B5CFF; letter-spacing: -.01em; }
    .tile { display: inline-grid; place-items: center; width: 52px; height: 52px; border-radius: 15px; box-shadow: inset 0 1px 0 rgba(255,255,255,.35); }
    .tile svg { width: 28px; height: 28px; }
    h1 { margin-top: 22px; font-size: ${o.title.length > 52 ? 46 : 54}px; line-height: 1.06; letter-spacing: -.04em; font-weight: 750; text-wrap: balance; }
    .url { position: absolute; left: 72px; bottom: 56px; font-size: 22px; font-weight: 600; color: #55555B; letter-spacing: -.01em; }
    .window { position: absolute; left: 680px; top: 120px; width: 900px; border-radius: 16px; overflow: hidden; background: #fff;
      box-shadow: 0 0 0 1px rgba(17,17,26,.08), 0 40px 80px -28px rgba(16,24,40,.38); }
    .bar { height: 34px; display: flex; gap: 8px; align-items: center; padding: 0 14px; background: linear-gradient(#F8F8F9,#F1F1F3); border-bottom: 1px solid rgba(17,17,26,.07); }
    .bar i { width: 11px; height: 11px; border-radius: 50%; background: #FF5F57; } .bar i:nth-child(2) { background: #FEBC2E; } .bar i:nth-child(3) { background: #28C840; }
    .window img { display: block; width: 100%; }
  </style></head><body>
    <div class="copy">
      <div class="brand"><img src="${logo}" alt="">Tizimchi</div>
      <div class="eyebrow">${tile}${esc(typo(o.eyebrow))}</div>
      <h1>${esc(typo(o.title))}</h1>
    </div>
    <div class="url">tizimchi.com</div>
    <div class="window"><div class="bar"><i></i><i></i><i></i></div><img src="${shot(o.shot)}" alt=""></div>
  </body></html>`;
}

const JOBS = [
  ["home", { eyebrow: "Biznesni boshqarish platformasi", title: "Biznesingizni tartibga soling. Boshqaruvni soddalashtiring.", shot: "d-hisobot" }],
  ["biznes-turlari", { eyebrow: "Biznes turlari", title: "Har bir biznes uchun o'z yechimi", shot: "d-savdo" }],
  ["imkoniyatlar", { eyebrow: "Imkoniyatlar", title: "Savdo, ombor, qarzlar va hisobotlar — bitta tizimda", shot: "d-ombor" }],
  ["video-qollanmalar", { eyebrow: "Video qo'llanmalar", title: "Tizimni bosqichma-bosqich o'rganing", shot: "d-mijozlar" }],
  ["aloqa", { eyebrow: "Aloqa", title: "Biznesingiz uchun demo so'rang", shot: "d-rest-pos" }],
  ["yuklab-olish", { eyebrow: "Yuklab olish", title: "Tizimchi'ni telefon va kompyuterga o'rnating", shot: "d-savdo" }],
  ...INDUSTRY_PAGES.map((i) => [i.slug, { eyebrow: i.name, title: i.hero.title.replace(/\.$/, ""), shot: i.shots.desktop, icon: i.icon, tone: i.tone }]),
];

const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  const tmp = path.join(OUT, "_og.html");
  for (const [name, o] of JOBS) {
    fs.writeFileSync(tmp, html(o));
    await page.goto(fileUrl(tmp), { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `${name}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 86 });
    console.log("  ✓", name, `${Math.round(fs.statSync(file).size / 1024)} KB`);
  }
  fs.rmSync(tmp, { force: true });
} finally {
  await browser.close();
}
