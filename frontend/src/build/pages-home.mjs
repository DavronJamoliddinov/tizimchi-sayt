// @ts-check
/* Bosh sahifa */
import { esc, tx } from "../client/util.js";
import { btn, sectionHead, industryCard, windowFrame, phoneFrame, shotNote, faqList, faqLd, tutorialsSlot, at, srNew } from "./kit.mjs";
import { demoForm, demoAside } from "./forms.mjs";
import { HERO, ASSURANCES, TOUR, BENEFITS, PLATFORM, STEPS } from "../../content/home.mjs";
import { INDUSTRY_PAGES, FIT } from "../../content/industries.mjs";
import { CAPABILITY_GROUPS } from "../../content/capabilities.mjs";
import { generalFaq } from "../../content/faq.mjs";

/** @param {import("./kit.mjs").Ctx} c */
export async function homePage(c) {
  const faq = generalFaq(c.cfg);
  const body = [
    hero(c), assurances(c), industries(c), tour(c), capabilities(c), benefits(c), platform(c),
    await tutorials(c), steps(c), faqSection(c, faq), demo(c),
  ].join("\n");
  return {
    path: "/", nav: "home",
    title: "Tizimchi", fullTitle: "Tizimchi — biznesingizni bir tizimda boshqaring",
    description: "Restoran, do'kon, supermarket, dorixona va boshqa bizneslar uchun savdo, ombor, qarzlar, xodimlar va hisobotlarni bitta tizimda yuritish. Internetsiz ham ishlaydi. 14 kun bepul.",
    og: "og/home.jpg", body, bodyClass: "page-home",
    preload: [`<link rel="preload" as="image" href="${c.asset("shots/d-hisobot@1x.webp")}" imagesrcset="${["1", "1.5", "2"].map((d) => `${c.asset(`shots/d-hisobot@${d}x.webp`)} ${Math.round(1536 * Number(d))}w`).join(", ")}" imagesizes="(min-width: 1200px) 1040px, 92vw" fetchpriority="high">`],
    ld: [
      { "@context": "https://schema.org", "@type": "Organization", name: "Tizimchi", url: c.cfg.site, logo: c.url(c.asset("img/logo-512.png")),
        contactPoint: [{ "@type": "ContactPoint", telephone: c.cfg.phone.replace(/\s/g, ""), contactType: "customer support", availableLanguage: ["uz", "ru"], areaServed: "UZ" }],
        sameAs: [`https://t.me/${c.cfg.telegram}`, ...Object.values(c.cfg.social || {}).filter(Boolean)] },
      { "@context": "https://schema.org", "@type": "WebSite", name: "Tizimchi", url: c.cfg.site, inLanguage: "uz" },
      { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Tizimchi", applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android, Windows", inLanguage: ["uz", "ru"], url: c.cfg.site,
        description: "Savdo, ombor, qarzlar, xodimlar va hisobotlarni yuritish uchun biznes platformasi." },
      faqLd(faq),
    ],
  };
}

