// @ts-check
/* Biznes turlari: kartochka (bosh sahifa, /biznes-turlari/) va har bir turning sahifasi (/biznes-turlari/<slug>/).
   QOIDA: faqat ilovada haqiqatan bor imkoniyatlar (README «Imkoniyatlar» jadvali va kod bilan tekshirilgan).
   Yo'q narsa — `limits` ro'yxatida ochiq yoziladi; ehtiyotkorlik kerak bo'lgan joy — `notes`.
   Matnda oddiy apostrof (o', g', ma'lumot) yoziladi — sayt uni o'zi to'g'ri belgiga (o‘, g‘, ma’lumot) almashtiradi. */

/**
 * @typedef {"ready" | "general" | "partial"} Fit
 *   ready   — ilovada shu soha uchun tayyor rejim (faoliyat turi) bor
 *   general — umumiy imkoniyatlar bilan yuritiladi
 *   partial — qisman mos: sohaning asosiy jarayoni uchun modul yo'q (limits da yozilgan)
 * @typedef {{ text: string, ok?: boolean }} Point
 * @typedef {{ icon: string, title: string, text: string }} Solution
 * @typedef {{ title: string, text: string }} Item
 * @typedef {{ q: string, a: string }} Faq
 * @typedef {{
 *   slug: string, name: string, icon: string, tone: string, fit: Fit,
 *   demo: { query: string, label: string },
 *   card: { text: string, points: Point[] },
 *   seo: { title: string, description: string },
 *   hero: { title: string, lead: string },
 *   shots: { desktop: string, phone: string },
 *   pains: Item[], solutions: Solution[],
 *   features: { title: string, items: string[] }[],
 *   limits?: string[], notes?: string[],
 *   flow: { title: string, steps: Item[] },
 *   faq: Faq[], sections: string[],
 * }} Industry
 */

export const FIT = {
  ready: { label: "Tayyor rejim", hint: "Ilovada shu soha uchun alohida rejim bor" },
  general: { label: "Umumiy imkoniyatlar", hint: "Savdo, ombor va hisobotning umumiy imkoniyatlari bilan" },
  partial: { label: "Qisman mos", hint: "Sohaning asosiy jarayoni uchun alohida modul yo'q" },
};

