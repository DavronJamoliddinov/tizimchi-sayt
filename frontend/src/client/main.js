// @ts-check
/* tizimchi.com — brauzer skripti (ES modul, CSP: faqat 'self').
   Sahifa JS'siz ham to'liq o'qiladi; bu skript qo'shadi: mobil menyu, tablar, akkordeon animatsiyasi, paydo bo'lish,
   video qo'llanmalarni jonli yangilash va filtrlash, pleyer, demo forma, analitika chegarasi. */
import { esc, uzPhone, apiHeaders } from "./util.js";
import * as T from "./tutorials.js";

/** @type {any} */
const D = JSON.parse(document.getElementById("site-data")?.textContent || "{}");
const $ = (/** @type {string} */ s, /** @type {ParentNode} */ r = document) => /** @type {HTMLElement | null} */ (r.querySelector(s));
const $$ = (/** @type {string} */ s, /** @type {ParentNode} */ r = document) => /** @type {HTMLElement[]} */ ([...r.querySelectorAll(s)]);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const timeout = (/** @type {number} */ ms) => (typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(ms) : undefined);

/* ============================== Analitika chegarasi ==============================
   Provayder ulanmagan. Hodisalar `tizimchi:track` sifatida tarqatiladi; adapter ulansa (window.TizimchiAnalytics.track) — unga ham.
   Shaxsiy ma'lumot (ism, telefon) hech qachon yuborilmaydi. */
function track(/** @type {string} */ name, /** @type {Record<string, string>} */ props = {}) {
  const detail = { name, props, path: location.pathname };
  window.dispatchEvent(new CustomEvent("tizimchi:track", { detail }));
  const a = /** @type {any} */ (window).TizimchiAnalytics;
  if (a && typeof a.track === "function") { try { a.track(name, { ...props, path: location.pathname }); } catch { /* adapter xatosi saytni buzmasin */ } }
  if (D.dev) console.debug("[analytics]", name, props);
}
document.addEventListener("click", (e) => {
  const el = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest?.("[data-track]"));
  if (!el) return;
  const { track: name, cta, industry, slug } = el.dataset;
  track(/** @type {string} */ (name), Object.fromEntries(Object.entries({ cta, industry, slug }).filter(([, v]) => v)));
});

