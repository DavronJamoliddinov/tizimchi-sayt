// Build testi: build natijasini tekshiradi — brauzer kerak emas.
//   sahifalar va manzillar, SEO (sarlavha, tavsif, canonical, Open Graph, sitemap), bitta H1, buzuq ichki havolalar,
//   CSP (inline skript va style atributi yo'q), rasm alt/o'lcham, JSON-LD, o'zbekcha tipografiya, video qo'llanma qoidalari,
//   asossiz marketing da'volari yo'qligi, /admin/ (indekslanmaydi), backend sozlamasi (manzil, kalit turi, CSP).
// Ishlatish: npm run test:build
import { readFileSync, readdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log("  ✓", name); } catch (e) { failed++; console.log("  ✗", name, "\n      ", e.message); }
}
const read = (p) => readFileSync(join(ROOT, p), "utf8");
/** Backend sozlamasi testlar uchun aniq: muhitdagi qiymatlar aralashmasin */
const ENV0 = { ...process.env, SITE_URL: "", APP_URL: "", SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };

// Yuklab olish fayllari ham aniq: standart — namunaviy (haqiqiy downloads.json versiyasiga bog'liq bo'lmasin)
function run(out, tutorials, env = {}, downloads = "tests/fixtures/downloads.json") {
  return spawnSync(process.execPath, [join(ROOT, "scripts", "build.mjs"), `--out=${out}`, `--tutorials=${tutorials}`, `--downloads=${downloads}`],
    { cwd: ROOT, encoding: "utf8", env: { ...ENV0, ...env } });
}
function build(out, tutorials, env = {}, downloads = undefined) {
  const r = run(out, tutorials, env, downloads);
  if (r.status !== 0) throw new Error(`build xatosi:\n${r.stdout}\n${r.stderr}`);
  return join(ROOT, out);
}

const { INDUSTRIES, SECTIONS } = await import("../frontend/content/taxonomy.mjs");
const { INDUSTRY_PAGES } = await import("../frontend/content/industries.mjs");
const { CAPABILITY_GROUPS } = await import("../frontend/content/capabilities.mjs");
const { SHOTS } = await import("../frontend/content/shots.mjs");
const { TOUR } = await import("../frontend/content/home.mjs");
const { LEGAL_DOCS } = await import("../frontend/content/legal.mjs");
const T = await import("../frontend/src/client/tutorials.js");
const { typo, uzPhone, apiHeaders } = await import("../frontend/src/client/util.js");
const SITE = (await import("../frontend/site.config.mjs")).default.SITE_URL;

console.log("Build");
const DIST = build(".test-dist", "tests/fixtures/tutorials.json");
const EMPTY = build(".test-dist-empty", "none", {}, "none");
const SUPA = "https://abcdefghijklmnop.supabase.co";
const ANON = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ iss: "supabase", role: "anon" })).toString("base64url")}.sig`;
const LIVE = build(".test-dist-backend", "none", { SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: ANON, SITE_URL: "https://tizimchi-sayt.netlify.app" });
/** Sahifadagi JSON-LD obyektlari */
const lds = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
/** dist ichidagi barcha HTML sahifalar: { path: "/aloqa/index.html", html } */
const pages = (dist) => {
  const out = [];
  const walk = (d, rel = "") => {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, ent.name), r = rel + "/" + ent.name;
      if (ent.isDirectory()) { if (ent.name !== "assets") walk(p, r); } else if (ent.name.endsWith(".html")) out.push({ path: r, html: readFileSync(p, "utf8") });
    }
  };
  walk(dist);
  return out;
};
const all = pages(DIST);
const site = all.filter((p) => !p.path.startsWith("/admin/")); // ommaviy sahifalar (SEO)
const byPath = (p) => all.find((x) => x.path === p);
const attr = (html, re) => (re.exec(html) || [])[1];
const dataOf = (html, id) => JSON.parse(attr(html, new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`)));

