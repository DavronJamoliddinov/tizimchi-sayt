// @ts-check
/* Sayt taksonomiyasi: biznes turlari, mahsulot bo'limlari, video qo'llanma darajalari.
   Kodlar ikki joyda bir xil bo'lishi shart:
     1) shu fayl (sayt: URL, filtrlar, sahifalar, /admin/ dagi tanlovlar),
     2) backend/schema.sql → site_private.industry_list(), section_list(), level_codes() (saqlashda tekshiruv).
   tests/db.test.mjs solishtiradi. Biznes turi kodi = sahifa manzili: /biznes-turlari/<kod>/ */

/** @typedef {[code: string, label: string]} Pair */

/** Biznes turlari (saytdagi tartib) @type {Pair[]} */
export const INDUSTRIES = [
  ["restoran", "Restoran va kafe"],
  ["dokon", "Do'kon"],
  ["supermarket", "Supermarket"],
  ["dorixona", "Dorixona"],
  ["avto-ehtiyot-qismlar", "Avto ehtiyot qismlar"],
  ["qurilish-mollari", "Qurilish mollari"],
  ["xojalik-mollari", "Xo'jalik mollari"],
  ["ombor", "Ombor va ulgurji savdo"],
  ["mehmonxona", "Mehmonxona"],
  ["oquv-markazi", "O'quv markazi"],
  ["boshqa", "Boshqa bizneslar"],
];

/** Mahsulot bo'limlari — /imkoniyatlar/#<kod> va video qo'llanma filtri @type {Pair[]} */
export const SECTIONS = [
  ["boshlash", "Boshlash va sozlash"],
  ["savdo", "Savdo va kassa"],
  ["ombor", "Ombor va mahsulotlar"],
  ["taminot", "Ta'minotchilar va xaridlar"],
  ["mijozlar", "Mijozlar va qarzlar"],
  ["xodimlar", "Xodimlar va nazorat"],
  ["hisobot", "Hisobotlar va tahlil"],
  ["restoran", "Restoran moduli"],
  ["platforma", "Platforma va xavfsizlik"],
];

/** Video qo'llanma darajasi @type {Pair[]} */
export const LEVELS = [
  ["beginner", "Boshlang'ich"],
  ["intermediate", "O'rta"],
  ["advanced", "Yuqori"],
];

/** Video barcha biznes turlariga tegishli bo'lsa — industries = ["umumiy"] */
export const ALL_INDUSTRIES = "umumiy";

export const labelOf = (/** @type {Pair[]} */ list, /** @type {string} */ code) => (list.find(([c]) => c === code) || [code, code])[1];
