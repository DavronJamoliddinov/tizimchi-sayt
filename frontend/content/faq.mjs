// @ts-check
/* Umumiy savollar (bosh sahifa #faq va /aloqa/). Javoblar haqiqiy jarayonga mos: o'zi ro'yxatdan o'tish (14 kun),
   admin orqali hisob ochish, Excel import, telefon va Telegram orqali yordam. Aloqa — site.config.mjs → CONTACT. */

/** @typedef {{ q: string, a: string, link?: { label: string, href: string } }} Faq */

/** @param {{ phone: string, telegram: string }} c  @returns {Faq[]} */
export function generalFaq(c) {
  return [
    { q: "Tizimchi nima?",
      a: "Tizimchi — savdo, ombor, qarzlar, xodimlar va hisobotlarni bitta tizimda yuritish uchun platforma. U brauzerda, telefonda (Android ilova yoki «Bosh ekranga qo'shish») va kompyuterda ishlaydi, internet uzilganda ham to'xtamaydi." },
    { q: "Tizimchi qaysi bizneslar uchun mos?",
      a: "Ilovada tayyor rejimlar bor: oziq-ovqat va market, dorixona, restoran va kafe, qurilish mollari, avto ehtiyot qismlar va boshqa do'konlar. Ombor va ulgurji savdo umumiy imkoniyatlar bilan yuritiladi. Mehmonxona va o'quv markazlari uchun maxsus modul yo'q — ularning savdo, zaxira va moliya qismi uchun foydalanish mumkin.",
      link: { label: "Biznes turlari", href: "/biznes-turlari/" } },
    { q: "Platforma qanday ishlaydi?",
      a: "Ilovaga login va parol bilan kirasiz. Ma'lumotlar himoyalangan bulut serverida saqlanadi va barcha qurilmalaringizda real vaqtda yangilanadi. Internet bo'lmasa, amallar qurilmada navbatga qo'yiladi va internet qaytganda yuboriladi." },
    { q: "Tizimdan foydalanishni qanday o'rganaman?",
      a: "Jonli demoni ochib, xavfsiz sinab ko'rishingiz mumkin — u faqat brauzeringizda ishlaydi va hech narsani buzmaydi. Video qo'llanmalar bo'limi bosqichma-bosqich to'ldirib boriladi, savollar bo'yicha esa telefon va Telegram orqali yordam beramiz.",
      link: { label: "Video qo'llanmalar", href: "/video-qollanmalar/" } },
    { q: "Video qo'llanmalar mavjudmi?",
      a: "Joylangan videolar «Video qo'llanmalar» sahifasida — biznes turi, bo'lim va daraja bo'yicha filtr bilan. Yangi video qo'shilishi bilan u tegishli biznes turi va imkoniyat sahifalarida ham paydo bo'ladi.",
      link: { label: "Video qo'llanmalar", href: "/video-qollanmalar/" } },
    { q: "Demo olish mumkinmi?",
      a: "Ha, ikki yo'l bilan: jonli demoni hoziroq brauzerda ochish (namunaviy ma'lumotlar bilan) yoki demo so'rovini qoldirish — siz bilan bog'lanib, biznesingizga mos imkoniyatlarni ko'rsatamiz." },
    { q: "Biznesimga mos imkoniyatlarni qanday bilaman?",
      a: "«Biznes turlari» bo'limida sohangizni tanlang: har bir sahifada tayyor imkoniyatlar va mavjud bo'lmaganlari ochiq yozilgan. Aniqlik kerak bo'lsa — demo so'rang, biznesingiz jarayonini birga ko'rib chiqamiz." },
    { q: "Tizimni sozlash va joriy qilish qanday amalga oshiriladi?",
      a: "Hisobni o'zingiz ochishingiz mumkin (telefon raqami Telegram orqali tasdiqlanadi, 14 kun bepul) yoki bizdan so'rashingiz mumkin. Faoliyat turi tanlanganda kerakli funksiyalar o'zi yoqiladi. Tovarlar Excel orqali yoki nakladnoy rasmidan AI yordamida yuklanadi; xodimlar, printer va boshqa sozlamalar ilovaning o'zida." },
    { q: "Texnik yordamni qanday olaman?",
      a: `Telefon: ${c.phone}. Telegram: @${c.telegram}. Yordam xizmati kontaktlari ilovaning o'zida ham ko'rsatilgan.` },
    { q: "Narxi qancha?",
      a: "Obuna tarif asosida: oylik yoki bir martalik to'liq dastur. Amaldagi narxlar ilovaning «Obuna va to'lov» bo'limida ko'rsatiladi, biznesingizga mos tarifni demo vaqtida tavsiya qilamiz. Yangi hisobga 14 kunlik bepul sinov beriladi." },
    { q: "Ma'lumotlarim xavfsizmi?",
      a: "Har bir biznes ma'lumoti ma'lumotlar bazasi darajasida boshqalardan ajratilgan. Ulanishlar shifrlangan, ikki bosqichli himoya (2FA) bor, zaxira nusxalar shifrlangan holda saqlanadi. Ma'lumotlaringizni istalgan vaqtda Excel'ga yuklab olishingiz mumkin." },
  ];
}
