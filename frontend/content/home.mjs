// @ts-check
/* Bosh sahifa matnlari. Raqamli statistika, mijoz logotiplari yoki kafolatlar YO'Q — faqat tekshirilgan imkoniyatlar. */

export const HERO = {
  eyebrow: "Restoran, do'kon, dorixona va boshqa bizneslar uchun",
  title: ["Biznesingizni tartibga soling.", "Boshqaruvni soddalashtiring."],
  lead: "Tizimchi — restoran, do'kon, supermarket, dorixona, mehmonxona va boshqa bizneslar uchun kundalik jarayonlarni boshqarishga yordam beradigan yagona platforma.",
  primary: { label: "Biznesim uchun ko'rish", href: "#biznes-turlari" },
  secondary: { label: "Platformani ko'rish", href: "#platforma" },
  trust: [
    { icon: "gift", text: "14 kun bepul sinov" },
    { icon: "wifi-off", text: "Internetsiz ham ishlaydi" },
    { icon: "smartphone", text: "Telefon va kompyuterda" },
    { icon: "languages", text: "O'zbek va rus tillarida" },
  ],
};

/** Gero ostidagi tasma: platformaning tekshirilgan kafolatlari (raqamsiz) */
export const ASSURANCES = [
  { icon: "shield-check", title: "Ma'lumotlar ajratilgan", text: "Har bir biznes ma'lumoti bazada boshqalardan to'liq ajratilgan" },
  { icon: "fingerprint", title: "Ikki bosqichli himoya", text: "Hisobga kirishda qo'shimcha kod (2FA)" },
  { icon: "database-backup", title: "Zaxira nusxa", text: "Ma'lumotlarning shifrlangan zaxira nusxasi" },
  { icon: "archive", title: "Ma'lumot sizniki", text: "Istalgan vaqtda Excel'ga yuklab olasiz" },
];

