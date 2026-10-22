// @ts-check
/* tizimchi_sayt — saytning barcha sozlamalari shu faylda.
   Hostingda build qilinsa (Netlify, Cloudflare Pages), muhit o'zgaruvchilari bu yerdagidan ustun turadi:
   SITE_URL, APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY. */
export default {
  /** Saytning asosiy manzili: canonical, sitemap, Open Graph. Domen ulanmaguncha hosting manzili bo'lishi mumkin
      (masalan https://tizimchi-sayt.netlify.app) — domen ulangach shu yerni o'zgartirib qayta build qiling. */
  SITE_URL: "https://tizimchi.com",

  /** Tizimchi ilovasi: «Tizimga kirish», «Bepul sinab ko'rish», «Jonli demo», «Ilovani o'rnatish» havolalari.
      Barqaror manzil: tizimchi.com/ilova/… — serverdagi Caddy ilovaning amaldagi joyiga yo'naltiradi (app.tizimchi.com;
      u ulanguncha — avvalgi manzil). Ilova boshqa joyga ko'chsa, sayt qayta build qilinmaydi — faqat yo'naltirish o'zgaradi. */
  APP_URL: "https://tizimchi.com/ilova",

  /** Backend — o'z Supabase loyihangiz (backend/README.md): Project Settings → API → «Project URL» va «anon public» kalit.
      Bo'sh bo'lsa sayt baribir ishlaydi: video qo'llanmalarda «tez orada», forma esa telefon va Telegram'ni taklif qiladi.
      anon kalit ochiq bo'lishi normal (brauzerda ko'rinadi) — ma'lumotni bazadagi huquqlar va funksiyalar himoya qiladi.
      service_role kalitini HECH QACHON bu yerga yozmang. */
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  /** Aloqa: sarlavha, footer, aloqa sahifasi va forma xatolarida ko'rsatiladi */
  CONTACT: { PHONE: "+998 90 598 28 29", TELEGRAM: "tizimchi_admin" },

  /** Maxfiylik siyosati va ofertadagi Ijrochi rekvizitlari (bo'sh maydon sahifada ko'rsatilmaydi).
      UPDATED — hujjat matni oxirgi o'zgargan sana (content/legal.mjs). */
  LEGAL: {
    NAME: "Jamoliddinov Davron Farxodjon o'g'li",
    INN: "577505369", // STIR
    ADDRESS: "",
    BANK: "",
    EMAIL: "",
    UPDATED: "2026-10-18",
  },

  /** Video qo'llanmalar brauzerda backend'dan jonli o'qiladi (/admin/ da e'lon qilingani darhol ko'rinadi).
      false — faqat build vaqtidagi nusxa ishlatiladi. */
  TUTORIALS_LIVE: true,

  /** Analitika provayderi ulanmagan. Ulash tartibi: README.md → «Analitika». */
  ANALYTICS: "none",

  /** Ijtimoiy tarmoqlar — faqat tasdiqlangan havolalar. Bo'sh qiymat saytda ko'rsatilmaydi. */
  SOCIAL: { instagram: "", youtube: "", facebook: "" },
};
