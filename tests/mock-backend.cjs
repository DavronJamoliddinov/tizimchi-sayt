// Backend taqlidi (testlar va lokal ko'rik uchun): backend/schema.sql dagi kirish va admin funksiyalarining soddalashtirilgan
// nusxasi — xotirada. Haqiqiy qoidalar backend'da va tests/db.test.mjs da tekshiriladi; bu yerda faqat brauzer oqimi uchun.
//   /__supa/auth/v1/token, /__supa/auth/v1/logout, /__supa/rest/v1/rpc/<funksiya>
const fs = require("node:fs");
const path = require("node:path");

const ANON = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.sig`;

/** @param {{ normalize: (r: any) => any, parseVideo: (u: string) => any }} T  frontend/src/client/tutorials.js */
function mockBackend(T) {
  const now = () => new Date().toISOString();
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "tutorials.json"), "utf8")).filter((r) => T.normalize(r));
  const state = {
    tutorials: fixture.map((r, i) => ({ ...r, is_published: i !== 2, created_at: now() })),
    leads: [
      { id: "l1", name: "Aziz", phone: "998901234567", business_name: "Osh markazi", business_type: "restoran", comment: "2 ta kassa kerak", page: "/aloqa/", status: "new", note: null, created_at: now() },
      { id: "l2", name: "Dilnoza", phone: "998935554411", business_name: null, business_type: "dorixona", comment: null, page: "/", status: "new", note: null, created_at: new Date(Date.now() - 864e5).toISOString() },
      { id: "l3", name: "Bobur", phone: "998977001020", business_name: null, business_type: "dokon", comment: null, page: "/", status: "contacted", note: "Dushanba qo'ng'iroq", created_at: new Date(Date.now() - 5 * 864e5).toISOString() },
    ],
    settings: { token: "", chats: "", site_url: "" },
    calls: [],
  };
  const USERS = { "admin@example.com": { pass: "Parol-12345", token: "tok-admin" }, "user@example.com": { pass: "Parol-12345", token: "tok-user" } };
  const P = (message) => [400, { code: "P0001", message, details: null, hint: null }];
  const slugify = (s) => String(s).toLowerCase().replace(/[‘’ʻʼ`']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const counts = () => Object.fromEntries([...["new", "contacted", "closed", "spam"].map((k) => [k, state.leads.filter((l) => l.status === k).length]), ["all", state.leads.length]]);
  const settings = () => ({ telegram_token_set: !!state.settings.token, telegram_token_hint: state.settings.token ? "…" + state.settings.token.slice(-4) : null,
    telegram_chat_ids: state.settings.chats, site_url: state.settings.site_url, pg_net: true });
  const sorted = () => [...state.tutorials].sort((a, b) => a.sort_order - b.sort_order);
  const RPC = {
    site_admin_me: (a, who) => [200, { is_admin: who.admin, email: who.email }],
    site_tutorials_admin: () => [200, sorted()],
    site_tutorial_save: ({ p }) => {
      const title = String(p.title || "").trim();
      if (title.length < 3) return P("Sarlavha kamida 3 belgi bo'lsin");
      if (!T.parseVideo(p.video_url)) return P("Video manzili noto'g'ri: YouTube havolasi yoki https orqali .mp4 fayl kerak");
      const slug = String(p.slug || "").trim() || slugify(title);
      const prev = p.id ? state.tutorials.find((t) => t.id === p.id) : null;
      if (p.id && !prev) return P("Video topilmadi");
      if (state.tutorials.some((t) => t.slug === slug && t !== prev)) return P("Bu manzil (slug) band — boshqasini yozing");
      const inds = Array.isArray(p.industries) ? p.industries : String(p.industries || "").split(",").map((x) => x.trim()).filter(Boolean);
      const row = { ...(prev || { id: `t${Date.now()}`, created_at: now(), sort_order: Math.max(0, ...state.tutorials.map((t) => t.sort_order)) + 10 }),
        title, slug, video_url: p.video_url, description: p.description || "", product_section: p.product_section, capability: p.capability || null,
        industries: !inds.length || inds.includes("umumiy") ? ["umumiy"] : [...new Set(inds)], difficulty: p.difficulty || "beginner",
        duration_sec: Number(p.duration_sec) || null, tags: Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
        steps: Array.isArray(p.steps) ? p.steps : String(p.steps || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
        is_published: p.is_published === true, is_featured: p.is_featured === true, updated_at: now() };
      row.published_at = prev?.published_at || (row.is_published ? now() : null);
      if (prev) Object.assign(prev, row); else state.tutorials.push(row);
      return [200, row];
    },
    site_tutorial_delete: ({ p_id }) => {
      const i = state.tutorials.findIndex((t) => t.id === p_id);
      if (i < 0) return P("Video topilmadi");
      state.tutorials.splice(i, 1);
      return [200, { ok: true }];
    },
    site_tutorial_move: ({ p_id, p_dir }) => {
      const list = sorted(), i = list.findIndex((t) => t.id === p_id);
      if (i < 0) return P("Video topilmadi");
      const j = i + (p_dir < 0 ? -1 : 1);
      if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
      list.forEach((t, k) => { t.sort_order = (k + 1) * 10; });
      return [200, { ok: true }];
    },
    site_leads_admin: ({ p_status }) => [200, { items: state.leads.filter((l) => p_status === "all" || l.status === p_status), counts: counts() }],
    site_lead_update: ({ p_id, p }) => {
      const l = state.leads.find((x) => x.id === p_id);
      if (!l) return P("So'rov topilmadi");
      if (p.status !== undefined && !["new", "contacted", "closed", "spam"].includes(p.status)) return P("Noto'g'ri holat");
      if (p.status !== undefined) l.status = p.status;
      if (p.note !== undefined) l.note = String(p.note).trim() || null;
      return [200, { ok: true }];
    },
    site_lead_delete: ({ p_id }) => {
      const i = state.leads.findIndex((x) => x.id === p_id);
      if (i < 0) return P("So'rov topilmadi");
      state.leads.splice(i, 1);
      return [200, { ok: true }];
    },
    site_settings_admin: () => [200, settings()],
    site_settings_save: ({ p }) => {
      if ("telegram_bot_token" in p && p.telegram_bot_token && !/^\d{5,12}:[A-Za-z0-9_-]{30,64}$/.test(p.telegram_bot_token)) {
        return P("Telegram bot tokeni noto'g'ri: @BotFather bergan «123456789:AA…» ko'rinishidagi kalit kerak");
      }
      if ("telegram_bot_token" in p) state.settings.token = p.telegram_bot_token;
      if ("telegram_chat_ids" in p) state.settings.chats = String(p.telegram_chat_ids).split(/[,\s]+/).filter(Boolean).join(",");
      if ("site_url" in p) state.settings.site_url = p.site_url;
      return [200, settings()];
    },
    site_telegram_test: () => (state.settings.token && state.settings.chats ? [200, { queued: state.settings.chats.split(",").length }] : P("Avval bot tokeni va chat ID ni saqlang")),
  };
  /** @returns {[number, any]} */
  function handle(url, headers, body) {
    const p = url.pathname.replace(/^\/__supa/, "");
    if (headers.apikey !== ANON) return [401, { message: "Invalid API key" }];
    if (p === "/auth/v1/token") {
      const grant = url.searchParams.get("grant_type");
      if (grant === "refresh_token") return [200, { access_token: "tok-admin", refresh_token: "ref-2", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { email: "admin@example.com" } }];
      const u = USERS[String(body.email || "").toLowerCase()];
      if (!u || u.pass !== body.password) return [400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" }];
      return [200, { access_token: u.token, refresh_token: "ref-1", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { email: String(body.email).toLowerCase() } }];
    }
    if (p === "/auth/v1/logout") return [204, null];
    const m = /^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(p);
    if (!m || !RPC[m[1]]) return [404, { code: "PGRST202", message: "Could not find the function" }];
    const token = String(headers.authorization || "").replace(/^Bearer /, "");
    const who = token === "tok-admin" ? { admin: true, email: "admin@example.com" } : token === "tok-user" ? { admin: false, email: "user@example.com" } : null;
    if (!who) return [401, { code: "PGRST301", message: "JWT required" }];
    if (m[1] !== "site_admin_me" && !who.admin) return [403, { code: "42501", message: "Ruxsat yo'q: bu amal faqat sayt adminlari uchun" }];
    state.calls.push(m[1]);
    return RPC[m[1]](body || {}, who);
  }
  return { state, handle };
}

module.exports = { mockBackend, ANON };
