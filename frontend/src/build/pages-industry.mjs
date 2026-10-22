// @ts-check
/* Biznes turlari: ro'yxat (/biznes-turlari/) va har bir tur sahifasi (/biznes-turlari/<slug>/) — bitta shablon. */
import { esc, tx, typo } from "../client/util.js";
import { btn, sectionHead, industryCard, windowFrame, phoneFrame, shotNote, faqList, faqLd, tutorialsSlot, ctaBand,
  breadcrumbs, breadcrumbLd, fitBadge, at } from "./kit.mjs";
import { INDUSTRY_PAGES, FIT } from "../../content/industries.mjs";
import { SECTIONS, labelOf } from "../../content/taxonomy.mjs";

/** @param {import("./kit.mjs").Ctx} c */
export function industriesIndex(c) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Biznes turlari", href: "/biznes-turlari/" }];
  const main = INDUSTRY_PAGES.filter((i) => i.slug !== "boshqa");
  const other = INDUSTRY_PAGES.find((i) => i.slug === "boshqa");
  const body = `<section class="page-hero">
  <div class="wrap">
    ${breadcrumbs(c, crumbs)}
    ${sectionHead({ h: 1, eyebrow: "Biznes turlari", title: "Har bir biznes uchun o'z yechimi",
      lead: "Tizimchida restoran, dorixona, market, qurilish mollari va avto ehtiyot qismlar uchun tayyor rejimlar bor. Har bir sahifada nima tayyor va nima hozircha yo'qligi ochiq yozilgan." })}
  </div>
</section>
<section class="section section-tight">
  <div class="wrap">
    <div class="igrid">${main.map((i) => industryCard(c, i, { h: 2 })).join("")}${other ? industryCard(c, other, { h: 2, wide: true }) : ""}</div>
    <dl class="fit-legend">${Object.entries(FIT).map(([k, v]) => `<div><dt><span class="badge badge-${k}">${tx(v.label)}</span></dt><dd>${tx(v.hint)}</dd></div>`).join("")}</dl>
  </div>
</section>
${ctaBand(c, { title: "Biznesingizga mosligini aniqlaymiz", text: "Demo so'rang — jarayoningizni birga ko'rib chiqamiz va qaysi imkoniyatlar kerakligini aytamiz.",
  primary: { label: "Demo so'rash", href: "/aloqa/#demo" }, secondary: { label: "Jonli demo", href: c.appUrl("demo.html"), external: true } })}`;
  return {
    path: "/biznes-turlari/", nav: "biznes", title: "Biznes turlari",
    description: "Restoran va kafe, do'kon, supermarket, dorixona, avto ehtiyot qismlar, qurilish va xo'jalik mollari, ombor, mehmonxona va o'quv markazlari uchun Tizimchi imkoniyatlari.",
    og: "og/biznes-turlari.jpg", body, ld: [breadcrumbLd(c, crumbs)],
  };
}

/** @param {import("./kit.mjs").Ctx} c @param {import("../../content/industries.mjs").Industry} ind */
export async function industryPage(c, ind) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Biznes turlari", href: "/biznes-turlari/" }, { name: ind.name, href: `/biznes-turlari/${ind.slug}/` }];
  const demoHref = c.appUrl(`demo.html${ind.demo.query}`);
  const formHref = `/aloqa/?biznes=${ind.slug}#demo`;
  const others = INDUSTRY_PAGES.filter((i) => i.slug !== ind.slug);
  const body = `<section class="page-hero ind-hero">
  <div class="hero-glow hero-glow--soft" aria-hidden="true"></div>
  <div class="wrap">
    ${breadcrumbs(c, crumbs)}
    <div class="ind-hero-grid">
      <div class="ind-hero-copy">
        <div class="ind-hero-tags"><span class="itile itile--lg" data-tone="${esc(ind.tone)}">${c.icon(ind.icon)}</span><span class="ind-name">${tx(ind.name)}</span>${fitBadge(ind.fit)}</div>
        <h1 class="display display--md">${tx(ind.hero.title)}</h1>
        <p class="lead">${tx(ind.hero.lead)}</p>
        <div class="hero-ctas hero-ctas--left">
          ${btn(c, "Demo so'rash", formHref, { size: "lg", iconEnd: "arrow-right", attrs: `data-track="hero_cta_clicked" data-cta="industry-${ind.slug}"` })}
          ${btn(c, ind.demo.label, demoHref, { kind: "secondary", size: "lg", external: true, iconEnd: "arrow-up-right" })}
        </div>
      </div>
      <div class="ind-hero-visual">
        ${windowFrame(c, ind.shots.desktop, { sizes: "(min-width: 1100px) 640px, 92vw", eager: true, cls: "ind-window" })}
        ${phoneFrame(c, ind.shots.phone, { cls: "ind-phone", sizes: "(min-width: 1024px) 210px, 40vw" })}
      </div>
    </div>
    ${shotNote(c)}
  </div>
</section>

<section class="section" aria-labelledby="pains-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Tanish muammolar", title: "Kundalik ishda nima qiyinchilik tug'diradi", id: "pains-title" })}
    <ol class="pains">${ind.pains.map((p, i) => `<li class="pain" data-reveal><span class="pain-n">${String(i + 1).padStart(2, "0")}</span><h3>${tx(p.title)}</h3><p>${tx(p.text)}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="section section-alt" aria-labelledby="sol-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Yechim", title: "Tizimchi qanday yordam beradi", id: "sol-title" })}
    <div class="feature-grid feature-grid--cards">${ind.solutions.map((s) => `<div class="feature feature--card" data-reveal><span class="feature-ic">${c.icon(s.icon)}</span><h3>${tx(s.title)}</h3><p>${tx(s.text)}</p></div>`).join("")}</div>
  </div>
