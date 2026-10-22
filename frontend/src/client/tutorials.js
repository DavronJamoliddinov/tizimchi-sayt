// @ts-check
/* Video qo'llanmalar: ma'lumotni tekshirish, filtrlash va HTML.
   Bu modul ham brauzerda (main.js — jonli ma'lumot), ham build'da (Node — sahifalarni oldindan chizish) ishlatiladi.
   Ma'lumot manbai: backend → public.site_tutorials_public() (faqat e'lon qilinganlari). Maydonlar: backend/schema.sql → site_tutorials. */
import { esc, tx, typo, fold, fmtDuration } from "./util.js";

/**
 * @typedef {{ kind: "youtube", id: string, start: number, embed: string, thumb: string } | { kind: "file", src: string, type: string }} Video
 * @typedef {{
 *   id: string, slug: string, title: string, description: string, video: Video, thumb: string,
 *   industries: string[], section: string, level: string, duration: number, tags: string[], steps: string[],
 *   transcript: string, captions: string, featured: boolean, sort: number, publishedAt: string, updatedAt: string,
 *   capability: string,
 * }} Tutorial
 * @typedef {{
 *   icon: (name: string, cls?: string) => string,
 *   label: { industry: (c: string) => string, section: (c: string) => string, level: (c: string) => string },
 *   href: (t: Tutorial) => string, sectionHref: (c: string) => string, industryHref: (c: string) => string,
 * }} Ctx
 */

