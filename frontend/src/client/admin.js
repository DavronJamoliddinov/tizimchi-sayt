// @ts-check
/* /admin/ — sayt boshqaruvi (ES modul, CSP: faqat 'self').
   Kirish: backend'dagi Supabase Auth (email + parol). Huquq va barcha tekshiruvlar backend'da (backend/schema.sql):
   brauzer faqat funksiyalarni chaqiradi, jadvallarga to'g'ridan-to'g'ri kira olmaydi. Matn — har doim esc()/tx() orqali. */
import { esc, tx, fmtDuration, uzPhone, apiHeaders } from "./util.js";
import { parseVideo } from "./tutorials.js";

/** @type {any} */
const D = JSON.parse(document.getElementById("admin-data")?.textContent || "{}");
const $ = (/** @type {string} */ s, /** @type {ParentNode} */ r = document) => /** @type {any} */ (r.querySelector(s));
const $$ = (/** @type {string} */ s, /** @type {ParentNode} */ r = document) => /** @type {any[]} */ ([...r.querySelectorAll(s)]);
const root = $("[data-admin-root]");
const dlg = /** @type {HTMLDialogElement} */ ($("[data-dialog]"));
const cfm = /** @type {HTMLDialogElement} */ ($("[data-confirm]"));
const timeout = (/** @type {number} */ ms) => (typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(ms) : undefined);
const icon = (/** @type {string} */ name, cls = "") =>
  `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${(D.icons || {})[name] || ""}</svg>`;

/* ------------------------------ Taksonomiya (build: frontend/content/taxonomy.mjs) ------------------------------ */
const L = D.labels || {};
/** @type {[string, string][]} */ const IND = (D.order?.industries || []).map((/** @type {string} */ c) => [c, L.industries?.[c] || c]);
/** @type {[string, string][]} */ const SEC = (D.order?.sections || []).map((/** @type {string} */ c) => [c, L.sections?.[c] || c]);
/** @type {[string, string][]} */ const LEV = (D.order?.levels || []).map((/** @type {string} */ c) => [c, L.levels?.[c] || c]);
const label = (/** @type {[string, string][]} */ list, /** @type {string} */ code) => (list.find(([c]) => c === code) || [code, code])[1];
/** @type {Record<string, [string, string]>} */
const STATUS = { new: ["Yangi", "badge-general"], contacted: ["Bog‘lanildi", "badge-partial"], closed: ["Yopildi", "badge-ready"], spam: ["Spam", "badge-setup"] };
const FILTERS = [["new", "Yangi"], ["contacted", "Bog‘lanildi"], ["closed", "Yopildi"], ["spam", "Spam"], ["all", "Hammasi"]];
/** [kod, to'liq nom, telefon uchun qisqa nom] */
const TABS = [["videos", "Video qo‘llanmalar", "Videolar"], ["leads", "Demo so‘rovlar", "So‘rovlar"], ["settings", "Sozlamalar", "Sozlamalar"]];

/* ------------------------------ Holat ------------------------------ */
const S = {
  /** @type {{ access_token: string, refresh_token: string, expires_at: number, email: string } | null} */ session: null,
  /** @type {{ is_admin: boolean, email: string } | null} */ me: null,
  tab: "videos",
  /** @type {any[] | null} */ tutorials: null,
  /** @type {any[] | null} */ leads: null,
  /** @type {Record<string, number> | null} */ counts: null,
  leadFilter: "new",
  /** @type {any} */ settings: null,
};

/* ------------------------------ Sessiya va API ------------------------------ */
const KEY = "tizimchi.admin.session";
const store = {
  get() { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.access_token ? v : null; } catch { return null; } },
  set(/** @type {any} */ v) {
    try {
      if (v) { localStorage.setItem(KEY, JSON.stringify(v)); if (v.email) localStorage.setItem(`${KEY}.email`, v.email); } else localStorage.removeItem(KEY);
    } catch { /* xotira yopiq */ }
  },
  lastEmail() { try { return localStorage.getItem(`${KEY}.email`) || ""; } catch { return ""; } },
};
class ApiError extends Error {
  constructor(/** @type {string} */ message, status = 0, code = "") { super(message); this.status = status; this.code = code; }
}
const nowSec = () => Math.floor(Date.now() / 1000);
const NET = "Serverga ulanib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.";
const EXPIRED = "Sessiya tugadi — qayta kiring.";

/** Supabase Auth (GoTrue) */
async function authCall(/** @type {string} */ path, /** @type {object} */ body, token = "") {
  let r;
  try {
    r = await fetch(`${D.supabaseUrl}/auth/v1/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", ...apiHeaders(D.anonKey, token) }, body: JSON.stringify(body || {}), signal: timeout(20000),
    });
  } catch { throw new ApiError(NET); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(authErrorText(j, r.status), r.status, String(j.error_code || j.error || ""));
  return j;
}
function authErrorText(/** @type {any} */ j, /** @type {number} */ status) {
  const code = String(j.error_code || j.error || ""), msg = String(j.msg || j.error_description || j.message || "");
  if (status === 429 || /rate_limit/.test(code)) return "Juda ko‘p urinish. Bir necha daqiqadan keyin qayta urinib ko‘ring.";
  if (code === "email_not_confirmed" || /not confirmed/i.test(msg)) return "Email tasdiqlanmagan: Supabase → Authentication → Users’da foydalanuvchini tasdiqlang (yoki «Auto Confirm User» bilan qayta yarating).";
  if (code === "invalid_credentials" || code === "invalid_grant" || /invalid login|credentials/i.test(msg)) return "Email yoki parol noto‘g‘ri.";
  if (code === "user_banned") return "Bu hisob bloklangan.";
  return "Kirib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.";
}
function saveSession(/** @type {any} */ j) {
  S.session = {
    access_token: j.access_token, refresh_token: j.refresh_token,
    expires_at: Number(j.expires_at) || nowSec() + (Number(j.expires_in) || 3600), email: j.user?.email || S.session?.email || "",
  };
  store.set(S.session);
}
/** @type {Promise<void> | null} */
let refreshing = null;
function refreshSession() {
  if (!S.session?.refresh_token) return Promise.reject(new ApiError(EXPIRED, 401, "session"));
  refreshing ||= authCall("token?grant_type=refresh_token", { refresh_token: S.session.refresh_token })
    .then(saveSession)
    .catch(() => { throw new ApiError(EXPIRED, 401, "session"); })
    .finally(() => { refreshing = null; });
  return refreshing;
}

/** Backend funksiyasi (PostgREST RPC). Xato matni: bazadagi o'zbekcha xabar (P0001) yoki tushunarli umumiy matn. */
async function rpc(/** @type {string} */ fn, /** @type {object} */ args = {}, retry = true) {
  if (S.session && S.session.expires_at - 60 < nowSec()) await refreshSession();
  let r;
  try {
    r = await fetch(`${D.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: { "Content-Type": "application/json", ...apiHeaders(D.anonKey, S.session?.access_token || "") },
      body: JSON.stringify(args), signal: timeout(20000),
    });
  } catch { throw new ApiError(NET); }
  const text = await r.text();
  /** @type {any} */
  let j = null;
  try { j = text ? JSON.parse(text) : null; } catch { /* JSON emas */ }
  if (r.ok) return j;
  if (r.status === 401 && retry && S.session) { await refreshSession(); return rpc(fn, args, false); }
  throw new ApiError(rpcErrorText(j, r.status), r.status, String(j?.code || ""));
}
function rpcErrorText(/** @type {any} */ j, /** @type {number} */ status) {
  const code = String(j?.code || ""), msg = String(j?.message || "");
  if (code === "P0001" && msg) return msg;
  if (code === "42501" && /^Ruxsat/.test(msg)) return msg;
  if (status === 404 || code === "PGRST202") return "Backend o‘rnatilmagan yoki eskirgan: backend/schema.sql ni Supabase SQL Editor’da qayta ishga tushiring.";
  if (status === 401 || /JWT/i.test(msg)) return EXPIRED;
  if (code === "42501") return "Ruxsat yo‘q.";
  return "Server xatosi. Birozdan keyin qayta urinib ko‘ring.";
}

