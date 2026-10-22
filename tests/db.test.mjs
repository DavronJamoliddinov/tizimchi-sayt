// Backend testi: backend/schema.sql ni haqiqiy PostgreSQL 17 (PGlite, WASM) da Supabase muhiti taqlidi bilan ishga tushiradi.
//   huquqlar (anon, kirgan foydalanuvchi, admin), video qo'llanmalar, demo so'rovi (tekshiruv, bot tuzog'i, spam cheklovi,
//   IP kodlash, 12 oy), admin funksiyalari, Telegram (pg_net taqlidi), taksonomiya va video manzili qoidasi sayt bilan bir xilligi.
// Ishlatish: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const db = new PGlite();

// ---- Supabase muhiti: rollar, auth sxemasi, standart huquqlar (2026: yangi funksiyalarga EXECUTE berilmaydi) ----
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  create schema extensions;
  alter default privileges in schema public grant references, trigger, truncate on tables to anon, authenticated, service_role;
  alter default privileges in schema public revoke execute on functions from public;
`);
const schema = readFileSync(new URL("../backend/schema.sql", import.meta.url), "utf8");
const t0 = Date.now();
await db.exec(schema);
const salt1 = (await db.query("select value from site_private.settings where key = 'ip_salt'")).rows[0].value;
await db.exec(schema); // ikkinchi marta — idempotentlik
console.log(`backend/schema.sql 2 marta bajarildi (${Date.now() - t0} ms)\n`);

// ---- yordamchilar ----
let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log("  ✓", name); } catch (e) { failed++; console.log("  ✗", name, "\n      ", e.message); }
}
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params = []) => (await q(sql, params))[0];
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
/** Supabase API so'rovi kabi: rol, JWT (sub) va so'rov sarlavhalari */
async function as(role, fn, { uid = "", headers = null } = {}) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', ${lit(uid)}, false);
    select set_config('request.headers', ${lit(headers ? JSON.stringify(headers) : "")}, false);`);
  try { return await fn(); } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); select set_config('request.headers', '', false);`);
  }
}
const anon = (fn, o) => as("anon", fn, o);
const asUser = (uid, fn, o) => as("authenticated", fn, { ...o, uid });
async function rejects(promise, re) {
  let err = null;
  try { await promise; } catch (e) { err = e; }
  assert.ok(err, "xato kutilgan edi, lekin muvaffaqiyatli bajarildi");
  if (re) assert.match(err.message, re);
}
const rpc = async (fn, args = []) => {
  const ph = args.map((_, i) => `$${i + 1}`).join(", ");
  return (await one(`select public.${fn}(${ph}) as r`, args.map((a) => (a !== null && typeof a === "object" ? JSON.stringify(a) : a)))).r;
};
const lead = (o = {}) => ({ name: "Aziz", phone: "+998 90 123 45 67", business_type: "restoran", consent: true, elapsed: 9000, page: "/aloqa/", ...o });

// Foydalanuvchilar: admin va oddiy kirgan foydalanuvchi
const ADMIN = (await one("insert into auth.users (email) values ('admin@example.com') returning id")).id;
const USER = (await one("insert into auth.users (email) values ('user@example.com') returning id")).id;
const asAdmin = (fn, o) => asUser(ADMIN, fn, o);

console.log("O'rnatish va huquqlar");
await test("schema.sql qayta ishga tushirilsa — xato yo'q, maxfiy IP tuzi o'zgarmaydi", async () => {
  const salt2 = (await one("select value from site_private.settings where key = 'ip_salt'")).value;
  assert.equal(salt2, salt1);
  assert.match(salt1, /^[0-9a-f]{64}$/);
});
await test("anon: jadvallar, yopiq sxema va admin funksiyalari yopiq", async () => {
  await anon(async () => {
    await rejects(q("select * from public.site_tutorials"), /permission denied/);
    await rejects(q("select * from public.site_leads"), /permission denied/);
    await rejects(q("select * from site_private.settings"), /permission denied/);
    await rejects(q("insert into public.site_leads (name, phone, business_type) values ('X', '998901234567', 'dokon')"), /permission denied/);
    await rejects(rpc("site_tutorials_admin"), /permission denied/);
    await rejects(rpc("site_leads_admin", ["all"]), /permission denied/);
    await rejects(rpc("site_admin_add", ["admin@example.com"]), /permission denied/);
    assert.deepEqual(await rpc("site_tutorials_public"), []);
  });
});
await test("site_admin_add: faqat SQL Editor'dan (postgres) va faqat mavjud foydalanuvchi", async () => {
  await rejects(rpc("site_admin_add", ["yoq@example.com"]), /Bunday foydalanuvchi yo'q/);
  assert.equal(await rpc("site_admin_add", ["ADMIN@example.com"]), "Admin qo'shildi: admin@example.com");
  assert.equal(await rpc("site_admin_add", ["admin@example.com"]), "Admin qo'shildi: admin@example.com"); // takror — xato emas
  await asUser(USER, () => rejects(rpc("site_admin_add", ["user@example.com"]), /permission denied/));
});
await test("kirgan, lekin admin bo'lmagan hisob: admin funksiyalari «Ruxsat yo'q»", async () => {
  await asUser(USER, async () => {
    assert.deepEqual(await rpc("site_admin_me"), { is_admin: false, email: "user@example.com" });
    await rejects(rpc("site_tutorials_admin"), /Ruxsat yo'q/);
    await rejects(rpc("site_tutorial_save", [{ title: "Sinov video", video_url: "https://youtu.be/dQw4w9WgXcQ", product_section: "savdo" }]), /Ruxsat yo'q/);
    await rejects(rpc("site_leads_admin", ["new"]), /Ruxsat yo'q/);
    await rejects(rpc("site_settings_admin"), /Ruxsat yo'q/);
    await rejects(q("select * from public.site_tutorials"), /permission denied/);
  });
  await asAdmin(async () => assert.deepEqual(await rpc("site_admin_me"), { is_admin: true, email: "admin@example.com" }));
});

console.log("\nVideo qo'llanmalar");
const V = (o = {}) => ({ title: "Kassada birinchi sotuv", video_url: "https://youtu.be/dQw4w9WgXcQ", product_section: "savdo", ...o });
await test("saqlash: tekshiruv xabarlari o'zbekcha", async () => {
  await asAdmin(async () => {
    await rejects(rpc("site_tutorial_save", [V({ title: " ab " })]), /Sarlavha kamida 3 belgi/);
    await rejects(rpc("site_tutorial_save", [V({ video_url: "https://vimeo.com/123" })]), /Video manzili noto'g'ri/);
    await rejects(rpc("site_tutorial_save", [V({ video_url: "http://youtu.be/dQw4w9WgXcQ" })]), /Video manzili noto'g'ri/);
    await rejects(rpc("site_tutorial_save", [V({ product_section: "yoq" })]), /Bo'limni tanlang/);
    await rejects(rpc("site_tutorial_save", [V({ industries: ["restoran", "kosmos"] })]), /Biznes turi noto'g'ri/);
    await rejects(rpc("site_tutorial_save", [V({ difficulty: "expert" })]), /Daraja noto'g'ri/);
    await rejects(rpc("site_tutorial_save", [V({ capability: "Kassa!" })]), /Imkoniyat kodi noto'g'ri/);
    await rejects(rpc("site_tutorial_save", [V({ thumbnail_url: "http://img.example/a.jpg" })]), /https:\/\/ bilan boshlanishi kerak/);
    await rejects(rpc("site_tutorial_save", [V({ slug: "Katta Harf" })]), /Manzil \(slug\)/);
    await rejects(rpc("site_tutorial_save", [V({ id: "00000000-0000-4000-8000-000000000999" })]), /Video topilmadi/);
    await rejects(q("select * from public.site_tutorials"), /permission denied/); // admin ham faqat funksiyalar orqali
  });
  assert.equal((await one("select count(*)::int as n from public.site_tutorials")).n, 0);
});
let first;
await test("saqlash: slug sarlavhadan, qoralama saytda yo'q, e'lon sanasi birinchi e'londa qo'yiladi", async () => {
  await asAdmin(async () => {
    first = await rpc("site_tutorial_save", [V({ title: "  Kassada birinchi sotuv — O‘zbekcha  ", is_published: false })]);
    assert.equal(first.slug, "kassada-birinchi-sotuv-ozbekcha");
    assert.equal(first.title, "Kassada birinchi sotuv — O‘zbekcha");
    assert.equal(first.published_at, null);
    assert.equal(first.sort_order, 10);
    assert.deepEqual(first.industries, ["umumiy"]);
    assert.ok(!("updated_by" in first), "kim tahrirlagani qaytarilmaydi");
  });
  await anon(async () => assert.deepEqual(await rpc("site_tutorials_public"), []));
  const pub = await asAdmin(() => rpc("site_tutorial_save", [{ ...first, is_published: true }]));
  assert.ok(pub.published_at, "e'lon qilinganda sana qo'yiladi");
  const again = await asAdmin(() => rpc("site_tutorial_save", [{ ...pub, is_published: false }]));
  assert.equal(again.published_at, pub.published_at, "qoralamaga qaytsa ham birinchi e'lon sanasi saqlanadi");
  await asAdmin(() => rpc("site_tutorial_save", [{ ...again, is_published: true }]));
  const list = await anon(() => rpc("site_tutorials_public"));
  assert.equal(list.length, 1);
  assert.equal(list[0].slug, "kassada-birinchi-sotuv-ozbekcha");
  assert.ok(!("updated_by" in list[0]) && !("created_at" in list[0]));
});
await test("biznes turlari, kalit so'zlar va qadamlar tozalanadi", async () => {
  await asAdmin(async () => {
    const a = await rpc("site_tutorial_save", [V({ title: "Restoran zali", slug: "restoran-zali", industries: ["restoran", "dokon", "restoran"],
      tags: "Kassa, CHEK, ,  x ", steps: "Birinchi qadam\n\n  Ikkinchi qadam \r\nUchinchi", duration_sec: 154.4, capability: "zal" })]);
    assert.deepEqual(a.industries, ["restoran", "dokon"]);
    assert.deepEqual(a.tags, ["kassa", "chek", "x"]);
    assert.deepEqual(a.steps, ["Birinchi qadam", "Ikkinchi qadam", "Uchinchi"]);
    assert.equal(a.duration_sec, 154);
    assert.equal(a.sort_order, 20);
    const b = await rpc("site_tutorial_save", [V({ title: "Umumiy video", slug: "umumiy-video", industries: "umumiy, restoran" })]);
    assert.deepEqual(b.industries, ["umumiy"]);
    assert.equal(b.sort_order, 30);
    await rejects(rpc("site_tutorial_save", [V({ title: "Boshqa nom", slug: "restoran-zali" })]), /Bu manzil \(slug\) band/);
  });
});
await test("tartib: yuqoriga/pastga, chetda o'zgarmaydi, 10-20-30", async () => {
  await asAdmin(async () => {
    const order = async () => (await rpc("site_tutorials_admin")).map((t) => [t.slug, t.sort_order]);
    const ids = Object.fromEntries((await rpc("site_tutorials_admin")).map((t) => [t.slug, t.id]));
    await rpc("site_tutorial_move", [ids["umumiy-video"], -1]);
    assert.deepEqual(await order(), [["kassada-birinchi-sotuv-ozbekcha", 10], ["umumiy-video", 20], ["restoran-zali", 30]]);
    await rpc("site_tutorial_move", [ids["kassada-birinchi-sotuv-ozbekcha"], -1]);
    assert.deepEqual((await order())[0][0], "kassada-birinchi-sotuv-ozbekcha");
    await rpc("site_tutorial_move", [ids["restoran-zali"], 1]);
    assert.deepEqual((await order())[2][0], "restoran-zali");
    await rejects(rpc("site_tutorial_move", ["00000000-0000-4000-8000-000000000999", 1]), /Video topilmadi/);
  });
});
await test("o'chirish", async () => {
  await asAdmin(async () => {
    const id = (await rpc("site_tutorials_admin")).find((t) => t.slug === "umumiy-video").id;
    assert.deepEqual(await rpc("site_tutorial_delete", [id]), { ok: true });
    await rejects(rpc("site_tutorial_delete", [id]), /Video topilmadi/);
    assert.equal((await rpc("site_tutorials_admin")).length, 2);
  });
});

console.log("\nDemo so'rovi");
const leadsCount = async () => (await one("select count(*)::int as n from public.site_leads")).n;
await test("tekshiruv: ism, telefon, biznes turi (ro'yxatdan), rozilik — o'zbekcha xabarlar", async () => {
  await anon(async () => {
    await rejects(rpc("site_lead_submit", [lead({ name: " A " })]), /Ismingizni yozing/);
    await rejects(rpc("site_lead_submit", [lead({ phone: "12345" })]), /Telefon raqamini to'liq kiriting/);
    await rejects(rpc("site_lead_submit", [lead({ business_type: "kosmos" })]), /Biznes turini tanlang/);
    await rejects(rpc("site_lead_submit", [lead({ business_type: "" })]), /Biznes turini tanlang/);
    await rejects(rpc("site_lead_submit", [lead({ consent: false })]), /rozilik bering/);
    await rejects(rpc("site_lead_submit", [[1, 2]]), /Noto'g'ri so'rov/);
  });
  assert.equal(await leadsCount(), 0);
});
await test("qabul: telefon 998XXXXXXXXX ko'rinishida, bo'sh maydonlar null, javob { ok: true }", async () => {
  const r = await anon(() => rpc("site_lead_submit", [lead({ name: "  Aziz Karimov ", business_name: " ", comment: " Salom ", phone: "90 123-45-67" })]));
  assert.deepEqual(r, { ok: true });
  const row = await one("select * from public.site_leads order by created_at desc limit 1");
  assert.equal(row.name, "Aziz Karimov");
  assert.equal(row.phone, "998901234567");
  assert.equal(row.business_name, null);
  assert.equal(row.comment, "Salom");
  assert.equal(row.status, "new");
  assert.equal(row.ip_hash, null, "sarlavha yo'q — IP kodi ham yo'q");
});
await test("bot tuzog'i: yashirin maydon yoki 2,5 soniyadan tez — saqlanmaydi, lekin { ok: true }", async () => {
  const before = await leadsCount();
  await anon(async () => {
    assert.deepEqual(await rpc("site_lead_submit", [lead({ website: "http://spam.example", phone: "991112233" })]), { ok: true });
    assert.deepEqual(await rpc("site_lead_submit", [lead({ elapsed: 800, phone: "991112234" })]), { ok: true });
  });
  assert.equal(await leadsCount(), before);
});
await test("IP: o'zi saqlanmaydi — maxfiy tuz bilan 32 belgilik kod; bitta IP'dan soatiga 10 ta", async () => {
  const H = { "x-forwarded-for": "203.0.113.7, 10.0.0.1" };
  for (let i = 0; i < 10; i++) await anon(() => rpc("site_lead_submit", [lead({ phone: `9311100${String(i).padStart(2, "0")}` })]), { headers: H });
  const rows = await q("select ip_hash from public.site_leads where ip_hash is not null");
  assert.equal(rows.length, 10);
  assert.equal(new Set(rows.map((r) => r.ip_hash)).size, 1, "bir xil IP — bir xil kod");
  assert.match(rows[0].ip_hash, /^[0-9a-f]{32}$/);
  assert.ok(!rows[0].ip_hash.includes("203.0.113.7"));
  const dump = JSON.stringify(await q("select * from public.site_leads"));
  assert.ok(!dump.includes("203.0.113.7"), "IP'ning o'zi hech qayerda yo'q");
  await anon(() => rejects(rpc("site_lead_submit", [lead({ phone: "931119999" })]), /Juda ko'p so'rov/), { headers: H });
  // boshqa IP — o'tadi (cf-connecting-ip ustun)
  assert.deepEqual(await anon(() => rpc("site_lead_submit", [lead({ phone: "931119999" })]), { headers: { "cf-connecting-ip": "198.51.100.4", "x-forwarded-for": "203.0.113.7" } }), { ok: true });
});
await test("bitta raqamdan soatiga 3 ta", async () => {
  await anon(async () => {
    for (let i = 0; i < 2; i++) await rpc("site_lead_submit", [lead({ phone: "901234567" })]); // birinchisi yuqorida yuborilgan
    await rejects(rpc("site_lead_submit", [lead({ phone: "+998901234567" })]), /Juda ko'p so'rov/);
  });
});
await test("hammasi bo'lib 10 daqiqada 60 ta", async () => {
  const n = await leadsCount();
  await db.exec(`insert into public.site_leads (name, phone, business_type)
    select 'Ko''p', '99895' || lpad(g::text, 7, '0'), 'dokon' from generate_series(1, ${60 - n}) g`);
  await anon(() => rejects(rpc("site_lead_submit", [lead({ phone: "977777777" })]), /Juda ko'p so'rov/));
  await db.exec("delete from public.site_leads where name = 'Ko''p'");
});
await test("12 oydan eski so'rovlar avtomatik o'chadi (maxfiylik siyosati, 5.3)", async () => {
  await db.exec(`insert into public.site_leads (name, phone, business_type, created_at)
    select 'Eski', '998900000000', 'dokon', now() - interval '13 months' from generate_series(1, 3)`);
  assert.deepEqual(await anon(() => rpc("site_lead_submit", [lead({ phone: "977777777" })])), { ok: true });
  assert.equal((await one("select count(*)::int as n from public.site_leads where name = 'Eski'")).n, 0);
});

console.log("\nAdmin: so'rovlar va sozlamalar");
await test("so'rovlar ro'yxati: holat bo'yicha va har holat soni; holat, izoh, o'chirish", async () => {
  const r = await asAdmin(() => rpc("site_leads_admin", ["new"]));
  assert.ok(r.items.length >= 14 && r.items.every((l) => l.status === "new"));
  assert.equal(r.counts.new, r.items.length);
  assert.ok(!("ip_hash" in r.items[0]), "IP kodi ham adminga berilmaydi");
  const id = r.items[0].id;
  const row = async () => one("select status, note from public.site_leads where id = $1", [id]);
  await asAdmin(() => rpc("site_lead_update", [id, { status: "contacted", note: "  Ertaga 15:00 da demo " }]));
  assert.deepEqual(Object.values(await row()), ["contacted", "Ertaga 15:00 da demo"]);
  await asAdmin(() => rpc("site_lead_update", [id, { note: "" }]));
  assert.deepEqual(Object.values(await row()), ["contacted", null], "faqat izoh o'zgaradi, holat qoladi");
  await asAdmin(async () => {
    await rejects(rpc("site_lead_update", [id, { status: "arxiv" }]), /Noto'g'ri holat/);
    const c = await rpc("site_leads_admin", ["contacted"]);
    assert.deepEqual(c.items.map((x) => x.id), [id]);
    assert.equal(c.counts.contacted, 1);
    assert.equal((await rpc("site_leads_admin", ["all"])).items.length, c.counts.all);
    assert.deepEqual(await rpc("site_lead_delete", [id]), { ok: true });
    await rejects(rpc("site_lead_delete", [id]), /So'rov topilmadi/);
    await rejects(rpc("site_lead_update", [id, { status: "new" }]), /So'rov topilmadi/);
  });
});
const TOKEN = "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX";
await test("Telegram sozlamalari: tekshiruv; token to'liq qaytarilmaydi", async () => {
  await asAdmin(async () => {
    await rejects(rpc("site_settings_save", [{ telegram_bot_token: "noto'g'ri" }]), /bot tokeni noto'g'ri/);
    await rejects(rpc("site_settings_save", [{ telegram_chat_ids: "12, abc" }]), /Chat ID noto'g'ri/);
    await rejects(rpc("site_settings_save", [{ telegram_chat_ids: "1001,1002,1003,1004,1005,1006" }]), /Ko'pi bilan 5 ta/);
    await rejects(rpc("site_telegram_test"), /pg_net kengaytmasi yoqilmagan/);
    const s = await rpc("site_settings_save", [{ telegram_bot_token: ` ${TOKEN} `, telegram_chat_ids: "123456789, -1001234567890 @tizimchi_kanal", site_url: "https://tizimchi.com/" }]);
    assert.equal(s.telegram_token_set, true);
    assert.equal(s.telegram_token_hint, "…sawX");
    assert.equal(s.telegram_chat_ids, "123456789,-1001234567890,@tizimchi_kanal");
    assert.equal(s.site_url, "https://tizimchi.com");
    assert.ok(!JSON.stringify(s).includes(TOKEN), "token javobda yo'q");
    assert.equal(s.pg_net, false);
    // kalit yuborilmasa — o'zgarmaydi
    assert.equal((await rpc("site_settings_save", [{ site_url: "javascript:alert(1)" }])).site_url, "https://tizimchi.com");
  });
});
await test("Telegram xabari: pg_net bo'lmasa jim; bo'lsa — har chatga bitta, matn HTML'da ekranlangan", async () => {
  await anon(() => rpc("site_lead_submit", [lead({ phone: "991234500" })]));
  // pg_net (net.http_post) taqlidi: so'rovlar jadvalga yoziladi
  await db.exec(`create schema net; create table net.calls (id serial primary key, url text, body jsonb);
    create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000)
    returns bigint language sql as $$ insert into net.calls (url, body) values ($1, $2) returning id::bigint $$;`);
  await anon(() => rpc("site_lead_submit", [lead({ name: "Ali <b>Valiyev</b>", phone: "991234501", business_name: "Osh & Somsa", comment: "Demo kerak", business_type: "dorixona" })]));
  const calls = await q("select url, body from net.calls order by id");
  assert.equal(calls.length, 3, "3 ta chat — 3 ta xabar");
  assert.equal(calls[0].url, `https://api.telegram.org/bot${TOKEN}/sendMessage`);
  assert.deepEqual(calls.map((c) => c.body.chat_id), ["123456789", "-1001234567890", "@tizimchi_kanal"]);
  const text = calls[0].body.text;
  assert.equal(calls[0].body.parse_mode, "HTML");
  assert.match(text, /Ali &lt;b&gt;Valiyev&lt;\/b&gt; · \+998 99 123 45 01/);
  assert.match(text, /Dorixona · Osh &amp; Somsa/);
  assert.match(text, /💬 Demo kerak/);
  assert.match(text, /Admin: https:\/\/tizimchi\.com\/admin\//);
  await asAdmin(async () => {
    assert.equal((await rpc("site_settings_admin")).pg_net, true);
    assert.deepEqual(await rpc("site_telegram_test"), { queued: 3 });
    await rpc("site_settings_save", [{ telegram_bot_token: "" }]);
    assert.equal((await rpc("site_settings_admin")).telegram_token_set, false);
    await rejects(rpc("site_telegram_test"), /Avval bot tokeni/);
  });
  const n = (await one("select count(*)::int as n from net.calls")).n;
  await anon(() => rpc("site_lead_submit", [lead({ phone: "991234502" })]));
  assert.equal((await one("select count(*)::int as n from net.calls")).n, n, "token o'chirilgach xabar yuborilmaydi");
});

