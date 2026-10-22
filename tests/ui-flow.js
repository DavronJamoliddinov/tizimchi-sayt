/* Sayt UI oqimi — tests/ui.test.cjs har bir sahifaga shu skriptni qo'shadi (CSP: same-origin skript).
   Har sahifada tekshiruvlar bajariladi, natija serverga yuboriladi (POST /__result) va keyingi sahifaga o'tiladi.
   Brauzer: --force-prefers-reduced-motion (animatsiyasiz, aniq vaqt), oyna 1000×900 (mobil menyu tugmasi ko'rinadi). */
(function () {
  "use strict";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const results = [];
  const csp = [];
  document.addEventListener("securitypolicyviolation", (e) => csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  window.addEventListener("error", (e) => results.push([false, `JS xato: ${e.message}`]));
  const check = (name, cond, extra) => results.push([!!cond, name + (cond || extra === undefined ? "" : ` — ${extra}`)]);
  async function until(fn, ms = 3000) { const t = Date.now(); while (Date.now() - t < ms) { try { if (fn()) return true; } catch (_) { /* hali yo'q */ } await sleep(40); } return false; }
  const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  const typeIn = (el, v) => { el.focus(); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };

  const FLOW = {
    "/": async () => {
      // mobil menyu (oyna 1000 px — menyu tugmasi ko'rinadi)
      const btn = $("[data-menu-btn]"), menu = $("#mnav");
      btn.click();
      await sleep(80);
      check("menyu ochiladi, fokus ichkarida, asosiy qism inert", !menu.hidden && btn.getAttribute("aria-expanded") === "true" && menu.contains(document.activeElement) && $("main").inert);
      key(document, "Escape");
      await sleep(50);
      check("Esc menyuni yopadi, fokus tugmaga qaytadi", menu.hidden && document.activeElement === btn && !$("main").inert);
      // interaktiv tur: biznes turi va ekranlar (WAI-ARIA tabs)
      $("#ti-restoran").click();
      check("tur: «Restoran» paneli ochiladi", !$("#tp-restoran").hidden && $("#tp-dokon").hidden);
      $("#tv-restoran-kassa").focus();
      key($("#tv-restoran-kassa"), "ArrowRight");
      check("tur: → tugmasi keyingi ekranni tanlaydi", $("#tv-restoran-zal").getAttribute("aria-selected") === "true" && !$("#tvp-restoran-zal").hidden && document.activeElement.id === "tv-restoran-zal");
      key(document.activeElement, "End");
      check("tur: End — oxirgi ekran", document.activeElement.id === "tv-restoran-panel");
      // FAQ (animatsiyasiz rejimda — oddiy <details>)
      const d = $(".faq-item");
      d.querySelector("summary").click();
      await sleep(30);
      check("FAQ ochiladi", d.open);
      // video bo'limi: namuna videolar oldindan chizilgan
      check("bosh sahifada tanlangan video birinchi", ($("#video .tcard-title") || {}).textContent === "Namuna: Kassada birinchi sotuv");
      check("yil avtomatik", $("[data-year]").textContent === String(new Date().getFullYear()));
      return "/aloqa/?biznes=dorixona";
    },
    "/aloqa/": async () => {
      check("?biznes= biznes turini oldindan tanlaydi", $("#contact-type").value === "dorixona");
      $("#contact-type").value = "";
      $(".dform-submit").click();
      await sleep(30);
      const errs = $$(".dform .field-err").filter((e) => !e.hidden);
      check("bo'sh forma: 4 ta xato o'zbekcha", errs.length === 4 && /Ismingizni/.test(errs[0].textContent), errs.map((e) => e.textContent).join(" | "));
      check("fokus birinchi xatoli maydonda, aria-invalid", document.activeElement.id === "contact-name" && $("#contact-name").getAttribute("aria-invalid") === "true");
      typeIn($("#contact-name"), "Aziz");
      typeIn($("#contact-phone"), "+998 90 123 45 67");
      check("telefon «90 123 45 67» ko'rinishiga keltiriladi", $("#contact-phone").value === "90 123 45 67", $("#contact-phone").value);
      $("#contact-type").value = "restoran";
      $("#contact-type").dispatchEvent(new Event("change", { bubbles: true }));
      $("#contact-consent").click();
      $(".dform-submit").click();
      const ok = await until(() => !$("[data-form-done]").hidden);
      check("yuborildi: «qabul qilindi» faqat server ok bergandan keyin (sinov rejimi matni bilan)", ok && $("[data-lead] form").hidden && /Sinov rejimi/.test($("[data-done-text]").textContent));
      return "/video-qollanmalar/";
    },
    "/video-qollanmalar/": async () => {
      await until(() => !$("[data-tfilters]").hidden);
      const count = () => $("[data-tcount]").textContent;
      check("filtrlar ko'rinadi, 3 ta video", !$("[data-tfilters]").hidden && count() === "3 ta video", count());
      typeIn($("#tf-q"), "qarz");
      await until(() => count() === "1 ta video topildi");
      check("qidiruv: «qarz» → 1 ta, manzilda ?q=qarz", count() === "1 ta video topildi" && /[?&]q=qarz/.test(location.search), count());
      $("#tf-biznes").value = "dorixona";
      $("#tf-biznes").dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(30);
      check("topilmadi holati va tozalash tugmasi", /Hech narsa topilmadi/.test($("[data-tlib]").textContent) && !!$("[data-treset-btn]"));
      $("#tf-q").blur(); // fokus yo'qolishi («change») natijani qayta chizib, tugmani almashtirmasligi kerak
      $("[data-treset-btn]").click();
      await until(() => count() === "3 ta video");
      check("tozalash: hammasi va manzil toza", count() === "3 ta video" && !location.search, `${count()} ${location.search}`);
      return "/video-qollanmalar/namuna-kassada-birinchi-sotuv/";
    },
    "/video-qollanmalar/namuna-kassada-birinchi-sotuv/": async () => {
      check("bosilmaguncha iframe yo'q", !$("iframe"));
      $(".player-facade").click();
      const f = $(".player iframe");
      check("bosilganda youtube-nocookie iframe (sandbox, title)", !!f && /^https:\/\/www\.youtube-nocookie\.com\/embed\/AAAAAAAAAAA\?/.test(f.src) && /allow-scripts/.test(f.getAttribute("sandbox")) && !!f.title);
      return "/video-qollanmalar/korish/?v=yoq-video";
    },
    "/video-qollanmalar/korish/": async () => {
      await until(() => /Video topilmadi/.test($("[data-tview]").textContent));
      check("noma'lum video → «Video topilmadi»", /Video topilmadi/.test($("[data-tview]").textContent));
      return "/imkoniyatlar/";
    },
    "/imkoniyatlar/": async () => {
      check("kassa kartochkasida aniq video havolasi", !!$('[data-cap="savdo:kassa"] .cap-video--on'));
      check("video yo'q imkoniyatda «tez orada»", /tez orada/.test($('[data-cap="taminot:kirim-hujjati"]').textContent));
      return "/admin/";
    },
    "/admin/": async () => {
      const lAlert = () => { const a = $("[data-login] [data-alert]"); return a && !a.hidden ? a.textContent : ""; };
      const login = (email, pass) => { typeIn($("#login-email"), email); typeIn($("#login-pass"), pass); $("[data-login] button[type=submit]").click(); };
      const rows = () => $$(".adm-row");
      const d = $("dialog[data-dialog]"), cf = $("dialog[data-confirm]");
      const toasts = () => $("[data-toasts]").textContent;

      // --- Kirish ---
      await until(() => $("[data-login]"));
      check("kirish oynasi: email va parol maydonlari", !!$("#login-email") && !!$("#login-pass") && /Kirish/.test($("#login-title").textContent));
      $("[data-login] button[type=submit]").click();
      await until(() => lAlert());
      check("bo'sh forma: email so'raladi", /Email manzilini to‘liq yozing/.test(lAlert()), lAlert());
      login("admin@example.com", "notogri-parol");
      await until(() => /parol noto‘g‘ri/.test(lAlert()));
      check("noto'g'ri parol: «Email yoki parol noto‘g‘ri.»", /Email yoki parol noto‘g‘ri/.test(lAlert()), lAlert());
      login("user@example.com", "Parol-12345");
      await until(() => /admin huquqi berilmagan/.test(lAlert()), 4000);
      check("admin bo'lmagan hisob: huquq yo'q va site_admin_add yo'riqnomasi", /site_admin_add\('user@example\.com'\)/.test(lAlert()) && $("[data-user]").hidden, lAlert());
      login("admin@example.com", "Parol-12345");
      await until(() => rows().length === 3, 5000);
      check("admin kirdi: 3 ta video, sarlavhada email", rows().length === 3 && $("[data-user-email]").textContent === "admin@example.com" && !$("[data-user]").hidden);
      await until(() => $('[data-count="leads"]').textContent === "2 yangi", 4000);
      check("tablar: videolar soni 3, so'rovlar «2 yangi»", $('[data-count="videos"]').textContent === "3" && $('[data-count="leads"]').textContent === "2 yangi");

      // --- Yangi video: tekshiruv, jonli ko'rinish, saqlash ---
      $('[data-act="new-video"]').click();
      await until(() => d.open && $("#ed-title"));
      check("«Yangi video» oynasi ochildi, fokus sarlavhada", d.open && document.activeElement.id === "ed-title");
      typeIn($("#ed-title"), "ab");
      $("[data-editor] button[type=submit]").click();
      await sleep(60);
      check("tekshiruv: qisqa sarlavha va bo'sh manzil — maydon xatolari", !$("#ed-title-err").hidden && !$("#ed-url-err").hidden && $("#ed-title").getAttribute("aria-invalid") === "true");
      typeIn($("#ed-title"), "Ombor kirimi — nakladnoydan");
      typeIn($("#ed-url"), "https://youtu.be/dQw4w9WgXcQ?t=15");
      await until(() => /YouTube video/.test($("[data-preview]").textContent));
      check("video manzili: jonli ko'rinish (YouTube, ID, boshlanish vaqti)", /YouTube video · dQw4w9WgXcQ · 0:15 dan/.test($("[data-preview]").textContent), $("[data-preview]").textContent);
      $("#ed-sec").value = "ombor";
      $("#ed-sec").dispatchEvent(new Event("change", { bubbles: true }));
      const caps = [...$("#ed-cap").options].map((o) => o.value);
      check("bo'lim tanlansa — imkoniyatlar shu bo'limniki", caps.includes("ai-kirim") && !caps.includes("kassa"), caps.join(","));
      $("#ed-cap").value = "ai-kirim";
      const chip = (v) => $(`[data-inds] input[value="${v}"]`);
      chip("restoran").click();
      chip("dokon").click();
      check("biznes turlari: tanlansa «Barcha bizneslar» o'chadi", chip("restoran").checked && chip("dokon").checked && !chip("umumiy").checked);
      $('input[name="difficulty"][value="intermediate"]').click();
      typeIn($("#ed-dur"), "4:35");
      typeIn($("#ed-steps"), "«Ombor» → «Kirim» ni oching\n\nNakladnoy rasmini yuklang");
      $('[data-editor] input[name="is_published"]').click();
      $("[data-editor] button[type=submit]").click();
      await until(() => !d.open && rows().length === 4, 5000);
      check("saqlandi: oyna yopildi, ro'yxatda 4 ta, «Saqlandi» xabari", !d.open && rows().length === 4 && /Saqlandi — saytda ko‘rinadi/.test(toasts()));

      // --- Server xatosi va saqlanmagan o'zgarish ---
      $('[data-act="new-video"]').click();
      await until(() => d.open && $("#ed-title"));
      typeIn($("#ed-title"), "Boshqa video");
      typeIn($("#ed-url"), "https://youtu.be/BBBBBBBBBBB");
      typeIn($("#ed-slug"), "namuna-qarzga-sotish");
      $("[data-editor] button[type=submit]").click();
      await until(() => !$("[data-editor] [data-alert]").hidden, 4000);
      const ea = $("[data-editor] [data-alert]");
      check("server xatosi oynada ko'rinadi: «Bu manzil (slug) band»", ea && /Bu manzil \(slug\) band/.test(ea.textContent),
        `oyna=${d.open}, forma=${!!$("[data-editor]")}, qatorlar=${rows().length}, xabarlar=«${toasts()}»`);
      d.dispatchEvent(new Event("cancel", { cancelable: true })); // Esc
      await until(() => cf.open);
      check("saqlanmagan o'zgarish: yopishdan oldin so'raladi, standart — «Bekor qilish»", cf.open && /saqlanmasinmi/.test(cf.textContent) && document.activeElement.value === "no");
      $('dialog[data-confirm] button[value="yes"]').click();
      await until(() => !d.open);
      check("«Saqlamasdan yopish» — oyna yopildi, ro'yxat o'zgarmadi", !d.open && rows().length === 4);

      // --- E'lon qilish, tartib, o'chirish ---
      const draft = rows().find((r) => /Qoralama/.test(r.textContent));
      const draftId = draft.dataset.id;
      draft.querySelector('[data-act="toggle"]').click();
      await until(() => /Saytda/.test(($(`.adm-row[data-id="${draftId}"] .badge`) || {}).textContent || ""), 5000);
      check("ko'z belgisi: qoralama → saytda", /Saytda/.test($(`.adm-row[data-id="${draftId}"] .badge`).textContent));
      const titles = () => $$(".adm-row .adm-row-title b").map((b) => b.textContent);
      const first = titles()[0];
      $('.adm-row [data-act="down"]').click();
      await until(() => titles()[0] !== first, 5000);
      check("tartib: «Pastga» — birinchi video ikkinchi o'ringa tushdi", titles()[1] === first, titles().join(" | "));
      rows().find((r) => /Qarzga sotish/.test(r.textContent)).querySelector('[data-act="delete"]').click();
      await until(() => cf.open);
      check("o'chirishdan oldin tasdiq so'raladi", /o‘chirilsinmi/.test(cf.textContent));
      $('dialog[data-confirm] button[value="yes"]').click();
      await until(() => rows().length === 3, 5000);
      check("o'chirildi: 3 ta qoldi", rows().length === 3 && !titles().some((t) => /Qarzga sotish/.test(t)));

      // --- Demo so'rovlar ---
      $("#tab-leads").click();
      await until(() => $$(".adm-row--lead").length === 2, 5000);
      check("so'rovlar: «Yangi» filtrida 2 ta, telefon havolasi", $$(".adm-row--lead").length === 2 && !!$('.adm-row--lead a[href="tel:+998901234567"]'));
      const sel = $('.adm-row--lead[data-id="l1"] select[data-act="status"]');
      sel.value = "contacted";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await until(() => $$(".adm-row--lead").length === 1 && $('[data-count="leads"]').textContent === "1 yangi", 5000);
      check("holat «Bog‘lanildi»: «Yangi» ro'yxatidan chiqdi, hisoblagich «1 yangi»", $$(".adm-row--lead").length === 1 && $('[data-count="leads"]').textContent === "1 yangi");
      $('.adm-row--lead[data-id="l2"] [data-act="note"]').click();
      await until(() => d.open && $("#note-t"));
      typeIn($("#note-t"), "Ertaga 15:00 da demo");
      $("[data-note] button[type=submit]").click();
      await until(() => !d.open && /Ertaga 15:00 da demo/.test(($('.adm-row--lead[data-id="l2"]') || {}).textContent || ""), 5000);
      check("izoh saqlandi va ro'yxatda ko'rinadi", /Ertaga 15:00 da demo/.test($('.adm-row--lead[data-id="l2"]').textContent));
      $('[data-act="filter"][data-f="all"]').click();
      await until(() => $$(".adm-row--lead").length === 3, 5000);
      check("«Hammasi» filtri: 3 ta", $$(".adm-row--lead").length === 3 && $('[data-f="all"]').getAttribute("aria-pressed") === "true");

      // --- Sozlamalar: Telegram ---
      $("#tab-settings").click();
      await until(() => $("[data-tg]"), 5000);
      check("sozlamalar: Telegram «Ulanmagan», sinov tugmasi o'chiq", $(".adm-card .badge").textContent === "Ulanmagan" && $('[data-act="tg-test"]').disabled);
      typeIn($("#tg-token"), "123");
      typeIn($("#tg-chats"), "123456789");
      $("[data-tg] button[type=submit]").click();
      await until(() => !$("[data-tg] [data-alert]").hidden, 5000);
      check("noto'g'ri token: server xabari", /bot tokeni noto‘g‘ri/.test($("[data-tg] [data-alert]").textContent), $("[data-tg] [data-alert]").textContent);
      typeIn($("#tg-token"), "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX");
      $("[data-tg] button[type=submit]").click();
      await until(() => $(".adm-card .badge") && $(".adm-card .badge").textContent === "Ulangan", 5000);
      check("token saqlandi: «Ulangan», token qayta ko'rsatilmaydi", $("#tg-token").value === "" && /…sawX/.test($("#tg-token").placeholder));
      $('[data-act="tg-test"]').click();
      await until(() => /Sinov xabari yuborildi/.test(toasts()), 5000);
      check("sinov xabari navbatga qo'yildi", /Sinov xabari yuborildi \(1 ta chat\)/.test(toasts()));
      $("#tab-settings").focus();
      key($("#tab-settings"), "Home");
      await sleep(50);
      check("tablar klaviaturada: Home — birinchi bo'lim", $("#tab-videos").getAttribute("aria-selected") === "true" && document.activeElement.id === "tab-videos");

      // --- Chiqish ---
      $('[data-act="logout"]').click();
      await until(() => $("[data-login]"), 3000);
      check("chiqish: kirish oynasi, sessiya o'chirildi", !!$("[data-login]") && $("[data-user]").hidden && !localStorage.getItem("tizimchi.admin.session"));
      return null;
    },
  };

  (async () => {
    await sleep(250); // main.js (modul) ishga tushsin
    let next = null;
    const fn = FLOW[location.pathname];
    if (!fn) results.push([false, `noma'lum sahifa: ${location.pathname}`]);
    else { try { next = await fn(); } catch (e) { results.push([false, `${location.pathname}: ${e.message}`]); } }
    if (csp.length) results.push([false, `CSP buzilishi: ${csp.join(", ")}`]);
    await fetch("/__result", { method: "POST", body: JSON.stringify({ page: location.pathname, results, next }) });
    if (next) location.href = next;
  })();
})();
