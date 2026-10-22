// @ts-check
/* Imkoniyatlar, video qo'llanmalar (kutubxona va video sahifasi), aloqa, huquqiy hujjatlar, 404. */
import { esc, tx, typo, fmtDuration } from "../client/util.js";
import * as T from "../client/tutorials.js";
import { btn, sectionHead, faqList, faqLd, tutorialsSlot, ctaBand, breadcrumbs, breadcrumbLd, at, srNew } from "./kit.mjs";
import { demoForm, demoAside } from "./forms.mjs";
import { CAPABILITY_GROUPS } from "../../content/capabilities.mjs";
import { INDUSTRIES, SECTIONS, LEVELS } from "../../content/taxonomy.mjs";
import { generalFaq } from "../../content/faq.mjs";

/* ------------------------------------------------------------ Imkoniyatlar ------------------------------------------------------------ */
/** @param {import("./kit.mjs").Ctx} c */
export async function capabilitiesPage(c) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Imkoniyatlar", href: "/imkoniyatlar/" }];
  const status = (/** @type {import("../../content/capabilities.mjs").Capability} */ x) => (x.status
    ? `<span class="badge badge-${x.status}" title="${at(x.statusText || "")}">${tx(x.status === "test" ? "Sinov rejimida" : "Ulanish kerak")}</span>` : "");
  const groups = [];
  for (const g of CAPABILITY_GROUPS) {
    groups.push(`<section class="cap-group" id="${esc(g.id)}" aria-labelledby="g-${esc(g.id)}">
      <header class="cap-group-head" data-reveal>
        <span class="feature-ic">${c.icon(g.icon)}</span>
        <div><h2 id="g-${esc(g.id)}">${tx(g.title)}</h2><p>${tx(g.lead)}</p></div>
      </header>
      <div class="cap-grid">${g.items.map((x) => `<article class="cap" id="${esc(g.id)}-${esc(x.id)}" data-reveal>
        <div class="cap-head"><span class="cap-ic">${c.icon(x.icon)}</span><h3>${tx(x.title)}</h3>${status(x)}</div>
        <p class="cap-text">${tx(x.text)}</p>
        ${x.statusText ? `<p class="cap-status">${c.icon("info")}<span>${tx(x.statusText)}</span></p>` : ""}
        <dl class="cap-meta">
          <div><dt>Qaysi muammoni hal qiladi</dt><dd>${tx(x.problem)}</dd></div>
          <div><dt>Kimga foydali</dt><dd>${tx(x.who)}</dd></div>
          <div><dt>Ilovada</dt><dd>${tx(x.access)}</dd></div>
        </dl>
        <div class="cap-foot" data-cap="${esc(g.id)}:${esc(x.id)}">${T.capVideoHTML(c.tutorials, g.id, x.id, c.tctx)}</div>
      </article>`).join("")}</div>
      <div class="cap-tuts">
        <h3 class="h-small">${tx(`${g.title}: video qo'llanmalar`)}</h3>
        ${await tutorialsSlot(c, { filter: `section:${g.id}`, limit: 3, cls: "tslot--compact" })}
      </div>
    </section>`);
  }
  const body = `<section class="page-hero">
  <div class="wrap">
    ${breadcrumbs(c, crumbs)}
    ${sectionHead({ h: 1, eyebrow: "Imkoniyatlar", title: "Tizimchi nimalar qila oladi",
      lead: "Har bir imkoniyat uchun: nima qiladi, qaysi muammoni hal qiladi, kimga foydali va ilovada qayerda joylashgan. «Sinov rejimida» va «Ulanish kerak» belgilari bilan ochiq yozdik." })}
  </div>
</section>
<div class="subnav" data-subnav><div class="wrap"><nav aria-label="Imkoniyatlar bo‘limlari"><ul>${CAPABILITY_GROUPS.map((g) => `<li><a href="#${esc(g.id)}">${c.icon(g.icon)}<span>${tx(g.title)}</span></a></li>`).join("")}</ul></nav></div></div>
<div class="section section-tight"><div class="wrap cap-groups">${groups.join("")}</div></div>
${ctaBand(c, { title: "Qaysi imkoniyatlar sizga kerakligini aniqlaymiz", text: "Demo so'rang — biznesingiz jarayoni bo'yicha ko'rsatib beramiz.",
  primary: { label: "Demo so'rash", href: "/aloqa/#demo" }, secondary: { label: "Jonli demo", href: c.appUrl("demo.html"), external: true } })}`;
  return {
    path: "/imkoniyatlar/", nav: "imkoniyatlar", title: "Imkoniyatlar",
    description: "Savdo va kassa, ombor, ta'minotchilar, mijozlar va qarzlar, xodimlar, hisobotlar, restoran moduli va platforma xavfsizligi — Tizimchining barcha imkoniyatlari.",
    og: "og/imkoniyatlar.jpg", body, ld: [breadcrumbLd(c, crumbs)],
  };
}

/* ------------------------------------------------------------ Video qo'llanmalar ------------------------------------------------------------ */
/** @param {import("./kit.mjs").Ctx} c */
export function tutorialsLibraryPage(c) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Video qo'llanmalar", href: "/video-qollanmalar/" }];
  const all = c.tutorials;
  const opt = (/** @type {[string, string][]} */ l) => l.map(([v, label]) => `<option value="${esc(v)}">${tx(label)}</option>`).join("");
  const body = `<section class="page-hero">
  <div class="wrap">
    ${breadcrumbs(c, crumbs)}
    ${sectionHead({ h: 1, eyebrow: "Video qo'llanmalar", title: "Tizimni bosqichma-bosqich o'rganing",
      lead: "Biznes turi, bo'lim va daraja bo'yicha saralang. Har bir video ostida qadamlar yozilgan — kerakli joyini tez topasiz." })}
  </div>
</section>
<section class="section section-tight" aria-label="Video qo‘llanmalar ro‘yxati">
  <div class="wrap">
    <form class="tfilters" role="search" aria-label="Video qo‘llanmalarni saralash" data-tfilters hidden>
      <div class="tsearch">${c.icon("search")}<label class="sr-only" for="tf-q">Qidirish</label>
        <input id="tf-q" name="q" type="search" placeholder="${at("Qidirish, masalan: qarz")}" autocomplete="off" enterkeyhint="search"></div>
      <div class="select"><label class="sr-only" for="tf-biznes">Biznes turi</label>
        <select id="tf-biznes" name="biznes"><option value="">${tx("Barcha bizneslar")}</option>${opt(INDUSTRIES)}</select>${c.icon("chevron-down")}</div>
      <div class="select"><label class="sr-only" for="tf-bolim">Bo‘lim</label>
        <select id="tf-bolim" name="bolim"><option value="">${tx("Barcha bo'limlar")}</option>${opt(SECTIONS)}</select>${c.icon("chevron-down")}</div>
      <fieldset class="seg seg--radio"><legend class="sr-only">Daraja</legend>
        <label><input type="radio" name="daraja" value="" checked><span>Hammasi</span></label>
        ${LEVELS.map(([v, l]) => `<label><input type="radio" name="daraja" value="${esc(v)}"><span>${tx(l)}</span></label>`).join("")}
      </fieldset>
      <button class="btn btn-ghost btn-sm" type="reset" data-treset hidden>${c.icon("x")}<span>Tozalash</span></button>
    </form>
    <p class="tcount" aria-live="polite" data-tcount>${all.length ? `${all.length} ta video` : ""}</p>
    <div class="tlib" data-tlib>${T.libraryHTML(all, c.tctx, libraryActions(c))}</div>
    <template data-lib-actions>${libraryActions(c)}</template>
  </div>
</section>
${ctaBand(c, { title: "Videoda javob topmadingizmi?", text: "Savolingizni yozing yoki demo so'rang — tizimni jonli ko'rsatib beramiz.",
  primary: { label: "Demo so'rash", href: "/aloqa/#demo" }, secondary: { label: "Telegram orqali yozish", href: `https://t.me/${c.cfg.telegram}`, external: true } })}`;
  return {
    path: "/video-qollanmalar/", nav: "video", title: "Video qo'llanmalar",
    description: "Tizimchidan foydalanish bo'yicha video qo'llanmalar: savdo, ombor, qarzlar, xodimlar, hisobotlar va restoran moduli — biznes turi va daraja bo'yicha.",
    og: "og/video-qollanmalar.jpg", body, ld: [breadcrumbLd(c, crumbs)],
  };
}

const libraryActions = (/** @type {import("./kit.mjs").Ctx} */ c) =>
  btn(c, "Jonli demoni ochish", c.appUrl("demo.html"), { kind: "secondary", external: true, iconEnd: "arrow-up-right" });

/** Oldindan chizilgan video sahifasi: /video-qollanmalar/<slug>/ @param {import("./kit.mjs").Ctx} c @param {T.Tutorial} t */
export function tutorialPage(c, t) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Video qo'llanmalar", href: "/video-qollanmalar/" }, { name: t.title, href: `/video-qollanmalar/${t.slug}/` }];
  const iso = (/** @type {number} */ s) => (s ? `PT${Math.floor(s / 60)}M${s % 60}S` : undefined);
  const body = `<section class="page-hero page-hero--tight">
  <div class="wrap">
    ${breadcrumbs(c, crumbs)}
    <h1 class="display display--sm">${tx(t.title)}</h1>
  </div>
</section>
<section class="section section-tight"><div class="wrap" data-tdetail="${esc(t.slug)}">${T.detailHTML(t, c.tctx, c.tutorials)}</div></section>`;
  /** @type {Record<string, unknown>} */
  const video = {
    "@context": "https://schema.org", "@type": "VideoObject", name: typo(t.title), description: typo(t.description || t.title),
    thumbnailUrl: t.thumb ? [t.thumb] : undefined, uploadDate: t.publishedAt || undefined, duration: iso(t.duration), inLanguage: "uz",
    ...(t.video.kind === "youtube" ? { embedUrl: `https://www.youtube-nocookie.com/embed/${t.video.id}` } : { contentUrl: t.video.src }),
  };
  // Tavsif: admin yozgan matn qisqa bo'lishi mumkin — har doim kontekst bilan to'ldiriladi
  const desc = `${(t.description || t.title).replace(/\s+/g, " ").trim()} Tizimchi video qo'llanmasi${t.section ? ` · ${c.tctx.label.section(t.section)}` : ""}.`;
  return {
    path: `/video-qollanmalar/${t.slug}/`, nav: "video", title: t.title,
    description: desc.length > 180 ? desc.slice(0, 177).replace(/\s+\S*$/, "") + "…" : desc, og: "og/video-qollanmalar.jpg", body,
    ld: [breadcrumbLd(c, crumbs), ...(t.thumb && t.publishedAt ? [video] : [])],
  };
}