/** Interaktiv tur: biznes turi → ekranlar. Ekranlar — ilovaning haqiqiy kadrlari (content/shots.mjs) */
export const TOUR = [
  {
    id: "dokon", label: "Do'kon va market", icon: "store", demo: "",
    views: [
      { id: "savdo", label: "Kassa", shot: "d-savdo", title: "Tezkor kassa",
        text: "Tovar nomi, katalog raqami yoki shtrix-kodi bilan topiladi. Klaviaturadan tez kiritish: qidirish → Enter → soni → Enter.",
        points: ["Naqd, karta, o'tkazma, qarzga yoki aralash to'lov", "Omborda qoldiq o'zi kamayadi, foyda hisoblanadi", "Chek printerga yoki Telegramga"] },
      { id: "ombor", label: "Ombor", shot: "d-ombor", title: "Ombor va kirim",
        text: "Nakladnoy rasmi, PDF yoki Excel'dan AI yordamida kirim. Joylar bo'yicha qoldiq va kam qolgan tovarlar bir qarashda.",
        points: ["Do'kon, ombor va boshqa joylar bo'yicha qoldiq", "Kam qolgan va tugagan tovarlar filtri", "Narxlarni ommaviy o'zgartirish va sanoq"] },
      { id: "mijozlar", label: "Qarzlar", shot: "d-mijozlar", title: "Mijozlar va qarzlar",
        text: "Har bir qarz necha kundan beri turgani ko'rinadi. Eslatma mijozga Telegram orqali boradi.",
        points: ["Jami qarz, qarzdorlar va 7 kundan oshgan qarzlar", "Dollar qarzi to'lov kunidagi kurs bilan", "Qarz yoki to'lovni AI bilan yozish"] },
      { id: "hisobot", label: "Hisobot", shot: "d-hisobot", title: "Hisobot va tahlil",
        text: "Tushum, yalpi va sof foyda, o'rtacha chek va kunlik grafik. Tovar tahlili sotilmayotgan va tugaydigan tovarlarni ko'rsatadi.",
        points: ["Istalgan davr: bugun, 7 kun, 30 kun yoki oraliq", "ABC tahlil va eng foydali tovarlar", "Excel'ga eksport"] },
      { id: "xodimlar", label: "Xodimlar", shot: "d-ruxsatlar", title: "Xodimlar va ruxsatlar",
        text: "Har bir xodimga tan narx, foyda, tushum va hisobotni ko'rish alohida beriladi yoki yopiladi.",
        points: ["Sotuvchi hech narsani o'chira olmaydi", "Yopiq raqamlarni server ham bermaydi", "Muhim amallar jurnalga yoziladi"] },
    ],
  },
  {
    id: "restoran", label: "Restoran va kafe", icon: "utensils", demo: "?restoran=1",
    views: [
      { id: "kassa", label: "Kassa", shot: "d-rest-pos", title: "Restoran kassasi",
        text: "Taom kartalari, o'lcham va qo'shimchalar. Buyurtma bir bosishda oshxonaga yuboriladi.",
        points: ["Zalda, olib ketish va yetkazib berish", "Hisobni bo'lish va birlashtirish", "Narx va summani server hisoblaydi"] },
      { id: "zal", label: "Zal", shot: "d-rest-zal", title: "Zal va stollar",
        text: "Har bir stol holati rang, belgi va matn bilan: bo'sh, tayyorlanmoqda, hisob kutilmoqda, tozalash kerak.",
        points: ["Bir nechta zal (masalan, «Asosiy zal», «Ayvon»)", "Tayyor taomli stolda qo'ng'iroq belgisi", "Tahrirlashda sudrab joylashtirish"] },
      { id: "oshxona", label: "Oshxona", shot: "d-rest-oshxona", title: "Oshxona ekrani",
        text: "Buyurtmalar tayyorlash joylari bo'yicha: yangi, tayyorlanmoqda va tayyor ustunlari.",
        points: ["Har bir taom holati alohida", "Taymer va ovozli signal", "Real vaqtda yangilanadi"] },
      { id: "panel", label: "Panel", shot: "d-rest-panel", title: "Umumiy panel",
        text: "Ochiq buyurtmalar, band stollar, xodimlar, tushum va eng ko'p sotilgan taomlar bitta ekranda.",
        points: ["Bugun, kecha, 7 yoki 30 kun", "To'lov va xizmat turlari", "QR-menyudan kelgan buyurtmalar"] },
    ],
  },
  {
    id: "dorixona", label: "Dorixona", icon: "pill", demo: "?dorixona=1",
    views: [
      { id: "analog", label: "Analoglar", shot: "d-dori-savdo", title: "Dori tugaganda — analog",
        text: "«Panadol» tugagan: kassa shu ta'sir etuvchi moddadagi dorilarni narxi va qoldig'i bilan taklif qiladi.",
        points: ["Qidiruv XPN (МНН) bo'yicha ham ishlaydi", "Lotin va kirill yozuvida bir xil", "Retseptli dorilar uchun tasdiq"] },
      { id: "zaxira", label: "Zaxira", shot: "d-dori-ombor", title: "Seriya va muddat",
        text: "Har bir partiyaning seriyasi va yaroqlilik muddati, sovutgichda saqlanadigan dorilar belgisi.",
        points: ["Muddati yaqinlashgan dorilar ro'yxati", "Seriya bo'yicha qidiruv", "Blister bilan sotish"] },
    ],
  },
];