console.log("\nSayt bilan bir xillik");
const TAX = await import("../frontend/content/taxonomy.mjs");
const T = await import("../frontend/src/client/tutorials.js");
await test("taksonomiya: backend = frontend/content/taxonomy.mjs (kod, nom, tartib)", async () => {
  const ind = await one("select site_private.industry_list() as v");
  assert.deepEqual(ind.v, TAX.INDUSTRIES.map(([c, l]) => [c, l]));
  const sec = await one("select site_private.section_list() as v");
  assert.deepEqual(sec.v, TAX.SECTIONS.map(([c, l]) => [c, l]));
  const lv = await one("select site_private.level_codes() as v");
  assert.deepEqual(lv.v, TAX.LEVELS.map(([c]) => c));
});
await test("video manzili: backend qabul qilgani saytda albatta ochiladi (parseVideo bilan bir xil)", async () => {
  const same = ["https://youtu.be/dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ?t=90", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s",
    "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=10", "https://youtube.com/live/dQw4w9WgXcQ", "https://YOUTU.BE/dQw4w9WgXcQ",
    "HTTPS://youtu.be/dQw4w9WgXcQ", "https://cdn.example.uz/v/kassa.mp4", "https://cdn.example.uz/v/kassa.MP4?x=1#t", "https://cdn.example.uz/v/a.webm",
    "https://cdn.example.uz/v/a.m4v", "http://youtu.be/dQw4w9WgXcQ", "https://youtu.be/short", "https://youtu.be/", "https://vimeo.com/123",
    "javascript:alert(1)", "https://evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=dQw4w9WgXc", "https://youtube.com/channel/abc",
    "https://example.com/video.mov", "ftp://cdn.example.uz/a.mp4", "https://youtube.com/watch/?v=dQw4w9WgXcQ", "", "https://youtube.com/embed/dQw4w9WgXcQ/x"];
  for (const u of same) {
    const sql = (await one("select site_private.video_url_ok($1) as ok", [u])).ok;
    assert.equal(sql, !!T.parseVideo(u), `${u}: backend ${sql}, sayt ${!!T.parseVideo(u)}`);
  }
  // backend qattiqroq bo'lishi mumkin (sayt qabul qiladi, backend — yo'q), aksi bo'lmasin
  for (const u of ["https://cdn.example.uz/v/bo sh joy.mp4", "https://youtube.com/watch?v=%41AAAAAAAAAA"]) {
    const sql = (await one("select site_private.video_url_ok($1) as ok", [u])).ok;
    assert.ok(!sql || T.parseVideo(u), u);
  }
});

console.log(`\n${passed} ta o'tdi, ${failed} ta xato`);
process.exit(failed ? 1 : 0);