/** Yangi (build'dan keyin qo'shilgan) videolar uchun: /video-qollanmalar/korish/?v=<slug> — brauzerda chiziladi @param {import("./kit.mjs").Ctx} c */
export function tutorialViewerPage(c) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Video qo'llanmalar", href: "/video-qollanmalar/" }];
  const body = `<section class="page-hero page-hero--tight">
  <div class="wrap">
    ${breadcrumbs(c, [...crumbs, { name: "Video", href: "/video-qollanmalar/korish/" }])}
    <h1 class="display display--sm" data-tview-title>Video qo‘llanma</h1>
  </div>
</section>
<section class="section section-tight"><div class="wrap" data-tview>
  <div class="tview-loading" role="status"><span class="spinner" aria-hidden="true"></span>Yuklanmoqda…</div>
  <noscript>${T.emptyHTML({ title: "Video ochilmadi", text: "Videoni ko'rish uchun brauzeringizda JavaScript yoqilgan bo'lishi kerak." }, c.tctx)}</noscript>
</div></section>`;
  return { path: "/video-qollanmalar/korish/", nav: "video", title: "Video qo'llanma", noindex: true, og: "og/video-qollanmalar.jpg", body,
    description: "Tizimchidan foydalanish bo'yicha video qo'llanma: qadamlar, tegishli bo'lim va o'xshash videolar." };
}