/** @param {import("./kit.mjs").Ctx} c */
function hero(c) {
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap hero-copy">
    <p class="eyebrow-pill"><span class="leaf-dot" aria-hidden="true"></span>${tx(HERO.eyebrow)}</p>
    <h1 class="display" id="hero-title"><span class="line">${tx(HERO.title[0])}</span> <span class="line grad">${tx(HERO.title[1])}</span></h1>
    <p class="lead hero-lead">${tx(HERO.lead)}</p>
    <div class="hero-ctas">
      ${btn(c, HERO.primary.label, HERO.primary.href, { size: "lg", iconEnd: "arrow-right", attrs: 'data-track="hero_cta_clicked" data-cta="primary"' })}
      ${btn(c, HERO.secondary.label, HERO.secondary.href, { kind: "secondary", size: "lg", icon: "circle-play", attrs: 'data-track="hero_cta_clicked" data-cta="secondary"' })}
    </div>
    <ul class="trust" aria-label="Asosiy afzalliklar">${HERO.trust.map((t) => `<li>${c.icon(t.icon)}<span>${tx(t.text)}</span></li>`).join("")}</ul>
  </div>
  <div class="hero-visual">
    <div class="hero-stage">
      ${windowFrame(c, "d-hisobot", { sizes: "(min-width: 1200px) 1040px, 92vw", eager: true, cls: "hero-window" })}
      ${phoneFrame(c, "p-savdo", { cls: "hero-phone", sizes: "(min-width: 1024px) 250px, 1px" })}
      <div class="float-card fc-tg" aria-hidden="true">
        <span class="fc-ic fc-ic--tg">${c.icon("send")}</span>
        <span><b>${tx("Telegram · kunlik hisobot")}</b><small>${tx("Bugun 18 ta sotuv · 7 031 267 so'm")}</small></span>
      </div>
      <div class="float-card fc-offline" aria-hidden="true">
        <span class="fc-ic fc-ic--amber">${c.icon("wifi-off")}</span>
        <span><b>${tx("Internetsiz rejim")}</b><small>${tx("3 ta amal navbatda — internet qaytganda yuboriladi")}</small></span>
      </div>
      <div class="float-card fc-stock" aria-hidden="true">
        <span class="fc-ic fc-ic--red">${c.icon("bell")}</span>
        <span><b>${tx("Kam qolgan: 2 ta tovar")}</b><small>${tx("Havo filtri Lacetti — 0 dona")}</small></span>
      </div>
    </div>
    ${shotNote(c)}
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function assurances(c) {
  return `<section class="assure" aria-label="Ishonch">
  <div class="wrap"><ul class="assure-list">${ASSURANCES.map((a) => `<li data-reveal>${c.icon(a.icon)}<div><b>${tx(a.title)}</b><span>${tx(a.text)}</span></div></li>`).join("")}</ul></div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function industries(c) {
  const main = INDUSTRY_PAGES.filter((i) => i.slug !== "boshqa");
  const other = INDUSTRY_PAGES.find((i) => i.slug === "boshqa");
  return `<section class="section" id="biznes-turlari" aria-labelledby="ind-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Biznes turlari", title: "Har bir biznes uchun o'z yechimi", id: "ind-title", center: true,
      lead: "Sohangizni tanlang: qaysi imkoniyatlar tayyor va qaysilari hozircha mavjud emasligini ochiq ko'rsatamiz." })}
    <div class="igrid">
      ${main.map((i) => industryCard(c, i)).join("")}
      ${other ? industryCard(c, other, { wide: true }) : ""}
    </div>
    <dl class="fit-legend">${Object.entries(FIT).map(([k, v]) => `<div><dt><span class="badge badge-${k}">${tx(v.label)}</span></dt><dd>${tx(v.hint)}</dd></div>`).join("")}</dl>
  </div>
</section>`;
}

/** Interaktiv tur: biznes turi → haqiqiy ekranlar (WAI-ARIA tabs, main.js) @param {import("./kit.mjs").Ctx} c */
function tour(c) {
  return `<section class="section section-alt tour" id="platforma" aria-labelledby="tour-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Platforma", title: "Tizimchini ichidan ko'ring", id: "tour-title", center: true,
      lead: "Ilovaning haqiqiy ekranlari. Biznes turini tanlang va bo'limlar bo'ylab yuring — yoki jonli demoni o'zingiz oching." })}
    <div class="tour-ind" role="tablist" aria-label="Biznes turi" data-tabs="tour-ind">
      ${TOUR.map((g, i) => `<button type="button" role="tab" id="ti-${g.id}" aria-controls="tp-${g.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${c.icon(g.icon)}<span>${tx(g.label)}</span></button>`).join("")}
    </div>
    ${TOUR.map((g, gi) => `<div class="tour-panel" role="tabpanel" id="tp-${g.id}" aria-labelledby="ti-${g.id}"${gi ? " hidden" : ""}>
      <div class="seg" role="tablist" aria-label="${at(`${g.label}: ekranlar`)}" data-tabs="tour-${g.id}">
        ${g.views.map((v, vi) => `<button type="button" role="tab" id="tv-${g.id}-${v.id}" aria-controls="tvp-${g.id}-${v.id}" aria-selected="${vi === 0}" tabindex="${vi === 0 ? 0 : -1}">${tx(v.label)}</button>`).join("")}
      </div>
      ${g.views.map((v, vi) => `<div class="tour-view" role="tabpanel" id="tvp-${g.id}-${v.id}" aria-labelledby="tv-${g.id}-${v.id}"${vi ? " hidden" : ""}>
        <div class="tour-copy">
          <h3>${tx(v.title)}</h3><p>${tx(v.text)}</p>
          <ul class="checks">${v.points.map((p) => `<li>${c.icon("check")}<span>${tx(p)}</span></li>`).join("")}</ul>
        </div>
        <div class="tour-shot">${windowFrame(c, v.shot, { sizes: "(min-width: 1100px) 760px, 92vw" })}</div>
      </div>`).join("")}
      <div class="tour-foot">
        ${btn(c, "Jonli demoni ochish", c.appUrl(`demo.html${g.demo}`), { kind: "dark", external: true, iconEnd: "arrow-up-right", attrs: `data-track="hero_cta_clicked" data-cta="tour-demo-${g.id}"` })}
        <p class="muted small">${tx("Demo brauzeringizda namunaviy ma'lumotlar bilan ishlaydi — hech narsa saqlanmaydi va buzilmaydi.")}</p>
      </div>
    </div>`).join("")}
    ${shotNote(c)}
  </div>
