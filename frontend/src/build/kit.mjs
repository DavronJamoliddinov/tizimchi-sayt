// @ts-check
/* Sayt komponentlari (HTML satrlari). Matn — tx() (tipografiya + ekranlash), atribut — at(). */
import { esc, tx, typo } from "../client/util.js";
import { SHOTS, SHOT_NOTE } from "../../content/shots.mjs";
import { FIT } from "../../content/industries.mjs";

/** Atribut qiymati: tipografiya + ekranlash */
export const at = (/** @type {unknown} */ s) => esc(typo(s));

/**
 * @typedef {{
 *   site: string, app: string, supabaseUrl: string, anonKey: string, phone: string, telegram: string,
 *   leadEndpoint: string, tutorialsLive: boolean, dev: boolean, year: number, buildDate: string,
 *   legal: Record<string, string>, social: Record<string, string>,
 * }} Cfg
 * @typedef {{
 *   cfg: Cfg, asset: (p: string) => string, icon: (n: string, cls?: string) => string,
 *   url: (p: string) => string, appUrl: (p?: string) => string, tutorials: import("../client/tutorials.js").Tutorial[],
 *   tctx: import("../client/tutorials.js").Ctx,
 * }} Ctx
 */

/** Lucide ikonkalari (frontend/assets/icons.json) — noma'lum nom build'ni to'xtatadi */
export function makeIcon(/** @type {Record<string, string>} */ icons) {
  return (/** @type {string} */ name, cls = "") => {
    const d = icons[name];
    if (!d) throw new Error(`Ikonka topilmadi: ${name} (scripts/assets.mjs ro'yxatiga qo'shing va npm run assets -- icons)`);
    return `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
  };
}

/** Tashqi havola (ilova, demo, Telegram): yangi oynada — buni ekran o'quvchiga ham aytamiz */
export const ext = (/** @type {Ctx} */ c) => `target="_blank" rel="noopener" `;
export const srNew = `<span class="sr-only"> (yangi oynada ochiladi)</span>`;

/**
 * Tugma-havola
 * @param {Ctx} c @param {string} label @param {string} href
 * @param {{ kind?: "primary" | "secondary" | "ghost" | "dark" | "light", size?: "sm" | "md" | "lg", icon?: string, iconEnd?: string, attrs?: string, external?: boolean, cls?: string }} [o]
 */
export function btn(c, label, href, o = {}) {
  const cls = ["btn", `btn-${o.kind || "primary"}`, o.size && o.size !== "md" ? `btn-${o.size}` : "", o.cls || ""].filter(Boolean).join(" ");
  return `<a class="${cls}" href="${esc(href)}" ${o.external ? ext(c) : ""}${o.attrs || ""}>${o.icon ? c.icon(o.icon) : ""}<span>${tx(label)}</span>${o.iconEnd ? c.icon(o.iconEnd) : ""}${o.external ? srNew : ""}</a>`;
}

/** Bo'lim sarlavhasi */
export function sectionHead(/** @type {{ eyebrow?: string, title: string, lead?: string, center?: boolean, id?: string, h?: 1 | 2 }} */ o) {
  const h = o.h || 2;
  return `<div class="sh${o.center ? " sh--center" : ""}">
    ${o.eyebrow ? `<p class="sh-eyebrow">${tx(o.eyebrow)}</p>` : ""}
    <h${h} class="sh-title"${o.id ? ` id="${esc(o.id)}"` : ""}>${tx(o.title)}</h${h}>
    ${o.lead ? `<p class="sh-lead">${tx(o.lead)}</p>` : ""}
  </div>`;
}

/** Non-yo'l (breadcrumbs) — ko'rinadigan va JSON-LD */
export function breadcrumbs(/** @type {Ctx} */ c, /** @type {{ name: string, href: string }[]} */ items) {
  return `<nav class="crumbs" aria-label="Sahifa yo‘li"><ol>${items.map((it, i) => i === items.length - 1
    ? `<li aria-current="page">${tx(it.name)}</li>`
    : `<li><a href="${esc(it.href)}">${tx(it.name)}</a>${c.icon("chevron-right")}</li>`).join("")}</ol></nav>`;
}
export const breadcrumbLd = (/** @type {Ctx} */ c, /** @type {{ name: string, href: string }[]} */ items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: typo(it.name), item: c.url(it.href) })),
});

/** Ilovaning haqiqiy kadri: srcset (1x/1.5x/2x yoki 2x/3x), o'lcham atributlari (CLS yo'q) */
export function shotImg(/** @type {Ctx} */ c, /** @type {string} */ name, /** @type {{ sizes: string, eager?: boolean, alt?: string, cls?: string }} */ o) {
  const s = SHOTS[name];
  if (!s) throw new Error(`Kadr topilmadi: ${name} (frontend/content/shots.mjs)`);
  const set = s.dprs.map((d) => `${c.asset(`shots/${name}@${d}x.webp`)} ${Math.round(s.w * d)}w`).join(", ");
  return `<img src="${c.asset(`shots/${name}@${s.dprs[0]}x.webp`)}" srcset="${set}" sizes="${esc(o.sizes)}" width="${s.w}" height="${s.h}"
    alt="${at(o.alt ?? s.alt)}"${o.cls ? ` class="${o.cls}"` : ""} ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/** Kompyuter oynasi ramkasi */
export function windowFrame(/** @type {Ctx} */ c, /** @type {string} */ shot, /** @type {{ sizes: string, eager?: boolean, cls?: string, title?: string }} */ o) {
  return `<div class="window${o.cls ? " " + o.cls : ""}">
    <div class="window-bar" aria-hidden="true"><span class="window-dots"><i></i><i></i><i></i></span>
      <span class="window-title">${c.icon("lock")}${tx(o.title || "Tizimchi")}</span><span class="window-dots window-dots--ghost"><i></i><i></i><i></i></span></div>
    <div class="window-body">${shotImg(c, shot, { sizes: o.sizes, eager: o.eager })}</div>
  </div>`;
}

/** Telefon ramkasi: tepada status satri (vaqt — kadrlardagi bilan bir xil) */
export function phoneFrame(/** @type {Ctx} */ c, /** @type {string} */ shot, /** @type {{ sizes?: string, eager?: boolean, cls?: string }} */ o = {}) {
  return `<div class="phone${o.cls ? " " + o.cls : ""}">
    <div class="phone-screen">
      <div class="phone-status" aria-hidden="true"><span class="phone-time">14:20</span><span class="phone-island"></span>
        <span class="phone-sys"><i class="sig"></i><i class="wifi"></i><i class="bat"></i></span></div>
      ${shotImg(c, shot, { sizes: o.sizes || "(min-width: 1024px) 280px, 62vw", eager: o.eager })}
    </div>
  </div>`;
}

export const shotNote = (/** @type {Ctx} */ c) => `<p class="shot-note">${c.icon("info")}${tx(SHOT_NOTE)}</p>`;

/** Moslik belgisi */
export const fitBadge = (/** @type {keyof FIT} */ fit) => `<span class="badge badge-${fit}" title="${at(FIT[fit].hint)}">${tx(FIT[fit].label)}</span>`;

/** Biznes turi kartochkasi */
export function industryCard(/** @type {Ctx} */ c, /** @type {import("../../content/industries.mjs").Industry} */ ind, /** @type {{ h?: 2 | 3, wide?: boolean }} */ o = {}) {
  const h = o.h || 3;
  return `<article class="icard${o.wide ? " icard--wide" : ""}" data-reveal>
    <div class="icard-top"><span class="itile" data-tone="${esc(ind.tone)}">${c.icon(ind.icon)}</span>${fitBadge(ind.fit)}</div>
    <div class="icard-main">
      <h${h} class="icard-title"><a class="stretch" href="/biznes-turlari/${esc(ind.slug)}/" data-track="industry_card_opened" data-industry="${esc(ind.slug)}">${tx(ind.name)}</a></h${h}>
      <p class="icard-text">${tx(ind.card.text)}</p>
    </div>
    <ul class="icard-points">${ind.card.points.map((p) => `<li${p.ok === false ? ' class="no"' : ""}>${c.icon(p.ok === false ? "minus" : "check")}<span>${tx(p.text)}</span></li>`).join("")}</ul>
    <span class="icard-more" aria-hidden="true">Batafsil ko‘rish ${c.icon("arrow-right")}</span>
  </article>`;
}

/** Savol-javoblar: <details> — JS'siz ham ishlaydi; JS silliq ochilishni qo'shadi */
export function faqList(/** @type {Ctx} */ c, /** @type {{ q: string, a: string, link?: { label: string, href: string } }[]} */ items) {
  return `<div class="faq">${items.map((f) => `<details class="faq-item">
      <summary><span>${tx(f.q)}</span><span class="faq-ic" aria-hidden="true">${c.icon("plus")}</span></summary>
      <div class="faq-a"><p>${tx(f.a)}</p>${f.link ? `<p><a class="link-arrow" href="${esc(f.link.href)}">${tx(f.link.label)} ${c.icon("arrow-right")}</a></p>` : ""}</div>
    </details>`).join("")}</div>`;
}
export const faqLd = (/** @type {{ q: string, a: string }[]} */ items) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: typo(f.q), acceptedAnswer: { "@type": "Answer", text: typo(f.a) } })),
});