console.log("\nSahifalar va SEO");
await test("barcha manzillar yaratilgan (11 biznes turi, video sahifalari, huquqiy, 404, /admin/)", () => {
  const want = ["/index.html", "/biznes-turlari/index.html", "/imkoniyatlar/index.html", "/video-qollanmalar/index.html", "/video-qollanmalar/korish/index.html",
    "/aloqa/index.html", "/maxfiylik/index.html", "/oferta/index.html", "/404.html", "/admin/index.html",
    ...INDUSTRIES.map(([c]) => `/biznes-turlari/${c}/index.html`),
    "/video-qollanmalar/namuna-kassada-birinchi-sotuv/index.html", "/video-qollanmalar/namuna-restoran-zal-va-stollar/index.html"];
  for (const p of want) assert.ok(byPath(p), `yo'q: ${p}`);
  assert.ok(!all.some((p) => p.path.includes("Noto")), "noto'g'ri video yozuvi saytga chiqmasligi kerak");
  for (const f of ["sitemap.xml", "robots.txt", "_headers", "_redirects"]) assert.ok(existsSync(join(DIST, f)), f);
});
await test("har bir sahifa: lang=uz, bitta H1, noyob sarlavha, tavsif, canonical, Open Graph", () => {
  const titles = new Map();
  for (const { path, html } of site) {
    assert.match(html, /<html lang="uz"/, path);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${path}: H1 soni`);
    const title = attr(html, /<title>([^<]+)<\/title>/);
    assert.ok(title && title.length <= 70, `${path}: sarlavha «${title}» (${title?.length})`);
    if (!/noindex/.test(attr(html, /<meta name="robots" content="([^"]+)"/) || "")) {
      assert.ok(!titles.has(title), `${path}: takroriy sarlavha (${titles.get(title)})`);
      titles.set(title, path);
    }
    const desc = attr(html, /<meta name="description" content="([^"]+)"/);
    assert.ok(desc && desc.length >= 50 && desc.length <= 200, `${path}: tavsif uzunligi ${desc?.length}`);
    assert.ok((attr(html, /<link rel="canonical" href="([^"]+)"/) || "").startsWith(SITE + "/"), `${path}: canonical`);
    assert.match(html, /<meta property="og:title"/, path);
    assert.ok((attr(html, /<meta property="og:image" content="([^"]+)"/) || "").startsWith("https://"), `${path}: og:image`);
  }
});
await test("sitemap: barcha indekslanadigan sahifalar, noindex sahifalar va /admin/ yo'q; robots.txt", () => {
  const sm = readFileSync(join(DIST, "sitemap.xml"), "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const { path, html } of all) {
    const url = SITE + path.replace(/index\.html$/, "");
    const noindex = /<meta name="robots" content="noindex/.test(html);
    assert.equal(locs.includes(url), !noindex, `${url}: sitemap'da ${noindex ? "bo'lmasligi" : "bo'lishi"} kerak`);
  }
  const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
  assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
  assert.match(robots, /Disallow: \/admin\//);
});
await test("yuklab olish: Windows (.exe) va Android (.apk) — tizimchi.com/yuklab/ dan, versiya, hajm, SHA-256 va imzo; iPhone, macOS/Linux", () => {
  const dl = JSON.parse(read("tests/fixtures/downloads.json"));
  const html = readFileSync(join(DIST, "yuklab-olish", "index.html"), "utf8");
  assert.match(html, /data-platforms/);
  for (const p of ["windows", "android", "ios", "desktop"]) assert.match(html, new RegExp(`data-platform="${p}"`));
  assert.equal((html.match(/<ol class="dl-steps">/g) || []).length, 4, "to'rtala qurilmaga qadamlar");
  assert.match(html, new RegExp(`href="/yuklab/${dl.windows.file.replace(/\./g, "\\.")}" download`), "Windows dasturi o'z serverdan");
  assert.match(html, new RegExp(`href="/yuklab/${dl.android.file.replace(/\./g, "\\.")}" download`), "Android ilovasi o'z serverdan");
  assert.doesNotMatch(html, /\/download\/dukon\.apk|t\.me\/[^"]*"[^>]*>[^<]*Windows dasturini so/, "eski havolalar qolmasin");
  assert.match(html, /Versiya 9\.8\.7 · 107 MB · Windows 10 va 11/);
  assert.match(html, /Versiya 9\.8\.7 · 2,0 MB · Android 8\.0 va yangi/);
  for (const v of [dl.windows.sha256, dl.android.sha256, dl.android.cert_sha256]) assert.ok(html.includes(`<code>${v}</code>`), `xesh: ${v}`);
  assert.match(html, /raqamli sertifikat bilan imzolanmagan/, "imzolanmagan exe — ochiq aytiladi");
  assert.match(html, /«Batafsil» → «Baribir ishga tushirish»/);
  const app = lds(html).find((x) => x["@type"] === "SoftwareApplication");
  assert.deepEqual(app?.downloadUrl, [`${SITE}/yuklab/${dl.windows.file}`, `${SITE}/yuklab/${dl.android.file}`]);
  assert.equal(readFileSync(join(DIST, ".yuklab"), "utf8"),
    `windows ${dl.windows.file} ${dl.windows.sha256} ${dl.windows.bytes}\nandroid ${dl.android.file} ${dl.android.sha256} ${dl.android.bytes}\n`, "deploy uchun ro'yxat");
  assert.match(html, /install\.html\?p=ios/);
  assert.match(html, /data-current hidden/, "«Sizning qurilmangiz» — brauzerda ochiladi");
  for (const page of ["index.html", join("aloqa", "index.html")]) {
    const h = readFileSync(join(DIST, page), "utf8");
    assert.match(h, /href="\/yuklab-olish\/"/, `${page}: o'rnatish havolasi /yuklab-olish/ ga`);
    assert.doesNotMatch(h, /install\.html"/, `${page}: install.html ga to'g'ridan-to'g'ri havola qolmasin`);
  }
});

await test("ichki havolalar va resurslar: buzuq manzil yo'q", () => {
  const exists = (u) => {
    const p = decodeURIComponent(u.split(/[?#]/)[0]);
    if (p === "" || p === "/") return true;
    if (/^\/(yuklab|media)\//.test(p)) return true; // serverda alohida papkadan — borligini deploy-vps.sh tekshiradi
    return existsSync(join(DIST, p)) && (!p.endsWith("/") || existsSync(join(DIST, p, "index.html")));
  };
  for (const { path, html } of all) {
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) assert.ok(exists(m[1]), `${path}: buzuq havola ${m[1]}`);
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(",")) assert.ok(exists(part.trim().split(" ")[0]), `${path}: srcset ${part}`);
    for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), `${path}: #${m[1]} langari yo'q`);
  }
});
await test("CSP bilan mos: inline skript, onclick va style atributlari yo'q; JSON-LD to'g'ri", () => {
  for (const { path, html } of all) {
    for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      const a = m[1];
      if (/type="application\/(ld\+)?json"/.test(a)) { JSON.parse(m[2]); continue; }
      assert.ok(/\bsrc="/.test(a) && !m[2].trim(), `${path}: inline skript`);
    }
    assert.ok(!/\son[a-z]+="/i.test(html), `${path}: on*= hodisa atributi`);
    assert.ok(!/\sstyle="/.test(html), `${path}: style atributi (CSP style-src 'self')`);
  }
  const headers = readFileSync(join(DIST, "_headers"), "utf8");
  assert.match(headers, /script-src 'self';/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/admin\/\*\n\s+X-Robots-Tag: noindex, nofollow/);
});
await test("rasmlar: alt matni va o'lchami bor (sahifa siljimasin)", () => {
  for (const { path, html } of all) {
    for (const m of html.matchAll(/<img\b([^>]*)>/g)) {
      assert.match(m[1], /\salt="/, `${path}: alt yo'q — ${m[0].slice(0, 80)}`);
      if (!/cover-art|i\.ytimg\.com/.test(m[1])) assert.match(m[1], /\swidth="\d+"[^>]*\sheight="\d+"/, `${path}: o'lcham yo'q — ${m[0].slice(0, 80)}`);
    }
  }
});
await test("o'zbekcha tipografiya: matnda o'/g' emas — o‘/g‘; «» qo'shtirnoq", () => {
  for (const { path, html } of all) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    const bad = text.match(/[A-Za-z][oOgG]'[a-z]|\b[oOgG]'[a-z]/g);
    assert.ok(!bad, `${path}: ${bad && bad.slice(0, 3).join(", ")}`);
  }
  assert.equal(typo("O'zbek tilida bog'lanish, ma'lumot"), "O‘zbek tilida bog‘lanish, ma’lumot");
});
await test("asossiz da'volar yo'q: soxta statistika, kafolat, «eng yaxshi», mijoz soni", () => {
  const banned = /\b\d{2,}\s?\+?\s?(mijoz|do‘kon|biznes)lar?\b|kafolat|eng yaxshi|№\s?1|100\s?%|daromadingiz\s+\d|minglab mijoz/i;
  for (const { path, html } of site) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    const m = banned.exec(text);
    assert.ok(!m, `${path}: «${m && m[0]}»`);
  }
});
await test("halollik: qisman mos sohalar sahifasida yo'q imkoniyatlar ochiq yozilgan", () => {
  for (const ind of INDUSTRY_PAGES.filter((i) => i.fit === "partial")) {
    const html = byPath(`/biznes-turlari/${ind.slug}/index.html`).html;
    assert.ok(ind.limits?.length, `${ind.slug}: limits bo'sh`);
    assert.match(html, /Hozircha mavjud emas/, ind.slug);
    assert.match(html, /Qisman mos/, ind.slug);
  }
});
await test("huquqiy hujjatlar: saytning o'z matni, demo so'rovi bandlari va rekvizitlar", () => {
  const priv = byPath("/maxfiylik/index.html").html;
  for (const n of ["2.7.", "3.6.", "5.3."]) assert.ok(LEGAL_DOCS.maxfiylik.sections.some(([, ps]) => ps.some((p) => p.startsWith(n))), `maxfiylik ${n}`);
  assert.match(priv, /Saytdagi demo so‘rovlari 12 oy saqlanadi/);
  assert.match(priv, /STIR/);
  assert.match(byPath("/oferta/index.html").html, /Ommaviy oferta/);
});

console.log("\nVideo qo'llanmalar");
await test("namuna videolar: kartochka, oldindan chizilgan sahifa (VideoObject), bo'lim va biznes turi sahifalarida", () => {
  const lib = byPath("/video-qollanmalar/index.html").html;
  assert.match(lib, /Namuna: Kassada birinchi sotuv/);
  assert.match(lib, /href="\/video-qollanmalar\/namuna-kassada-birinchi-sotuv\/"/);
  const v = byPath("/video-qollanmalar/namuna-kassada-birinchi-sotuv/index.html").html;
  assert.match(v, /"@type":"VideoObject"/);
  assert.match(v, /data-embed="https:\/\/www\.youtube-nocookie\.com\/embed\/AAAAAAAAAAA\?/);
  assert.match(v, /Qadamma-qadam/);
  assert.ok(!/<iframe/.test(v), "YouTube faqat bosilganda yuklanadi");
  const mp4 = byPath("/video-qollanmalar/namuna-restoran-zal-va-stollar/index.html").html;
  assert.match(mp4, /data-kind="file" data-src="https:\/\/cdn\.example\.uz\/namuna\/restoran\.mp4"/);
  const body = (p) => byPath(p).html.replace(/<script[\s\S]*?<\/script>/g, ""); // sayt-ma'lumot bloki (barcha slug'lar) hisobga olinmaydi
  assert.match(body("/biznes-turlari/restoran/index.html"), /namuna-restoran-zal-va-stollar/);
  assert.match(body("/biznes-turlari/mehmonxona/index.html"), /namuna-restoran-zal-va-stollar/);
  assert.ok(!/namuna-restoran/.test(body("/biznes-turlari/dorixona/index.html")), "boshqa soha videosi chiqmasin");
  // imkoniyat kartochkasi: aynan bog'langan video
  assert.match(byPath("/imkoniyatlar/index.html").html, /data-cap="savdo:kassa"><a class="cap-video cap-video--on" href="\/video-qollanmalar\/namuna-kassada-birinchi-sotuv\/"/);
});
await test("video yo'q bo'lsa: soxta video emas — «tez orada» holati", () => {
  const home = readFileSync(join(EMPTY, "index.html"), "utf8");
  assert.match(home, /Video qo‘llanmalar tayyorlanmoqda/);
  assert.ok(!/class="tcard"/.test(home));
  assert.match(readFileSync(join(EMPTY, "biznes-turlari", "dorixona", "index.html"), "utf8"), /Bu bo‘lim uchun video qo‘llanma tez orada qo‘shiladi\./);
  assert.match(readFileSync(join(EMPTY, "imkoniyatlar", "index.html"), "utf8"), /Video qo‘llanma tez orada/);
});
await test("o'z video qo'llanmalaringiz (frontend/content/tutorials.json): har qator sayt qoidasiga mos, fayl bo'lsa — /media/ da ?v= xesh bilan", () => {
  const rows = JSON.parse(read("frontend/content/tutorials.json"));
  const media = (ext) => new RegExp(`^https://tizimchi\\.com/media/qollanmalar/[a-z0-9-]+\\.${ext}\\?v=[0-9a-f]{10}$`);
  for (const r of rows) {
    const t = T.normalize(r);
    assert.ok(t, `noto'g'ri qator: ${r.slug}`);
    if (t.video.kind === "file" && r.video_url.startsWith("https://tizimchi.com/")) {
      assert.match(r.video_url, media("mp4"), r.slug);
      assert.match(r.thumbnail_url, media("jpg"), r.slug);
    }
    const group = CAPABILITY_GROUPS.find((g) => g.id === t.section);
    assert.ok(group, `bo'lim: ${t.section}`);
    if (t.capability) assert.ok(group.items.some((x) => x.id === t.capability), `imkoniyat: ${t.section}:${t.capability}`);
  }
});
await test("npm run video: YouTube havola qo'shiladi → backend'siz build sahifasini yaratadi; noto'g'ri bo'lim va havola rad etiladi; o'chiriladi", () => {
  const file = join(ROOT, "frontend", "content", "tutorials.json");
  const orig = existsSync(file) ? readFileSync(file, "utf8") : null;
  const cli = (...a) => spawnSync(process.execPath, [join(ROOT, "tools", "video.mjs"), ...a], { cwd: ROOT, encoding: "utf8" });
  const out = join(ROOT, ".test-dist-local");
  try {
    let r = cli("add", "https://youtu.be/dQw4w9WgXcQ", "--title", "Sinov: kassada qaytarish", "--section", "savdo", "--capability", "kassa",
      "--duration", "1:05", "--steps", "Birinchi | Ikkinchi", "--featured");
    assert.equal(r.status, 0, r.stderr);
    const row = JSON.parse(readFileSync(file, "utf8")).find((x) => x.slug === "sinov-kassada-qaytarish");
    assert.ok(row, "manzil sarlavhadan: o' → o, «:» tushib qoladi");
    assert.deepEqual([row.duration_sec, row.steps, row.is_featured, row.product_section, row.capability], [65, ["Birinchi", "Ikkinchi"], true, "savdo", "kassa"]);
    build(".test-dist-local", "live");
    assert.ok(existsSync(join(out, "video-qollanmalar", "sinov-kassada-qaytarish", "index.html")));
    assert.match(readFileSync(join(out, "index.html"), "utf8"), /class="tcard"/, "tanlangan video bosh sahifada");
    assert.notEqual(cli("add", "https://youtu.be/dQw4w9WgXcQ", "--title", "X", "--section", "yoq").status, 0);
    assert.match(cli("add", "https://vimeo.com/1", "--title", "X", "--section", "savdo").stderr, /faqat YouTube/);
    assert.equal(cli("remove", "sinov-kassada-qaytarish").status, 0);
    assert.ok(!JSON.parse(readFileSync(file, "utf8")).some((x) => x.slug === "sinov-kassada-qaytarish"));
  } finally {
    if (orig === null) rmSync(file, { force: true }); else writeFileSync(file, orig);
    rmSync(out, { recursive: true, force: true });
  }
});
await test("yuklab olish fayli bo'lmasa: soxta tugma yo'q — Android va kompyuter brauzer orqali; noto'g'ri downloads.json build'ni to'xtatadi", () => {
  const html = readFileSync(join(EMPTY, "yuklab-olish", "index.html"), "utf8");
  assert.doesNotMatch(html, /\/yuklab\/|data-platform="windows"/);
  assert.match(html, /<h2 class="dl-title">Kompyuter<\/h2>/);
  assert.match(html, /Chrome’da ochish/);
  assert.equal(readFileSync(join(EMPTY, ".yuklab"), "utf8"), "");
  const bad = join(ROOT, ".test-bad-downloads.json");
  try {
    writeFileSync(bad, JSON.stringify({ windows: { file: "virus.exe", version: "1.0.0", bytes: 1, sha256: "x" } }));
    const r = run(".test-dist-bad", "none", {}, ".test-bad-downloads.json");
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /downloads\.json: «windows» yozuvi noto'g'ri/);
  } finally { rmSync(bad, { force: true }); rmSync(join(ROOT, ".test-dist-bad"), { recursive: true, force: true }); }
});
await test("video manzili qoidasi: YouTube yoki https .mp4/.webm (backend bilan bir xilligi — tests/db.test.mjs)", () => {
  const ok = ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s", "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "https://cdn.example.uz/v/kassa.mp4"];
  const bad = ["http://youtu.be/dQw4w9WgXcQ", "https://youtu.be/short", "https://vimeo.com/123", "javascript:alert(1)", "https://evil.example/watch?v=dQw4w9WgXcQ"];
  for (const u of ok) assert.ok(T.parseVideo(u), u);
  for (const u of bad) assert.equal(T.parseVideo(u), null, u);
  assert.equal(T.parseVideo("https://youtu.be/dQw4w9WgXcQ?t=90").start, 90);
  assert.match(T.parseVideo("https://youtu.be/dQw4w9WgXcQ").embed, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
});
await test("filtr va qidiruv: biznes turi («umumiy» hammaga), bo'lim, daraja, so'z", () => {
  const list = T.sortTutorials(JSON.parse(read("tests/fixtures/tutorials.json")).map(T.normalize).filter(Boolean));
  assert.equal(list.length, 3);
  assert.deepEqual(T.filterTutorials(list, { industry: "dorixona" }).map((t) => t.slug), ["namuna-kassada-birinchi-sotuv"]);
  assert.deepEqual(T.filterTutorials(list, { industry: "restoran", level: "intermediate" }).map((t) => t.slug), ["namuna-restoran-zal-va-stollar"]);
  assert.deepEqual(T.filterTutorials(list, { q: "QARZ" }).map((t) => t.slug), ["namuna-qarzga-sotish"]);
  assert.deepEqual(T.filterTutorials(list, { q: "to‘lovni" }).map((t) => t.slug), ["namuna-kassada-birinchi-sotuv"]);
  assert.deepEqual(T.filterTutorials(list, { section: "mijozlar" }).map((t) => t.slug), ["namuna-qarzga-sotish"]);
});
await test("telefon: +998 formati", () => {
  assert.equal(uzPhone("90 123 45 67"), "+998 90 123 45 67");
  assert.equal(uzPhone("+998901234567"), "+998 90 123 45 67");
  assert.equal(uzPhone("12345"), "");
});

console.log("\nSayt boshqaruvi (/admin/) va backend sozlamasi");
await test("/admin/: indekslanmaydi, bitta H1, faqat o'z skripti; taksonomiya va imkoniyatlar ma'lumotda", () => {
  const html = byPath("/admin/index.html").html;
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.match(html, /<script type="module" src="\/assets\/js\/admin\.[0-9a-f]{8}\.js"><\/script>/);
  assert.ok(!/\/assets\/js\/main\./.test(html), "admin sahifada sayt skripti yuklanmaydi");
  const d = dataOf(html, "admin-data");
  assert.deepEqual(d.order.industries, INDUSTRIES.map(([c]) => c));
  assert.deepEqual(d.order.sections, SECTIONS.map(([c]) => c));
  for (const g of CAPABILITY_GROUPS) assert.deepEqual((d.caps[g.id] || []).map(([c]) => c), g.items.map((x) => x.id), `imkoniyatlar: ${g.id}`);
  for (const g of CAPABILITY_GROUPS) assert.ok(SECTIONS.some(([c]) => c === g.id), `bo'lim yo'q: ${g.id}`);
  for (const i of INDUSTRY_PAGES) for (const s of i.sections) assert.ok(SECTIONS.some(([c]) => c === s), `${i.slug}: ${s}`);
  assert.ok(Object.values(d.icons).every(Boolean), "admin ikonkalari to'liq");
});
await test("backend ulanmagan: forma hech qayerga yubormaydi (halol xabar), CSP faqat 'self'", () => {
  const d = dataOf(readFileSync(join(EMPTY, "aloqa", "index.html"), "utf8"), "site-data");
  assert.equal(d.leadEndpoint, "");
  assert.equal(d.tutorialsLive, false);
  assert.equal(dataOf(readFileSync(join(EMPTY, "admin", "index.html"), "utf8"), "admin-data").supabaseUrl, "");
  assert.match(readFileSync(join(EMPTY, ".csp"), "utf8"), /connect-src 'self';/);
  assert.match(read("frontend/src/client/main.js"), /if \(!D\.leadEndpoint\)/);
});
await test("backend ulangan: forma → site_lead_submit, CSP'da faqat o'sha manzil, SITE_URL muhitdan", () => {
  const d = dataOf(readFileSync(join(LIVE, "aloqa", "index.html"), "utf8"), "site-data");
  assert.equal(d.leadEndpoint, `${SUPA}/rest/v1/rpc/site_lead_submit`);
  assert.equal(d.tutorialsLive, true);
  assert.match(readFileSync(join(LIVE, ".csp"), "utf8"), new RegExp(`connect-src 'self' ${SUPA.replace(/\./g, "\\.")};`));
  assert.match(readFileSync(join(LIVE, "index.html"), "utf8"), /<link rel="canonical" href="https:\/\/tizimchi-sayt\.netlify\.app\/">/);
  assert.match(readFileSync(join(LIVE, "robots.txt"), "utf8"), /Sitemap: https:\/\/tizimchi-sayt\.netlify\.app\/sitemap\.xml/);
});
await test("maxfiy kalit saytga tushmaydi: service_role va sb_secret_ build'ni to'xtatadi", () => {
  const role = (r) => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ role: r })).toString("base64url")}.sig`;
  const r1 = run(".test-dist-bad", "none", { SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: role("service_role") });
  assert.notEqual(r1.status, 0);
  assert.match(r1.stderr, /service_role/);
  const r2 = run(".test-dist-bad", "none", { SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: "sb_secret_abc123" });
  assert.notEqual(r2.status, 0);
  const r3 = run(".test-dist-bad", "none", { SUPABASE_URL: "http://evil.example", SUPABASE_ANON_KEY: ANON });
  assert.notEqual(r3.status, 0, "https bo'lmagan backend manzili");
  const r4 = run(".test-dist-bad", "none", { SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: "sb_publishable_abc123" });
  assert.equal(r4.status, 0, `yangi publishable kalit ishlashi kerak: ${r4.stderr}`);
  rmSync(join(ROOT, ".test-dist-bad"), { recursive: true, force: true });
});
await test("so'rov sarlavhalari: JWT kalit — Authorization ham; publishable kalit — faqat apikey; foydalanuvchi tokeni ustun", () => {
  assert.deepEqual(apiHeaders(ANON), { apikey: ANON, Authorization: `Bearer ${ANON}` });
  assert.deepEqual(apiHeaders("sb_publishable_x"), { apikey: "sb_publishable_x" });
  assert.deepEqual(apiHeaders("sb_publishable_x", "eyJuser"), { apikey: "sb_publishable_x", Authorization: "Bearer eyJuser" });
});
await test("kadrlar va tur: har bir ekran fayli bor", () => {
  const used = new Set([...INDUSTRY_PAGES.flatMap((i) => [i.shots.desktop, i.shots.phone]), ...TOUR.flatMap((g) => g.views.map((v) => v.shot)), "d-hisobot", "p-savdo"]);
  for (const s of used) {
    assert.ok(SHOTS[s], `shots.mjs: ${s}`);
    for (const d of SHOTS[s].dprs) assert.ok(existsSync(join(ROOT, "frontend", "assets", "shots", `${s}@${d}x.webp`)), `${s}@${d}x.webp`);
  }
});
await test("loyiha mustaqil: kodda boshqa loyiha (dokon_app) fayllariga yo'l yo'q", () => {
  const files = ["scripts/build.mjs", "scripts/dev.mjs", "frontend/src/build/layout.mjs", "frontend/src/build/pages-misc.mjs", "frontend/src/client/main.js", "frontend/src/client/admin.js"];
  for (const f of files) assert.ok(!/web\/config\.js|web\/js\/|\.\.\/\.\.\/\.\.\/|supabase\/functions/.test(read(f)), f);
});

for (const d of [DIST, EMPTY, LIVE]) rmSync(d, { recursive: true, force: true });
console.log(`\n${passed} ta o'tdi, ${failed} ta xato`);
process.exit(failed ? 1 : 0);
