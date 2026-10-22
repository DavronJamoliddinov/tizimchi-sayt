// Sayt uchun ilovaning HAQIQIY ekranlari: Tizimchi ilovasining demo.html sahifasi (lokal, namunaviy ma'lumotlar) → frontend/assets/shots/*.webp
// Har bir kadr bir nechta zichlikda (1x, 1.5x, 2x) olinadi — saytda srcset bilan beriladi.
// Ishlatish: npm run shots [-- nom ...]   (argumentsiz — hammasi)
//   APP_DIR=papka    — Tizimchi ilovasi loyihasi (standart: ../dokon_app)
//   SHOTS_OUT=papka  — boshqa joyga yozish (masalan, ko'rib chiqish uchun)
//   SHOTS_DPR=1      — faqat bitta zichlik (tez tekshirish)
import fs from "node:fs";
import path from "node:path";
import { startServer, launch, newPage, settle, sleep, ROOT } from "./lib.mjs";

const OUT = process.env.SHOTS_OUT || path.join(ROOT, "frontend", "assets", "shots");
const DPRS = process.env.SHOTS_DPR ? [Number(process.env.SHOTS_DPR)] : null;
const want = new Set(process.argv.slice(2));
fs.mkdirSync(OUT, { recursive: true });

/** Demo bazasini boyitish: o'tgan 29 kunlik va bugungi sotuvlar (grafik va hisobot tabiiy ko'rinsin). Tasodif doim bir xil (seed). */
async function enrich(page, base, query = "") {
  await page.goto(`${base}/demo.html${query}`, { waitUntil: "networkidle0" });
  await settle(page, 600);
  await page.evaluate(async () => {
    const KEY = "dokon.demo.db.v4";
    const db0 = JSON.parse(localStorage.getItem(KEY));
    if (db0.__siteEnriched) return;
    const inv = (name) => db0.inventory.find((x) => x.name === name);
    const sale = async (date, time, method, client, items, phone) => {
      const p = {
        date, time, payment_method: method, client_name: client || "", client_phone: phone || "", client_uuid: crypto.randomUUID(),
        items: items.filter(([name]) => inv(name)).map(([name, qty]) => {
          const x = inv(name);
          return { inventory_id: x.id, name: x.name, catalog_no: x.catalog_no || "", qty, unit_price: x.sell_price, currency: x.currency };
        }),
      };
      if (p.items.length) await sb.rpc("create_sale", { p });
    };
    let seed = 20261010;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const names = db0.inventory.filter((x) => x.qty > 0 && x.sell_price > 0).map((x) => x.name);
    const buyers = ["", "", "", "Jasur usta", "Sardor", "Vali aka (taksi)", "Rustam (Malibu)"];
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    for (let k = 29; k >= 1; k--) {
      const d = new Date(); d.setDate(d.getDate() - k);
      const cnt = 7 + Math.floor(rnd() * 5);
      for (let j = 0; j < cnt; j++) {
        const items = [[names[Math.floor(rnd() * names.length)], 1 + Math.floor(rnd() * 3)]];
        if (rnd() < 0.3) items.push([names[Math.floor(rnd() * names.length)], 1 + Math.floor(rnd() * 2)]);
        const r = rnd(), method = r < 0.5 ? "cash" : r < 0.75 ? "card" : r < 0.93 ? "transfer" : "debt";
        const client = method === "debt" ? buyers[3 + Math.floor(rnd() * 3)] : buyers[Math.floor(rnd() * buyers.length)];
        const hh = 9 + Math.floor((j / cnt) * 10), mm = Math.floor(rnd() * 60);
        await sale(iso(d), `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, method, client, items);
      }
    }
    const today = iso(new Date());
    for (const [time, method, client, items] of [
      ["09:05", "cash", "", [["Svecha NGK", 4], ["Motor moyi 5W-30 4L", 2]]], ["09:24", "card", "", [["Tormoz kolodkasi Spark", 1]]],
      ["09:48", "cash", "", [["Antifriz 5L", 2]]], ["10:12", "transfer", "", [["Generator remeni Cobalt", 1], ["Termostat Lacetti", 1]]],
      ["10:31", "cash", "", [["Moy filtri Cobalt", 3]]], ["10:56", "card", "Jasur usta", [["Rul nakonechnigi Nexia", 2]]],
      ["11:20", "cash", "", [["Akkumulyator 60Ah", 1]]], ["11:42", "cash", "Sardor", [["Svecha NGK", 8]]],
      ["12:05", "debt", "Dilshod (Cobalt)", [["Tormoz diski Nexia", 2]]], ["12:27", "card", "", [["Motor moyi 5W-30 4L", 3], ["Moy filtri Cobalt", 1]]],
      ["12:50", "cash", "", [["Stupitsa podshipnigi Matiz", 1]]], ["13:08", "transfer", "", [["Antifriz 5L", 1], ["Svecha NGK", 4]]],
      ["13:26", "cash", "Bobur aka", [["Tormoz kolodkasi Spark", 2]]], ["13:41", "cash", "", [["Termostat Lacetti", 1]]],
      ["13:55", "card", "Rustam (Malibu)", [["Akkumulyator 60Ah", 1]]], ["14:09", "cash", "", [["Generator remeni Cobalt", 2]]],
    ]) await sale(today, time, method, client, items);
    const db = JSON.parse(localStorage.getItem(KEY));
    // Ombor qoldiqlari boshlang'ich holatida qolsin (minusga tushmasin)
    db.inventory.forEach((x) => { const o = db0.inventory.find((y) => y.id === x.id); if (o) x.qty = o.qty; });
    db.inventory_stock = db0.inventory_stock;
    db.profiles[0].shop_name = "Avto Ali";
    db.tg = Array.from(new Set([...(db.tg || []), "931112233", "977001020", "905554411", "993210077"]));
    db.__siteEnriched = true;
    localStorage.setItem(KEY, JSON.stringify(db));
  });
}

/** Dorixona: faqat dorilar, «Shifo dorixonasi» nomi va bugungi bir nechta sotuv (avto qismlar ko'rinmasin) */
async function pharmacy(page, base) {
  await page.goto(`${base}/demo.html?dorixona=1`, { waitUntil: "networkidle0" });
  await settle(page, 700);
  await page.evaluate(() => {
    const KEY = "dokon.demo.db.v4";
    const db = JSON.parse(localStorage.getItem(KEY));
    const drugs = new Set(db.inventory.filter((x) => x.inn).map((x) => x.id));
    db.inventory = db.inventory.filter((x) => drugs.has(x.id));
    for (const k of ["inventory_stock", "inventory_lots", "stock_moves"]) db[k] = (db[k] || []).filter((x) => drugs.has(x.inventory_id));
    for (const k of ["sales", "sale_items", "sale_returns", "sale_return_items", "clients", "client_transactions", "orders", "order_items",
      "purchases", "purchase_items", "supplier_transactions", "reminders", "audit_log"]) db[k] = [];
    db.profiles[0].shop_name = "Shifo dorixonasi";
    localStorage.setItem(KEY, JSON.stringify(db));
  });
  await page.goto(`${base}/demo.html?dorixona=1&tab=savdo`, { waitUntil: "networkidle0" });
  await settle(page, 700);
  await page.evaluate(async () => {
    const KEY = "dokon.demo.db.v4";
    const db = JSON.parse(localStorage.getItem(KEY));
    const inv = (name) => db.inventory.find((x) => x.name.startsWith(name));
    const iso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    for (const [time, method, items] of [["09:12", "cash", [["Paratsetamol-Nobel", 2]]], ["09:40", "card", [["Ibuprofen", 1], ["Drotaverin", 1]]],
      ["10:25", "cash", [["Efferalgan", 1]]], ["11:05", "card", [["Amoksiklav", 1]]], ["12:30", "cash", [["No-shpa", 1], ["Paratsetamol sirop", 1]]],
      ["13:15", "transfer", [["Augmentin", 1]]], ["13:50", "cash", [["Drotaverin", 2]]]]) {
      const p = { date: iso, time, payment_method: method, client_uuid: crypto.randomUUID(), note: "",
        items: items.map(([n, qty]) => { const x = inv(n); return { inventory_id: x.id, name: x.name, qty, unit_price: x.sell_price, currency: x.currency }; }) };
      await sb.rpc("create_sale", { p });
    }
  });
}

/**
 * Boshqa soha uchun namunaviy do'kon: avto qismlar o'rniga shu sohaning tovarlari, do'kon turi (funksiyalar), bugungi sotuvlar.
 * @param {{ name: string, features: object, supplier: string, items: object[], sales: [string, string, [string, number][]][] }} o
 */
function shopOf(o) {
  return async (page, base) => {
    await page.goto(`${base}/demo.html`, { waitUntil: "networkidle0" });
    await settle(page, 600);
    await page.evaluate((o) => {
      const KEY = "dokon.demo.db.v4";
      const db = JSON.parse(localStorage.getItem(KEY));
      for (const k of ["inventory", "inventory_stock", "inventory_lots", "stock_moves", "sales", "sale_items", "sale_returns", "sale_return_items",
        "clients", "client_transactions", "orders", "order_items", "purchases", "purchase_items", "supplier_transactions", "suppliers", "reminders", "audit_log"]) db[k] = [];
      db.profiles[0].shop_name = o.name;
      db.profiles[0].features = o.features;
      localStorage.setItem(KEY, JSON.stringify(db));
    }, o);
    await page.goto(`${base}/demo.html?tab=savdo`, { waitUntil: "networkidle0" });
    await settle(page, 700);
    await page.evaluate(async (o) => {
      const r = await sb.rpc("stock_receive", { p: { supplier_name: o.supplier, doc_no: "N-210", items: o.items } });
      if (r.error) console.log("stock_receive", r.error.message);
      const db = JSON.parse(localStorage.getItem("dokon.demo.db.v4"));
      const inv = (name) => db.inventory.find((x) => x.name.startsWith(name));
      const iso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      for (const [time, method, items] of o.sales) {
        const p = { date: iso, time, payment_method: method, client_uuid: crypto.randomUUID(),
          items: items.map(([n, qty]) => { const x = inv(n); return { inventory_id: x.id, name: x.name, qty, unit_price: x.sell_price, currency: x.currency, unit: x.unit }; }) };
        const s = await sb.rpc("create_sale", { p });
        if (s.error) console.log("sale", s.error.message);
      }
    }, o);
  };
}
const FEAT = (kind, on) => ({ kind, parts: false, barcode: true, scale: false, expiry: false, discounts: true, fiscal: true, units2: false, wholesale: false,
  tiers: false, calc: false, holds: false, services: false, pharmacy: false, restaurant: false, ...on });
const QURILISH = shopOf({
  name: "Mustahkam", supplier: "Qurilish Savdo Opt", features: FEAT("build", { units2: true, wholesale: true, tiers: true, calc: true, holds: true, services: true }),
  items: [
    { name: "Kafel 30×60 «Granit»", unit: "m²", qty: 186, unit_price: 85000, sell_price: 110000, alt_unit: "quti", alt_ratio: 1.44, alt_price: 158000,
      price_tiers: [{ min: 10, price: 102000 }, { min: 50, price: 95000 }], calc_base: "m2", calc_rate: 1, calc_layers: 1, calc_reserve: 10, barcode: "4780002000017" },
    { name: "Sement M400, 50 kg", unit: "qop", qty: 240, unit_price: 52000, sell_price: 62000, wholesale_price: 58000, barcode: "4780002000024" },
    { name: "Plitka yelimi CM 11, 25 kg", unit: "qop", qty: 64, unit_price: 68000, sell_price: 82000, calc_base: "m2", calc_rate: 0.16, calc_layers: 1, calc_reserve: 5 },
    { name: "Gipsokarton 12,5 mm", unit: "list", qty: 90, unit_price: 48000, sell_price: 59000, wholesale_price: 55000 },
    { name: "Armatura A500 Ø12", unit: "tonna", qty: 6, unit_price: 8200000, sell_price: 9100000, alt_unit: "dona", alt_ratio: 0.0104, alt_price: 98000 },
    { name: "Bo'yoq oq, 10 l", unit: "dona", qty: 35, unit_price: 145000, sell_price: 189000, calc_base: "m2", calc_rate: 0.012, calc_layers: 2, calc_reserve: 5 },
    { name: "Gruntovka, 10 l", unit: "dona", qty: 28, unit_price: 98000, sell_price: 125000 },
    { name: "Plintus PVX, 2,5 m", unit: "dona", qty: 140, unit_price: 21000, sell_price: 29000 },
  ],
  sales: [["09:20", "cash", [["Sement", 10]]], ["10:05", "card", [["Kafel", 28.8], ["Plitka yelimi", 3]]], ["11:40", "transfer", [["Gipsokarton", 12]]],
    ["12:15", "cash", [["Bo'yoq", 2], ["Gruntovka", 1]]], ["13:30", "card", [["Plintus", 16]]]],
});
const MARKET = shopOf({
  name: "Barakali market", supplier: "Oziq-ovqat Distribyutor", features: FEAT("market", { scale: true, expiry: true, units2: true }),
  items: [
    { name: "Non «Bo'lka»", unit: "dona", qty: 60, unit_price: 3000, sell_price: 3500, barcode: "4780003000016", shelf_life_days: 2 },
    { name: "Sut 2,5% 1 l", unit: "dona", qty: 48, unit_price: 9500, sell_price: 11500, barcode: "4780003000023", shelf_life_days: 6 },
    { name: "Coca-Cola 1,5 l", unit: "dona", qty: 96, unit_price: 9000, sell_price: 12000, barcode: "5449000000996", alt_unit: "blok", alt_ratio: 6, alt_price: 69000 },
    { name: "Guruch «Lazer», 1 kg", unit: "dona", qty: 70, unit_price: 14000, sell_price: 17000, barcode: "4780003000030" },
    { name: "Olma «Golden»", unit: "kg", qty: 85, unit_price: 9000, sell_price: 14000, barcode: "2200101000003" },
    { name: "Tuxum, 10 dona", unit: "dona", qty: 40, unit_price: 14000, sell_price: 17000, barcode: "4780003000047", shelf_life_days: 20 },
    { name: "Kungaboqar yog'i, 1 l", unit: "dona", qty: 55, unit_price: 19000, sell_price: 23500, barcode: "4780003000054" },
    { name: "Choy «Ahmad», 100 g", unit: "dona", qty: 36, unit_price: 21000, sell_price: 27000, barcode: "4780003000061" },
  ],
  sales: [["08:40", "cash", [["Non", 4], ["Sut", 2]]], ["09:15", "card", [["Coca-Cola", 2], ["Guruch", 3]]], ["10:02", "cash", [["Olma", 1.5], ["Tuxum", 1]]],
    ["11:30", "card", [["Kungaboqar", 2], ["Choy", 1]]], ["12:45", "cash", [["Non", 2], ["Coca-Cola", 1]]], ["13:20", "transfer", [["Guruch", 5], ["Sut", 3]]]],
});
const XOJALIK = shopOf({
  name: "Uy-ro'zg'or", supplier: "Xo'jalik Opt", features: FEAT("other", {}),
  items: [
    { name: "Lampochka LED 10W E27", unit: "dona", qty: 120, unit_price: 8000, sell_price: 13000, barcode: "4780004000015", min_qty: 20 },
    { name: "Kran-mikser oshxona uchun", unit: "dona", qty: 9, unit_price: 145000, sell_price: 210000, barcode: "4780004000022", min_qty: 3 },
    { name: "Mix 50 mm", unit: "kg", qty: 42, unit_price: 18000, sell_price: 26000, min_qty: 10 },
    { name: "Suv shlangi 1/2\"", unit: "m", qty: 150, unit_price: 4000, sell_price: 7000, min_qty: 30 },
    { name: "Idish yuvish vositasi 450 ml", unit: "dona", qty: 64, unit_price: 14000, sell_price: 19000, barcode: "4780004000039", min_qty: 12 },
    { name: "Plastik chelak 10 l", unit: "dona", qty: 3, unit_price: 18000, sell_price: 27000, barcode: "4780004000046", min_qty: 5 },
    { name: "Rozetka ikkilik", unit: "dona", qty: 38, unit_price: 16000, sell_price: 24000, barcode: "4780004000053", min_qty: 8 },
    { name: "Bolg'a 500 g", unit: "dona", qty: 14, unit_price: 42000, sell_price: 59000, barcode: "4780004000060", min_qty: 4 },
    { name: "Kir yuvish kukuni 3 kg", unit: "dona", qty: 0, unit_price: 52000, sell_price: 69000, barcode: "4780004000077", min_qty: 6 },
  ],
  sales: [["09:10", "cash", [["Lampochka", 4]]], ["10:25", "card", [["Kran-mikser", 1], ["Suv shlangi", 10]]], ["11:50", "cash", [["Idish yuvish", 3], ["Rozetka", 2]]],
    ["13:05", "card", [["Mix", 1.5], ["Bolg'a", 1]]]],
});

/** Kassada savatga tovar qo'shish: qidiruv → Enter → soni → Enter */
async function cartAdd(page, q, qty) {
  await page.focus("#cart-search");
  await page.keyboard.type(q, { delay: 25 });
  await sleep(450);
  await page.keyboard.press("Enter"); await sleep(300);
  await page.keyboard.type(String(qty)); await page.keyboard.press("Enter"); await sleep(350);
}

const DESK = { width: 1440, height: 900, dprs: [1, 1.5, 2] };
const WIDE = { width: 1536, height: 960, dprs: [1, 1.5, 2] }; // hisobot: 9 xonali tushum kartaga sig'sin (o'sha 16:10)
// Telefon: 390×800 — saytdagi ramka tepasiga 44 px status satrini o'zi qo'shadi (jami 844, iPhone)
const PHONE = { width: 390, height: 800, dprs: [2, 3], mobile: true };

/** Kadrlar: nom → { vp, url, setup(page, base), prep(page) } */
const SHOTS = {
  "d-hisobot": { vp: WIDE, url: "?tab=hisobot", setup: enrich, wait: 1200 },
  "d-savdo": {
    vp: DESK, url: "?tab=savdo", setup: enrich, wait: 900,
    prep: async (page) => {
      await cartAdd(page, "tormoz", 2);
      await cartAdd(page, "svecha", 4);
      await cartAdd(page, "antifriz", 1);
      await page.keyboard.press("Escape");
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await sleep(400);
    },
  },
  "d-savdo-qidiruv": {
    vp: DESK, url: "?tab=savdo", setup: enrich, wait: 900,
    prep: async (page) => {
      await cartAdd(page, "tormoz", 2);
      await page.focus("#cart-search");
      await page.keyboard.type("moy", { delay: 25 }); await sleep(600);
    },
  },
  "d-ombor": { vp: DESK, url: "?tab=ombor", setup: enrich, wait: 900 },
  "d-mijozlar": { vp: DESK, url: "?tab=mijozlar", setup: enrich, wait: 1200, prep: async (page) => { await page.evaluate(() => renderView()); await sleep(500); } },
  "d-ruxsatlar": {
    vp: DESK, url: "?tab=sozlamalar", setup: enrich, wait: 900,
    prep: async (page) => {
      await page.evaluate(() => { S.ui.set.page = "xodimlar"; renderView(); });
      const b = await page.waitForSelector('[data-act="staff-perms"]', { timeout: 8000 });
      await b.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await sleep(300);
      await b.click();
      await sleep(900);
    },
  },
  "d-rest-panel": { vp: DESK, url: "?restoran=1&tab=r-panel", wait: 1400 },
  "d-rest-pos": {
    vp: DESK, url: "?restoran=1&tab=r-pos", wait: 1200,
    prep: async (page) => {
      const add = (n) => page.evaluate((n) => { const b = [...document.querySelectorAll('[data-act="rp-add"]')].find((x) => x.getAttribute("aria-label").startsWith(n + ",")); if (b) b.click(); return !!b; }, n);
      // Zalda: avval stol tanlanadi (ilova o'zi so'raydi) — bo'sh stollardan biri
      await add("To'y oshi");
      await sleep(500);
      const tables = await page.$$('.sheet [data-act="rp-table-set"]');
      if (tables.length) { await tables[Math.min(3, tables.length - 1)].click(); await sleep(500); }
      for (const [name, times] of [["To'y oshi", 2], ["Achchiq-chuchuk", 1], ["Non", 2], ["Ko'k choy (choynak)", 1]]) {
        for (let i = 0; i < times; i++) {
          await add(name);
          await sleep(250);
          if (await page.$(".sheet")) { await page.keyboard.press("Escape"); await sleep(300); }
        }
      }
      await sleep(400);
    },
  },
  "d-rest-zal": { vp: DESK, url: "?restoran=1&tab=r-tables", wait: 1200 },
  "d-rest-oshxona": { vp: DESK, url: "?restoran=1&tab=r-kitchen", wait: 1400 },
  "d-rest-menyu": { vp: DESK, url: "?restoran=1&tab=r-menu", wait: 1200 },
  "d-dori-savdo": {
    vp: DESK, url: "?dorixona=1&tab=savdo", setup: pharmacy, wait: 1000,
    prep: async (page) => { await page.focus("#cart-search"); await page.keyboard.type("panadol", { delay: 25 }); await sleep(900); },
  },
  "d-dori-ombor": { vp: DESK, url: "?dorixona=1&tab=ombor", setup: pharmacy, wait: 1000 },
  "p-savdo": { vp: PHONE, url: "?tab=savdo", setup: enrich, wait: 900 },
  "p-hisobot": { vp: PHONE, url: "?tab=hisobot", setup: enrich, wait: 1200 },
  "p-mijozlar": { vp: PHONE, url: "?tab=mijozlar", setup: enrich, wait: 1200, prep: async (page) => { await page.evaluate(() => renderView()); await sleep(500); } },
  "p-rest-ofitsiant": { vp: PHONE, url: "?restoran=1&role=cashier&job=waiter&tab=r-waiter", wait: 1400 },
  "p-rest-oshxona": { vp: PHONE, url: "?restoran=1&role=cashier&job=kitchen&tab=r-kitchen", wait: 1400 },
  "p-dori-savdo": {
    vp: PHONE, url: "?dorixona=1&tab=savdo", setup: pharmacy, wait: 1000,
    prep: async (page) => { await page.focus("#cart-search"); await page.keyboard.type("panadol", { delay: 25 }); await sleep(900); },
  },
  // Qurilish mollari: kafel m² da (ikki birlik — quti), armatura tonnada; miqdorga qarab narx o'zi qo'llanadi
  "d-qurilish-ombor": { vp: DESK, url: "?tab=ombor", setup: QURILISH, wait: 900 },
  "p-qurilish-savdo": {
    vp: PHONE, url: "?tab=savdo", setup: QURILISH, wait: 900,
    prep: async (page) => {
      await cartAdd(page, "kafel", 14.4);
      await cartAdd(page, "sement", 12);
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await sleep(400);
    },
  },
  // Supermarket: shtrix-kodli tovarlar, tarozi (kg), muddat
  "d-market-savdo": {
    vp: DESK, url: "?tab=savdo", setup: MARKET, wait: 900,
    prep: async (page) => {
      await cartAdd(page, "non", 2);
      await cartAdd(page, "sut", 2);
      await cartAdd(page, "olma", 1.25);
      await cartAdd(page, "coca", 1);
      await page.keyboard.press("Escape");
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await sleep(400);
    },
  },
  "p-market-savdo": {
    vp: PHONE, url: "?tab=savdo", setup: MARKET, wait: 900,
    prep: async (page) => {
      await cartAdd(page, "non", 2);
      await cartAdd(page, "olma", 2);
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await sleep(400);
    },
  },
  // Xo'jalik mollari: ko'p mayda tovar, kam qolgan va tugaganlar
  "d-xojalik-ombor": { vp: DESK, url: "?tab=ombor", setup: XOJALIK, wait: 900 },
  "p-xojalik-savdo": {
    vp: PHONE, url: "?tab=savdo", setup: XOJALIK, wait: 900,
    prep: async (page) => {
      await cartAdd(page, "lampochka", 4);
      await cartAdd(page, "rozetka", 2);
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await sleep(400);
    },
  },
};

const { srv, base } = await startServer(5612);
const browser = await launch();
const report = [];
try {
  for (const [name, s] of Object.entries(SHOTS)) {
    if (want.size && !want.has(name)) continue;
    for (const dpr of DPRS || s.vp.dprs) {
      const page = await newPage(browser, { width: s.vp.width, height: s.vp.height, dpr, mobile: !!s.vp.mobile });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      if (s.setup) await s.setup(page, base);
      await page.goto(`${base}/demo.html${s.url}`, { waitUntil: "networkidle0" });
      await settle(page, s.wait || 800);
      if (s.prep) await s.prep(page);
      await page.evaluate(() => { const t = document.getElementById("toasts"); if (t) t.innerHTML = ""; });
      const file = path.join(OUT, `${name}@${dpr}x.webp`);
      await page.screenshot({ path: file, type: "webp", quality: 82 });
      report.push(`${name}@${dpr}x ${Math.round(fs.statSync(file).size / 1024)} KB${errors.length ? "  [xato: " + errors.join("; ") + "]" : ""}`);
      console.log("  ✓", report[report.length - 1]);
      await page.close();
    }
  }
} finally {
  await browser.close();
  srv.close();
}