/* ------------------------------------------------------------ Aloqa ------------------------------------------------------------ */
/** @param {import("./kit.mjs").Ctx} c */
export function contactPage(c) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: "Aloqa", href: "/aloqa/" }];
  const faq = generalFaq(c.cfg).filter((f) => /Demo olish|sozlash va joriy|Texnik yordam|Narxi/.test(f.q));
  const tel = c.cfg.phone.replace(/\s/g, "");
  const cards = [
    { icon: "phone", title: "Telefon", text: c.cfg.phone, href: `tel:${tel}`, ext: false },
    { icon: "send", title: "Telegram", text: `@${c.cfg.telegram}`, href: `https://t.me/${c.cfg.telegram}`, ext: true },
    { icon: "log-in", title: "Tizimga kirish", text: "Mavjud foydalanuvchilar uchun", href: c.appUrl(), ext: false },
    { icon: "smartphone", title: "Ilovani o'rnatish", text: "Android, iPhone va kompyuter", href: c.appUrl("install.html"), ext: true },
  ];
  const body = `<section class="page-hero">
  <div class="wrap">
    ${breadcrumbs(c, crumbs)}
    ${sectionHead({ h: 1, eyebrow: "Aloqa", title: "Biz bilan bog'laning", lead: "Demo so'rang, savol bering yoki to'g'ridan-to'g'ri qo'ng'iroq qiling." })}
    <ul class="contact-grid">${cards.map((k) => `<li><a class="contact-tile" href="${esc(k.href)}"${k.ext ? ' target="_blank" rel="noopener"' : ""}>
      <span class="cc-ic${k.icon === "send" ? " cc-ic--tg" : ""}">${c.icon(k.icon)}</span><span><b>${tx(k.title)}</b><small>${tx(k.text)}</small></span>${c.icon(k.ext ? "arrow-up-right" : "arrow-right")}${k.ext ? srNew : ""}</a></li>`).join("")}</ul>
  </div>
</section>
<section class="section demo-section" id="demo" aria-labelledby="demo-title">
  <div class="wrap demo-layout">
    <div class="demo-head">${sectionHead({ eyebrow: "Demo", title: "Demo so'rovi", id: "demo-title", lead: "Biznesingiz haqida qisqacha yozing — siz bilan bog'lanib, mos imkoniyatlarni ko'rsatamiz." })}</div>
    ${demoForm(c, { id: "contact", title: "So'rov qoldirish" })}
    ${demoAside(c, false)}
  </div>
</section>
<section class="section section-alt" aria-labelledby="cfaq-title">
  <div class="wrap faq-layout">
    <div class="faq-side">${sectionHead({ eyebrow: "Savollar", title: "Demo va ishga tushirish haqida", id: "cfaq-title" })}</div>
    ${faqList(c, faq)}
  </div>
</section>`;
  return {
    path: "/aloqa/", nav: "aloqa", title: "Aloqa va demo so'rovi",
    description: `Tizimchi bilan bog'lanish: demo so'rovi, telefon ${c.cfg.phone}, Telegram @${c.cfg.telegram}.`,
    og: "og/aloqa.jpg", body, ld: [breadcrumbLd(c, crumbs), faqLd(faq)],
  };
}