/* ------------------------------ Umumiy yordamchilar ------------------------------ */
const p2 = (/** @type {number} */ n) => String(n).padStart(2, "0");
function fmtDate(/** @type {string} */ iso) {
  const d = new Date(iso);
  return isNaN(+d) ? "" : `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
function relTime(/** @type {string} */ iso) {
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "hozirgina";
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  const day = (/** @type {Date} */ x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(d)) / 864e5);
  const hm = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  if (diff === 0) return `bugun, ${hm}`;
  if (diff === 1) return `kecha, ${hm}`;
  return fmtDate(iso);
}
/** «4:35» yoki «275» → soniya */
function parseDur(/** @type {string} */ v) {
  const s = String(v || "").trim();
  const m = /^(\d{1,3}):([0-5]?\d)$/.exec(s);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return /^\d+$/.test(s) ? Number(s) : 0;
}
const loadingHTML = () => `<div class="adm-loading" role="status"><span class="spinner" aria-hidden="true"></span>Yuklanmoqda…</div>`;
const emptyHTML = (/** @type {string} */ ic, /** @type {string} */ t, /** @type {string} */ s, actions = "") =>
  `<div class="empty"><span class="empty-ic" aria-hidden="true">${icon(ic)}</span><p class="empty-t">${esc(t)}</p>${s ? `<p class="empty-s">${esc(s)}</p>` : ""}${actions ? `<div class="empty-a">${actions}</div>` : ""}</div>`;
const alertHTML = (/** @type {string} */ msg, kind = "error") =>
  `${icon(kind === "info" ? "info" : "circle-alert")}<span>${tx(msg)}</span>`;
function showAlert(/** @type {HTMLElement} */ box, /** @type {string} */ msg, kind = "error") {
  box.className = `dform-alert${kind === "info" ? " dform-alert--info" : ""}`;
  box.innerHTML = alertHTML(msg, kind);
  box.hidden = false;
}

function toast(/** @type {string} */ msg, kind = "ok") {
  const box = $("[data-toasts]");
  const el = document.createElement("div");
  el.className = `adm-toast adm-toast--${kind}`;
  el.innerHTML = `${icon(kind === "err" ? "circle-alert" : "circle-check")}<span>${tx(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("is-out"); setTimeout(() => el.remove(), 300); }, kind === "err" ? 6500 : 3500);
}
function fail(/** @type {any} */ e) {
  if (e && e.code === "session") { endSession(); renderLogin(EXPIRED, "info"); return; }
  toast(e && e.message ? e.message : "Xatolik yuz berdi", "err");
}
/** Tugma bosilganda: band holat (spinner), qayta bosilmaydi. Tugma allaqachon band bo'lsa — SKIP qaytadi. */
const SKIP = Symbol("skip");
async function busy(/** @type {HTMLButtonElement | null} */ btn, /** @type {() => Promise<any>} */ fn) {
  if (btn?.disabled) return SKIP;
  const lab = btn ? $("[data-label]", btn) : null;
  const old = lab ? lab.textContent : "";
  if (btn) btn.disabled = true;
  if (lab) lab.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${esc(old)}`;
  try { return await fn(); } finally {
    if (btn && btn.isConnected) { btn.disabled = false; if (lab) lab.textContent = old; }
  }
}

/* ------------------------------ Dialoglar ------------------------------ */
/** @type {Element | null} */
let lastFocus = null;
/** @type {() => boolean} */
let isDirty = () => false;
function openDialog(/** @type {string} */ html) {
  lastFocus = document.activeElement;
  isDirty = () => false;
  dlg.innerHTML = html;
  dlg.showModal();
}
dlg.addEventListener("close", () => {
  // «close» hodisasi kechikib keladi: shu orada yangi oyna ochilgan bo'lsa — uning mazmuniga tegmaymiz
  if (dlg.open) return;
  dlg.innerHTML = "";
  if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus();
});
dlg.addEventListener("cancel", async (e) => { // Esc: saqlanmagan o'zgarish bo'lsa — so'raymiz
  if (!isDirty()) return;
  e.preventDefault();
  if (await confirmBox({ title: "O‘zgarishlar saqlanmasinmi?", text: "Kiritilgan ma’lumot yo‘qoladi.", ok: "Saqlamasdan yopish", danger: true })) dlg.close();
});
dlg.addEventListener("click", async (e) => {
  const t = /** @type {HTMLElement} */ (e.target);
  if (!t.closest("[data-close]")) return;
  if (isDirty() && !(await confirmBox({ title: "O‘zgarishlar saqlanmasinmi?", text: "Kiritilgan ma’lumot yo‘qoladi.", ok: "Saqlamasdan yopish", danger: true }))) return;
  dlg.close();
});

/** Tasdiqlash oynasi (ikkinchi dialog — tahrirlash oynasi ustida ham ochiladi). Standart fokus — xavfsiz tugma. */
function confirmBox(/** @type {{ title: string, text?: string, ok?: string, danger?: boolean }} */ o) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    cfm.innerHTML = `<form method="dialog" class="adm-cfm">
      <h2 id="cfm-title" class="adm-h3">${esc(o.title)}</h2>${o.text ? `<p>${esc(o.text)}</p>` : ""}
      <div class="adm-cfm-actions"><button class="btn btn-ghost" value="no">Bekor qilish</button>
        <button class="btn ${o.danger ? "btn-danger" : "btn-primary"}" value="yes">${esc(o.ok || "Tasdiqlash")}</button></div></form>`;
    cfm.returnValue = "";
    cfm.addEventListener("close", () => {
      resolve(cfm.returnValue === "yes");
      cfm.innerHTML = "";
      if (prev instanceof HTMLElement && prev.isConnected) prev.focus();
    }, { once: true });
    cfm.showModal();
    $('button[value="no"]', cfm)?.focus();
  });
}

/* ------------------------------ Kirish ------------------------------ */
function showUser(/** @type {string} */ email) {
  const box = $("[data-user]");
  box.hidden = !email;
  $("[data-user-email]", box).textContent = email;
  $("[data-user-initial]", box).textContent = (email || "?").charAt(0).toUpperCase();
}
function endSession(remote = false) {
  const s = S.session;
  Object.assign(S, { session: null, me: null, tutorials: null, leads: null, counts: null, settings: null, tab: "videos", leadFilter: "new" });
  store.set(null);
  showUser("");
  if (dlg.open) dlg.close();
  if (remote && s?.access_token) authCall("logout", {}, s.access_token).catch(() => { /* lokal sessiya baribir o'chirildi */ });
}

function renderSetup() {
  root.innerHTML = `<section class="adm-card adm-setup" aria-labelledby="setup-title">
    <span class="adm-login-ic" aria-hidden="true">${icon("database-backup")}</span>
    <h2 id="setup-title" class="adm-h2">Backend hali ulanmagan</h2>
    <p class="adm-sub">Video qo‘llanmalar va demo so‘rovlari bepul Supabase loyihasida saqlanadi. Ulash uchun:</p>
    <ol class="adm-steps">
      <li><b>supabase.com</b> da yangi loyiha oching (bepul tarif yetarli).</li>
      <li>SQL Editor’da <code>backend/schema.sql</code> faylini to‘liq ishga tushiring.</li>
      <li>Authentication → Users → «Add user»: email va parol («Auto Confirm User»). So‘ng SQL Editor’da:
        <code class="adm-code">select public.site_admin_add('email@example.com');</code></li>
      <li>Project Settings → Data API dagi manzil va API Keys dagi ochiq (publishable / anon) kalitni <code>frontend/site.config.mjs</code> ga yozing (SUPABASE_URL, SUPABASE_ANON_KEY) va saytni qayta build qiling.</li>
    </ol>
    <p class="adm-sub">Batafsil: <code>backend/README.md</code></p>
  </section>`;
}

function renderLogin(msg = "", kind = "error") {
  showUser("");
  root.innerHTML = `<section class="adm-login" aria-labelledby="login-title">
    <span class="adm-login-ic" aria-hidden="true">${icon("lock")}</span>
    <h2 id="login-title" class="adm-h2">Kirish</h2>
    <p class="adm-sub">Faqat sayt adminlari uchun. Hisob backend’da (Supabase → Authentication) yaratiladi.</p>
    <form class="adm-form" data-login novalidate>
      <div class="field"><label for="login-email">Email</label>
        <input id="login-email" name="email" type="email" autocomplete="username" inputmode="email" required spellcheck="false" autocapitalize="off"></div>
      <div class="field"><label for="login-pass">Parol</label>
        <input id="login-pass" name="password" type="password" autocomplete="current-password" required></div>
      <div class="dform-alert" role="alert" hidden data-alert></div>
      <button class="btn btn-primary btn-lg adm-wide" type="submit"><span data-label>Kirish</span></button>
    </form>
  </section>`;
  const form = /** @type {HTMLFormElement} */ ($("[data-login]", root));
  const box = $("[data-alert]", form);
  if (msg) showAlert(box, msg, kind);
  const f = /** @type {any} */ (form.elements);
  f.email.value = store.lastEmail();
  (f.email.value ? f.password : f.email).focus();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = f.email.value.trim(), password = f.password.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) { showAlert(box, "Email manzilini to‘liq yozing."); f.email.focus(); return; }
    if (!password) { showAlert(box, "Parolni yozing."); f.password.focus(); return; }
    box.hidden = true;
    busy($('button[type="submit"]', form), async () => {
      try {
        saveSession(await authCall("token?grant_type=password", { email, password }));
        await enter();
      } catch (err) {
        if (S.session) endSession(); // kirildi, lekin backend javob bermadi — yarim sessiya qolmasin
        showAlert(box, /** @type {any} */ (err).message || NET);
        f.password.select();
      }
    });
  });
}

async function enter() {
  const me = await rpc("site_admin_me");
  if (!me || !me.is_admin) {
    const email = (me && me.email) || S.session?.email || "";
    endSession(true);
    renderLogin(`«${email}» hisobiga admin huquqi berilmagan. Supabase SQL Editor’da bajaring: select public.site_admin_add('${email}');`, "info");
    return;
  }
  S.me = me;
  showUser(me.email || S.session?.email || "");
  renderApp();
  await loadTab();
  if (S.tab !== "leads") loadLeadCounts();
}

async function boot() {
  if (!D.supabaseUrl) { renderSetup(); return; }
  S.session = store.get();
  if (!S.session) { renderLogin(); return; }
  try { await enter(); } catch (e) {
    const err = /** @type {any} */ (e);
    endSession();
    renderLogin(err.code === "session" ? EXPIRED : err.message, err.code === "session" ? "info" : "error");
  }
}

/* ------------------------------ Asosiy oyna: bo'limlar ------------------------------ */
function renderApp() {
  root.innerHTML = `<div class="seg adm-tabs" role="tablist" aria-label="Bo‘limlar">
      ${TABS.map(([id, name, short]) => `<button type="button" role="tab" id="tab-${id}" aria-controls="adm-panel" aria-selected="${S.tab === id}" tabindex="${S.tab === id ? 0 : -1}" data-tab="${id}"><span class="adm-tab-long">${esc(name)}</span><span class="adm-tab-short">${esc(short)}</span><span class="adm-count" data-count="${id}"></span></button>`).join("")}
    </div>
    <section class="adm-panel" id="adm-panel" role="tabpanel" aria-labelledby="tab-${S.tab}" tabindex="-1" data-panel></section>`;
  renderPanel();
  updateCounts();
}
function selectTab(/** @type {string} */ id, focus = false) {
  if (S.tab === id) return;
  S.tab = id;
  for (const b of $$('[role="tab"]', root)) {
    const on = b.dataset.tab === id;
    b.setAttribute("aria-selected", String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  }
  $("[data-panel]", root).setAttribute("aria-labelledby", `tab-${id}`);
  renderPanel();
  loadTab();
}
function updateCounts() {
  const v = $('[data-count="videos"]', root), l = $('[data-count="leads"]', root);
  if (v) v.textContent = S.tutorials ? String(S.tutorials.length) : "";
  if (l) {
    const n = S.counts && S.counts.new ? Number(S.counts.new) : 0;
    l.innerHTML = n ? `${n}<span class="adm-hide-sm"> yangi</span>` : "";
    l.classList.toggle("adm-count--new", !!n);
  }
}
async function loadTab(force = false) {
  const tab = S.tab;
  try {
    if (tab === "videos" && (force || !S.tutorials)) S.tutorials = await rpc("site_tutorials_admin");
    if (tab === "leads" && (force || !S.leads)) { const r = await rpc("site_leads_admin", { p_status: S.leadFilter }); S.leads = r.items; S.counts = r.counts; }
    if (tab === "settings" && (force || !S.settings)) S.settings = await rpc("site_settings_admin");
  } catch (e) { fail(e); return; }
  if (S.tab === tab && S.me) renderPanel();
  updateCounts();
}
async function loadLeadCounts() {
  try {
    const r = await rpc("site_leads_admin", { p_status: "new" });
    S.counts = r.counts;
    if (S.leadFilter === "new" && !S.leads) S.leads = r.items;
    updateCounts();
  } catch { /* hisoblagich ikkinchi darajali */ }
}
function renderPanel() {
  const panel = $("[data-panel]", root);
  if (!panel) return;
  panel.innerHTML = S.tab === "videos" ? videosHTML() : S.tab === "leads" ? leadsHTML() : settingsHTML();
  if (S.tab === "settings" && S.settings) bindSettings(panel);
}

/* ------------------------------ Video qo'llanmalar ------------------------------ */
function videosHTML() {
  const list = S.tutorials;
  const head = `<div class="adm-toolbar">
    <div><h2 class="adm-h2">Video qo‘llanmalar</h2>
      <p class="adm-sub">E’lon qilingan video saytda darhol ko‘rinadi: kutubxonada, tegishli biznes turi va imkoniyatlar sahifalarida.</p></div>
    <div class="adm-actions">
      <button class="btn btn-secondary btn-sm" type="button" data-act="refresh" aria-label="Yangilash">${icon("refresh-cw")}</button>
      <button class="btn btn-primary btn-sm" type="button" data-act="new-video">${icon("plus")}<span>Yangi video</span></button>
    </div></div>`;
  if (!list) return head + loadingHTML();
  if (!list.length) return head + emptyHTML("film", "Hali video yo‘q", "«Yangi video» ni bosing va YouTube havolasini yoki .mp4 fayl manzilini kiriting.",
    `<button class="btn btn-primary" type="button" data-act="new-video">${icon("plus")}<span>Birinchi videoni qo‘shish</span></button>`);
  return `${head}<ul class="adm-list">${list.map((t, i) => videoRow(t, i, list.length)).join("")}</ul>
    <p class="adm-help">${icon("info")}<span>Tartib — ↑ ↓ tugmalari. Vaqtincha olib qo‘yish — ko‘z belgisi (qoralama bo‘ladi, o‘chmaydi). Qidiruv tizimlari uchun alohida sahifa sayt keyingi marta build qilinganda yaratiladi.</span></p>`;
}
function videoRow(/** @type {any} */ t, /** @type {number} */ i, /** @type {number} */ n) {
  const v = parseVideo(t.video_url);
  const thumb = t.thumbnail_url || (v && v.kind === "youtube" ? `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` : "");
  const inds = (t.industries || []).includes("umumiy") ? "Barcha bizneslar" : (t.industries || []).map((/** @type {string} */ c) => label(IND, c)).join(", ");
  const meta = [label(SEC, t.product_section), inds, label(LEV, t.difficulty), t.duration_sec ? fmtDuration(t.duration_sec) : ""].filter(Boolean);
  const name = esc(t.title);
  return `<li class="adm-row" data-id="${esc(t.id)}">
    <span class="adm-thumb">${thumb ? `<img src="${esc(thumb)}" alt="" width="96" height="54" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : icon("film")}</span>
    <div class="adm-row-main">
      <p class="adm-row-title"><b>${tx(t.title)}</b>
        <span class="badge ${t.is_published ? "badge-ready" : "badge-setup"}">${t.is_published ? "Saytda" : "Qoralama"}</span>${t.is_featured ? `<span class="badge badge-partial">Tanlangan</span>` : ""}</p>
      <p class="adm-row-meta">${meta.map((m) => tx(m)).join(" · ")}</p>
    </div>
    <div class="adm-row-actions">
      <button class="adm-ib" type="button" data-act="up" ${i === 0 ? "disabled" : ""} aria-label="Yuqoriga: ${name}" title="Yuqoriga">${icon("arrow-up")}</button>
      <button class="adm-ib" type="button" data-act="down" ${i === n - 1 ? "disabled" : ""} aria-label="Pastga: ${name}" title="Pastga">${icon("arrow-down")}</button>
      <button class="adm-ib" type="button" data-act="toggle" aria-label="${t.is_published ? "Saytdan olish" : "Saytda e’lon qilish"}: ${name}" title="${t.is_published ? "Saytdan olish (qoralama)" : "Saytda e’lon qilish"}">${icon(t.is_published ? "eye-off" : "eye")}</button>
      ${t.is_published ? `<a class="adm-ib" href="/video-qollanmalar/korish/?v=${encodeURIComponent(t.slug)}" target="_blank" rel="noopener" aria-label="Saytda ko‘rish: ${name} (yangi oynada)" title="Saytda ko‘rish">${icon("external-link")}</a>` : ""}
      <button class="adm-ib" type="button" data-act="edit" aria-label="Tahrirlash: ${name}" title="Tahrirlash">${icon("pencil")}</button>
      <button class="adm-ib adm-ib--danger" type="button" data-act="delete" aria-label="O‘chirish: ${name}" title="O‘chirish">${icon("trash-2")}</button>
    </div>
  </li>`;
}
const tutById = (/** @type {string} */ id) => (S.tutorials || []).find((x) => x.id === id);

/** Imkoniyatlar (tanlangan bo'lim bo'yicha) */
const capOptions = (/** @type {string} */ section, /** @type {string} */ cur) =>
  [["", "— bo‘lim bo‘yicha (tanlanmagan)"], ...((D.caps || {})[section] || [])].map(([v, l]) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${tx(l)}</option>`).join("");

function openEditor(/** @type {any} */ t) {
  const v = t || { title: "", slug: "", video_url: "", description: "", product_section: SEC[0]?.[0] || "boshlash", industries: ["umumiy"], capability: "",
    difficulty: "beginner", duration_sec: null, tags: [], steps: [], thumbnail_url: "", captions_url: "", transcript: "", is_featured: false, is_published: false };
  const inds = new Set(v.industries && v.industries.length ? v.industries : ["umumiy"]);
  const extra = !!(v.thumbnail_url || v.captions_url || v.transcript);
  openDialog(`<form class="adm-dlg" data-editor novalidate>
    <header class="adm-dlg-hd"><h2 id="dlg-title" class="adm-h2">${t ? "Videoni tahrirlash" : "Yangi video qo‘llanma"}</h2>
      <button class="adm-ib" type="button" data-close aria-label="Yopish">${icon("x")}</button></header>
    <div class="adm-dlg-body">
      <div class="adm-grid">
        <div class="field adm-full"><label for="ed-title">Sarlavha <span class="req" aria-hidden="true">*</span></label>
          <input id="ed-title" name="title" maxlength="160" required placeholder="Masalan: Kassada birinchi sotuv" aria-describedby="ed-title-err">
          <p class="field-err" id="ed-title-err" hidden></p></div>
        <div class="field adm-full"><label for="ed-url">Video manzili <span class="req" aria-hidden="true">*</span></label>
          <input id="ed-url" name="video_url" type="url" inputmode="url" maxlength="500" required spellcheck="false" autocapitalize="off"
            placeholder="https://youtu.be/… yoki https://…/video.mp4" aria-describedby="ed-url-hint ed-url-err">
          <p class="field-hint" id="ed-url-hint">YouTube havolasi (ochiq yoki «Ro‘yxatga kiritilmagan») yoki https orqali .mp4 / .webm fayl</p>
          <div class="adm-preview" data-preview aria-live="polite"></div>
          <p class="field-err" id="ed-url-err" hidden></p></div>
        <div class="field adm-full"><label for="ed-desc">Qisqa tavsif <span class="opt">(ixtiyoriy)</span></label>
          <textarea id="ed-desc" name="description" rows="2" maxlength="2000" placeholder="Video nimani o‘rgatadi — 1–2 gap"></textarea></div>
        <div class="field"><label for="ed-sec">Bo‘lim</label>
          <div class="select"><select id="ed-sec" name="product_section">${SEC.map(([c, l]) => `<option value="${esc(c)}"${c === v.product_section ? " selected" : ""}>${tx(l)}</option>`).join("")}</select>${icon("chevron-down")}</div></div>
        <div class="field"><label for="ed-cap">Imkoniyat <span class="opt">(ixtiyoriy)</span></label>
          <div class="select"><select id="ed-cap" name="capability" aria-describedby="ed-cap-hint">${capOptions(v.product_section, v.capability || "")}</select>${icon("chevron-down")}</div>
          <p class="field-hint" id="ed-cap-hint">Tanlansa — «Imkoniyatlar» sahifasidagi aynan shu kartochkada video havolasi chiqadi</p></div>
        <fieldset class="adm-fieldset adm-full"><legend>Biznes turlari</legend>
          <div class="adm-chips" data-inds>${[["umumiy", "Barcha bizneslar"], ...IND].map(([c, l]) =>
            `<label class="adm-chip"><input type="checkbox" name="ind" value="${esc(c)}"${inds.has(c) ? " checked" : ""}><span>${tx(l)}</span></label>`).join("")}</div>
          <p class="field-hint">Video qaysi biznes turlari sahifasida ko‘rinadi</p></fieldset>
        <fieldset class="adm-fieldset"><legend>Daraja</legend>
          <div class="seg seg--radio">${LEV.map(([c, l]) => `<label><input type="radio" name="difficulty" value="${esc(c)}"${c === (v.difficulty || "beginner") ? " checked" : ""}><span>${tx(l)}</span></label>`).join("")}</div></fieldset>
        <div class="field"><label for="ed-dur">Davomiyligi <span class="opt">(daq:son)</span></label>
          <input id="ed-dur" name="duration" inputmode="numeric" maxlength="8" placeholder="4:35"></div>
        <div class="field"><label for="ed-slug">Manzil (slug) <span class="opt">(ixtiyoriy)</span></label>
          <input id="ed-slug" name="slug" maxlength="80" placeholder="avtomatik" spellcheck="false" autocapitalize="off" aria-describedby="ed-slug-hint">
          <p class="field-hint" id="ed-slug-hint">Bo‘sh qolsa — sarlavhadan yasaladi: /video-qollanmalar/<b>manzil</b>/</p></div>
        <div class="field"><label for="ed-tags">Kalit so‘zlar <span class="opt">(vergul bilan)</span></label>
          <input id="ed-tags" name="tags" maxlength="400" placeholder="kassa, chek, sotuv"></div>
        <div class="field adm-full"><label for="ed-steps">Qadamlar <span class="opt">(har biri yangi qatorda)</span></label>
          <textarea id="ed-steps" name="steps" rows="4" placeholder="«Savdo» bo‘limini oching&#10;Tovar nomini yozing va Enter bosing&#10;To‘lov turini tanlab «Sotish» ni bosing"></textarea></div>
        <details class="adm-more adm-full"${extra ? " open" : ""}><summary>Qo‘shimcha: muqova, subtitr, matnli variant</summary>
          <div class="adm-grid">
            <div class="field adm-full"><label for="ed-thumb">Muqova rasmi <span class="opt">(ixtiyoriy)</span></label>
              <input id="ed-thumb" name="thumbnail_url" type="url" maxlength="500" placeholder="https://…" spellcheck="false">
              <p class="field-hint">YouTube uchun bo‘sh qoldiring — muqova o‘zi olinadi</p></div>
            <div class="field adm-full"><label for="ed-cc">Subtitr — .vtt <span class="opt">(faqat .mp4 uchun)</span></label>
              <input id="ed-cc" name="captions_url" type="url" maxlength="500" placeholder="https://…/uz.vtt" spellcheck="false"></div>
            <div class="field adm-full"><label for="ed-tr">Matnli varianti <span class="opt">(ixtiyoriy)</span></label>
              <textarea id="ed-tr" name="transcript" rows="3" maxlength="20000"></textarea></div>
          </div>
        </details>
        <div class="adm-switches adm-full">
          <label class="adm-switch"><input type="checkbox" name="is_published" role="switch"><span class="adm-switch-ui" aria-hidden="true"></span>
            <span><b>Saytda e’lon qilish</b><small>O‘chiq bo‘lsa — qoralama, saytda ko‘rinmaydi</small></span></label>
          <label class="adm-switch"><input type="checkbox" name="is_featured" role="switch"><span class="adm-switch-ui" aria-hidden="true"></span>
            <span><b>Tanlangan</b><small>Bosh sahifada birinchi ko‘rsatiladi</small></span></label>
        </div>
      </div>
      <div class="dform-alert" role="alert" hidden data-alert></div>
    </div>
    <footer class="adm-dlg-ft"><button class="btn btn-ghost" type="button" data-close>Bekor qilish</button>
      <button class="btn btn-primary" type="submit"><span data-label>Saqlash</span></button></footer>
  </form>`);
  const form = /** @type {HTMLFormElement} */ ($("[data-editor]", dlg));
  const f = /** @type {any} */ (form.elements);
  // Qiymatlar — DOM orqali (HTML ichida ekranlash xatosi bo'lmasin)
  f.title.value = v.title || "";
  f.video_url.value = v.video_url || "";
  f.description.value = v.description || "";
  f.duration.value = v.duration_sec ? fmtDuration(v.duration_sec) : "";
  f.slug.value = v.slug || "";
  f.tags.value = (v.tags || []).join(", ");
  f.steps.value = (v.steps || []).join("\n");
  f.thumbnail_url.value = v.thumbnail_url || "";
  f.captions_url.value = v.captions_url || "";
  f.transcript.value = v.transcript || "";
  f.is_published.checked = !!v.is_published;
  f.is_featured.checked = !!v.is_featured;
  const snap = () => new URLSearchParams(/** @type {any} */ (new FormData(form))).toString();
  const initial = snap();
  isDirty = () => form.isConnected && snap() !== initial;

  // Video manzili: jonli tekshiruv va ko'rinish
  const preview = $("[data-preview]", form);
  const showPreview = () => {
    const raw = f.video_url.value.trim();
    const pv = parseVideo(raw);
    if (!raw) { preview.innerHTML = ""; return; }
    if (!pv) { preview.innerHTML = `<span class="adm-pv adm-pv--bad">${icon("circle-alert")}Manzil tanilmadi: YouTube yoki https .mp4 / .webm kerak</span>`; return; }
    preview.innerHTML = pv.kind === "youtube"
      ? `<img src="https://i.ytimg.com/vi/${esc(pv.id)}/mqdefault.jpg" alt="" width="96" height="54" referrerpolicy="no-referrer"><span class="adm-pv adm-pv--ok">${icon("circle-check")}YouTube video · ${esc(pv.id)}${pv.start ? ` · ${esc(fmtDuration(pv.start))} dan` : ""}</span>`
      : `<span class="adm-pv adm-pv--ok">${icon("circle-check")}Video fayl (${pv.type === "video/webm" ? "WebM" : "MP4"})</span>`;
  };
  let tm = 0;
  f.video_url.addEventListener("input", () => { clearTimeout(tm); tm = window.setTimeout(showPreview, 250); });
  showPreview();
  // Bo'lim o'zgarsa — imkoniyatlar ro'yxati shu bo'limniki
  f.product_section.addEventListener("change", () => { f.capability.innerHTML = capOptions(f.product_section.value, ""); });
  // Biznes turlari: «Barcha bizneslar» yoki bir nechtasi
  const box = $("[data-inds]", form);
  box.addEventListener("change", (/** @type {Event} */ e) => {
    const cb = /** @type {HTMLInputElement} */ (e.target);
    const all = /** @type {HTMLInputElement[]} */ ($$("input", box));
    const general = all.find((x) => x.value === "umumiy");
    if (cb.value === "umumiy" && cb.checked) all.forEach((x) => { x.checked = x === general; });
    else if (cb.checked && general) general.checked = false;
    if (!all.some((x) => x.checked) && general) general.checked = true;
  });

  const err = (/** @type {string} */ id, /** @type {string} */ msg) => {
    const el = $(`#${id}-err`, form), input = $(`#${id}`, form);
    if (el) { el.textContent = msg; el.hidden = !msg; }
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  };
  const alertBox = $("[data-alert]", form);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alertBox.hidden = true;
    const okTitle = err("ed-title", f.title.value.trim().length >= 3 ? "" : "Sarlavha kamida 3 belgi bo‘lsin");
    const okUrl = err("ed-url", parseVideo(f.video_url.value.trim()) ? "" : "Video manzili noto‘g‘ri: YouTube havolasi yoki https orqali .mp4 fayl kerak");
    if (!okTitle || !okUrl) { (okTitle ? f.video_url : f.title).focus(); return; }
    const body = {
      id: t ? t.id : "", title: f.title.value.trim(), slug: f.slug.value.trim().toLowerCase(), video_url: f.video_url.value.trim(),
      description: f.description.value.trim(), product_section: f.product_section.value, capability: f.capability.value,
      industries: $$('input[name="ind"]:checked', form).map((x) => x.value), difficulty: (/** @type {any} */ ($('input[name="difficulty"]:checked', form)))?.value || "beginner",
      duration_sec: parseDur(f.duration.value), tags: f.tags.value, steps: f.steps.value,
      thumbnail_url: f.thumbnail_url.value.trim(), captions_url: f.captions_url.value.trim(), transcript: f.transcript.value.trim(),
      is_published: f.is_published.checked, is_featured: f.is_featured.checked,
    };
    busy($('button[type="submit"]', form), async () => {
      try {
        await rpc("site_tutorial_save", { p: body });
        isDirty = () => false;
        dlg.close();
        toast(body.is_published ? "Saqlandi — saytda ko‘rinadi" : "Qoralama saqlandi");
        await loadTab(true);
      } catch (ex) {
        const e2 = /** @type {any} */ (ex);
        if (e2.code === "session") { fail(e2); return; }
        showAlert(alertBox, e2.message);
        alertBox.scrollIntoView({ block: "nearest" });
      }
    });
  });
  f.title.focus();
}