/**
 * Video qo'llanmalar uchun joy: build vaqtidagi nusxadan oldindan chiziladi, brauzer jonli ma'lumot bilan yangilaydi (main.js).
 * filter: "industry:restoran" | "section:ombor" | "featured" | "all"
 * @param {Ctx} c
 * @param {{ filter: string, limit?: number, emptyTitle?: string, emptyText?: string, emptyActions?: string, cls?: string }} o
 */
export async function tutorialsSlot(c, o) {
  const T = await import("../client/tutorials.js");
  const [k, v] = o.filter.split(":");
  let list = c.tutorials;
  if (k === "industry") list = list.filter((t) => T.appliesTo(t, v));
  if (k === "section") list = list.filter((t) => t.section === v);
  if (k === "featured") list = list.filter((t) => t.featured).concat(list.filter((t) => !t.featured));
  list = list.slice(0, o.limit || 3);
  const empty = { title: o.emptyTitle || T.EMPTY_SECTION.title, text: o.emptyText || T.EMPTY_SECTION.text };
  return `<div class="tslot${o.cls ? " " + o.cls : ""}" data-tutorials="${esc(o.filter)}" data-limit="${o.limit || 3}"
      data-empty-title="${at(empty.title)}" data-empty-text="${at(empty.text)}" aria-live="polite">
    ${list.length ? `<div class="tgrid">${list.map((t) => T.cardHTML(t, c.tctx)).join("")}</div>`
      : T.emptyHTML({ ...empty, actions: o.emptyActions || "" }, c.tctx)}
    ${o.emptyActions ? `<template data-empty-actions>${o.emptyActions}</template>` : ""}
  </div>`;
}

/** Sahifa oxiridagi chaqiriq (CTA) bloki */
export function ctaBand(/** @type {Ctx} */ c, /** @type {{ title: string, text: string, primary: { label: string, href: string }, secondary?: { label: string, href: string, external?: boolean } }} */ o) {
  return `<section class="section cta-band-wrap"><div class="wrap"><div class="cta-band" data-reveal>
    <div class="cta-band-copy"><h2>${tx(o.title)}</h2><p>${tx(o.text)}</p></div>
    <div class="cta-band-actions">
      ${btn(c, o.primary.label, o.primary.href, { kind: "light", size: "lg", iconEnd: "arrow-right" })}
      ${o.secondary ? btn(c, o.secondary.label, o.secondary.href, { kind: "ghost-light", size: "lg", external: o.secondary.external, iconEnd: o.secondary.external ? "arrow-up-right" : undefined }) : ""}
    </div>
  </div></div></section>`;
}

/** JSON-LD (ma'lumot bloki — CSP skript sifatida bajarmaydi) */
export const jsonLd = (/** @type {object | object[]} */ data) =>
  (Array.isArray(data) ? data : [data]).map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`).join("\n");
