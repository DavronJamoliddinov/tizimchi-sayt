// @ts-check
/* Brauzer (main.js, admin.js) va build (Node) uchun umumiy yordamchilar. DOM'ga bog'liq emas. */

/** HTML uchun xavfsiz matn */
export const esc = (/** @type {unknown} */ s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => /** @type {Record<string, string>} */ ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * O'zbek lotin yozuvi tipografiyasi: o' g' → o‘ g‘ (U+2018), tutuq belgisi ma'lumot → ma’lumot (U+2019).
 * Kontent va /admin/ dagi matnlarda oddiy apostrof yoziladi — sayt chiqarishda shu yerda almashtiriladi.
 */
export const typo = (/** @type {unknown} */ s) =>
  String(s ?? "").replace(/([OoGg])['`ʻ‘]/g, "$1‘").replace(/(\p{L})['`ʼ’](\p{L})/gu, "$1’$2");

/** Kontent matni: tipografiya + ekranlash */
export const tx = (/** @type {unknown} */ s) => esc(typo(s));

/** Qidiruv uchun: kichik harf, apostrof turlari bir xil */
export const fold = (/** @type {unknown} */ s) => String(s ?? "").toLowerCase().replace(/[‘’ʻʼ`']/g, "'").replace(/\s+/g, " ").trim();

/** 275 → "4:35", 3725 → "1:02:05" */
export function fmtDuration(/** @type {number} */ sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (!s) return "";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`;
}

/**
 * Supabase so'rov sarlavhalari: apikey doim; Authorization — foydalanuvchi tokeni yoki kalitning o'zi JWT bo'lsa (eski «anon» kalit).
 * Yangi «sb_publishable_…» kalit JWT emas — uni Authorization'ga qo'yib bo'lmaydi.
 */
export function apiHeaders(/** @type {string} */ key, /** @type {string} */ token = "") {
  /** @type {Record<string, string>} */
  const h = { apikey: key };
  const bearer = token || (/^eyJ/.test(key) ? key : "");
  if (bearer) h.Authorization = `Bearer ${bearer}`;
  return h;
}

/** Telefon: 998901234567 yoki 901234567 → "+998 90 123 45 67"; noto'g'ri bo'lsa "" */
export function uzPhone(/** @type {unknown} */ v) {
  const d = String(v ?? "").replace(/\D/g, "");
  const n = d.length === 9 ? "998" + d : d;
  if (!/^998\d{9}$/.test(n)) return "";
  return `+998 ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10, 12)}`;
}