</section>`;
}

/** Imkoniyatlar (bento) @param {import("./kit.mjs").Ctx} c */
function capabilities(c) {
  const g = Object.fromEntries(CAPABILITY_GROUPS.map((x) => [x.id, x]));
  const tile = (/** @type {string} */ id, /** @type {string} */ cls, shot = "") => {
    const x = g[id];
    return `<article class="bento-tile ${cls}" data-reveal>
      <div class="bento-copy">
        <span class="bento-ic">${c.icon(x.icon)}</span>
        <h3><a class="stretch" href="/imkoniyatlar/#${esc(id)}">${tx(x.title)}</a></h3>
        <p>${tx(x.lead)}</p>
        <ul>${x.items.filter((it) => !it.status).slice(0, cls.includes("b-narrow") ? 5 : 3).map((it) => `<li>${tx(it.title)}</li>`).join("")}</ul>
      </div>
      ${shot ? `<div class="bento-shot" aria-hidden="true">${windowFrame(c, shot, { sizes: "(min-width: 1100px) 640px, 90vw" })}</div>` : ""}
      <span class="bento-more" aria-hidden="true">${c.icon("arrow-up-right")}</span>
    </article>`;
  };
  return `<section class="section" id="imkoniyatlar" aria-labelledby="cap-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Imkoniyatlar", title: "Kundalik ish uchun kerakli hamma narsa", id: "cap-title", center: true,
      lead: "Savdodan hisobotgacha — har bir bo'lim bir-biri bilan bog'langan: sotuv yozilishi bilan qoldiq, foyda va qarz o'zi yangilanadi." })}
    <div class="bento">
      ${tile("savdo", "b-wide b-shot", "d-savdo")}
      ${tile("mijozlar", "b-narrow")}
      ${tile("ombor", "b-narrow")}
      ${tile("hisobot", "b-wide b-shot", "d-hisobot")}
      ${tile("taminot", "b-third")}
      ${tile("xodimlar", "b-third")}
      ${tile("restoran", "b-third")}
    </div>
    <p class="center mt-l">${btn(c, "Barcha imkoniyatlar", "/imkoniyatlar/", { kind: "secondary", iconEnd: "arrow-right" })}</p>
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function benefits(c) {
  return `<section class="section section-alt" aria-labelledby="ben-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Afzalliklar", title: "Biznesingizni boshqarish yanada tushunarli bo'lsin", id: "ben-title",
      lead: "Va'da emas — kundalik ishdagi aniq o'zgarishlar." })}
    <div class="feature-grid">${BENEFITS.map((b) => `<div class="feature" data-reveal><span class="feature-ic">${c.icon(b.icon)}</span><h3>${tx(b.title)}</h3><p>${tx(b.text)}</p></div>`).join("")}</div>
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function platform(c) {
  return `<section class="section section-dark" aria-labelledby="plat-title">
  <div class="dark-glow" aria-hidden="true"></div>
  <div class="wrap">
    ${sectionHead({ eyebrow: "Har qanday sharoitda", title: "Bir platforma — har qanday qurilmada", id: "plat-title", center: true,
      lead: "Do'konda, omborda yoki yo'lda — Tizimchi siz bilan. Internet uzilsa ham ish to'xtamaydi." })}
    <div class="dark-grid">${PLATFORM.map((p) => `<div class="dark-tile" data-reveal><span class="dark-ic">${c.icon(p.icon)}</span><h3>${tx(p.title)}</h3><p>${tx(p.text)}</p></div>`).join("")}</div>
    <div class="dark-actions">
      ${btn(c, "Ilovani o'rnatish", "/yuklab-olish/", { kind: "light", icon: "smartphone" })}
      ${btn(c, "Jonli demo", c.appUrl("demo.html"), { kind: "ghost-light", external: true, iconEnd: "arrow-up-right", attrs: 'data-track="hero_cta_clicked" data-cta="platform-demo"' })}
    </div>
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
async function tutorials(c) {
  return `<section class="section" id="video" aria-labelledby="tut-title">
  <div class="wrap">
    <div class="sh-row">
      ${sectionHead({ eyebrow: "Video qo'llanmalar", title: "Tizimni o'z tezligingizda o'rganing", id: "tut-title",
        lead: "Har bir bo'lim qanday ishlashini qisqa videolarda ko'rsatamiz. Yangi videolar qo'shilishi bilan shu yerda paydo bo'ladi." })}
      ${btn(c, "Barcha video qo'llanmalar", "/video-qollanmalar/", { kind: "secondary", iconEnd: "arrow-right" })}
    </div>
    ${await tutorialsSlot(c, { filter: "featured", limit: 3, emptyTitle: "Video qo'llanmalar tayyorlanmoqda",
      emptyText: "Birinchi videolar tez orada qo'shiladi. Hozircha jonli demoda tizimni xavfsiz sinab ko'rishingiz mumkin.",
      emptyActions: btn(c, "Jonli demoni ochish", c.appUrl("demo.html"), { kind: "secondary", external: true, iconEnd: "arrow-up-right" }) })}
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function steps(c) {
  const href = (/** @type {string} */ h) => (h === "signup" ? c.appUrl("?signup=1") : h);
  return `<section class="section section-alt" id="qanday-boshlash" aria-labelledby="steps-title">
  <div class="wrap">
    ${sectionHead({ eyebrow: "Qanday boshlash mumkin", title: "Tanishuvdan ishga tushirishgacha — besh qadam", id: "steps-title", center: true })}
    <ol class="steps">${STEPS.map((s, i) => `<li class="step" data-reveal>
      <span class="step-n" aria-hidden="true">${i + 1}</span>
      <h3>${tx(s.title)}</h3><p>${tx(s.text)}</p>
      <a class="link-arrow" href="${esc(href(s.link.href))}">${tx(s.link.label)} ${c.icon("arrow-right")}</a>
    </li>`).join("")}</ol>
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c @param {ReturnType<typeof generalFaq>} faq */
function faqSection(c, faq) {
  const tel = c.cfg.phone.replace(/\s/g, "");
  return `<section class="section" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq-layout">
    <div class="faq-side">
      ${sectionHead({ eyebrow: "FAQ", title: "Ko'p beriladigan savollar", id: "faq-title" })}
      <p class="muted">${tx("Javob topmadingizmi? To'g'ridan-to'g'ri yozing yoki qo'ng'iroq qiling.")}</p>
      <div class="faq-contact">
        <a class="btn btn-secondary" href="tel:${esc(tel)}">${c.icon("phone")}<span>${esc(c.cfg.phone)}</span></a>
        <a class="btn btn-secondary" href="https://t.me/${esc(c.cfg.telegram)}" target="_blank" rel="noopener">${c.icon("send")}<span>Telegram</span>${srNew}</a>
      </div>
    </div>
    ${faqList(c, faq)}
  </div>
</section>`;
}

/** @param {import("./kit.mjs").Ctx} c */
function demo(c) {
  return `<section class="section demo-section" id="demo" aria-labelledby="demo-title">
  <div class="wrap demo-layout">
    <div class="demo-head">${sectionHead({ eyebrow: "Demo", title: "Biznesingiz uchun demo so'rang", id: "demo-title",
      lead: "So'rov qoldiring — biznesingizga mos imkoniyatlarni ko'rsatamiz va savollaringizga javob beramiz." })}</div>
    ${demoForm(c, { id: "home" })}
    ${demoAside(c)}
  </div>
</section>`;
}