/* ------------------------------ Demo so'rovlar ------------------------------ */
function leadsHTML() {
  const list = S.leads;
  const head = `<div class="adm-toolbar">
    <div><h2 class="adm-h2">Demo so‘rovlar</h2><p class="adm-sub">Saytdagi formadan kelgan so‘rovlar. 12 oy saqlanadi, keyin avtomatik o‘chadi.</p></div>
    <div class="adm-actions">
      <button class="btn btn-secondary btn-sm" type="button" data-act="refresh" aria-label="Yangilash">${icon("refresh-cw")}</button>
      <button class="btn btn-secondary btn-sm" type="button" data-act="export" ${list && list.length ? "" : "disabled"}>${icon("download")}<span>Excel (CSV)</span></button>
    </div></div>
    <div class="seg adm-filter" role="group" aria-label="Holat bo‘yicha">${FILTERS.map(([k, l]) =>
      `<button type="button" data-act="filter" data-f="${k}" aria-pressed="${S.leadFilter === k}">${esc(l)}${S.counts ? `<span class="adm-n">${S.counts[k] ?? 0}</span>` : ""}</button>`).join("")}</div>`;
  if (!list) return head + loadingHTML();
  if (!list.length) return head + emptyHTML("inbox", S.leadFilter === "new" ? "Yangi so‘rov yo‘q" : "So‘rov yo‘q",
    S.leadFilter === "new" ? "Saytdagi demo formasidan kelgan so‘rovlar shu yerda chiqadi." : "Bu holatda so‘rov yo‘q.");
  return `${head}<ul class="adm-list">${list.map(leadRow).join("")}</ul>`;
}
function leadRow(/** @type {any} */ l) {
  const [st, cls] = STATUS[l.status] || STATUS.new;
  const phone = uzPhone(l.phone) || l.phone;
  const name = esc(l.name);
  return `<li class="adm-row adm-row--lead" data-id="${esc(l.id)}">
    <span class="adm-avatar adm-avatar--lg" aria-hidden="true">${esc(String(l.name || "?").trim().charAt(0).toUpperCase())}</span>
    <div class="adm-row-main">
      <p class="adm-row-title"><b>${name}</b><span class="badge ${cls}">${st}</span></p>
      <p class="adm-row-meta"><a href="tel:+${esc(l.phone)}">${esc(phone)}</a> · ${tx(label(IND, l.business_type))}${l.business_name ? ` · ${esc(l.business_name)}` : ""} · <time datetime="${esc(l.created_at)}" title="${esc(fmtDate(l.created_at))}">${esc(relTime(l.created_at))}</time></p>
      ${l.comment ? `<p class="adm-comment">${esc(l.comment)}</p>` : ""}
      ${l.note ? `<p class="adm-note">${icon("square-pen")}<span>${esc(l.note)}</span></p>` : ""}
    </div>
    <div class="adm-row-actions">
      <a class="btn btn-secondary btn-sm" href="tel:+${esc(l.phone)}">${icon("phone")}<span>Qo‘ng‘iroq</span></a>
      <div class="select adm-select-sm"><select data-act="status" aria-label="Holat: ${name}">${Object.entries(STATUS).map(([k, [n]]) =>
        `<option value="${k}"${k === l.status ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>${icon("chevron-down")}</div>
      <button class="adm-ib" type="button" data-act="note" aria-label="Izoh yozish: ${name}" title="Izoh">${icon("square-pen")}</button>
      <button class="adm-ib adm-ib--danger" type="button" data-act="lead-delete" aria-label="O‘chirish: ${name}" title="O‘chirish">${icon("trash-2")}</button>
    </div>
  </li>`;
}
const leadById = (/** @type {string} */ id) => (S.leads || []).find((x) => x.id === id);

function openNote(/** @type {any} */ l) {
  openDialog(`<form class="adm-dlg" data-note novalidate>
    <header class="adm-dlg-hd"><h2 id="dlg-title" class="adm-h2">Izoh: ${esc(l.name)}</h2>
      <button class="adm-ib" type="button" data-close aria-label="Yopish">${icon("x")}</button></header>
    <div class="adm-dlg-body"><div class="field"><label for="note-t">Izoh <span class="opt">(faqat adminlar ko‘radi)</span></label>
      <textarea id="note-t" name="note" rows="4" maxlength="1000" placeholder="Masalan: ertaga 15:00 da demo"></textarea></div>
      <div class="dform-alert" role="alert" hidden data-alert></div></div>
    <footer class="adm-dlg-ft"><button class="btn btn-ghost" type="button" data-close>Bekor qilish</button>
      <button class="btn btn-primary" type="submit"><span data-label>Saqlash</span></button></footer></form>`);
  const form = /** @type {HTMLFormElement} */ ($("[data-note]", dlg));
  const ta = /** @type {HTMLTextAreaElement} */ ($("textarea", form));
  ta.value = l.note || "";
  const initial = ta.value;
  isDirty = () => form.isConnected && ta.value !== initial;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    busy($('button[type="submit"]', form), async () => {
      try {
        await rpc("site_lead_update", { p_id: l.id, p: { note: ta.value } });
        isDirty = () => false;
        dlg.close();
        toast("Izoh saqlandi");
        await loadTab(true);
      } catch (ex) { showAlert($("[data-alert]", form), /** @type {any} */ (ex).message); }
    });
  });
  ta.focus();
}

/** CSV (Excel uchun: UTF-8 BOM, «;» ajratgich). Formula sifatida o'qilmasligi uchun =,+,-,@ bilan boshlangan qiymatga «'» qo'shiladi. */
function exportCsv() {
  const cell = (/** @type {unknown} */ v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const rows = [["Sana", "Ism", "Telefon (+998)", "Biznes turi", "Biznes nomi", "Mijoz izohi", "Holat", "Admin izohi", "Sahifa"],
    ...(S.leads || []).map((l) => [fmtDate(l.created_at), l.name, (uzPhone(l.phone) || l.phone).replace(/^\+998 /, ""), label(IND, l.business_type),
      l.business_name || "", l.comment || "", (STATUS[l.status] || [l.status])[0], l.note || "", l.page || ""])];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `tizimchi-demo-sorovlar-${S.leadFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ------------------------------ Sozlamalar ------------------------------ */
function settingsHTML() {
  const s = S.settings;
  const head = `<div class="adm-toolbar"><div><h2 class="adm-h2">Sozlamalar</h2><p class="adm-sub">Bildirishnomalar va admin hisoblari</p></div></div>`;
  if (!s) return head + loadingHTML();
  const on = s.telegram_token_set && s.telegram_chat_ids;
  return `${head}<div class="adm-cards">
    <section class="adm-card" aria-labelledby="tg-h">
      <div class="adm-card-hd"><span class="adm-card-ic" aria-hidden="true">${icon("bell")}</span>
        <div><h3 id="tg-h" class="adm-h3">Telegram bildirishnomalari</h3><p class="adm-sub">Yangi demo so‘rovi kelganda Telegram’ga xabar keladi.</p></div>
        <span class="badge ${on ? "badge-ready" : "badge-setup"}">${on ? "Ulangan" : "Ulanmagan"}</span></div>
      ${s.pg_net ? "" : `<p class="dform-alert dform-alert--info">${icon("info")}<span>Supabase’da pg_net kengaytmasi yoqilmagan: Database → Extensions → «pg_net» ni yoqing — xabarlar shu orqali yuboriladi.</span></p>`}
      <form class="adm-form" data-tg novalidate>
        <div class="field"><label for="tg-token">Bot tokeni</label>
          <input id="tg-token" name="token" type="password" autocomplete="off" spellcheck="false" aria-describedby="tg-token-hint"
            placeholder="${s.telegram_token_set ? `Saqlangan (${esc(s.telegram_token_hint || "")}) — almashtirish uchun yangisini yozing` : "123456789:AA…"}">
          <p class="field-hint" id="tg-token-hint">@BotFather → /newbot — bot yaratilgach beriladigan kalit. Saqlangandan keyin to‘liq ko‘rsatilmaydi.</p></div>
        <div class="field"><label for="tg-chats">Chat ID</label>
          <input id="tg-chats" name="chats" autocomplete="off" spellcheck="false" inputmode="text" placeholder="123456789" aria-describedby="tg-chats-hint">
          <p class="field-hint" id="tg-chats-hint">Botingizga /start yozing, o‘z ID’ingizni @userinfobot dan oling. Bir nechta bo‘lsa — vergul bilan (5 tagacha).</p></div>
        <div class="dform-alert" role="alert" hidden data-alert></div>
        <div class="adm-form-actions">
          <button class="btn btn-primary" type="submit"><span data-label>Saqlash</span></button>
          <button class="btn btn-secondary" type="button" data-act="tg-test" ${on && s.pg_net ? "" : "disabled"}>${icon("send")}<span data-label>Sinov xabari</span></button>
          ${s.telegram_token_set ? `<button class="btn btn-ghost" type="button" data-act="tg-clear">Tokenni o‘chirish</button>` : ""}
        </div>
      </form>
    </section>
    <section class="adm-card" aria-labelledby="acc-h">
      <div class="adm-card-hd"><span class="adm-card-ic" aria-hidden="true">${icon("user")}</span>
        <div><h3 id="acc-h" class="adm-h3">Admin hisoblari</h3><p class="adm-sub">Siz: ${esc(S.me?.email || "")}</p></div></div>
      <ol class="adm-steps">
        <li>Supabase → Authentication → Users → «Add user»: email va parol, «Auto Confirm User» belgisi bilan.</li>
        <li>SQL Editor’da bajaring:<code class="adm-code">select public.site_admin_add('email@example.com');</code></li>
      </ol>
      <p class="adm-sub">Olib tashlash: <code class="adm-code">select public.site_admin_remove('email@example.com');</code></p>
      <p class="adm-sub">Parolni Supabase → Authentication → Users’da o‘zgartirasiz.</p>
    </section>
  </div>`;
}
function bindSettings(/** @type {HTMLElement} */ panel) {
  const form = /** @type {HTMLFormElement | null} */ ($("[data-tg]", panel));
  if (!form) return;
  const f = /** @type {any} */ (form.elements);
  f.chats.value = S.settings.telegram_chat_ids || "";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    /** @type {Record<string, string>} */
    const p = { telegram_chat_ids: f.chats.value.trim(), site_url: location.origin };
    if (f.token.value.trim()) p.telegram_bot_token = f.token.value.trim();
    busy($('button[type="submit"]', form), async () => {
      try {
        S.settings = await rpc("site_settings_save", { p });
        toast("Saqlandi");
        renderPanel();
      } catch (ex) { showAlert($("[data-alert]", form), /** @type {any} */ (ex).message); }
    });
  });
}

/* ------------------------------ Hodisalar ------------------------------ */
root.addEventListener("click", async (/** @type {MouseEvent} */ e) => {
  const el = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-act], [data-tab]"));
  if (!el || !root.contains(el)) return;
  if (el.dataset.tab) { selectTab(el.dataset.tab); return; }
  const act = el.dataset.act;
  const row = /** @type {HTMLElement | null} */ (el.closest("[data-id]"));
  const id = row?.dataset.id || "";
  try {
    if (act === "refresh") {
      if (S.tab === "videos") S.tutorials = null; else if (S.tab === "leads") S.leads = null; else S.settings = null;
      renderPanel();
      await loadTab(true);
    } else if (act === "new-video") openEditor(null);
    else if (act === "edit") openEditor(tutById(id));
    else if (act === "toggle") {
      const t = tutById(id);
      if (!t) return;
      if (await busy(/** @type {any} */ (el), () => rpc("site_tutorial_save", { p: { ...t, is_published: !t.is_published } })) === SKIP) return;
      toast(t.is_published ? "Saytdan olindi (qoralama)" : "Saytda e’lon qilindi");
      await loadTab(true);
    } else if (act === "up" || act === "down") {
      if (await busy(/** @type {any} */ (el), () => rpc("site_tutorial_move", { p_id: id, p_dir: act === "up" ? -1 : 1 })) === SKIP) return;
      await loadTab(true);
      $(`[data-id="${CSS.escape(id)}"] [data-act="${act}"]:not([disabled])`, root)?.focus();
    } else if (act === "delete") {
      const t = tutById(id);
      if (!t || !(await confirmBox({ title: `«${t.title}» o‘chirilsinmi?`, text: "Video saytdan ham olib tashlanadi. Buni qaytarib bo‘lmaydi — vaqtincha olib qo‘yish uchun ko‘z belgisidan foydalaning.", ok: "O‘chirish", danger: true }))) return;
      await rpc("site_tutorial_delete", { p_id: id });
      toast("O‘chirildi");
      await loadTab(true);
    } else if (act === "filter") {
      S.leadFilter = el.dataset.f || "new";
      S.leads = null;
      renderPanel();
      await loadTab(true);
    } else if (act === "export") exportCsv();
    else if (act === "note") { const l = leadById(id); if (l) openNote(l); }
    else if (act === "lead-delete") {
      const l = leadById(id);
      if (!l || !(await confirmBox({ title: `${l.name} — so‘rov o‘chirilsinmi?`, text: "Buni qaytarib bo‘lmaydi.", ok: "O‘chirish", danger: true }))) return;
      await rpc("site_lead_delete", { p_id: id });
      toast("O‘chirildi");
      await loadTab(true);
    } else if (act === "tg-test") {
      const r = await busy(/** @type {any} */ (el), () => rpc("site_telegram_test"));
      if (r === SKIP) return;
      toast(`Sinov xabari yuborildi (${r?.queued ?? 0} ta chat) — Telegram’ni tekshiring`);
    } else if (act === "tg-clear") {
      if (!(await confirmBox({ title: "Telegram tokeni o‘chirilsinmi?", text: "Yangi so‘rovlar haqida xabar kelmay qoladi (so‘rovlar baribir shu yerda ko‘rinadi).", ok: "O‘chirish", danger: true }))) return;
      S.settings = await rpc("site_settings_save", { p: { telegram_bot_token: "" } });
      toast("Token o‘chirildi");
      renderPanel();
    }
  } catch (ex) { fail(ex); }
});
root.addEventListener("change", async (/** @type {Event} */ e) => {
  const sel = /** @type {HTMLSelectElement} */ (e.target);
  if (sel.dataset?.act !== "status") return;
  const id = /** @type {HTMLElement} */ (sel.closest("[data-id]"))?.dataset.id || "";
  sel.disabled = true;
  try {
    await rpc("site_lead_update", { p_id: id, p: { status: sel.value } });
    toast(`Holat: ${(STATUS[sel.value] || [sel.value])[0]}`);
    await loadTab(true);
  } catch (ex) { sel.disabled = false; fail(ex); }
});
root.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => { // tablar: ← → Home End
  const tab = /** @type {HTMLElement} */ (e.target).closest?.('[role="tab"]');
  if (!tab) return;
  const tabs = $$('[role="tab"]', root), i = tabs.indexOf(tab), n = tabs.length;
  const next = e.key === "ArrowRight" ? tabs[(i + 1) % n] : e.key === "ArrowLeft" ? tabs[(i - 1 + n) % n] : e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[n - 1] : null;
  if (next) { e.preventDefault(); selectTab(next.dataset.tab, true); }
});
$('[data-act="logout"]')?.addEventListener("click", () => { endSession(true); renderLogin("Tizimdan chiqdingiz.", "info"); });

boot();