export const LEVEL_CODES = ["beginner", "intermediate", "advanced"];
export const ALL = "umumiy";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** «90», «1m30s», «1h2m» → soniya */
function parseStart(/** @type {string | null} */ v) {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return Number(v);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(v);
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

/** https manzil bo'lsa — o'zi, aks holda "" */
export function safeHttps(/** @type {unknown} */ v) {
  try { const u = new URL(String(v ?? "")); return u.protocol === "https:" ? u.href : ""; } catch { return ""; }
}

/**
 * Video manzili: faqat YouTube (youtube.com/watch, youtu.be, /shorts/, /embed/, /live/) yoki https orqali .mp4/.webm fayl.
 * Boshqa manzil — null (saytda ko'rsatilmaydi). Server (admin funksiyasi) ham xuddi shu qoida bilan tekshiradi.
 * @returns {Video | null}
 */
export function parseVideo(/** @type {unknown} */ raw) {
  let u;
  try { u = new URL(String(raw ?? "").trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, "");
  let id = "";
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
    else { const m = /^\/(?:embed|shorts|live)\/([^/?#]+)/.exec(u.pathname); if (m) id = m[1]; }
  }
  if (id) {
    if (!YT_ID.test(id)) return null;
    const start = parseStart(u.searchParams.get("t") || u.searchParams.get("start"));
    return {
      kind: "youtube", id, start,
      embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&autoplay=1${start ? `&start=${start}` : ""}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
  if (/\.(mp4|m4v|webm)$/i.test(u.pathname)) return { kind: "file", src: u.href, type: /\.webm$/i.test(u.pathname) ? "video/webm" : "video/mp4" };
  return null;
}

const str = (/** @type {unknown} */ v, max = 20000) => String(v ?? "").trim().slice(0, max);
const list = (/** @type {unknown} */ v, max = 40) => (Array.isArray(v) ? v.map((x) => str(x, 400)).filter(Boolean).slice(0, max) : []);

/** Bazadagi qator → Tutorial (noto'g'ri yozuv — null, saytga chiqmaydi) @returns {Tutorial | null} */
export function normalize(/** @type {any} */ r) {
  if (!r || typeof r !== "object") return null;
  const slug = str(r.slug, 80);
  const title = str(r.title, 160);
  const video = parseVideo(r.video_url);
  if (!SLUG_RE.test(slug) || !title || !video) return null;
  const industries = list(r.industries, 20);
  return {
    id: str(r.id, 64) || slug, slug, title, description: str(r.description, 2000), video,
    thumb: safeHttps(r.thumbnail_url) || (video.kind === "youtube" ? video.thumb : ""),
    industries: industries.length ? industries : [ALL],
    section: str(r.product_section, 40), level: LEVEL_CODES.includes(r.difficulty) ? r.difficulty : "beginner",
    duration: Number(r.duration_sec) > 0 ? Math.round(Number(r.duration_sec)) : 0,
    tags: list(r.tags, 12), steps: list(r.steps, 40), transcript: str(r.transcript), captions: safeHttps(r.captions_url),
    featured: r.is_featured === true, sort: Number(r.sort_order) || 0,
    publishedAt: str(r.published_at || r.created_at, 40), updatedAt: str(r.updated_at, 40),
    capability: str(r.capability, 60),
  };
}

/** Imkoniyat kartochkasi uchun video: aynan shu imkoniyatga bog'langani, bo'lmasa — bo'lim videolari soni */
export function forCapability(/** @type {Tutorial[]} */ all, /** @type {string} */ section, /** @type {string} */ capId) {
  return { exact: all.find((t) => t.section === section && t.capability === capId) || null, inSection: all.filter((t) => t.section === section).length };
}

/** Admin paneldagi tartib (sort_order), keyin yangilari oldin */
export const sortTutorials = (/** @type {Tutorial[]} */ l) =>
  [...l].sort((a, b) => a.sort - b.sort || (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0));

export const appliesTo = (/** @type {Tutorial} */ t, /** @type {string} */ industry) => t.industries.includes(ALL) || t.industries.includes(industry);

/**
 * @param {Tutorial[]} items
 * @param {{ q?: string, industry?: string, section?: string, level?: string }} f
 */
export function filterTutorials(items, f) {
  const q = fold(f.q || "");
  const words = q ? q.split(" ") : [];
  return items.filter((t) => {
    if (f.industry && !appliesTo(t, f.industry)) return false;
    if (f.section && t.section !== f.section) return false;
    if (f.level && t.level !== f.level) return false;
    if (!words.length) return true;
    const hay = fold([t.title, t.description, t.tags.join(" "), t.steps.join(" ")].join(" "));
    return words.every((w) => hay.includes(w));
  });
}

/** O'xshash videolar: bir xil bo'lim yoki umumiy biznes turi, o'zi emas */
export function related(/** @type {Tutorial} */ t, /** @type {Tutorial[]} */ all, n = 3) {
  const score = (/** @type {Tutorial} */ x) => (x.section === t.section ? 2 : 0) + (x.industries.some((i) => t.industries.includes(i)) ? 1 : 0);
  return all.filter((x) => x.slug !== t.slug && score(x) > 0).sort((a, b) => score(b) - score(a) || a.sort - b.sort).slice(0, n);
}

/** Oldingi va keyingi video (umumiy tartibda) */
export function neighbors(/** @type {Tutorial} */ t, /** @type {Tutorial[]} */ all) {
  const i = all.findIndex((x) => x.slug === t.slug);
  return { prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

/* ------------------------------------------------------------------ HTML ------------------------------------------------------------------ */

/** Muqova: rasm bo'lsa — rasm, bo'lmasa brend uslubidagi zaxira bezak (video kadriga o'xshatilmaydi) */
function cover(/** @type {Tutorial} */ t, /** @type {Ctx} */ c, eager = false) {
  return t.thumb
    ? `<img src="${esc(t.thumb)}" alt="" width="480" height="270" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer">`
    : `<span class="cover-art" aria-hidden="true">${c.icon("film")}</span>`;
}

/** Kartochka (ro'yxatlar, tegishli videolar) */
export function cardHTML(/** @type {Tutorial} */ t, /** @type {Ctx} */ c) {
  const dur = fmtDuration(t.duration);
  return `<article class="tcard">
    <div class="tcard-media">${cover(t, c)}<span class="tcard-play" aria-hidden="true">${c.icon("play")}</span>${dur ? `<span class="tcard-dur">${esc(dur)}</span>` : ""}</div>
    <div class="tcard-body">
      <div class="chips">${t.section ? `<span class="chip">${tx(c.label.section(t.section))}</span>` : ""}<span class="chip chip-soft">${tx(c.label.level(t.level))}</span></div>
      <h3 class="tcard-title"><a class="stretch" href="${esc(c.href(t))}" data-track="tutorial_opened" data-slug="${esc(t.slug)}">${tx(t.title)}</a></h3>
      ${t.description ? `<p class="tcard-desc">${tx(t.description)}</p>` : ""}
      <span class="tcard-cta" aria-hidden="true">Ko‘rish ${c.icon("arrow-right")}</span>
    </div>
  </article>`;
}

/** Pleyer: avval muqova + tugma (hech narsa yuklanmaydi), bosilganda — YouTube (youtube-nocookie) yoki <video> */
export function playerHTML(/** @type {Tutorial} */ t, /** @type {Ctx} */ c) {
  const v = t.video;
  const data = v.kind === "youtube"
    ? `data-kind="youtube" data-embed="${esc(v.embed)}"`
    : `data-kind="file" data-src="${esc(v.src)}" data-type="${esc(v.type)}"${t.captions ? ` data-captions="${esc(t.captions)}"` : ""}`;
  return `<div class="player" data-player ${data} data-slug="${esc(t.slug)}" data-title="${esc(typo(t.title))}">
    <button type="button" class="player-facade" aria-label="${esc(typo(`Videoni ko'rish: ${t.title}`))}">
      ${cover(t, c, true)}<span class="player-play" aria-hidden="true">${c.icon("play")}</span>
      ${t.duration ? `<span class="tcard-dur">${esc(fmtDuration(t.duration))}</span>` : ""}
    </button>
  </div>`;
}

/** Video sahifasining asosiy qismi (sarlavha — sahifa shablonida) */
export function detailHTML(/** @type {Tutorial} */ t, /** @type {Ctx} */ c, /** @type {Tutorial[]} */ all) {
  const rel = related(t, all);
  const { prev, next } = neighbors(t, all);
  const inds = t.industries.includes(ALL) ? [] : t.industries;
  const navLink = (/** @type {Tutorial | null} */ x, /** @type {"prev" | "next"} */ dir) => (x
    ? `<a class="tnav-${dir}" href="${esc(c.href(x))}"><span class="tnav-k">${dir === "prev" ? `${c.icon("arrow-left")} Oldingi` : `Keyingi ${c.icon("arrow-right")}`}</span><span class="tnav-t">${tx(x.title)}</span></a>`
    : "<span></span>");
  return `<div class="tdetail">
    <div class="tdetail-main">
      ${playerHTML(t, c)}
      <div class="tdetail-meta chips">
        ${t.section ? `<a class="chip" href="${esc(c.sectionHref(t.section))}">${c.icon("layers")} ${tx(c.label.section(t.section))}</a>` : ""}
        <span class="chip chip-soft">${c.icon("graduation-cap")} ${tx(c.label.level(t.level))}</span>
        ${t.duration ? `<span class="chip chip-soft">${c.icon("clock")} ${esc(fmtDuration(t.duration))}</span>` : ""}
        ${inds.map((i) => `<a class="chip chip-soft" href="${esc(c.industryHref(i))}">${tx(c.label.industry(i))}</a>`).join("")}
      </div>
      ${t.description ? `<p class="tdetail-desc">${tx(t.description)}</p>` : ""}
      ${t.steps.length ? `<section class="tsteps" aria-labelledby="tsteps-h"><h2 id="tsteps-h">Qadamma-qadam</h2>
        <ol>${t.steps.map((s) => `<li>${tx(s)}</li>`).join("")}</ol></section>` : ""}
      ${t.transcript ? `<details class="ttranscript"><summary>Matnli varianti</summary><div>${tx(t.transcript).replace(/\n/g, "<br>")}</div></details>` : ""}
      <nav class="tnav" aria-label="Boshqa video qo‘llanmalar">${navLink(prev, "prev")}${navLink(next, "next")}</nav>
    </div>
    <aside class="tdetail-side" aria-label="Tegishli">
      ${t.section ? `<a class="side-link" href="${esc(c.sectionHref(t.section))}">${c.icon("layers")}<span><b>${tx(c.label.section(t.section))}</b><small>Bu bo‘lim imkoniyatlari</small></span>${c.icon("chevron-right")}</a>` : ""}
      <h2 class="side-h">Tegishli videolar</h2>
      ${rel.length ? `<div class="side-list">${rel.map((x) => `<a class="side-video" href="${esc(c.href(x))}"><span class="side-thumb">${cover(x, c)}</span><span>${tx(x.title)}<small>${esc(fmtDuration(x.duration))}</small></span></a>`).join("")}</div>`
        : `<p class="muted small">Hozircha tegishli video yo‘q.</p>`}
    </aside>
  </div>`;
}

/** Bo'sh holat: video hali yo'q yoki filtr bo'yicha topilmadi */
export function emptyHTML(/** @type {{ title: string, text: string, actions?: string }} */ e, /** @type {Ctx} */ c) {
  return `<div class="empty"><span class="empty-ic" aria-hidden="true">${c.icon("circle-play")}</span>
    <p class="empty-t">${tx(e.title)}</p><p class="empty-s">${tx(e.text)}</p>${e.actions ? `<div class="empty-a">${e.actions}</div>` : ""}</div>`;
}

export const EMPTY_SECTION = { title: "Video qo'llanma tez orada", text: "Bu bo'lim uchun video qo'llanma tez orada qo'shiladi." };
export const EMPTY_LIBRARY = { title: "Video qo'llanmalar tayyorlanmoqda", text: "Birinchi videolar tez orada qo'shiladi. Hozircha jonli demoda tizimni xavfsiz sinab ko'rishingiz mumkin." };

const grid = (/** @type {Tutorial[]} */ l, /** @type {Ctx} */ c) => `<div class="tgrid">${l.map((t) => cardHTML(t, c)).join("")}</div>`;

/** Kutubxona (filtrsiz): tanlanganlar, yangi qo'shilganlar, barchasi — yoki bo'sh holat */
export function libraryHTML(/** @type {Tutorial[]} */ all, /** @type {Ctx} */ c, emptyActions = "") {
  if (!all.length) return emptyHTML({ ...EMPTY_LIBRARY, actions: emptyActions }, c);
  const featured = all.filter((t) => t.featured).slice(0, 3);
  const recent = [...all].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0)).slice(0, 3);
  return `${featured.length ? `<section class="tblock"><h2 class="h-small">Tanlangan</h2>${grid(featured, c)}</section>` : ""}
    ${all.length > 3 ? `<section class="tblock"><h2 class="h-small">Yangi qo‘shilganlar</h2>${grid(recent, c)}</section>` : ""}
    <section class="tblock"><h2 class="h-small">Barcha videolar</h2>${grid(all, c)}</section>`;
}

/** Filtr natijasi */
export function resultsHTML(/** @type {Tutorial[]} */ l, /** @type {Ctx} */ c) {
  return l.length ? grid(l, c) : emptyHTML({ title: "Hech narsa topilmadi", text: "Boshqa so'z yoki filtr bilan urinib ko'ring.",
    actions: `<button class="btn btn-secondary" type="button" data-treset-btn>${c.icon("x")}<span>Filtrlarni tozalash</span></button>` }, c);
}

/** Imkoniyat kartochkasidagi «video» qatori */
export function capVideoHTML(/** @type {Tutorial[]} */ all, /** @type {string} */ section, /** @type {string} */ capId, /** @type {Ctx} */ c) {
  const { exact, inSection } = forCapability(all, section, capId);
  if (exact) return `<a class="cap-video cap-video--on" href="${esc(c.href(exact))}" data-track="tutorial_opened" data-slug="${esc(exact.slug)}">${c.icon("circle-play")}<span>Video qo‘llanmani ko‘rish</span></a>`;
  if (inSection) return `<a class="cap-video" href="/video-qollanmalar/?bolim=${esc(section)}">${c.icon("circle-play")}<span>Bo‘lim videolari: ${inSection} ta</span></a>`;
  return `<span class="cap-video cap-video--off">${c.icon("clock")}<span>Video qo‘llanma tez orada</span></span>`;
}