/** @type {Industry[]} */
export const INDUSTRY_PAGES = [
  {
    slug: "restoran", name: "Restoran va kafe", icon: "utensils", tone: "orange", fit: "ready",
    demo: { query: "?restoran=1", label: "Restoran demosini ochish" },
    card: {
      text: "Zal, oshxona va kassa bitta tizimda: buyurtmadan to'lovgacha.",
      points: [
        { text: "Zal va stollar xaritasi — holati real vaqtda" },
        { text: "Oshxona ekrani: taomlar tayyorlash joyi bo'yicha" },
        { text: "Texnologik karta: ingredientlar ombordan o'zi chiqadi" },
        { text: "Ofitsiant, kassir, oshpaz, kuryer — har biriga o'z ekrani" },
      ],
    },
    seo: {
      title: "Restoran va kafe uchun boshqaruv tizimi",
      description: "Buyurtma, zal va stollar, oshxona ekrani, menyu va texnologik karta, lavozimlar va hisobot — restoran, kafe va choyxonalar uchun Tizimchi.",
    },
    hero: {
      title: "Restoran boshqaruvini yagona tizimda tashkil qiling.",
      lead: "Ofitsiant buyurtmani telefonidan oladi, taom oshxona ekraniga tushadi, kassir to'lovni qabul qiladi, ingredientlar esa ombordan o'zi chiqadi. Zal, oshxona va kassa real vaqtda bog'langan.",
    },
    shots: { desktop: "d-rest-pos", phone: "p-rest-ofitsiant" },
    pains: [
      { title: "Buyurtma qog'ozda adashadi", text: "Ofitsiant yozgan chek oshxonaga kech yetadi yoki noto'g'ri o'qiladi, mehmon esa kutib qoladi." },
      { title: "Ingredientlar sarfi noma'lum", text: "Qancha go'sht, guruch yoki yog' ishlatilgani va qanchasi isrof bo'lgani aniq emas." },
      { title: "Kim nima qilgani ko'rinmaydi", text: "Bekor qilingan taom, chegirma yoki qaytarilgan pul uchun mas'ulni topish qiyin." },
      { title: "Hisob-kitob sekin", text: "Hisobni bo'lish, stolni ko'chirish yoki aralash to'lov qo'lda qilinadi va xatoga olib keladi." },
    ],
    solutions: [
      { icon: "utensils", title: "Tezkor kassa", text: "Kategoriyalar va taom kartalari, o'lcham va qo'shimchalar, «...siz» belgisi va oshpazga izoh. Hisobni bo'lish, birlashtirish va boshqa stolga ko'chirish." },
      { icon: "armchair", title: "Zal va stollar", text: "Stol holati rang, belgi va matn bilan: bo'sh, buyurtma kutilmoqda, tayyorlanmoqda, hisob, tozalash. Tayyor taomli stolda qo'ng'iroq belgisi chiqadi." },
      { icon: "chef-hat", title: "Oshxona ekrani", text: "Taomlar tayyorlash joylari (issiq sex, bar va boshqalar) bo'yicha. Har bir taom holati alohida, taymer rangi tayyorlash vaqtiga qarab o'zgaradi, yangi chek ovoz bilan keladi." },
      { icon: "utensils-crossed", title: "Menyu va texnologik karta", text: "Taomning tan narxi va ustamasi darhol hisoblanadi. Sotilganda ingredientlar ombordan o'zi chiqadi, bekor qilingan tayyor taom chiqindi sifatida yoziladi." },
      { icon: "user-cog", title: "Lavozimlar va ruxsatlar", text: "Ofitsiant, kassir, oshpaz, kuryer, omborchi, menejer va boshqalar — har biriga o'z ekrani. Pulni qaytarish, chegirma va bekor qilish faqat ruxsat bilan." },
      { icon: "bike", title: "Yetkazib berish va QR-menyu", text: "Kuryer ekrani: manzil, qo'ng'iroq va holatlar. Mehmon stol QR-kodi orqali menyuni ko'radi va buyurtma yuboradi — xodim tasdiqlaydi." },
    ],
    features: [
      { title: "Buyurtma va to'lov", items: [
        "Zalda, olib ketish va yetkazib berish rejimlari",
        "Oldindan hisob, xizmat haqi foizi va ruxsat bilan chegirma",
        "Naqd va qaytim, karta, o'tkazma, aralash va QR orqali to'lov",
        "Narx va summani server hisoblaydi — ilovadan o'zgartirib bo'lmaydi",
        "Kunlik buyurtma raqami; takroriy yuborish ikki marta yozilmaydi",
      ] },
      { title: "Oshxona va menyu", items: [
        "Tayyorlash joylari: issiq sex, bar va boshqalar",
        "Taom holati: qabul → tayyorlanmoqda → tayyor → berildi",
        "Stop-list: tugagan taom kassada belgilanadi",
        "Texnologik karta g, kg, ml, l va dona birliklarida",
      ] },
      { title: "Nazorat va hisobot", items: [
        "Har bir buyurtmada kim olgan, tayyorlagan va to'lovni qabul qilgani",
        "Ofitsiant yuborilgan taomni o'zi bekor qila olmaydi — menejerga so'rov yuboradi",
        "Hisobot: taomlar, ofitsiantlar, soatlar, to'lov turlari, bekor qilishlar",
        "Ingredientlar sarfi, chiqindi va yalpi foyda; Excel'ga eksport",
      ] },
      { title: "Muassasa turlari", items: [
        "Restoran, kafe, fast-food, choyxona, oshxona",
        "Pitsseriya, burger, qandolatxona, kofeynya, dark kitchen",
        "Sozlash ustasi: rejimlar, stollar soni, xizmat haqi, oshxona ekrani",
      ] },
    ],
    notes: [
      "Restoran rejimida barcha narxlar so'mda yuritiladi — dollar kursi ishlatilmaydi.",
      "Restoran rejimida mijozlarga qarzga sotish va qarz eslatmalari yo'q; ta'minotchilardan qarzga olish hisobi bor.",
      "Onlayn-kassa (fiskal chek) hozircha sinov rejimida — haqiqiy provayder bilan ulanish shartnomadan keyin yoqiladi.",
    ],
    flow: {
      title: "Bir buyurtmaning yo'li",
      steps: [
        { title: "Buyurtma", text: "Ofitsiant stolni tanlaydi va telefonidan buyurtma oladi: o'lcham, qo'shimcha va «piyozsiz» kabi izohlar bilan." },
        { title: "Oshxona", text: "Taomlar tayyorlash joyiga qarab oshxona yoki bar ekraniga tushadi, oshpaz holatini belgilaydi." },
        { title: "Xizmat", text: "Taom tayyor bo'lishi bilan ofitsiant ekranida belgi chiqadi — u taomni olib boradi." },
        { title: "To'lov", text: "Mehmon hisob so'raydi: kassir to'lovni qabul qiladi, kerak bo'lsa hisobni bo'ladi yoki aralash to'lov qiladi." },
        { title: "Hisob", text: "Ingredientlar ombordan o'zi chiqadi, hisobotda tushum, sarf va yalpi foyda ko'rinadi." },
      ],
    },
    faq: [
      { q: "Ofitsiantlar buyurtmani telefonidan ola oladimi?", a: "Ha. Ofitsiantga «Stollarim» va «Buyurtma olish» ekranlari ochiladi. Ilova telefon brauzerida ishlaydi va Android'ga ilova sifatida ham o'rnatiladi." },
      { q: "Internet uzilib qolsa nima bo'ladi?", a: "Buyurtma internetsiz ham olinadi. To'lov server tasdiqlaguncha «navbatda» turadi va internet qaytgach o'zi yuboriladi." },
      { q: "Oshxona uchun alohida qurilma kerakmi?", a: "Oshxona ekrani istalgan planshet, monitor yoki kompyuter brauzerida ochiladi. Oshpazga faqat o'z tayyorlash joyidagi taomlar ko'rsatiladi." },
      { q: "Narx yoki chegirmani kim o'zgartira oladi?", a: "Narx va summani server hisoblaydi. Narxni o'zgartirish, chegirma berish va bekor qilish faqat shu ruxsat berilgan xodimlarda bo'ladi." },
    ],
    sections: ["restoran", "savdo", "ombor", "xodimlar", "hisobot"],
  },

  {
    slug: "dokon", name: "Do'kon", icon: "store", tone: "blue", fit: "ready",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Savdo, qarzlar, qoldiq va kunlik tushum — bitta ilovada, telefoningizda ham.",
      points: [
        { text: "Tovarni nomi yoki shtrix-kodi bilan tez topish" },
        { text: "Qarz daftari o'rniga: muddat va Telegram orqali eslatma" },
        { text: "Kam qolgan tovar haqida ogohlantirish" },
        { text: "Internet bo'lmasa ham ishlaydi" },
      ],
    },
    seo: {
      title: "Do'kon uchun savdo va ombor dasturi",
      description: "Kassa, qarzlar hisobi, ombor qoldig'i, Telegram orqali kunlik hisobot va internetsiz ishlash — kichik va o'rta do'konlar uchun Tizimchi.",
    },
    hero: {
      title: "Savdo jarayonlarini nazorat qiling va ishni tartibga soling.",
      lead: "Har bir sotuv, qarz va qoldiq yozib boriladi. Kun oxirida tushum va foydani ko'rasiz, qarzdorlarga eslatma esa Telegram orqali o'zi boradi.",
    },
    shots: { desktop: "d-savdo", phone: "p-savdo" },
    pains: [
      { title: "Qarz daftarda yo'qoladi", text: "Kim qancha qarzi borligi va qachondan beri to'lamayotgani esdan chiqadi." },
      { title: "Qoldiq taxminan", text: "Qaysi tovar tugaganini peshtaxtada xaridor so'raganda bilasiz." },
      { title: "Foyda noma'lum", text: "Kassada pul bor, lekin xarajatlardan keyin qancha foyda qolgani aniq emas." },
      { title: "Sotuvchini nazorat qilish qiyin", text: "Kim nima sotgani, nimani o'chirgani yoki narxni o'zgartirgani ko'rinmaydi." },
    ],
    solutions: [
      { icon: "scan-barcode", title: "Tezkor kassa", text: "Tovarni nomi, katalog raqami yoki shtrix-kodi bilan topasiz — telefon kamerasi ham skaner. To'lov: naqd, karta, o'tkazma, qarzga yoki aralash." },
      { icon: "wallet", title: "Qarzlar hisobi", text: "Har bir qarz necha kundan beri turgani ko'rinadi, muddati o'tganlar alohida ro'yxatda. Eslatma mijozga Telegram orqali yuboriladi." },
      { icon: "package", title: "Ombor qoldig'i", text: "Sotuvda qoldiq o'zi kamayadi. Kam qolgan tovar haqida ogohlantirish chiqadi, kirim esa nakladnoy rasmidan AI yordamida tayyorlanadi." },
      { icon: "chart-column", title: "Hisobot", text: "Tushum, yalpi va sof foyda, eng ko'p sotilgan tovarlar va to'lov turlari. Istalgan davr uchun Excel." },
      { icon: "user-cog", title: "Sotuvchilar nazorati", text: "Sotuvchi hech narsani o'chira olmaydi. Tan narx va foydani ko'rish — faqat ruxsat bilan. Muhim amallar jurnalga yoziladi." },
      { icon: "send", title: "Telegram bot", text: "Kunlik hisobot, kam qolgan tovarlar va qarzdorlar ro'yxati egasining Telegramiga keladi." },
    ],
    features: [
      { title: "Savdo", items: [
        "Klaviaturadan tez kiritish: qidirish → Enter → soni → Enter",
        "Chek: 58 yoki 80 mm printer, Telegram yoki rasm",
        "Sotuvni qisman yoki to'liq qaytarish",
        "Buyurtma (zakaz): omborda yo'q tovar ham yoziladi",
      ] },
      { title: "Qarz va mijozlar", items: [
        "Qarzga sotishda qaytarish sanasi",
        "Dollar qarzi to'lov kunidagi kurs bilan hisoblanadi",
        "Avtomatik eslatma soat 10:00–19:00 oralig'ida, kunlari sozlanadi",
        "Mijoz Telegram botda «Qarzlarim» tugmasi bilan qarzini ko'radi",
      ] },
      { title: "Ombor", items: [
        "Shtrix-kod yaratish va narx yorlig'ini chop etish",
        "Excel'dan yuklash va Excel'ga eksport",
        "Inventarizatsiya (sanoq) — skaner bilan ham",
        "Narxlarni ommaviy o'zgartirish",
      ] },
    ],
    notes: [
      "Qarz eslatmalari standart holatda o'chiq — egasi Sozlamalar → «Qarz eslatmalari» bo'limida yoqadi.",
      "SMS eslatma hozircha ulanmagan: eslatmalar Telegram orqali bepul yuboriladi.",
    ],
    flow: {
      title: "Do'kondagi bir kun",
      steps: [
        { title: "Ertalab", text: "Kechagi hisobot Telegramda: tushum, foyda va kam qolgan tovarlar." },
        { title: "Savdo", text: "Sotuvchi tovarni nomi yoki shtrix-kodi bilan topadi, to'lovni qabul qiladi va chek chiqaradi." },
        { title: "Qarz", text: "Doimiy mijozga qaytarish sanasi bilan qarzga sotiladi. Muddat o'tsa, eslatma o'zi boradi." },
        { title: "Kirim", text: "Ta'minotchi nakladnoyini suratga olasiz — AI tovarlarni ajratib, kirim hujjatini tayyorlaydi." },
        { title: "Kechqurun", text: "Hisobotda tushum, sof foyda va eng ko'p sotilgan tovarlar; tugayotgan tovarlar ro'yxatini ta'minotchiga yuborasiz." },
      ],
    },
    faq: [
      { q: "Shtrix-kod skaneri shartmi?", a: "Shart emas. Telefon kamerasi bilan skanerlash mumkin. USB yoki Bluetooth skanerlar ham ishlaydi." },
      { q: "Chek printeri kerakmi?", a: "Ixtiyoriy. 58 yoki 80 mm chek printeriga chop etish mumkin. Chekni Telegram orqali yuborish yoki rasm sifatida ulashish ham mumkin." },
      { q: "Bir nechta sotuvchi ishlay oladimi?", a: "Ha. Egasi sotuvchilarga alohida login ochadi (soni tarifga bog'liq). Barcha qurilmalardagi sotuvlar real vaqtda ko'rinadi." },
      { q: "Internet uzilsa ma'lumot yo'qolmaydimi?", a: "Yo'qolmaydi. Internetsiz qilingan sotuv, qarz va kirim navbatda turadi va internet qaytganda tartib bilan yuboriladi — ikki marta yozilmaydi." },
    ],
    sections: ["savdo", "mijozlar", "ombor", "hisobot"],
  },

  {
    slug: "supermarket", name: "Supermarket", icon: "shopping-cart", tone: "green", fit: "ready",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Ko'p kassali savdo, tarozi, yaroqlilik muddati va aksiyalar.",
      points: [
        { text: "Shtrix-kod va tarozi yorlig'i bilan tez kassa" },
        { text: "Yaroqlilik muddati: partiyalar va ogohlantirish" },
        { text: "Aksiya narxi, chek chegirmasi va bonus karta" },
        { text: "Kassa smenasi va Z-hisobot" },
      ],
    },
    seo: {
      title: "Supermarket va oziq-ovqat do'koni uchun tizim",
      description: "Kassa smenasi va Z-hisobot, shtrix-kod va tarozi, yaroqlilik muddati nazorati, aksiyalar va bonus karta — supermarket va marketlar uchun Tizimchi.",
    },
    hero: {
      title: "Kassa, muddatlar va aksiyalarni bir joydan boshqaring.",
      lead: "Bir nechta kassada bir vaqtda savdo, smena oxirida naqd pulni sanash va Z-hisobot. Muddati yaqinlashgan tovar haqida ogohlantirish chiqadi, aksiyalar esa kassada o'zi qo'llanadi.",
    },
    shots: { desktop: "d-market-savdo", phone: "p-market-savdo" },
    pains: [
      { title: "Muddati o'tgan tovar zarari", text: "Qaysi partiyaning muddati yaqinlashganini bilmasangiz, tovar javonda buziladi." },
      { title: "Kassada kamomad", text: "Smena oxirida pul yetishmaydi, lekin qachon va qaysi kassada ekanini aniqlash qiyin." },
      { title: "Kassada navbat", text: "Tovarni qo'lda qidirish va narxni eslash xaridorlarni kuttiradi." },
      { title: "Aksiyalarni qo'lda hisoblash", text: "Chegirma va bonuslarni kassir yodda tutishiga to'g'ri keladi." },
    ],
    solutions: [
      { icon: "scan-barcode", title: "Shtrix-kod va tarozi", text: "Tovar shtrix-kod bilan bir zumda topiladi. Tarozi yorlig'idagi vazn kassada o'qiladi. USB va Bluetooth skanerlar ishlaydi." },
      { icon: "hourglass", title: "Yaroqlilik muddati", text: "Har bir partiya o'z muddati bilan saqlanadi, sotuvda avval muddati yaqini chiqadi. Muddati yaqinlashgan va o'tgan tovarlar ro'yxati, hisobdan chiqarish." },
      { icon: "badge-percent", title: "Aksiyalar va bonus karta", text: "Aksiya narxi va chek chegirmasi kassada o'zi qo'llanadi. Doimiy xaridorlar uchun bonus (jamg'arma) karta." },
      { icon: "wallet", title: "Kassa smenasi", text: "Smena boshlang'ich naqd bilan ochiladi. Yopishda kassir naqdni sanaydi — kutilgan summani ko'rmaydi. Z-hisobotda kamomad yoki ortiqcha ko'rinadi." },
      { icon: "users", title: "Kassirlar va ruxsatlar", text: "Har bir kassirga alohida login. Sotuvchilar bo'yicha hisobot: sotuvlar, tushum, chegirmalar va qaytarishlar." },
      { icon: "chart-pie", title: "Tovar tahlili", text: "Sotilmayotgan tovarlar va ularda muzlagan pul, 2 hafta ichida tugaydiganlar, ABC tahlil." },
    ],
    features: [
      { title: "Kassa", items: [
        "Bir nechta kassa bir vaqtda — sotuvlar real vaqtda sinxronlanadi",
        "Kassaga kirim va chiqim, oraliq X-hisobot",
        "Smenani xodim yopsa — egaga Telegram orqali xabar",
        "Kassada QR orqali to'lov (do'konning o'z Payme yoki Click kassasi)",
      ] },
      { title: "Tovar va narx", items: [
        "Narxlarni ommaviy o'zgartirish va 7 kun ichida qaytarish",
        "Ikki birlikda sotish (masalan, dona va blok)",
        "MXIK kodlarini tasnif.soliq.uz ma'lumotlari bilan to'ldirish",
        "«Asl belgisi» kodlarini skanerlash",
      ] },
      { title: "Nazorat", items: [
        "Muhim amallar jurnali: o'chirish, narx o'zgartirish",
        "Sotuvchi tan narx va foydani faqat ruxsat bilan ko'radi",
        "Inventarizatsiya: farqni ko'rish va bir tugma bilan tuzatish",
      ] },
    ],
    notes: [
      "Onlayn-kassa (fiskal chek) hozircha sinov rejimida: haqiqiy provayder (masalan, Multikassa, E-POS, Rahmat) bilan ulanish shartnomadan keyin yoqiladi.",
      "Kassada QR orqali to'lov uchun do'konning o'z Payme yoki Click shartnomasi kerak.",
    ],
    flow: {
      title: "Bir smena",
      steps: [
        { title: "Smena ochiladi", text: "Kassir boshlang'ich naqdni kiritadi va savdoni boshlaydi." },
        { title: "Savdo", text: "Tovarlar shtrix-kod va tarozi yorlig'i bilan qo'shiladi, aksiyalar o'zi qo'llanadi." },
        { title: "Kassa harakati", text: "Kun davomida kassadan chiqim yoki kirim yoziladi, kerak bo'lsa oraliq X-hisobot olinadi." },
        { title: "Smena yopiladi", text: "Kassir naqdni sanab yozadi; Z-hisobotda kutilgan va sanalgan summa, kamomad yoki ortiqcha ko'rinadi." },
        { title: "Ega xabardor", text: "Smena yopilgani haqida egaga Telegram orqali xabar keladi, barcha smenalar «Hisobot»da saqlanadi." },
      ],
    },
    faq: [
      { q: "Tarozi bilan ishlaydimi?", a: "Ha. Tarozi chop etgan shtrix-kodli yorliq kassada o'qiladi va vazn avtomatik olinadi. Yorliq prefiksi sozlamalarda belgilanadi." },
      { q: "Muddati o'tgan tovarlar qanday nazorat qilinadi?", a: "Har bir kirimda partiya muddati yoziladi. Muddati yaqinlashgan va o'tgan partiyalar alohida ro'yxatda chiqadi, ularni hisobdan chiqarish mumkin." },
      { q: "Fiskal chek chiqaradimi?", a: "Fiskal chek funksiyasi sinov rejimida tayyor. Haqiqiy onlayn-kassa provayderi bilan ulanish shartnoma tuzilgandan keyin yoqiladi — bu haqda demo vaqtida aniq ma'lumot beramiz." },
      { q: "Nechta kassa ulash mumkin?", a: "Xodimlar soni tarifga bog'liq. Barcha kassalar bitta bazada ishlaydi va sotuvlar real vaqtda ko'rinadi." },
    ],
    sections: ["savdo", "ombor", "xodimlar", "hisobot"],
  },

  {
    slug: "dorixona", name: "Dorixona", icon: "pill", tone: "teal", fit: "ready",
    demo: { query: "?dorixona=1", label: "Dorixona demosini ochish" },
    card: {
      text: "Ta'sir etuvchi modda bo'yicha qidiruv, analoglar, seriya va muddat nazorati.",
      points: [
        { text: "XPN (МНН) bo'yicha qidiruv va analoglar" },
        { text: "Partiya seriyasi va yaroqlilik muddati" },
        { text: "Retseptli dorilar uchun belgi va tasdiq" },
        { text: "Qutidan blister bilan sotish" },
      ],
    },
    seo: {
      title: "Dorixona uchun savdo va zaxira tizimi",
      description: "Ta'sir etuvchi modda (XPN) bo'yicha qidiruv va analoglar, seriya va yaroqlilik muddati, retseptli dorilar, blister bilan sotish — dorixonalar uchun Tizimchi.",
    },
    hero: {
      title: "Dorixona savdosi va dori zaxirasini aniq nazorat qiling.",
      lead: "Dori tugagan bo'lsa, kassada uning analoglari narxi bilan chiqadi. Seriya va muddat har bir partiya bo'yicha yuritiladi, retseptli dori sotishdan oldin tasdiq so'raladi.",
    },
    shots: { desktop: "d-dori-savdo", phone: "p-dori-savdo" },
    pains: [
      { title: "Dori tugasa, analog topish qiyin", text: "Xaridor so'ragan dori yo'q, lekin xuddi shu modda boshqa nom bilan javonda turibdi." },
      { title: "Muddat nazorati qo'lda", text: "Qaysi partiyaning muddati yaqinlashgani ro'yxatda ko'rinmaydi." },
      { title: "Seriya bo'yicha qidirish", text: "Qaytarib olish xati kelganda kerakli seriyani topish uchun barcha qutilarni ko'rib chiqishga to'g'ri keladi." },
      { title: "Retseptli dori nazorati", text: "Retsept tekshirilgani va uning raqami hech qayerda qayd etilmaydi." },
    ],
    solutions: [
      { icon: "replace", title: "Analoglar", text: "Qidiruv ta'sir etuvchi modda bo'yicha ham ishlaydi: «paratsetamol» yozilsa, shu moddadagi barcha dorilar chiqadi. Dori tugagan bo'lsa, omborda bor analoglari narxi bilan ko'rsatiladi." },
      { icon: "tablets", title: "Dori kartasi", text: "Ta'sir etuvchi modda, dori shakli va dozasi, ishlab chiqaruvchi, saqlash sharoiti (sovutgichda saqlanadigani belgi bilan) va retsept talabi." },
      { icon: "hourglass", title: "Seriya va muddat", text: "Har bir partiyaning seriyasi va yaroqlilik muddati. Ro'yxatda eng yaqin muddat ko'rinadi, ombor qidiruvi seriya bo'yicha ham topadi." },
      { icon: "clipboard-check", title: "Retseptli dorilar", text: "Savatda «Rx» belgisi. Sotishdan oldin retsept tekshirilgani so'raladi, raqami sotuv izohiga yoziladi. Omborda «Retseptli» filtri." },
      { icon: "boxes", title: "Blister bilan sotish", text: "Qutini to'liq yoki blister bilan sotish: masalan, «1 quti = 10 blister», har birining o'z narxi." },
      { icon: "file-spreadsheet", title: "Excel bilan kirim", text: "Distribyutor fayllaridagi «МНН», «Лекарственная форма», «Дозировка», «Производитель», «Серия» ustunlari taniladi." },
    ],
    features: [
      { title: "Savdo", items: [
        "Qidiruv lotin va kirillda bir xil ishlaydi: «paratsetamol» = «парацетамол»",
        "Kassada «Analoglari» oynasi",
        "«Asl belgisi» DataMatrix kodini skanerlash",
      ] },
      { title: "Zaxira", items: [
        "Muddati yaqinlashgan va o'tgan dorilar ro'yxati",
        "Sovutgichda saqlanadigan dorilar belgisi",
        "Kam qolgan dorilar haqida ogohlantirish",
        "Inventarizatsiya: skaner bilan sanash",
      ] },
    ],
    notes: [
      "Tizimchi dorixonaning ichki savdo va zaxira hisobini yuritadi. Davlat axborot tizimlariga hisobot yuborish (masalan, markirovka bo'yicha) uchun alohida integratsiya hozircha yo'q — ehtiyojingizni demo vaqtida aniqlashtiramiz.",
      "Onlayn-kassa (fiskal chek) hozircha sinov rejimida.",
    ],
    flow: {
      title: "Xaridor kelganda",
      steps: [
        { title: "Qidiruv", text: "Farmatsevt dori nomini yoki ta'sir etuvchi moddasini yozadi." },
        { title: "Analog", text: "Dori tugagan bo'lsa, shu moddadagi analoglar narxi va qoldig'i bilan chiqadi." },
        { title: "Retsept", text: "Retseptli dori uchun tasdiq so'raladi, retsept raqami sotuvga yoziladi." },
        { title: "Sotuv", text: "Quti yoki blister bilan sotiladi; avval muddati yaqin partiya chiqadi." },
        { title: "Nazorat", text: "Hisobotda tushum va foyda, ombor ro'yxatida esa muddati yaqinlashgan partiyalar." },
      ],
    },
    faq: [
      { q: "Analoglar qanday aniqlanadi?", a: "Dori kartasidagi ta'sir etuvchi modda (XPN) bo'yicha: bir xil moddadagi dorilar bir-birining analogi hisoblanadi. Shuning uchun XPN to'g'ri kiritilishi muhim." },
      { q: "Mavjud dorilar ro'yxatini yuklash mumkinmi?", a: "Ha, Excel orqali. Distribyutor fayllaridagi ruscha ustun nomlari ham taniladi." },
      { q: "Retseptli dorilar qanday nazorat qilinadi?", a: "Retseptli dori sotilishidan oldin retsept tekshirilgani so'raladi va raqami sotuv izohiga yoziladi. Bu ichki nazorat uchun; davlat tizimlariga hisobot yuborilmaydi." },
    ],
    sections: ["savdo", "ombor", "hisobot"],
  },

  {
    slug: "avto-ehtiyot-qismlar", name: "Avto ehtiyot qismlar", icon: "car", tone: "indigo", fit: "ready",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Katalog raqami, mos mashinalar va nakladnoydan AI bilan kirim.",
      points: [
        { text: "Katalog raqami bo'yicha qidiruv — har xil yozilishda ham" },
        { text: "Tovar qaysi mashinalarga mosligi" },
        { text: "Nakladnoy rasmidan AI bilan kirim" },
        { text: "Dollar kursi, dollardagi narx va qarzlar" },
      ],
    },
    seo: {
      title: "Avto ehtiyot qismlar do'koni uchun dastur",
      description: "Katalog raqami va mashina modeli bo'yicha qidiruv, nakladnoyni AI bilan o'qish, dollar kursi, ustalar bilan qarz hisobi — avto ehtiyot qismlar do'konlari uchun Tizimchi.",
    },
    hero: {
      title: "Ehtiyot qismni katalog raqami bilan bir zumda toping.",
      lead: "«96-353-041», «96 353 041» va «96353041» bir xil topiladi. «Nexia 3 kolodka» deb yozsangiz, shu mashinaga mos tovarlar chiqadi. Kirim esa nakladnoy rasmidan AI yordamida tayyorlanadi.",
    },
    shots: { desktop: "d-savdo-qidiruv", phone: "p-savdo" },
    pains: [
      { title: "Bir qism — o'nlab nom", text: "Usta bir nom bilan so'raydi, ta'minotchi boshqasini yozadi, katalogda esa raqam." },
      { title: "Qaysi mashinaga mos?", text: "Qism qaysi modellarga to'g'ri kelishini sotuvchi yoddan bilishi kerak." },
      { title: "Kirim uzoq vaqt oladi", text: "Uzun nakladnoyni qo'lda kiritish soatlab vaqt oladi va xatoga olib keladi." },
      { title: "Dollar va so'm aralash", text: "Narx dollarda, to'lov so'mda, kurs esa har kuni o'zgaradi." },
    ],
    solutions: [
      { icon: "search", title: "Katalog raqami bo'yicha qidiruv", text: "Raqam chiziqcha va bo'sh joy bilan yoki ularsiz yozilsa ham topiladi. Katalog raqami, shtrix-kodi yoki nomi bir xil tovarlar kirimda birlashtiriladi." },
      { icon: "car", title: "Mos mashinalar", text: "Tovar kartasida mos modellar yoziladi. Nomlar lotin, kirill va xato yozilishda ham taniladi: «нексия» = «neksiya» = «Nexia». Omborda «Mashina» filtri bor." },
      { icon: "sparkles", title: "AI bilan kirim", text: "Nakladnoy rasmi, PDF, Excel yoki matn — AI tovarlarni katalog raqamlari bilan ajratadi. Saqlashdan oldin o'zingiz tekshirasiz." },
      { icon: "circle-dollar-sign", title: "Dollar kursi", text: "Markaziy bank kursi har soatda yangilanadi. Kursga ustama qo'shish yoki uni qo'lda belgilash mumkin. Dollardagi qarz to'lov kunidagi kurs bilan hisoblanadi." },
      { icon: "wallet", title: "Ustalar va qarzlar", text: "Doimiy mijozlar va ustalar qarzi, muddati o'tganlar ro'yxati, Telegram orqali eslatma." },
      { icon: "map-pin", title: "Tovar joylari", text: "Do'kon, ombor va boshqa joylardagi qoldiq va polka alohida. Buyurtmada «ombordan olib kelish» ro'yxati alohida chiqadi." },
    ],
    features: [
      { title: "Qidiruv va savdo", items: [
        "«Nexia 3 kolodka» kabi so'rov bilan qidirish",
        "AI yoki ovoz bilan sotuv yozish: «Aliyevga 2 ta svecha qarzga»",
        "Omborda yo'q tovarni ham buyurtmaga yozish",
      ] },
      { title: "Ombor", items: [
        "10 000 – 15 000 dan ortiq tovar ham to'liq ko'rinadi",
        "Sotilmayotgan qismlar va ularda muzlagan pul",
        "Narx tarixi va narxlarni ommaviy o'zgartirish",
      ] },
    ],
    notes: ["AI so'rovlari soni tarifga bog'liq (kunlik limit)."],
    flow: {
      title: "Mijoz qism so'raganda",
      steps: [
        { title: "So'rov", text: "Mijoz: «Nexia uchun tormoz diski bormi?»" },
        { title: "Qidiruv", text: "Sotuvchi «nexia tormoz» yoki katalog raqamini yozadi — tovar qoldig'i va joyi bilan chiqadi." },
        { title: "Sotuv", text: "Tovar savatga qo'shiladi; usta bo'lsa — qaytarish sanasi bilan qarzga." },
        { title: "Yo'q bo'lsa", text: "Tovar buyurtmaga «sotib olish kerak» deb yoziladi va ro'yxat ta'minotchiga yuboriladi." },
      ],
    },
    faq: [
      { q: "Barcha qismlarni o'zim kiritishim kerakmi?", a: "Yo'q. Mavjud ro'yxatni Excel'dan yuklaysiz, yangi kirimlarni esa nakladnoy rasmi yoki faylidan AI yordamida kiritasiz." },
      { q: "AI xato qilsa-chi?", a: "AI tayyorlagan kirim hujjati saqlanishidan oldin ko'rsatiladi — siz tekshirib, tuzatib, keyin saqlaysiz." },
      { q: "Narxlarni dollarda yuritsa bo'ladimi?", a: "Ha. Tovar narxi so'mda yoki dollarda bo'lishi mumkin, kurs esa Markaziy bank bo'yicha avtomatik yangilanadi." },
    ],
    sections: ["savdo", "ombor", "mijozlar", "taminot"],
  },

  {
    slug: "qurilish-mollari", name: "Qurilish mollari", icon: "brick-wall", tone: "brown", fit: "ready",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Ikki birlikda sotish, miqdorga qarab narx va material kalkulyatori.",
      points: [
        { text: "m² ⇄ quti, tonna, qop — ikki birlikda sotish" },
        { text: "Miqdorga qarab narx va ulgurji narx" },
        { text: "Material kalkulyatori: kafel, bo'yoq, sement va boshqalar" },
        { text: "To'langan, lekin olib ketilmagan tovar hisobi" },
      ],
    },
    seo: {
      title: "Qurilish mollari do'koni uchun tizim",
      description: "Ikki o'lchov birligida sotish, miqdorga qarab va ulgurji narx, material kalkulyatori, olib ketilmagan tovar hisobi — qurilish mollari do'konlari uchun Tizimchi.",
    },
    hero: {
      title: "Qurilish mollari savdosini o'lchov birliklari bilan aniq yuriting.",
      lead: "Kafel m² da, sement qopda, armatura tonnada — har biri o'z birligi va narxi bilan. Kalkulyator xona o'lchamidan kerakli miqdorni hisoblaydi, to'langan, lekin olib ketilmagan tovar esa mijoz nomida turadi.",
    },
    shots: { desktop: "d-qurilish-ombor", phone: "p-qurilish-savdo" },
    pains: [
      { title: "Birliklar chalkash", text: "Kafel m² da hisoblanadi, lekin qutida sotiladi; armatura dona va tonnada." },
      { title: "Hajmga qarab narx", text: "Ko'p olgan mijozga narx tushadi — kassir har safar qo'lda hisoblaydi." },
      { title: "Qancha material kerak?", text: "Mijoz xona o'lchamini aytadi, sotuvchi kafel, yelim va zatirkani qo'lda hisoblaydi." },
      { title: "Olib ketilmagan tovar", text: "Pul to'langan, tovar omborda — kimniki ekanini daftardan qidirasiz." },
    ],
    solutions: [
      { icon: "ruler", title: "Ikki birlikda sotish", text: "«1 quti = 1,44 m²», «1 qop = 50 kg» — har birining o'z narxi. Kassada bir bosishda m² ⇄ quti va butun qutiga yaxlitlash. Ombor asosiy birlikda yuritiladi." },
      { icon: "badge-percent", title: "Miqdorga qarab narx", text: "«10 m² dan boshlab — 102 000» kabi 3 tagacha pog'ona: miqdor o'zgarsa narx o'zi tushadi. Ulgurji narx usta yoki ulgurji mijoz tanlanganda qo'llanadi." },
      { icon: "calculator", title: "Material kalkulyatori", text: "Yuza, hajm yoki uzunlik bo'yicha har bir tovarga kerakli miqdor (sarf × qatlam + zaxira foizi). Natija savatga yoki Telegram orqali smeta sifatida yuboriladi." },
      { icon: "package", title: "Olib ketilmagan tovar", text: "To'lov to'liq olinadi, qolgan qismi mijoz nomida turadi va qismlab olib ketiladi. Har bir olib ketish tarixi saqlanadi." },
      { icon: "truck", title: "Xizmatlar", text: "Yetkazib berish, yuk tushirish va boshqa xizmatlar kassada bir bosishda qo'shiladi." },
      { icon: "file-spreadsheet", title: "Excel bilan ishlash", text: "Ikkinchi birlik, nisbat, pog'onali narx va sarf me'yori ustunlari Excel'dan yuklanadi va eksport qilinadi." },
    ],
    features: [
      { title: "Birliklar", items: [
        "m², m³, tonna, qop, list, rulon, pachka",
        "Excel'dagi «кв.м», «мешок», «т» kabi yozuvlar taniladi",
        "Chekda «4,32 m²» yoki «3 quti» ko'rinishida",
      ] },
      { title: "Kalkulyator shablonlari", items: [
        "Kafel, bo'yoq, gruntovka, yelim, shtukaturka",
        "G'isht, gipsokarton, profil, plintus, truba",
        "Beton va sement",
      ] },
    ],
    notes: ["Nisbat, pog'onali narx va sarf me'yori har bir tovar kartasida do'kon egasi tomonidan kiritiladi."],
    flow: {
      title: "Mijoz ta'mir uchun kelganda",
      steps: [
        { title: "O'lcham", text: "Mijoz xona o'lchamini aytadi: masalan, 4 × 3 m." },
        { title: "Hisob", text: "Kalkulyator kafel, yelim va zatirka miqdorini zaxira foizi bilan hisoblaydi va qutiga yaxlitlaydi." },
        { title: "Narx", text: "Miqdorga qarab narx o'zi qo'llanadi; usta bo'lsa — ulgurji narx." },
        { title: "To'lov", text: "Mijoz hammasini to'laydi, bugun bir qismini olib ketadi — qolgani uning nomida turadi." },
        { title: "Yetkazish", text: "Yetkazib berish xizmati chekka qo'shiladi; qolgan tovar keyinroq yuk xati bilan beriladi." },
      ],
    },
    faq: [
      { q: "Kalkulyator me'yorlarini o'zgartirsa bo'ladimi?", a: "Ha. Sarf me'yori, qatlam va zaxira foizi tovar kartasida yoziladi; tayyor shablonlardan boshlash mumkin." },
      { q: "Mijoz qolgan tovarni bir necha marta olib ketsa-chi?", a: "Har bir olib ketish alohida yoziladi va yuk xati chop etiladi. Tarix mijoz kartasida ko'rinadi." },
    ],
    sections: ["savdo", "ombor", "mijozlar"],
  },

  {
    slug: "xojalik-mollari", name: "Xo'jalik mollari", icon: "spray-can", tone: "pink", fit: "ready",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Minglab mayda tovar, shtrix-kod, aksiyalar va ta'minotchilar hisobi.",
      points: [
        { text: "10–15 ming tovar bilan ham tez ishlaydi" },
        { text: "Shtrix-kod yaratish va narx yorlig'ini chop etish" },
        { text: "Ta'minotchilar oldidagi qarz va to'lov muddatlari" },
        { text: "Narxlarni ommaviy o'zgartirish" },
      ],
    },
    seo: {
      title: "Xo'jalik mollari do'koni uchun dastur",
      description: "Minglab tovar uchun tez qidiruv, shtrix-kod va narx yorliqlari, ta'minotchilar va qarzlar, narxlarni ommaviy o'zgartirish — xo'jalik mollari do'konlari uchun Tizimchi.",
    },
    hero: {
      title: "Minglab mayda tovarni tartib bilan boshqaring.",
      lead: "Mix, lampochka, kran yoki yuvish vositasi — har biri shtrix-kod, narx va qoldiq bilan. Ta'minotchidan kirim, qarzlar va narxlarni yangilash bir necha daqiqada.",
    },
    shots: { desktop: "d-xojalik-ombor", phone: "p-xojalik-savdo" },
    pains: [
      { title: "Tovar juda ko'p", text: "Minglab mayda tovarning narxi va qoldig'ini yodda tutib bo'lmaydi." },
      { title: "Shtrix-kodsiz tovarlar", text: "Ko'p mahsulotda zavod shtrix-kodi yo'q — sotuvchi qidirib vaqt yo'qotadi." },
      { title: "Narxlar tez-tez o'zgaradi", text: "Ta'minotchi narxni oshirsa, yuzlab tovarni qo'lda yangilash kerak bo'ladi." },
      { title: "Optovikka qarz", text: "Qaysi ta'minotchiga qancha qarz va qachon to'lash kerakligi esdan chiqadi." },
    ],
    solutions: [
      { icon: "boxes", title: "Katta ro'yxat", text: "10 000 – 15 000 dan ortiq tovar ham to'liq ko'rinadi: ro'yxat qismlab yuklanadi, filtrlar sonlari bilan ko'rsatiladi." },
      { icon: "tag", title: "Shtrix-kod va yorliq", text: "Shtrix-kodi yo'q tovarga kod yaratiladi va narx yorlig'i chop etiladi. Bir tovarda bir nechta shtrix-kod bo'lishi mumkin." },
      { icon: "percent", title: "Narxlarni ommaviy o'zgartirish", text: "Filtrlangan yoki barcha tovarlar narxini foizga oshirish, kelish narxiga ustama qo'yish va yaxlitlash. Natija oldindan ko'rsatiladi, 7 kun ichida qaytarish mumkin." },
      { icon: "handshake", title: "Ta'minotchilar", text: "Kirim hujjati: to'liq, qisman yoki qarzga. Har bir ta'minotchi oldidagi qarz, muddati o'tganlar va Telegram orqali eslatma." },
      { icon: "undo-2", title: "Ta'minotchiga qaytarish", text: "Qaytarilgan tovar ombordan chiqadi, summa qarzdan ayiriladi yoki pul qaytarildi deb yoziladi." },
      { icon: "clipboard-check", title: "Inventarizatsiya", text: "Skaner bilan sanash: har skanerlashda +1. Farqni ko'rib, qoldiqni bir tugma bilan tuzatasiz." },
    ],
    features: [
      { title: "Savdo", items: [
        "Aksiya narxi va chek chegirmasi",
        "Qarzga sotish va eslatma",
        "Chek printeri yoki Telegram orqali chek",
      ] },
      { title: "Ombor", items: [
        "Tovar joylari va polkalar",
        "Kam qolgan tovar haqida ogohlantirish",
        "Excel'dan yuklash va eksport",
      ] },
    ],
    flow: {
      title: "Yangi partiya kelganda",
      steps: [
        { title: "Kirim", text: "Ta'minotchi nakladnoyi rasm yoki Excel'dan kiritiladi — qisman to'lov va muddat bilan." },
        { title: "Yorliq", text: "Yangi tovarlarga shtrix-kod yaratiladi va narx yorliqlari chop etiladi." },
        { title: "Narx", text: "Kelish narxi o'zgargan bo'lsa, sotuv narxlari ommaviy ustama bilan yangilanadi." },
        { title: "Savdo", text: "Sotuvchi tovarni skaner bilan qo'shadi, aksiyalar o'zi qo'llanadi." },
        { title: "To'lov muddati", text: "Ta'minotchiga to'lov muddati yaqinlashganda Telegram orqali eslatma keladi." },
      ],
    },
    faq: [
      { q: "Tovarlarni boshqa dasturdan ko'chirsa bo'ladimi?", a: "Ha, Excel orqali. Tovar nomi, narxlar, qoldiq va shtrix-kodlar ustunlardan taniladi." },
      { q: "Narx o'zgarishini bekor qilish mumkinmi?", a: "Ha. Ommaviy narx o'zgarishini 7 kun ichida bir bosishda qaytarish mumkin; shu orada qo'lda o'zgartirilgan tovarlarga tegilmaydi." },
    ],
    sections: ["ombor", "taminot", "savdo"],
  },

  {
    slug: "ombor", name: "Ombor va ulgurji savdo", icon: "warehouse", tone: "slate", fit: "general",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Bir nechta joy, ko'chirishlar, ta'minotchilar va ulgurji narxlar.",
      points: [
        { text: "20 tagacha joy: do'kon, ombor va boshqalar" },
        { text: "Joydan joyga ko'chirish jurnali" },
        { text: "Ulgurji va miqdorga qarab narx" },
        { text: "Katta buyurtmani to'xtamasdan yozish" },
      ],
    },
    seo: {
      title: "Ombor va ulgurji savdo uchun hisob tizimi",
      description: "Bir nechta ombor va joy, ko'chirishlar, ta'minotchilar, ulgurji va miqdorga qarab narx, buyurtmalar va inventarizatsiya — ombor va ulgurji savdo uchun Tizimchi.",
    },
    hero: {
      title: "Ombor qoldig'i va ulgurji savdoni bitta tizimda boshqaring.",
      lead: "Har bir tovarning har bir joydagi qoldig'i va polkasi, ko'chirishlar jurnali, ta'minotchilar bilan hisob-kitob va ulgurji narxlar. Katta buyurtmalar to'xtamasdan yoziladi.",
    },
    shots: { desktop: "d-ombor", phone: "p-hisobot" },
    pains: [
      { title: "Qaysi omborda qancha?", text: "Qoldiq bitta raqam bo'lib ko'rinadi, tovar esa bir nechta joyda turadi." },
      { title: "Ko'chirishlar izsiz", text: "Tovar ombordan do'konga olib o'tildi — kim, qachon va qancha ekanini hech kim bilmaydi." },
      { title: "Katta buyurtmani yozish", text: "Mijoz 30 xil tovarni aytadi, sotuvchi har birini qidirib vaqt yo'qotadi." },
      { title: "Ulgurji narxlar", text: "Har bir mijozga alohida narxni yodda tutishga to'g'ri keladi." },
    ],
    solutions: [
      { icon: "map-pin", title: "Joylar va polkalar", text: "Do'kon, ombor, uy va boshqa joylar — 20 tagacha. Sotuv asosiy joydan olinadi, yetmasa boshqa joylardan; sotuvchi joyni o'zi ham tanlay oladi." },
      { icon: "arrow-right-left", title: "Ko'chirish jurnali", text: "Joydan joyga ko'chirish va har bir tuzatish jurnalga yoziladi." },
      { icon: "list-ordered", title: "Tezkor buyurtma", text: "Qidirish → Enter → soni → Enter → keyingisi. Omborda yo'q tovar ham yoziladi, oldindan to'lov qabul qilinadi. Holatlar: Yangi → Tayyor → Berildi." },
      { icon: "badge-percent", title: "Ulgurji va pog'onali narx", text: "Ulgurji narx ulgurji mijoz tanlanganda o'zi qo'llanadi. Miqdorga qarab 3 tagacha narx pog'onasi." },
      { icon: "handshake", title: "Ta'minotchilar", text: "Kirim hujjati, ta'minotchi oldidagi qarz va muddatlar, tovar qaytarish va hisob-kitob varag'ini Telegramga yuborish." },
      { icon: "chart-pie", title: "Tovar tahlili", text: "Sotilmayotgan tovarlar va muzlagan pul, 2 hafta ichida tugaydiganlar va qancha buyurtma qilish kerakligi, ABC tahlil." },
    ],
    features: [
      { title: "Buyurtmalar", items: [
        "«Uydan yoki ombordan olib kelish» va «sotib olish kerak» ro'yxatlari alohida",
        "Buyurtma bir bosishda sotuvga o'tadi",
        "Chekni Telegramga yuborish",
      ] },
      { title: "Ombor", items: [
        "Inventarizatsiya: A4 sanoq varag'i yoki skaner bilan",
        "Excel'dan bir martada 1000 dan ortiq tovar yuklash",
        "Bir nechta qurilmada real vaqtda ishlash",
      ] },
    ],
    notes: ["Ulgurji narx va miqdorga qarab narx Sozlamalar → «Do'kon turi va funksiyalar» bo'limida yoqiladi."],
    limits: ["Yirik logistika omborlari uchun yacheykali manzilli saqlash, terish (picking) va transport logistikasi kabi WMS funksiyalari"],
    flow: {
      title: "Ulgurji buyurtma",
      steps: [
        { title: "Qabul", text: "Mijoz telefonda ro'yxatni aytadi — sotuvchi to'xtamasdan yozadi va oldindan to'lov qabul qiladi." },
        { title: "Yig'ish", text: "Buyurtmada qaysi tovar qaysi joydan olinishi va nimani sotib olish kerakligi alohida ro'yxatda." },
        { title: "Tayyor", text: "Buyurtma «Tayyor» holatiga o'tadi." },
        { title: "Berish", text: "Mijoz kelganda buyurtma bir bosishda sotuvga aylanadi — qoldiq va qarz o'zi yangilanadi." },
      ],
    },
    faq: [
      { q: "Bir nechta ombor bo'lsa, qoldiq qanday hisoblanadi?", a: "Har bir tovarning har bir joydagi soni alohida hisoblanadi; umumiy qoldiq — ularning yig'indisi." },
      { q: "Ulgurji mijozlarga alohida narx bera olamanmi?", a: "Ha. Tovarga ulgurji narx yoziladi va ulgurji mijoz tanlanganda kassada o'zi qo'llanadi." },
    ],
    sections: ["ombor", "taminot", "savdo", "hisobot"],
  },

  {
    slug: "mehmonxona", name: "Mehmonxona", icon: "hotel", tone: "purple", fit: "partial",
    demo: { query: "?restoran=1", label: "Restoran demosini ochish" },
    card: {
      text: "Restoran, bar va do'kon qismi hamda ichki zaxiralar uchun.",
      points: [
        { text: "Mehmonxona restorani, kafesi yoki bari uchun restoran moduli" },
        { text: "Minibar, do'kon va xo'jalik zaxiralari hisobi" },
        { text: "Xodimlar, ruxsatlar va xarajatlar" },
        { text: "Xonalarni bron qilish moduli yo'q", ok: false },
      ],
    },
    seo: {
      title: "Mehmonxona uchun restoran va zaxira hisobi",
      description: "Mehmonxonaning restorani, bari, do'koni va ichki zaxiralarini yuritish uchun Tizimchi. Xonalarni bron qilish moduli hozircha mavjud emas.",
    },
    hero: {
      title: "Mehmonxonangizning savdo va zaxira qismini tartibga soling.",
      lead: "Tizimchi mehmonxonaning restorani, bari, do'koni va ichki zaxiralarini yuritishga yordam beradi. Xonalarni bron qilish va mehmonlarni joylashtirish moduli hozircha yo'q — ehtiyojingizni birga muhokama qilamiz.",
    },
    shots: { desktop: "d-rest-zal", phone: "p-rest-ofitsiant" },
    pains: [
      { title: "Restoran va bar hisobi", text: "Mehmonxona restoranidagi buyurtmalar va to'lovlar qog'ozda yoki tarqoq dasturlarda yuritiladi." },
      { title: "Zaxiralar nazorati", text: "Gigiyena vositalari va minibar mahsulotlari qachon va qancha sarflangani noma'lum." },
      { title: "Xodimlar mas'uliyati", text: "Kim qaysi amalni bajarganini aniqlash qiyin." },
      { title: "Xarajatlar tarqoq", text: "Ijara, oylik va boshqa xarajatlar sof foydaga qanday ta'sir qilishi ko'rinmaydi." },
    ],
    solutions: [
      { icon: "utensils", title: "Restoran va bar", text: "Mehmonxona restorani, kafesi yoki bari uchun to'liq restoran moduli: zal, oshxona ekrani, menyu, ofitsiantlar va hisobot." },
      { icon: "package", title: "Zaxiralar va minibar", text: "Xo'jalik zaxiralari va minibar mahsulotlari omborda: kirim, sarf, kam qolgan ogohlantirishi va joylar bo'yicha qoldiq." },
      { icon: "store", title: "Do'kon", text: "Mehmonxona do'konidagi savdo: shtrix-kod, chek va to'lov turlari." },
      { icon: "user-cog", title: "Xodimlar va ruxsatlar", text: "Har bir xodimga alohida login va ruxsatlar; muhim amallar jurnalga yoziladi." },
      { icon: "chart-column", title: "Xarajatlar va hisobot", text: "Ijara, oylik va boshqa xarajatlar sof foydaga avtomatik ta'sir qiladi." },
    ],
    features: [
      { title: "Bugun ishlaydi", items: [
        "Restoran moduli: zal, oshxona ekrani, menyu, ofitsiantlar",
        "Ombor va joylar bo'yicha qoldiq",
        "Savdo, chek va to'lov turlari",
        "Xarajatlar va hisobot",
      ] },
    ],
    limits: [
      "Xonalarni bron qilish va xonalar jadvali",
      "Mehmonlarni joylashtirish (check-in va check-out)",
      "Booking va boshqa bron platformalari bilan integratsiya",
      "Restoran hisobini mehmon xonasi hisobiga yozish",
    ],
    flow: {
      title: "Mehmonxona restoranida",
      steps: [
        { title: "Buyurtma", text: "Ofitsiant restoran yoki terrasa stolidan buyurtma oladi." },
        { title: "Oshxona", text: "Taom oshxona ekraniga, ichimlik esa bar ekraniga tushadi." },
        { title: "To'lov", text: "Mehmon naqd, karta yoki o'tkazma orqali to'laydi." },
        { title: "Hisobot", text: "Kun oxirida tushum, ingredientlar sarfi va yalpi foyda ko'rinadi." },
      ],
    },
    faq: [
      { q: "Xonalarni bron qilish bormi?", a: "Hozircha yo'q. Tizimchi mehmonxonaning savdo, restoran va zaxira qismini yuritadi. Bron bo'yicha ehtiyojingizni demo so'rovida yozib qoldiring — birga muhokama qilamiz." },
      { q: "Restoran moduli mehmonxona uchun yetarlimi?", a: "Mehmonxona restorani, kafesi yoki bari uchun to'liq ishlaydi. Faqat hisobni mehmon xonasi hisobiga yozish imkoniyati yo'q." },
    ],
    sections: ["restoran", "ombor", "xodimlar", "hisobot"],
  },

  {
    slug: "oquv-markazi", name: "O'quv markazi", icon: "graduation-cap", tone: "sky", fit: "partial",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "To'lovlar va qarzlar, kitob va materiallar savdosi, xarajatlar.",
      points: [
        { text: "Kurs to'lovlari va qarzlarni hisobga olish" },
        { text: "Kitob va o'quv materiallari savdosi" },
        { text: "Xarajatlar va sof foyda" },
        { text: "Guruhlar, dars jadvali va davomat moduli yo'q", ok: false },
      ],
    },
    seo: {
      title: "O'quv markazi uchun to'lovlar va moliya hisobi",
      description: "O'quv markazining to'lovlari, qarzlari, materiallar savdosi va xarajatlarini yuritish uchun Tizimchi. Guruhlar, dars jadvali va davomat moduli hozircha mavjud emas.",
    },
    hero: {
      title: "O'quv markazingizning to'lovlari va moliyasini tizimli boshqaring.",
      lead: "Kurs to'lovlari va qarzlar, kitob va materiallar savdosi, xarajatlar va sof foyda — bir joyda. O'quvchilar guruhlari, dars jadvali va davomat moduli hozircha yo'q; bu ehtiyojni demo vaqtida aniqlashtiramiz.",
    },
    shots: { desktop: "d-mijozlar", phone: "p-mijozlar" },
    pains: [
      { title: "To'lovlar daftarda", text: "Kim to'lagani va kim kechikkani noaniq — ota-onalar bilan kelishmovchilik chiqadi." },
      { title: "Qarzni eslatish noqulay", text: "Har oy qo'ng'iroq qilib to'lovni so'rash vaqt va asab talab qiladi." },
      { title: "Xarajatlar tarqoq", text: "Ijara, o'qituvchilar oyligi va materiallar sof foydaga qanday ta'sir qilishi ko'rinmaydi." },
      { title: "Materiallar zaxirasi", text: "Kitob va daftarlar qachon tugashini oldindan bilmaysiz." },
    ],
    solutions: [
      { icon: "wallet", title: "To'lovlar va qarzlar", text: "Kurs to'lovini xizmat sifatida yozib, qarzga sotish mumkin: qarz necha kundan beri turgani va muddati o'tganlar ko'rinadi." },
      { icon: "send", title: "Telegram orqali eslatma", text: "Ota-ona yoki o'quvchi botga ulangan bo'lsa, qarz eslatmasi Telegram orqali bepul boradi." },
      { icon: "book-open", title: "Materiallar savdosi", text: "Kitob, daftar va boshqa materiallar ombori: qoldiq, kirim va kam qolgan tovar ogohlantirishi." },
      { icon: "chart-column", title: "Xarajatlar va hisobot", text: "Ijara, oylik va boshqa xarajatlar sof foydaga avtomatik ta'sir qiladi; istalgan davr uchun Excel." },
    ],
    features: [
      { title: "Bugun ishlaydi", items: [
        "Mijozlar (o'quvchi yoki ota-ona) va qarzlar hisobi",
        "Xizmatlarni kassada bir bosishda qo'shish",
        "Materiallar ombori va savdosi",
        "Xodimlar va ruxsatlar",
      ] },
    ],
    limits: [
      "O'quvchilar guruhlari va dars jadvali",
      "Davomat va baholash",
      "O'qituvchilar oyligini avtomatik hisoblash",
      "Oylik to'lovlarni avtomatik hisoblab qo'yish (abonement)",
    ],
    notes: ["Bu sohada Tizimchi moslashtirilgan holda ishlatiladi — demo vaqtida jarayoningizga qanchalik mos kelishini birga tekshiramiz."],
    flow: {
      title: "Oylik to'lov",
      steps: [
        { title: "Yozish", text: "Administrator oy boshida o'quvchiga kurs to'lovini xizmat sifatida qarzga yozadi." },
        { title: "Eslatma", text: "To'lanmasa, belgilangan kundan keyin eslatma Telegram orqali boradi." },
        { title: "To'lov", text: "O'quvchi to'laganda to'lov qabul qilinadi va qarz kamayadi." },
        { title: "Hisobot", text: "Oy oxirida tushum, xarajatlar va sof foyda ko'rinadi." },
      ],
    },
    faq: [
      { q: "O'quvchilar ro'yxati va guruhlar bormi?", a: "Alohida guruh va dars jadvali moduli yo'q. O'quvchilar mijozlar sifatida yuritiladi — to'lov va qarzlar shu orqali hisoblanadi." },
      { q: "Davomatni belgilash mumkinmi?", a: "Hozircha yo'q." },
    ],
    sections: ["mijozlar", "savdo", "hisobot"],
  },

  {
    slug: "boshqa", name: "Boshqa bizneslar", icon: "layout-grid", tone: "gray", fit: "general",
    demo: { query: "", label: "Demo do'konni ochish" },
    card: {
      text: "Kiyim, kosmetika, elektronika, gul do'koni va boshqa savdo bizneslari.",
      points: [
        { text: "Umumiy savdo, ombor va qarzlar hisobi" },
        { text: "Do'kon turi tanlanganda kerakli funksiyalar yoqiladi" },
        { text: "Funksiyalarni alohida yoqish va o'chirish" },
        { text: "14 kun bepul sinab ko'rish" },
      ],
    },
    seo: {
      title: "Savdo va xizmat bizneslari uchun Tizimchi",
      description: "Kiyim, kosmetika, elektronika va boshqa savdo bizneslari uchun savdo, ombor, qarzlar va hisobot. Biznesingizga mos kelishini demo vaqtida aniqlaymiz.",
    },
    hero: {
      title: "Biznesingiz ro'yxatda yo'qmi? Moslikni birga tekshiramiz.",
      lead: "Tizimchining savdo, ombor, qarzlar va hisobot imkoniyatlari ko'pchilik savdo va xizmat bizneslariga mos keladi. Kerakli funksiyalar do'kon turiga qarab yoqiladi va alohida ham sozlanadi.",
    },
    shots: { desktop: "d-savdo", phone: "p-hisobot" },
    pains: [
      { title: "Hisob tarqoq", text: "Savdo, qoldiq va qarzlar daftar, Excel va xotirada yuritiladi." },
      { title: "Nazorat qiyin", text: "Egasi do'konda bo'lmasa, kun qanday o'tganini bilmaydi." },
      { title: "Qarzlar unutiladi", text: "Doimiy mijozlarning qarzi to'planib boradi." },
      { title: "Foyda noma'lum", text: "Xarajatlardan keyin qancha qolgani aniq emas." },
    ],
    solutions: [
      { icon: "shopping-cart", title: "Savdo", text: "Tezkor kassa, chek, qaytarish va buyurtmalar." },
      { icon: "package", title: "Ombor", text: "Qoldiq, kirim, joylar, inventarizatsiya va Excel." },
      { icon: "wallet", title: "Mijozlar va qarzlar", text: "Qarzlar, muddatlar va Telegram orqali eslatma." },
      { icon: "chart-column", title: "Hisobot", text: "Tushum, foyda, xarajatlar va tovar tahlili." },
      { icon: "send", title: "Telegram bot", text: "Kunlik hisobot egasining telefoniga keladi." },
      { icon: "settings", title: "Moslashuvchan funksiyalar", text: "Shtrix-kod, tarozi, muddat, aksiyalar, ikki birlik, ulgurji narx — keraklisini yoqasiz." },
    ],
    features: [
      { title: "Ilovadagi do'kon turlari", items: [
        "Avto ehtiyot qismlar",
        "Oziq-ovqat, market",
        "Qurilish mollari",
        "Dorixona",
        "Restoran, kafe",
        "Boshqa do'kon: kiyim, kosmetika, maishiy tovarlar",
      ] },
    ],
    flow: {
      title: "Qanday boshlaymiz",
      steps: [
        { title: "So'rov", text: "Biznesingiz va jarayonlaringiz haqida qisqacha yozasiz." },
        { title: "Demo", text: "Sizga mos funksiyalarni ko'rsatamiz va savollaringizga javob beramiz." },
        { title: "Sinov", text: "14 kun bepul sinab ko'rasiz." },
        { title: "Ishga tushirish", text: "Tovarlarni Excel orqali yuklab, ishni boshlaysiz." },
      ],
    },
    faq: [
      { q: "Xizmat ko'rsatish biznesi uchun mosmi?", a: "Savdo va qarz hisobi kerak bo'lsa — ha: xizmatlar kassada bir bosishda qo'shiladi. Navbat yoki onlayn yozilish (bron) moduli yo'q." },
    ],
    sections: ["savdo", "ombor", "mijozlar", "hisobot"],
  },
];