</section>

<section class="section" aria-labelledby="feat-title">
  <div class="wrap feat-layout">
    <div>
      ${sectionHead({ eyebrow: "Imkoniyatlar", title: "Nimalar tayyor", id: "feat-title" })}
      <div class="feat-groups">${ind.features.map((g) => `<div class="feat-group" data-reveal><h3>${tx(g.title)}</h3>
        <ul class="checks">${g.items.map((it) => `<li>${c.icon("check")}<span>${tx(it)}</span></li>`).join("")}</ul></div>`).join("")}</div>
    </div>
    <aside class="feat-aside" aria-label="Bilish muhim">
      ${ind.limits?.length ? `<div class="note-card note-card--limits" data-reveal><h3>${c.icon("circle-x")}${tx("Hozircha mavjud emas")}</h3>
        <ul>${ind.limits.map((l) => `<li>${tx(l)}</li>`).join("")}</ul>
        <p class="small">${tx("Bu ehtiyojlar sizga muhim bo'lsa, demo so'rovida yozing — birga muhokama qilamiz.")}</p></div>` : ""}
      ${ind.notes?.length ? `<div class="note-card" data-reveal><h3>${c.icon("info")}${tx("Bilish muhim")}</h3>
        <ul>${ind.notes.map((n) => `<li>${tx(n)}</li>`).join("")}</ul></div>` : ""}
      <div class="note-card note-card--links" data-reveal><h3>${c.icon("layers")}${tx("Tegishli bo'limlar")}</h3>
        <ul class="link-list">${ind.sections.map((s) => `<li><a class="link-arrow" href="/imkoniyatlar/#${esc(s)}">${tx(labelOf(SECTIONS, s))} ${c.icon("arrow-right")}</a></li>`).join("")}</ul></div>
    </aside>
  </div>
</section>

<section class="section section-alt" aria-labelledby="flow-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Amaliy misol", title: ind.flow.title, id: "flow-title" })}
    <ol class="flow">${ind.flow.steps.map((s, i) => `<li class="flow-step" data-reveal><span class="flow-n">${i + 1}</span><h3>${tx(s.title)}</h3><p>${tx(s.text)}</p></li>`).join("")}</ol>
  </div>
</section>

<section class="section" aria-labelledby="ivid-title">
  <div class="wrap">
    <div class="sh-row">
      ${sectionHead({ eyebrow: "Video qo'llanmalar", title: `${ind.name}: video qo'llanmalar`, id: "ivid-title" })}
      ${btn(c, "Barcha videolar", `/video-qollanmalar/?biznes=${ind.slug}`, { kind: "secondary", iconEnd: "arrow-right" })}
    </div>
    ${await tutorialsSlot(c, { filter: `industry:${ind.slug}`, limit: 3,
      emptyActions: btn(c, ind.demo.label, demoHref, { kind: "secondary", external: true, iconEnd: "arrow-up-right" }) })}
  </div>
</section>

<section class="section section-alt" aria-labelledby="ifaq-title">
  <div class="wrap faq-layout">
    <div class="faq-side">${sectionHead({ eyebrow: "Savollar", title: "Ko'p beriladigan savollar", id: "ifaq-title" })}
      <p class="muted">${tx("Boshqa savol bo'lsa — demo so'rang yoki to'g'ridan-to'g'ri yozing.")}</p>
      <p>${btn(c, "Aloqa", "/aloqa/", { kind: "secondary", iconEnd: "arrow-right" })}</p></div>
    ${faqList(c, ind.faq)}
  </div>
</section>

${ctaBand(c, { title: `${ind.name} uchun demo so'rang`, text: "Biznesingiz jarayonini birga ko'rib chiqamiz va kerakli imkoniyatlarni ko'rsatamiz.",
  primary: { label: "Demo so'rash", href: formHref }, secondary: { label: ind.demo.label, href: demoHref, external: true } })}

<section class="section section-tight" aria-labelledby="other-title">
  <div class="wrap">
    <h2 class="h-small" id="other-title">${tx("Boshqa biznes turlari")}</h2>
    <ul class="pill-links">${others.map((o) => `<li><a href="/biznes-turlari/${esc(o.slug)}/">${c.icon(o.icon)}<span>${tx(o.name)}</span></a></li>`).join("")}</ul>
  </div>
</section>`;
  return {
    path: `/biznes-turlari/${ind.slug}/`, nav: "biznes", title: ind.seo.title, description: ind.seo.description,
    og: `og/${ind.slug}.jpg`, body, bodyClass: "page-industry",
    ld: [breadcrumbLd(c, crumbs), faqLd(ind.faq)],
  };
}

export const industryTitle = (/** @type {string} */ slug) => typo((INDUSTRY_PAGES.find((i) => i.slug === slug) || { name: slug }).name);
export { at };
