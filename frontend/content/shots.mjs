// @ts-check
/* Ilovaning haqiqiy ekranlari (namunaviy ma'lumotlar bilan): frontend/assets/shots/<nom>@<zichlik>x.webp
   Yangilash: npm run shots  (Tizimchi ilovasining demo.html sahifasidan avtomatik suratga oladi — tools/shots.mjs).
   kind: "desktop" — 16:10 (kompyuter), "phone" — 390×800 (ramka tepasiga status satri qo'shiladi). */

/** @typedef {{ kind: "desktop" | "phone", w: number, h: number, dprs: number[], alt: string }} Shot */

const D = /** @type {const} */ ({ kind: "desktop", w: 1440, h: 900, dprs: [1, 1.5, 2] });
const W = /** @type {const} */ ({ kind: "desktop", w: 1536, h: 960, dprs: [1, 1.5, 2] });
const P = /** @type {const} */ ({ kind: "phone", w: 390, h: 800, dprs: [2, 3] });

/** @type {Record<string, Shot>} */
export const SHOTS = {
  "d-hisobot": { ...W, alt: "Tizimchi «Hisobot» ekrani: 30 kunlik tushum, yalpi va sof foyda, o'rtacha chek, kunlik tushum grafigi va tovar tahlili" },
  "d-savdo": { ...D, alt: "Tizimchi kassasi: savatda uchta tovar, jami summa, to'lov turlari va bugungi sotuvlar tarixi" },
  "d-savdo-qidiruv": { ...D, alt: "Kassada «moy» so'zi bo'yicha qidiruv: tovar katalog raqami, mos mashinalar va qoldig'i bilan chiqadi" },
  "d-ombor": { ...D, alt: "«Ombor» ekrani: tovarlar ro'yxati, joylar bo'yicha qoldiq, kam qolgan tovarlar va AI bilan kirim kiritish" },
  "d-mijozlar": { ...D, alt: "«Mijozlar» ekrani: jami qarz, qarzdorlar, 7 kundan oshgan qarzlar va Telegramga ulangan mijozlar" },
  "d-ruxsatlar": { ...D, alt: "Xodim ruxsatlari oynasi: tan narx, foyda, tushum va hisobotni ko'rish ruxsatlari" },
  "d-rest-panel": { ...D, alt: "Restoran umumiy paneli: ochiq buyurtmalar, band stollar, tushum va eng ko'p sotilgan taomlar" },
  "d-rest-pos": { ...D, alt: "Restoran kassasi: taom kartalari, 4-stol buyurtmasi, «Oshxonaga» va «To'lov» tugmalari" },
  "d-rest-zal": { ...D, alt: "«Zal va stollar» xaritasi: har bir stol holati rang va matn bilan" },
  "d-rest-oshxona": { ...D, alt: "Oshxona ekrani: yangi, tayyorlanayotgan va tayyor buyurtmalar ustunlari" },
  "d-rest-menyu": { ...D, alt: "Restoran menyusi: taomlar, narxlar va kategoriyalar" },
  "d-dori-savdo": { ...D, alt: "Dorixona kassasi: «Panadol» tugagan, uning o'rniga omborda bor analoglari narxi bilan ko'rsatilgan" },
  "d-dori-ombor": { ...D, alt: "Dorixona ombori: dorilar seriyasi va yaroqlilik muddati bilan" },
  "d-qurilish-ombor": { ...D, alt: "Qurilish mollari ombori: kafel m² va qutida, armatura tonna va donada, miqdorga qarab narx pog'onalari va ulgurji narx" },
  "d-market-savdo": { ...D, alt: "Market kassasi: non, sut, tarozida tortilgan olma va blokda ham sotiladigan ichimlik, bugungi sotuvlar tarixi" },
  "d-xojalik-ombor": { ...D, alt: "Xo'jalik mollari ombori: shtrix-kodli tovarlar, kam qolgan va tugagan tovarlar filtri bilan" },
  "p-savdo": { ...P, alt: "Telefondagi Tizimchi kassasi" },
  "p-hisobot": { ...P, alt: "Telefondagi «Hisobot» ekrani: tushum, foyda va kunlik grafik" },
  "p-mijozlar": { ...P, alt: "Telefondagi «Mijozlar» ekrani: qarzdorlar ro'yxati" },
  "p-rest-ofitsiant": { ...P, alt: "Ofitsiant telefoni: «Stollarim» ekrani, tayyor taomlar va QR-menyudan kelgan buyurtma" },
  "p-rest-oshxona": { ...P, alt: "Oshpaz ekrani: tayyorlanishi kerak bo'lgan taomlar" },
  "p-dori-savdo": { ...P, alt: "Telefondagi dorixona kassasi: dori analoglari" },
  "p-qurilish-savdo": { ...P, alt: "Telefondagi kassa: kafelni m² yoki qutida sotish, miqdorga qarab narx va material kalkulyatori" },
  "p-market-savdo": { ...P, alt: "Telefondagi market kassasi: dona va kilogramm hisobidagi tovarlar" },
  "p-xojalik-savdo": { ...P, alt: "Telefondagi kassa: savatda lampochka va rozetka" },
};

export const SHOT_NOTE = "Ilovaning haqiqiy ekrani · namunaviy ma'lumotlar";
