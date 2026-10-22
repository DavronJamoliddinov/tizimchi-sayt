// @ts-check
/* Demo so'rovi formasi (bosh sahifa #demo va /aloqa/). Tekshiruv va yuborish — main.js; server — backend/schema.sql → site_lead_submit().
   «So'rov yuborildi» faqat server { ok: true } qaytarganda ko'rsatiladi. */
import { esc, tx } from "../client/util.js";
import { at, srNew } from "./kit.mjs";
import { INDUSTRIES } from "../../content/taxonomy.mjs";

/** @param {import("./kit.mjs").Ctx} c @param {{ id?: string, selected?: string, title?: string }} [o] */
export function demoForm(c, o = {}) {
  const p = o.id || "df";
  const tel = c.cfg.phone.replace(/\s/g, "");
  return `<div class="dform-card" data-lead>
  <form class="dform" data-lead-form novalidate aria-labelledby="${p}-title">
    <h3 class="dform-title" id="${p}-title">${tx(o.title || "Demo so'rovi")}</h3>
    <div class="dform-grid">
      <div class="field">
        <label for="${p}-name">Ismingiz <span class="req" aria-hidden="true">*</span></label>
        <input id="${p}-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80" aria-describedby="${p}-name-err" aria-required="true">
        <p class="field-err" id="${p}-name-err" hidden></p>
      </div>
      <div class="field">
        <label for="${p}-phone">Telefon raqami <span class="req" aria-hidden="true">*</span></label>
        <div class="phone-input"><span class="phone-prefix" aria-hidden="true">+998</span>
          <input id="${p}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="90 123 45 67" required maxlength="16"
            aria-describedby="${p}-phone-hint ${p}-phone-err" aria-required="true"></div>
        <p class="field-hint" id="${p}-phone-hint">${tx("Siz bilan shu raqam orqali bog'lanamiz")}</p>
        <p class="field-err" id="${p}-phone-err" hidden></p>
      </div>
      <div class="field">
        <label for="${p}-biz">Biznes nomi <span class="opt">(ixtiyoriy)</span></label>
        <input id="${p}-biz" name="business_name" type="text" autocomplete="organization" maxlength="120">
      </div>
      <div class="field">
        <label for="${p}-type">Biznes turi <span class="req" aria-hidden="true">*</span></label>
        <div class="select"><select id="${p}-type" name="business_type" required aria-describedby="${p}-type-err" aria-required="true">
          <option value="">Tanlang</option>
          ${INDUSTRIES.map(([code, label]) => `<option value="${esc(code)}"${code === o.selected ? " selected" : ""}>${tx(label)}</option>`).join("")}
        </select>${c.icon("chevron-down")}</div>
        <p class="field-err" id="${p}-type-err" hidden></p>
      </div>
      <div class="field field--full">
        <label for="${p}-msg">Qisqa izoh <span class="opt">(ixtiyoriy)</span></label>
        <textarea id="${p}-msg" name="comment" rows="3" maxlength="1000" aria-describedby="${p}-msg-count"
          placeholder="${at("Masalan: 2 ta kassa, 1500 xil tovar, qarzlarni yuritish kerak")}"></textarea>
        <p class="field-hint field-count" id="${p}-msg-count"><span data-count>0</span> / 1000</p>
      </div>
      <div class="hp" aria-hidden="true"><label>Veb-sayt <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
      <div class="field field--full">
        <div class="check">
          <input id="${p}-consent" name="consent" type="checkbox" required aria-describedby="${p}-consent-err" aria-required="true">
          <label for="${p}-consent">${tx("Ma'lumotlarim siz bilan bog'lanish uchun ishlatilishiga roziman.")} <a href="/maxfiylik/">Maxfiylik siyosati</a></label>
        </div>
        <p class="field-err" id="${p}-consent-err" hidden></p>
      </div>
    </div>
    <div class="dform-alert" role="alert" hidden data-form-alert></div>
    <button class="btn btn-primary btn-lg dform-submit" type="submit"><span data-label>${tx("Demo so'rash")}</span>${c.icon("arrow-right")}</button>
    <p class="dform-note">${tx("Ma'lumotlaringiz faqat siz bilan bog'lanish uchun ishlatiladi va uchinchi shaxslarga berilmaydi.")}</p>
    <noscript><p class="dform-alert">${tx("Forma ishlashi uchun brauzeringizda JavaScript yoqilgan bo'lishi kerak. Bizga to'g'ridan-to'g'ri yozing:")} <a href="tel:${esc(tel)}">${esc(c.cfg.phone)}</a>, <a href="https://t.me/${esc(c.cfg.telegram)}">@${esc(c.cfg.telegram)}</a></p></noscript>
  </form>
  <div class="dform-done" hidden data-form-done tabindex="-1">
    <span class="dform-done-ic" aria-hidden="true">${c.icon("circle-check")}</span>
    <h3>${tx("So'rovingiz qabul qilindi")}</h3>
    <p data-done-text>${tx("Rahmat! Tez orada siz bilan bog'lanamiz. Shoshilinch savol bo'lsa — telefon yoki Telegram orqali yozing.")}</p>
    <div class="dform-done-actions">
      <a class="btn btn-secondary" href="tel:${esc(tel)}">${c.icon("phone")}<span>${esc(c.cfg.phone)}</span></a>
      <a class="btn btn-secondary" href="https://t.me/${esc(c.cfg.telegram)}" target="_blank" rel="noopener">${c.icon("send")}<span>Telegram</span>${srNew}</a>
    </div>
  </div>
</div>`;
}

/** Forma yonidagi blok: nima bo'ladi va to'g'ridan-to'g'ri aloqa (aloqa sahifasida kontaktlar tepada — takrorlanmaydi) */
export function demoAside(/** @type {import("./kit.mjs").Ctx} */ c, contacts = true) {
  const tel = c.cfg.phone.replace(/\s/g, "");
  const steps = [
    ["So'rov qoldirasiz", "Biznesingiz turi va ehtiyojingizni qisqacha yozasiz."],
    ["Bog'lanamiz", "Ko'rsatilgan raqam orqali siz bilan bog'lanib, savollarga javob beramiz."],
    ["Demo ko'rsatamiz", "Biznesingizga mos imkoniyatlarni ko'rsatamiz va sozlashni kelishamiz."],
  ];
  return `<div class="demo-aside">
    <ol class="mini-steps">${steps.map(([t, d], i) => `<li><span class="mini-n">${i + 1}</span><div><b>${tx(t)}</b><p>${tx(d)}</p></div></li>`).join("")}</ol>
    ${contacts ? `<div class="contact-cards">
      <a class="contact-card" href="tel:${esc(tel)}"><span class="cc-ic">${c.icon("phone")}</span><span><small>Telefon</small><b>${esc(c.cfg.phone)}</b></span></a>
      <a class="contact-card" href="https://t.me/${esc(c.cfg.telegram)}" target="_blank" rel="noopener"><span class="cc-ic cc-ic--tg">${c.icon("send")}</span><span><small>Telegram</small><b>@${esc(c.cfg.telegram)}</b></span>${srNew}</a>
    </div>` : ""}
  </div>`;
}