/* ------------------------------------------------------------ Huquqiy hujjatlar ------------------------------------------------------------ */
/**
 * @param {import("./kit.mjs").Ctx} c
 * @param {"maxfiylik" | "oferta"} which
 * @param {{ title: string, lead: string, sections: [string, string[]][] }} doc  content/legal.mjs → LEGAL_DOCS
 */
export function legalPage(c, which, doc) {
  const crumbs = [{ name: "Bosh sahifa", href: "/" }, { name: doc.title, href: `/${which}/` }];
  const L = c.cfg.legal || {};
  const upd = L.UPDATED ? String(L.UPDATED).split("-").reverse().join(".") : "";
  const req = [["Ijrochi", L.NAME || "Tizimchi platformasi egasi"], ["STIR", L.INN], ["Manzil", L.ADDRESS], ["Bank rekvizitlari", L.BANK],
    ["Telefon", c.cfg.phone], ["Telegram", `@${c.cfg.telegram}`], ["E-mail", L.EMAIL]].filter(([, v]) => v);
  const other = which === "maxfiylik" ? { href: "/oferta/", label: "Ommaviy oferta" } : { href: "/maxfiylik/", label: "Maxfiylik siyosati" };
  const body = `<section class="page-hero page-hero--tight">
  <div class="wrap wrap-narrow">
    ${breadcrumbs(c, crumbs)}
    <h1 class="display display--sm">${tx(doc.title)}</h1>
    <p class="lead">${tx(doc.lead)}${upd ? `<br><span class="muted small">Tahrir sanasi: ${esc(upd)}</span>` : ""}</p>
  </div>
</section>
<section class="section section-tight"><div class="wrap wrap-narrow legal">
  ${doc.sections.map(([h, ps]) => `<section><h2>${tx(h)}</h2>${ps.map((p) => `<p>${tx(p)}</p>`).join("")}</section>`).join("")}
  <section class="legal-req"><h2>Rekvizitlar va aloqa</h2><dl>${req.map(([k, v]) => `<div><dt>${tx(k)}</dt><dd>${tx(v)}</dd></div>`).join("")}</dl></section>
  <p><a class="link-arrow" href="${other.href}">${tx(other.label)} ${c.icon("arrow-right")}</a></p>
</div></section>`;
  return { path: `/${which}/`, title: doc.title, description: doc.lead, body, og: "og/home.jpg" };
}

/* ------------------------------------------------------------ 404 ------------------------------------------------------------ */
/** @param {import("./kit.mjs").Ctx} c */
export function notFoundPage(c) {
  const body = `<section class="page-hero nf">
  <div class="wrap wrap-narrow center">
    <p class="nf-code" aria-hidden="true">404</p>
    <h1 class="display display--sm">Sahifa topilmadi</h1>
    <p class="lead">${tx("Manzil o'zgargan yoki xato yozilgan bo'lishi mumkin. Quyidagi sahifalardan birini oching.")}</p>
    <div class="hero-ctas">${btn(c, "Bosh sahifa", "/", { iconEnd: "arrow-right" })}${btn(c, "Biznes turlari", "/biznes-turlari/", { kind: "secondary" })}${btn(c, "Video qo'llanmalar", "/video-qollanmalar/", { kind: "secondary" })}</div>
  </div>
</section>`;
  return { path: "/404.html", title: "Sahifa topilmadi", noindex: true, body, og: "og/home.jpg",
    description: "Bu manzilda sahifa topilmadi. Tizimchi bosh sahifasi, biznes turlari yoki video qo'llanmalar sahifasiga o'ting." };
}

export { fmtDuration };
