// @ts-check
/* Huquqiy hujjatlar: maxfiylik siyosati va ommaviy oferta (o'zbekcha).
   Manba — Tizimchi ilovasidagi matn (web/js/legal.js) + saytdagi demo so'rovi bandlari (2.7, 3.6, 5.3).
   Ilovadagi matn o'zgarsa, bu yerni ham yangilang va site.config.mjs → LEGAL.UPDATED sanasini o'zgartiring.
   Rekvizitlar (Ijrochi, STIR, manzil) — site.config.mjs → LEGAL. */

/** @typedef {{ title: string, lead: string, sections: [string, string[]][] }} LegalDoc */

/** @type {{ maxfiylik: LegalDoc, oferta: LegalDoc }} */
export const LEGAL_DOCS = {
  maxfiylik: {
    title: "Maxfiylik siyosati",
    lead: "Tizimchi platformasida shaxsiy ma'lumotlar qanday yig'iladi, saqlanadi va himoya qilinadi",
    sections: [
      ["1. Umumiy qoidalar", [
        "1.1. Ushbu siyosat Tizimchi platformasi (veb-sayt, kompyuter va telefon ilovalari) foydalanuvchilari ma'lumotlariga qanday ishlov berilishini tushuntiradi va O'zbekiston Respublikasining «Shaxsga doir ma'lumotlar to'g'risida»gi Qonuniga muvofiq tuzilgan.",
        "1.2. Platformadan foydalanish orqali Foydalanuvchi ushbu siyosat shartlariga rozilik bildiradi.",
      ]],
      ["2. Qanday ma'lumotlar yig'iladi", [
        "2.1. Hisob ma'lumotlari: do'kon nomi, egasining ismi, telefon raqami, login. Parol ochiq holda saqlanmaydi — faqat uning qaytarib bo'lmaydigan shifrlangan ko'rinishi (xesh).",
        "2.2. Do'kon ma'lumotlari: tovarlar, narxlar, qoldiqlar, sotuvlar, buyurtmalar, ta'minotchilar, xarajatlar va hisobotlar.",
        "2.3. Do'kon mijozlari haqidagi ma'lumotlar: ism, telefon raqami, qarz summalari. Bu ma'lumotlarni do'kon o'zi kiritadi va ularni kiritish uchun mijozlardan rozilik olishga javobgar; platforma ularga faqat do'kon topshirig'i bilan ishlov beradi.",
        "2.4. Telegram: ro'yxatdan o'tishda telefon raqami Telegram bot orqali tasdiqlanadi; bot ulanganda — Telegram chat identifikatori va foydalanuvchi nomi.",
        "2.4.1. Bank kartasi (avtomatik uzaytirish yoqilsa): faqat to'lov tizimi bergan belgi va yashirilgan raqam (masalan, 8600 **** **** 1234). To'liq karta raqami Ijrochida saqlanmaydi.",
        "2.5. Texnik ma'lumotlar: kirish vaqti, qurilma va brauzer turi, xatolar jurnali, muhim amallar jurnali (masalan, o'chirish va narx o'zgartirish).",
        "2.6. AI so'rovlari: AI yordamchiga yuborilgan matn, rasm va fayllar.",
        "2.7. Saytdagi demo so'rovi (tizimchi.com): ism, telefon raqami, biznes turi, ixtiyoriy ravishda biznes nomi va izoh. Spam'dan himoya uchun IP manzilning o'zi emas, faqat undan hisoblangan qaytarib bo'lmaydigan kod saqlanadi.",
      ]],
      ["3. Ma'lumotlardan foydalanish maqsadlari", [
        "3.1. Platforma xizmatlarini ko'rsatish: savdo va ombor hisobi, qurilmalar o'rtasida sinxronlash, hisobotlar.",
        "3.2. Do'kon sozlamasiga ko'ra qarzdor mijozlarga Telegram yoki SMS orqali eslatma yuborish.",
        "3.3. Obuna to'lovlarini qabul qilish, yordam ko'rsatish, xavfsizlikni ta'minlash va xatolarni tuzatish.",
        "3.4. Platformani yaxshilash (umumlashtirilgan, shaxsni aniqlab bo'lmaydigan statistika asosida).",
        "3.5. Ma'lumotlar reklama uchun ishlatilmaydi va sotilmaydi.",
        "3.6. Saytdagi demo so'roviga javob berish: siz bilan bog'lanish va biznesingizga mos imkoniyatlarni ko'rsatish.",
      ]],
      ["4. Uchinchi tomonlar", [
        "4.1. Xizmatni ko'rsatish uchun ma'lumotlar faqat zarur hajmda quyidagi ishonchli xizmatlar orqali ishlov beriladi: ma'lumotlar bazasi va server (Supabase), veb-xosting, AI (Google Gemini), Telegram, SMS-provayder (yoqilgan bo'lsa), to'lov tizimlari (Payme, Click).",
        "4.2. Ma'lumotlar davlat organlariga faqat qonunda belgilangan hollarda va tartibda beriladi.",
      ]],
      ["5. Saqlash joyi va muddati", [
        "5.1. Ma'lumotlar himoyalangan bulut serverlarida saqlanadi. Ijrochi shaxsga doir ma'lumotlarni saqlash joyiga oid O'zbekiston Respublikasi qonunchiligi talablariga rioya qilish choralarini ko'radi.",
        "5.2. Ma'lumotlar hisob faol bo'lgan davrda va obuna tugaganidan keyin kamida 90 kun saqlanadi. Zaxira nusxalar 30 kungacha, texnik jurnallar 90 kungacha saqlanadi.",
        "5.3. Saytdagi demo so'rovlari 12 oy saqlanadi, so'ng avtomatik o'chiriladi. O'chirishni bundan oldin ham so'rashingiz mumkin (7-bo'lim).",
      ]],
      ["6. Xavfsizlik", [
        "6.1. Barcha ulanishlar shifrlangan (HTTPS).",
        "6.2. Har bir do'kon faqat o'z ma'lumotlarini ko'radi — bu ma'lumotlar bazasi darajasida (qator darajasidagi himoya) ta'minlanadi.",
        "6.3. Ikki bosqichli himoya (2FA), sotuvchilar uchun cheklangan huquqlar, muhim amallar jurnali va shifrlangan zaxira nusxalar qo'llanadi.",
      ]],
      ["7. Foydalanuvchi huquqlari", [
        "7.1. Foydalanuvchi o'z ma'lumotlari bilan tanishish, ularni to'g'rilash, Excel faylga yuklab olish va o'chirishni so'rash huquqiga ega.",
        "7.2. So'rovlar yordam xizmatiga (telefon yoki Telegram) yuboriladi va 10 ish kuni ichida ko'rib chiqiladi.",
        "7.3. Foydalanuvchi rozilikni qaytarib olishi va vakolatli davlat organiga shikoyat qilishi mumkin.",
      ]],
      ["8. Qurilmadagi ma'lumotlar", [
        "8.1. Internetsiz ishlash uchun ilova sessiya, sozlamalar va oxirgi ma'lumotlarni qurilmaning o'zida (brauzer xotirasida) saqlaydi. Reklama kuzatuvchilari (trekerlar) ishlatilmaydi.",
        "8.2. Umumiy kompyuterda ishlaganda ishni tugatgach «Chiqish» tugmasini bosing.",
      ]],
      ["9. Voyaga yetmaganlar", [
        "9.1. Platforma biznes uchun mo'ljallangan va 18 yoshga to'lmagan shaxslar uchun emas.",
      ]],
      ["10. O'zgartirishlar", [
        "10.1. Siyosatga o'zgartirish kiritilishi mumkin. Yangi tahrir shu sahifada e'lon qilinadi va e'lon qilingan kundan kuchga kiradi.",
      ]],
    ],
  },
  oferta: {
    title: "Ommaviy oferta",
    lead: "Tizimchi platformasidan foydalanish shartlari (obuna shartnomasi)",
    sections: [
      ["1. Umumiy qoidalar", [
        "1.1. Ushbu hujjat Tizimchi platformasi egasi (bundan buyon — «Ijrochi») tomonidan har qanday shaxsga (bundan buyon — «Foydalanuvchi») qaratilgan rasmiy taklif bo'lib, O'zbekiston Respublikasi Fuqarolik kodeksiga muvofiq ommaviy oferta hisoblanadi.",
        "1.2. Foydalanuvchi platformada hisob ochgan, unga birinchi marta kirgan yoki obuna uchun to'lov qilgan paytdan boshlab ushbu oferta shartlarini to'liq va so'zsiz qabul qilgan (aksept) hisoblanadi.",
        "1.3. Atamalar: «Platforma» — Tizimchi savdo va ombor hisobi dasturi (veb-sayt, kompyuter va telefon ilovalari); «Hisob» — Foydalanuvchining login va paroli bilan kiriladigan shaxsiy bo'limi; «Obuna» — platformadan tanlangan tarif bo'yicha pullik foydalanish muddati; «Sinov davri» — bepul tanishish muddati.",
      ]],
      ["2. Shartnoma predmeti", [
        "2.1. Ijrochi Foydalanuvchiga platformadan internet orqali (SaaS) tanlangan tarif doirasida foydalanish huquqini beradi, Foydalanuvchi esa obuna haqini to'laydi.",
        "2.2. Platforma «boricha» taqdim etiladi. Ijrochi platformani doimiy yaxshilab boradi va funksiyalarni o'zgartirish, qo'shish yoki olib tashlash huquqiga ega.",
      ]],
      ["3. Hisob va xavfsizlik", [
        "3.1. Hisobni Foydalanuvchi ilovada o'zi ochadi: telefon raqami Telegram bot orqali tasdiqlanadi va parol o'rnatiladi. Hisobni Ijrochi (administrator) ham ochishi mumkin. Foydalanuvchi o'z sotuvchilari uchun qo'shimcha hisoblar ochishi mumkin.",
        "3.2. Foydalanuvchi login va parolni sir saqlashi shart. Hisob orqali qilingan barcha amallar uchun Foydalanuvchi javobgar. Ikki bosqichli himoyani (2FA) yoqish tavsiya etiladi.",
        "3.3. Hisobga ruxsatsiz kirilganiga shubha bo'lsa, Foydalanuvchi darhol parolni o'zgartirishi va Ijrochiga xabar berishi kerak.",
      ]],
      ["4. Sinov davri", [
        "4.1. Yangi Foydalanuvchiga odatda 14 kunlik bepul sinov davri beriladi. Sinov davrida ayrim limitlar (sotuvchilar soni, AI so'rovlari) cheklangan bo'lishi mumkin.",
        "4.2. Sinov davri tugagach, obuna to'lanmaguncha platformadan foydalanish cheklanadi. Kiritilgan ma'lumotlar saqlanib qoladi.",
      ]],
      ["5. Tariflar va to'lov", [
        "5.1. Tariflar va narxlar platformaning «Obuna» bo'limida ko'rsatilgan. Obuna 1, 3, 6 yoki 12 oyga oldindan to'lanadi; uzoq muddatga to'lovda chegirma beriladi.",
        "5.2. To'lov Payme, Click, naqd pul yoki bank o'tkazmasi orqali amalga oshiriladi. To'lov mablag' Ijrochiga kelib tushgan paytdan boshlab amalga oshirilgan hisoblanadi va obuna muddati avtomatik uzaytiriladi.",
        "5.3. Ijrochi narxlarni o'zgartirishi mumkin. Yangi narxlar kamida 10 kun oldin e'lon qilinadi va allaqachon to'langan muddatga ta'sir qilmaydi.",
        "5.4. Avtomatik uzaytirish. Foydalanuvchi bank kartasini ulab, avtomatik uzaytirishni yoqishi mumkin. Bunda obuna muddati tugaganda tanlangan tarif summasi kartadan avtomatik yechiladi; bu haqda 3 kun oldin Telegram orqali xabar beriladi. Avtomatik uzaytirishni va kartani ilovada istalgan vaqtda o'chirish mumkin. Karta ma'lumotlari to'lov tizimi (Payme) tomonida saqlanadi — Ijrochi karta raqamini saqlamaydi.",
        "5.5. To'liq dastur (muddatsiz litsenziya). Foydalanuvchi bir martalik to'lov bilan platformadan muddat cheklovisiz foydalanish huquqini sotib olishi mumkin. Huquq bitta do'kon (hisob) uchun beriladi, boshqa shaxsga o'tkazilmaydi va platforma ishlab turgan butun davr davomida amal qiladi. Yangilanishlar, zaxira nusxa va yordam shu narxga kiradi. Xodimlar soni, AI so'rovlari va SMS limitlari tarifda ko'rsatilgan miqdorda saqlanadi.",
      ]],
      ["6. Pulni qaytarish", [
        "6.1. To'langan obuna muddati uchun pul qaytarilmaydi, bundan 6.2-band mustasno.",
        "6.2. Agar platforma Ijrochining aybi bilan ketma-ket 3 kundan ortiq ishlamasa, obuna muddati shu kunlar soniga bepul uzaytiriladi yoki Foydalanuvchi talabiga ko'ra ishlamagan kunlar uchun mutanosib summa qaytariladi.",
      ]],
      ["7. Do'stlarni taklif qilish dasturi", [
        "7.1. Har bir do'kon egasiga shaxsiy promokod beriladi.",
        "7.2. Promokod bilan ro'yxatdan o'tgan yangi do'kon birinchi marta pullik obuna sotib olganda, taklif qilgan Foydalanuvchining obunasiga 1 (bir) oy bepul qo'shiladi. Har bir yangi do'kon uchun bonus bir marta beriladi; bonuslar soni cheklanmagan.",
        "7.3. Bonus pulga almashtirilmaydi va boshqa shaxsga o'tkazilmaydi. O'zini o'zi taklif qilish, soxta hisoblar yaratish yoki boshqa suiiste'mol aniqlansa, Ijrochi bonuslarni bekor qilish huquqiga ega.",
      ]],
      ["8. Tomonlarning huquq va majburiyatlari", [
        "8.1. Ijrochi: platformaning uzluksiz ishlashini ta'minlashga harakat qiladi; ma'lumotlarning zaxira nusxasini muntazam oladi; Foydalanuvchiga telefon va Telegram orqali yordam beradi; rejali texnik ishlar haqida oldindan xabar beradi.",
        "8.2. Ijrochi obuna to'lanmaganda yoki ushbu oferta qo'pol buzilganda hisobni vaqtincha to'xtatib qo'yishi mumkin.",
        "8.3. Foydalanuvchi: platformadan qonunga muvofiq foydalanadi; platformani buzishga, boshqa hisoblarga kirishga yoki uni qayta sotishga urinmaydi; kiritgan ma'lumotlarining to'g'riligi uchun javob beradi.",
        "8.4. Foydalanuvchi o'z mijozlarining shaxsiy ma'lumotlarini (ism, telefon) platformaga kiritishdan oldin ularning roziligini olishi shart.",
        "8.5. Platforma chiqaradigan chek va nakladnoylar soliq (fiskal) cheki hisoblanmaydi. Foydalanuvchi soliq qonunchiligiga muvofiq onlayn nazorat-kassa mashinasi (virtual kassa) dan mustaqil foydalanadi.",
      ]],
      ["9. Ma'lumotlar", [
        "9.1. Foydalanuvchi platformaga kiritgan ma'lumotlar (tovarlar, sotuvlar, mijozlar va boshqalar) Foydalanuvchiga tegishli. Foydalanuvchi ularni istalgan vaqtda Excel faylga yuklab olishi mumkin.",
        "9.2. Obuna tugaganidan keyin ma'lumotlar kamida 90 kun saqlanadi, so'ng Foydalanuvchi so'roviga yoki Ijrochi qaroriga ko'ra o'chirilishi mumkin.",
        "9.3. Shaxsiy ma'lumotlarga ishlov berish Maxfiylik siyosatiga muvofiq amalga oshiriladi.",
      ]],
      ["10. Sun'iy intellekt (AI) funksiyalari", [
        "10.1. AI yordamchi va AI orqali hujjat o'qish natijalari xato bo'lishi mumkin. Foydalanuvchi natijalarni saqlashdan oldin tekshiradi.",
        "10.2. AI so'rovlari uchinchi tomon xizmati (Google Gemini) orqali qayta ishlanadi.",
      ]],
      ["11. Javobgarlik", [
        "11.1. Ijrochining javobgarligi Foydalanuvchi oxirgi 1 oy uchun to'lagan obuna summasi bilan cheklanadi.",
        "11.2. Ijrochi bilvosita zarar va boy berilgan foyda, internet yoki elektr uzilishi, Foydalanuvchi xatosi, shuningdek uchinchi tomon xizmatlari (Telegram, to'lov tizimlari, aloqa operatorlari) ishidagi uzilishlar uchun javob bermaydi.",
      ]],
      ["12. Fors-major", [
        "12.1. Tomonlar yengib bo'lmaydigan kuch holatlari (tabiiy ofat, urush, davlat organlari qarorlari, keng ko'lamli aloqa uzilishi va h.k.) tufayli majburiyatlarni bajarmaganlik uchun javobgar emas.",
      ]],
      ["13. Nizolarni hal qilish", [
        "13.1. Nizolar muzokara yo'li bilan hal qilinadi. Da'volar yozma ravishda (jumladan Telegram orqali) yuboriladi va 10 ish kuni ichida ko'rib chiqiladi.",
        "13.2. Kelishuvga erishilmasa, nizo O'zbekiston Respublikasi qonunchiligiga muvofiq sudda hal qilinadi.",
      ]],
      ["14. Amal qilish muddati va o'zgartirish", [
        "14.1. Shartnoma aksept qilingan paytdan kuchga kiradi va tomonlardan biri uni bekor qilgunicha amal qiladi. Foydalanuvchi platformadan foydalanishni istalgan vaqtda to'xtatishi mumkin.",
        "14.2. Ijrochi ofertaga o'zgartirish kiritishi mumkin. Yangi tahrir shu sahifada e'lon qilinadi; e'lon qilingandan keyin platformadan foydalanishni davom ettirish yangi tahrirni qabul qilish hisoblanadi.",
      ]],
    ],
  },
};