/* ============================== Sarlavha va mobil menyu ============================== */
function initHeader() {
  const hdr = $("[data-header]");
  if (!hdr) return;
  let raf = 0;
  const onScroll = () => { raf = 0; hdr.classList.toggle("is-scrolled", scrollY > 4); };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  const btn = /** @type {HTMLButtonElement | null} */ ($("[data-menu-btn]", hdr));
  const menu = $("[data-menu]", hdr);
  if (!btn || !menu) return;
  const outside = () => /** @type {HTMLElement[]} */ ([$("main"), $("footer"), $(".skip")].filter(Boolean));
  const focusables = () => [btn, ...$$("a, button", menu)];
  const open = () => {
    // Menyu doim sarlavha ostidan boshlanadi (tepada boshqa tasma bo'lsa ham yopish tugmasi ko'rinib tursin)
    menu.style.top = `${Math.max(0, Math.round(hdr.getBoundingClientRect().bottom))}px`;
    menu.hidden = false;
    menu.classList.add("is-open");
    hdr.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    outside().forEach((el) => { /** @type {any} */ (el).inert = true; });
    /** @type {HTMLElement | null} */ (menu.querySelector("a"))?.focus();
  };
  const close = (focusBtn = true) => {
    if (menu.hidden) return;
    menu.hidden = true;
    menu.classList.remove("is-open");
    hdr.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    outside().forEach((el) => { /** @type {any} */ (el).inert = false; });
    if (focusBtn) btn.focus();
  };
  btn.addEventListener("click", () => (menu.hidden ? open() : close()));
  menu.addEventListener("click", (e) => { if (/** @type {HTMLElement} */ (e.target).closest("a")) close(false); });
  document.addEventListener("keydown", (e) => {
    if (menu.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const f = focusables(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  matchMedia("(min-width: 1120px)").addEventListener("change", (m) => { if (m.matches) close(false); });
}

/* Bosh sahifada «FAQ» bo'limi ko'rinayotganda menyuda belgilanadi; imkoniyatlar sahifasida — bo'limlar menyusi */
function initScrollSpy() {
  if (!("IntersectionObserver" in window)) return;
  const faq = $("#faq");
  if (faq && location.pathname === "/") {
    const links = $$('.nav-link[href="/#faq"]');
    new IntersectionObserver((en) => en.forEach((x) => links.forEach((l) => l.classList.toggle("is-active", x.isIntersecting))), { rootMargin: "-40% 0px -50% 0px" }).observe(faq);
  }
  const sub = $("[data-subnav]");
  if (sub) {
    const links = /** @type {HTMLAnchorElement[]} */ ($$("a", sub));
    const map = new Map(links.map((a) => [document.getElementById(a.hash.slice(1)), a]));
    const io = new IntersectionObserver((en) => en.forEach((x) => {
      if (!x.isIntersecting) return;
      const a = map.get(/** @type {HTMLElement} */ (x.target));
      links.forEach((l) => { l.classList.toggle("is-active", l === a); if (l === a) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current"); });
      if (a) { const ul = /** @type {HTMLElement} */ (a.closest("ul")); ul.scrollTo({ left: a.offsetLeft - ul.clientWidth / 2 + a.clientWidth / 2, behavior: reduced ? "auto" : "smooth" }); }
    }), { rootMargin: "-35% 0px -60% 0px" });
    map.forEach((_, sec) => sec && io.observe(sec));
  }
}

/* ============================== Paydo bo'lish ============================== */
function initReveal() {
  const els = $$("[data-reveal]");
  if (reduced || !els.length || !("IntersectionObserver" in window)) return;
  const vh = innerHeight;
  const count = new Map();
  for (const el of els) {
    if (el.getBoundingClientRect().top < vh * 0.94) { el.classList.add("is-in"); continue; } // ekrandagilar darhol (miltillamasin)
    const p = el.parentElement, i = count.get(p) || 0;
    count.set(p, i + 1);
    el.style.setProperty("--d", `${Math.min(i, 5) * 70}ms`);
  }
  document.documentElement.classList.add("reveal-on");
  const io = new IntersectionObserver((en) => en.forEach((x) => {
    if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); }
  }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  els.forEach((el) => { if (!el.classList.contains("is-in")) io.observe(el); });
}

/* ============================== Tablar (WAI-ARIA) ============================== */
function initTabs() {
  for (const list of $$('[role="tablist"]')) {
    const tabs = /** @type {HTMLElement[]} */ ([...list.children].filter((x) => x.getAttribute("role") === "tab"));
    const select = (/** @type {HTMLElement} */ tab, focus = false) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls") || "");
        if (!panel) continue;
        const was = !panel.hidden;
        panel.hidden = !on;
        if (on && !was) { panel.classList.remove("is-entering"); void panel.offsetWidth; panel.classList.add("is-entering"); }
      }
      if (focus) tab.focus();
    };
    list.addEventListener("click", (e) => {
      const t = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('[role="tab"]'));
      if (t && tabs.includes(t)) select(t);
    });
    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(/** @type {HTMLElement} */ (document.activeElement));
      if (i < 0) return;
      const k = e.key, n = tabs.length;
      const next = k === "ArrowRight" || k === "ArrowDown" ? tabs[(i + 1) % n] : k === "ArrowLeft" || k === "ArrowUp" ? tabs[(i - 1 + n) % n]
        : k === "Home" ? tabs[0] : k === "End" ? tabs[n - 1] : null;
      if (next) { e.preventDefault(); select(next, true); }
    });
  }
}

/* ============================== Akkordeon (silliq ochilish) ============================== */
function initFaq() {
  if (reduced || !Element.prototype.animate) return;
  for (const d of /** @type {HTMLDetailsElement[]} */ ($$(".faq-item"))) {
    const s = $("summary", d), body = $(".faq-a", d);
    if (!s || !body) continue;
    let anim = /** @type {Animation | null} */ (null);
    s.addEventListener("click", (e) => {
      e.preventDefault();
      anim?.cancel();
      body.style.overflow = "hidden";
      if (d.open) {
        d.classList.add("is-closing");
        anim = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
        anim.onfinish = () => { d.open = false; d.classList.remove("is-closing"); body.style.overflow = ""; };
      } else {
        d.open = true;
        anim = body.animate([{ height: "0px", opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
        anim.onfinish = () => { body.style.overflow = ""; };
      }
    });
  }
}

/* ============================== Video qo'llanmalar ============================== */
const pretty = new Set(D.pretty || []);
/** @type {import("./tutorials.js").Ctx} */
const tctx = {
  icon: (name, cls = "") => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${(D.icons || {})[name] || ""}</svg>`,
  href: (t) => (pretty.has(t.slug) ? `/video-qollanmalar/${t.slug}/` : `/video-qollanmalar/korish/?v=${encodeURIComponent(t.slug)}`),
  label: { industry: (c) => D.labels?.industries?.[c] || c, section: (c) => D.labels?.sections?.[c] || c, level: (c) => D.labels?.levels?.[c] || c },
  sectionHref: (s) => (s === "boshlash" ? "/#qanday-boshlash" : `/imkoniyatlar/#${s}`),
  industryHref: (i) => `/biznes-turlari/${i}/`,
};

/** @type {Promise<{ list: import("./tutorials.js").Tutorial[], live: boolean }> | null} */
let loading = null;
/** Jonli ma'lumot (backend: site_tutorials_public()) — bo'lmasa build vaqtidagi nusxa */
function loadTutorials() {
  if (loading) return loading;
  loading = (async () => {
    /** @type {any[] | null} */
    let rows = null, live = false;
    if (D.tutorialsLive && D.supabaseUrl) {
      try {
        const r = await fetch(`${D.supabaseUrl}/rest/v1/rpc/site_tutorials_public`, { headers: apiHeaders(D.anonKey), signal: timeout(7000) });
        if (r.ok) { const j = await r.json(); if (Array.isArray(j)) { rows = j; live = true; } }
      } catch { /* tarmoq yo'q — nusxa ishlatiladi */ }
    }
    if (!rows && D.snapshot) {
      try { const r = await fetch(D.snapshot); if (r.ok) rows = await r.json(); } catch { /* nusxa ham yo'q */ }
    }
    const list = T.sortTutorials(/** @type {import("./tutorials.js").Tutorial[]} */ ((rows || []).map(T.normalize).filter(Boolean)));
    return { list, live };
  })();
  return loading;
}
const sig = (/** @type {import("./tutorials.js").Tutorial[]} */ l) => l.map((t) => `${t.slug}@${t.updatedAt}`).join("|");

function renderSlots(/** @type {import("./tutorials.js").Tutorial[]} */ list) {
  for (const el of $$("[data-tutorials]")) {
    const [k, v] = (el.dataset.tutorials || "").split(":");
    let l = list;
    if (k === "industry") l = l.filter((t) => T.appliesTo(t, v));
    if (k === "section") l = l.filter((t) => t.section === v);
    if (k === "featured") l = [...l.filter((t) => t.featured), ...l.filter((t) => !t.featured)];
    l = l.slice(0, Number(el.dataset.limit) || 3);
    const tpl = /** @type {HTMLTemplateElement | null} */ (el.querySelector("template[data-empty-actions]"));
    el.innerHTML = l.length ? `<div class="tgrid">${l.map((t) => T.cardHTML(t, tctx)).join("")}</div>`
      : T.emptyHTML({ title: el.dataset.emptyTitle || T.EMPTY_SECTION.title, text: el.dataset.emptyText || T.EMPTY_SECTION.text, actions: tpl ? tpl.innerHTML : "" }, tctx);
    if (tpl) el.appendChild(tpl);
  }
  for (const el of $$("[data-cap]")) {
    const [g, id] = (el.dataset.cap || "").split(":");
    el.innerHTML = T.capVideoHTML(list, g, id, tctx);
  }
}

/** Kutubxona: qidiruv va filtrlar (holat manzilda: ?q=&biznes=&bolim=&daraja=) */
function initLibrary(/** @type {import("./tutorials.js").Tutorial[]} */ list, rerender = true) {
  const form = /** @type {HTMLFormElement | null} */ ($("[data-tfilters]"));
  const out = $("[data-tlib]"), count = $("[data-tcount]");
  if (!form || !out || !count) return;
  const actions = /** @type {HTMLTemplateElement | null} */ ($("template[data-lib-actions]"))?.innerHTML || "";
  if (!list.length) { // video yo'q — filtrlar kerak emas
    form.hidden = true;
    count.textContent = "";
    if (rerender) out.innerHTML = T.libraryHTML([], tctx, actions);
    return;
  }
  form.hidden = false;
  const els = /** @type {any} */ (form.elements);
  const q = new URLSearchParams(location.search);
  if (!form.dataset.ready) {
    els.q.value = q.get("q") || "";
    els.biznes.value = q.get("biznes") || "";
    els.bolim.value = q.get("bolim") || "";
    const lv = q.get("daraja") || "";
    for (const r of /** @type {HTMLInputElement[]} */ ([...form.querySelectorAll('input[name="daraja"]')])) r.checked = r.value === lv;
  }
  const state = () => ({ q: els.q.value.trim(), industry: els.biznes.value, section: els.bolim.value, level: (/** @type {HTMLInputElement | null} */ (form.querySelector('input[name="daraja"]:checked')))?.value || "" });
  // Holat o'zgarmagan bo'lsa qayta chizilmaydi: qidiruv maydoni fokusni yo'qotganda ham «change» keladi — o'sha paytda
  // natijalar almashsa, foydalanuvchi bosayotgan tugma (masalan, «Filtrlarni tozalash») ostidan chiqib ketadi va bosish yo'qoladi
  let lastKey = "";
  const render = (force = false) => {
    const s = state();
    const key = JSON.stringify(s);
    if (!force && key === lastKey) return;
    lastKey = key;
    const active = !!(s.q || s.industry || s.section || s.level);
    const res = T.filterTutorials(list, s);
    out.innerHTML = active ? T.resultsHTML(res, tctx) : T.libraryHTML(list, tctx, actions);
    count.textContent = active ? (res.length ? `${res.length} ta video topildi` : "Video topilmadi") : `${list.length} ta video`;
    /** @type {HTMLElement} */ ($("[data-treset]", form)).hidden = !active;
    const u = new URL(location.href);
    for (const [k, v] of [["q", s.q], ["biznes", s.industry], ["bolim", s.section], ["daraja", s.level]]) { if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); }
    history.replaceState(null, "", u);
  };
  if (!form.dataset.ready) {
    form.dataset.ready = "1";
    let t = 0;
    form.addEventListener("input", () => { clearTimeout(t); t = window.setTimeout(() => render(), 140); });
    form.addEventListener("change", () => render());
    form.addEventListener("submit", (e) => { e.preventDefault(); render(); });
    form.addEventListener("reset", () => setTimeout(() => render(), 0));
    out.addEventListener("click", (e) => { if (/** @type {HTMLElement} */ (e.target).closest("[data-treset-btn]")) { form.reset(); els.q.focus(); } });
  }
  const s0 = state();
  // Filtr yo'q va ma'lumot build'dagidek — oldindan chizilgan ro'yxat to'g'ri, DOM'ga tegmaymiz (muqovalar miltillamasin)
  if (!rerender && !(s0.q || s0.industry || s0.section || s0.level)) lastKey = JSON.stringify(s0);
  else render(true);
}

/** /video-qollanmalar/korish/?v=slug — build'dan keyin qo'shilgan video */
function renderViewer(/** @type {import("./tutorials.js").Tutorial[]} */ list) {
  const box = $("[data-tview]");
  if (!box) return;
  const slug = new URLSearchParams(location.search).get("v") || "";
  const t = list.find((x) => x.slug === slug);
  if (t && pretty.has(t.slug)) { location.replace(`/video-qollanmalar/${t.slug}/`); return; }
  const title = $("[data-tview-title]");
  if (!t) {
    box.innerHTML = T.emptyHTML({ title: "Video topilmadi", text: "Bu video olib tashlangan yoki manzil noto'g'ri.",
      actions: `<a class="btn btn-secondary" href="/video-qollanmalar/">Barcha video qo‘llanmalar</a>` }, tctx);
    return;
  }
  document.title = `${t.title} — Tizimchi`;
  if (title) title.textContent = t.title;
  box.innerHTML = T.detailHTML(t, tctx, list);
}

/** Oldindan chizilgan video sahifasi: video olib tashlangan bo'lsa — ochiq aytamiz */
function checkDetail(/** @type {import("./tutorials.js").Tutorial[]} */ list, /** @type {boolean} */ live) {
  const box = $("[data-tdetail]");
  if (!box || !live) return;
  const slug = box.dataset.tdetail || "";
  const t = list.find((x) => x.slug === slug);
  if (!t) box.innerHTML = T.emptyHTML({ title: "Video olib tashlangan", text: "Bu video qo'llanma endi mavjud emas.", actions: `<a class="btn btn-secondary" href="/video-qollanmalar/">Barcha video qo‘llanmalar</a>` }, tctx);
}

async function initTutorials() {
  const needs = $("[data-tutorials], [data-cap], [data-tlib], [data-tview], [data-tdetail]");
  if (!needs) return;
  const { list, live } = await loadTutorials();
  const changed = sig(list) !== (D.snapshotSig || "");
  if (changed) renderSlots(list);
  initLibrary(list, changed);
  renderViewer(list);
  checkDetail(list, live);
}

/* Pleyer: faqat bosilganda yuklanadi (YouTube — youtube-nocookie.com), avtomatik ovozli ijro yo'q */
document.addEventListener("click", (e) => {
  const f = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest(".player-facade"));
  const p = f?.closest("[data-player]");
  if (!f || !(p instanceof HTMLElement)) return;
  const slug = p.dataset.slug || "";
  if (p.dataset.kind === "youtube" && /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?/.test(p.dataset.embed || "")) {
    const ifr = document.createElement("iframe");
    ifr.src = /** @type {string} */ (p.dataset.embed);
    ifr.title = p.dataset.title || "Video";
    ifr.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    ifr.allowFullscreen = true;
    ifr.referrerPolicy = "strict-origin-when-cross-origin";
    ifr.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox");
    p.replaceChildren(ifr);
    ifr.focus();
  } else if (p.dataset.kind === "file" && /^https:\/\//.test(p.dataset.src || "")) {
    const v = document.createElement("video");
    v.controls = true; v.playsInline = true; v.preload = "metadata";
    const src = document.createElement("source");
    src.src = /** @type {string} */ (p.dataset.src); src.type = p.dataset.type || "video/mp4";
    v.appendChild(src);
    if (p.dataset.captions) {
      const tr = document.createElement("track");
      tr.kind = "captions"; tr.srclang = "uz"; tr.label = "O‘zbekcha"; tr.src = p.dataset.captions; tr.default = true;
      v.appendChild(tr);
    }
    v.addEventListener("ended", () => track("tutorial_video_completed", { slug }), { once: true });
    v.addEventListener("error", () => { p.innerHTML = `<div class="player-error">Videoni yuklab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.</div>`; }, { once: true });
    p.replaceChildren(v);
    v.play().catch(() => { /* brauzer ruxsat bermasa — foydalanuvchi o'zi bosadi */ });
    v.focus();
  } else return;
  track("tutorial_video_started", { slug });
});

/* ============================== Demo so'rovi formasi ============================== */
const MSG = {
  name: "Ismingizni yozing (kamida 2 harf)",
  phone: "Telefon raqamini to‘liq yozing: 90 123 45 67",
  type: "Biznes turini tanlang",
  consent: "Davom etish uchun rozilik bering",
  network: "So‘rov yuborilmadi: internet aloqasini tekshirib, qayta urinib ko‘ring.",
  server: "So‘rov hozir yuborilmadi. Birozdan keyin qayta urinib ko‘ring.",
  offline: "Onlayn so‘rov hozircha ulanmagan — bizga to‘g‘ridan-to‘g‘ri yozing yoki qo‘ng‘iroq qiling:",
};

/** 9 ta raqam → «90 123 45 67» */
function fmtLocal(/** @type {string} */ v) {
  let d = v.replace(/\D/g, "");
  if (d.length > 9 && d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

function initLeadForms() {
  for (const box of $$("[data-lead]")) {
    const form = /** @type {HTMLFormElement} */ ($("form", box));
    const done = /** @type {HTMLElement} */ ($("[data-form-done]", box));
    const alertBox = /** @type {HTMLElement} */ ($("[data-form-alert]", form));
    const submit = /** @type {HTMLButtonElement} */ ($('button[type="submit"]', form));
    const label = /** @type {HTMLElement} */ ($("[data-label]", submit));
    const f = /** @type {any} */ (form.elements);
    const opened = Date.now();
    let started = false, tried = false, sending = false;

    const pre = new URLSearchParams(location.search).get("biznes");
    if (pre && [...f.business_type.options].some((/** @type {HTMLOptionElement} */ o) => o.value === pre)) f.business_type.value = pre;

    form.addEventListener("focusin", () => { if (!started) { started = true; track("demo_form_started", {}); } });
    f.phone.addEventListener("input", () => {
      const pos = f.phone.selectionStart === f.phone.value.length;
      f.phone.value = fmtLocal(f.phone.value);
      if (pos) f.phone.setSelectionRange(f.phone.value.length, f.phone.value.length);
      if (tried) check("phone");
    });
    const counter = $("[data-count]", form);
    f.comment.addEventListener("input", () => { if (counter) counter.textContent = String(f.comment.value.length); });

    const fields = { name: f.name, phone: f.phone, type: f.business_type, consent: f.consent };
    const errorOf = (/** @type {keyof typeof fields} */ k) => {
      if (k === "name") return f.name.value.trim().length >= 2 ? "" : MSG.name;
      if (k === "phone") return uzPhone(f.phone.value) ? "" : MSG.phone;
      if (k === "type") return f.business_type.value ? "" : MSG.type;
      return f.consent.checked ? "" : MSG.consent;
    };
    const check = (/** @type {keyof typeof fields} */ k) => {
      const el = fields[k], msg = errorOf(k);
      const errEl = document.getElementById(`${el.id}-err`);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (errEl) { errEl.textContent = msg; errEl.hidden = !msg; }
      return !msg;
    };
    for (const k of /** @type {(keyof typeof fields)[]} */ (Object.keys(fields))) {
      fields[k].addEventListener(k === "consent" || k === "type" ? "change" : "blur", () => { if (tried || fields[k].value) check(k); });
    }
    // Xabar bitta qator-blok bo'lib tursin (quti flex: matn va havolalar alohida ustunlarga bo'linib ketmasin)
    const showAlert = (/** @type {string} */ html, info = false) => {
      alertBox.className = `dform-alert${info ? " dform-alert--info" : ""}`;
      alertBox.innerHTML = `${tctx.icon(info ? "info" : "circle-alert")}<span>${html}</span>`;
      alertBox.hidden = false;
    };
    const contactHTML = () => {
      const c = D.contact || {};
      return ` <a href="tel:${esc(String(c.phone || "").replace(/\s/g, ""))}">${esc(c.phone || "")}</a> · <a href="https://t.me/${esc(c.telegram || "")}" target="_blank" rel="noopener">Telegram</a>`;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      tried = true;
      alertBox.hidden = true;
      const bad = /** @type {(keyof typeof fields)[]} */ (Object.keys(fields)).filter((k) => !check(k));
      if (bad.length) { fields[bad[0]].focus(); return; }
      if (!D.leadEndpoint) { // backend hali ulanmagan: so'rov hech qayerga ketmaydi — buni ochiq aytamiz
        showAlert(`${esc(MSG.offline)}${contactHTML()}`, true);
        return;
      }
      sending = true;
      submit.disabled = true;
      const old = label.textContent;
      label.innerHTML = `<span class="spinner" aria-hidden="true"></span> Yuborilmoqda…`;
      const payload = {
        name: f.name.value.trim(), phone: uzPhone(f.phone.value).replace(/\D/g, ""),
        business_name: f.business_name.value.trim(), business_type: f.business_type.value, comment: f.comment.value.trim(),
        consent: true, page: location.pathname, website: f.website.value, elapsed: Date.now() - opened,
      };
      try {
        // backend: public.site_lead_submit(p jsonb) — tekshiruv, spam cheklovi va Telegram xabari bazada
        const r = await fetch(D.leadEndpoint, {
          method: "POST", body: JSON.stringify({ p: payload }), signal: timeout(20000),
          headers: { "Content-Type": "application/json", ...apiHeaders(D.anonKey) },
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j && j.ok === true) {
          track("demo_form_submitted", { business_type: payload.business_type });
          if (j.dev) {
            const t = $("[data-done-text]", done);
            if (t) t.textContent = "Sinov rejimi: forma to‘g‘ri ishladi, lekin so‘rov serverga yuborilmadi (lokal ko‘rinish). Haqiqiy saytda so‘rov /admin/ ga tushadi.";
          }
          form.hidden = true;
          done.hidden = false;
          done.focus();
          return;
        }
        // Bazadagi tekshiruv xabarlari (P0001) — o'zbekcha; boshqa xatolarning texnik matni ko'rsatilmaydi
        const msg = j && j.code === "P0001" && j.message ? String(j.message) : MSG.server;
        showAlert(`${esc(msg)} Yoki to‘g‘ridan-to‘g‘ri yozing:${contactHTML()}`);
      } catch {
        showAlert(`${esc(MSG.network)} Yoki to‘g‘ridan-to‘g‘ri yozing:${contactHTML()}`);
      } finally {
        sending = false;
        submit.disabled = false;
        label.textContent = old;
      }
    });
  }
}

/* ============================== Ishga tushirish ============================== */
for (const el of $$("[data-year]")) el.textContent = String(new Date().getFullYear());
initHeader();
initReveal();
initTabs();
initFaq();
initScrollSpy();
initLeadForms();
initTutorials();