/** «Biznesingizni boshqarish yanada tushunarli bo'lsin» — aniq misollar, kafolatsiz */
export const BENEFITS = [
  { icon: "layers", title: "Ma'lumot bir joyda", text: "Savdo, ombor, qarzlar va xarajatlar daftar, Excel va xotirada emas — bitta tizimda. Sotuv yozilishi bilan qoldiq, foyda va qarz o'zi yangilanadi." },
  { icon: "list-checks", title: "Kundalik ish tartibli", text: "Har bir amalning aniq joyi bor: kassa, kirim hujjati, buyurtma, smena. Yangi xodim ham ishni tez o'rganadi." },
  { icon: "chart-column", title: "Kerakli raqam qo'l ostida", text: "Bugungi tushum, sof foyda, eng ko'p sotilgan tovarlar va qarzdorlar — telefoningizda va Telegramda." },
  { icon: "user-cog", title: "Xodimlarga aniq vazifa", text: "Har bir xodim faqat o'ziga kerakli bo'limlarni ko'radi, muhim amallar esa jurnalga yoziladi." },
  { icon: "bell", title: "Muammo erta ko'rinadi", text: "Kam qolgan tovar, muddati yaqin partiya, to'lov muddati o'tgan qarz — ogohlantirishlar o'zi chiqadi." },
  { icon: "circle-play", title: "O'rganish oson", text: "Jonli demoda xavfsiz sinab ko'rasiz, video qo'llanmalar bo'limi esa bosqichma-bosqich to'ldirib boriladi." },
];

/** Bir platforma — har qanday qurilmada (to'q fondagi bo'lim) */
export const PLATFORM = [
  { icon: "wifi-off", title: "Internetsiz ishlaydi", text: "Internet uzilsa ham sotuv, qarz va kirim yoziladi. Internet qaytganda hammasi o'zi yuboriladi — ikki marta yozilmaydi." },
  { icon: "smartphone", title: "Har qanday qurilmada", text: "Brauzerda, Android ilova sifatida yoki Windows dasturida. Barcha qurilmalar real vaqtda sinxronlanadi." },
  { icon: "send", title: "Telegram bot", text: "Kunlik hisobot, kam qolgan tovarlar va qarzdorlar — egasining Telegramiga. Mijozlar esa botda o'z qarzini ko'radi." },
  { icon: "sparkles", title: "AI yordamchi", text: "Nakladnoyni o'qiydi, sotuvni matndan yozadi va «Nimani buyurtma qilay?» kabi savollarga do'kon ma'lumotlari asosida javob beradi." },
  { icon: "languages", title: "Uch tilda", text: "O'zbekcha (lotin va kirill) va ruscha. Qidiruv ikkala yozuvda bir xil ishlaydi." },
  { icon: "shield-check", title: "Himoya", text: "Har bir biznes ma'lumoti alohida, ikki bosqichli himoya (2FA), shifrlangan ulanish va zaxira nusxalar." },
];

/** «Qanday boshlash mumkin» — haqiqiy jarayon: o'zi ro'yxatdan o'tish yoki admin ochadi; Excel import; telefon va Telegram orqali yordam */
export const STEPS = [
  { title: "Biznes turini tanlang", text: "Sohangizni tanlang — har bir sahifada tayyor imkoniyatlar va mavjud bo'lmaganlari ochiq yozilgan.", link: { label: "Biznes turlari", href: "/biznes-turlari/" } },
  { title: "Imkoniyatlar bilan tanishing", text: "Savdo, ombor, qarzlar, xodimlar va hisobotlar qanday ishlashini ko'ring yoki jonli demoni oching.", link: { label: "Imkoniyatlar", href: "/imkoniyatlar/" } },
  { title: "Video qo'llanmalarni ko'ring", text: "Har bir bo'lim qanday ishlashini qisqa videolarda ko'rasiz.", link: { label: "Video qo'llanmalar", href: "/video-qollanmalar/" } },
  { title: "Demo yoki maslahat so'rang", text: "So'rov qoldiring — siz bilan bog'lanib, biznesingizga mos imkoniyatlarni ko'rsatamiz.", link: { label: "Demo so'rash", href: "#demo" } },
  { title: "Ishni boshlang", text: "Hisobni o'zingiz ochasiz (14 kun bepul) yoki biz ochib beramiz. Tovarlar Excel orqali yuklanadi, savollar bo'yicha telefon va Telegram orqali yordam beramiz.", link: { label: "Bepul sinab ko'rish", href: "signup" } },
];
