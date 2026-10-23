# tizimchi_sayt — tizimchi.com sayti

Tizimchi platformasining sayti va uning backend'i — **alohida, mustaqil loyiha** (ilova loyihasiga bog'liq emas):

- **frontend/** — sayt: bosh sahifa, 11 ta biznes turi, imkoniyatlar, video qo'llanmalar, ilovani yuklab olish (Windows dasturi,
  Android ilovasi, iPhone, macOS/Linux),
  aloqa va demo so'rovi, maxfiylik siyosati, oferta;
  **/admin/** — sayt boshqaruvi (video qo'llanmalar, demo so'rovlari, Telegram bildirishnomalari).
- **backend/** — Supabase (bepul tarif): `schema.sql` — jadvallar, himoya, funksiyalar. O'rnatish: [backend/README.md](backend/README.md).

Ilova (Tizimchi) alohida qoladi — sayt unga faqat havola beradi: «Tizimga kirish», «Bepul sinab ko'rish», «Jonli demo», «Ilovani o'rnatish» (`APP_URL`).

**Texnologiya:** bog'liqliksiz Node skript har bir sahifani tayyor HTML qilib yig'adi (SEO uchun); brauzerda kichik ES-modullar.
Framework va CDN yo'q. Qat'iy CSP (`script-src 'self'`, inline skript va stil yo'q). YouTube faqat bosilganda, `youtube-nocookie.com` orqali.

## Tuzilma

```
frontend/
  site.config.mjs        Sozlamalar: sayt va ilova manzili, backend (Supabase), aloqa, rekvizitlar
  content/               Barcha matnlar — kodga tegmasdan tahrirlanadi
    industries.mjs         11 ta biznes turi: kartochka va sahifa matni, «Hozircha mavjud emas», FAQ
    capabilities.mjs       Imkoniyatlar sahifasi (bo'limlar → imkoniyatlar)
    home.mjs, faq.mjs      Bosh sahifa, interaktiv tur, umumiy savollar
    legal.mjs              Maxfiylik siyosati va ommaviy oferta
    taxonomy.mjs           Biznes turi va bo'lim kodlari (backend/schema.sql bilan bir xil — test tekshiradi)
    shots.mjs              Ekran kadrlari ro'yxati va alt matnlari
    tutorials.json         Video qo'llanmalar ro'yxati backend'siz (npm run video yozadi; backend ulanmagan bo'lsa ishlatiladi)
    downloads.json         Yuklab olish fayllari: versiya, hajm, SHA-256, imzo (npm run yuklab yozadi)
  src/build/             Sahifa shablonlari (Node): layout, komponentlar, sahifalar, forma, /admin/ qobig'i
  src/client/            Brauzer kodi: main.js (sayt), admin.js (boshqaruv), tutorials.js (build bilan umumiy), util.js
  src/styles/            Dizayn tizimi: tokens → base → components → sections → pages; admin.css
  assets/                Shrift (Inter, OFL), ikonkalar (Lucide, ISC), ekran kadrlari, OG rasmlar, logotip
backend/
  schema.sql             Supabase: jadvallar, RLS, funksiyalar, Telegram (pg_net)
  README.md              O'rnatish yo'riqnomasi
scripts/                 build.mjs (yig'ish), dev.mjs (lokal server), assets.mjs (shrift va ikonkalarni yangilash)
tools/                   shots.mjs (ilova ekranlari), og.mjs (ijtimoiy tarmoq rasmlari), video.mjs (videolaringizni qo'shish), yuklab.mjs (o'rnatgichlar)
tests/                   build, backend (PGlite) va brauzer testlari
deploy/                  O'z serveringiz (VPS): Caddyfile (shablon), deploy-vps.sh (joylash), server/ (ilova manzili taymeri)
dist/                    Production build — hostingga SHU papka yuklanadi (git'ga tushmaydi)
media/                   Video qo'llanmalaringiz fayllari — npm run video yaratadi, deploy-vps.sh serverga yuklaydi (git'ga tushmaydi)
yuklab/                  Windows o'rnatgichi va Android ilovasi — npm run yuklab nusxalaydi, deploy-vps.sh yuklaydi (git'ga tushmaydi)
```

## Ishga tushirish

Kerak: **Node.js 20+** (nodejs.org → LTS).

```powershell
npm install          # bir marta (faqat testlar va vositalar uchun paketlar; build'ning o'zi paketsiz)
npm run dev          # lokal ko'rinish: http://localhost:5600 (o'zgarishda o'zi yangilanadi), boshqaruv: /admin/
npm run build        # production → dist/ (hostingga shu papka yuklanadi)
npm run preview      # dist/ ni lokal ko'rish (forma haqiqiy backend'ga yuboradi)
npm test             # barcha testlar
```

`npm run dev` da demo forma **sinov rejimida** (so'rov hech qayerga ketmaydi, tepada «Lokal ko'rinish» belgisi) va `.dev-dist/` ga yig'iladi — uni serverga yuklamang.
Namunaviy video qo'llanmalar bilan ko'rish: `npm run dev -- --tutorials=tests/fixtures/tutorials.json` (namunadagi videolar o'ynamaydi).

**VS Code «Go Live»** (Live Server kengaytmasi): bu papkani VS Code'da oching (*File → Open Folder*), `npm run build`, so'ng pastdagi **Go Live** —
`http://127.0.0.1:5500/` da `dist/` ochiladi (`.vscode/settings.json` sozlangan). Live Server xavfsizlik sarlavhalarini (CSP) yubormaydi — bu faqat ko'rish uchun; hostingda sarlavhalar `_headers` orqali qo'yiladi.

## Sozlamalar — `frontend/site.config.mjs`

| Kalit | Ma'nosi |
|---|---|
| `SITE_URL` | Saytning asosiy manzili (canonical, sitemap, Open Graph). Domen ulanguncha hosting manzili: `https://<nom>.netlify.app` |
| `APP_URL` | Tizimchi ilovasi manzili — `https://tizimchi.com/ilova` (barqaror manzil, server ilovaning amaldagi joyiga yo'naltiradi — «Joylash» bo'limi) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Backend — o'z Supabase loyihangiz manzili va **ochiq** kaliti. Bo'sh bo'lsa sayt baribir ishlaydi: videolar `frontend/content/tutorials.json` dan (u ham bo'lmasa — «tez orada»), forma telefon/Telegram'ni taklif qiladi |
| `CONTACT` | Telefon va Telegram — sarlavha, footer, aloqa, forma xatolari |
| `LEGAL` | Maxfiylik siyosati va ofertadagi Ijrochi rekvizitlari, tahrir sanasi |

Hostingda build qilinsa, muhit o'zgaruvchilari (`SITE_URL`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) fayldagidan ustun turadi.

## Sayt boshqaruvi — `/admin/`

Kirish — backend'dagi admin hisobi (email + parol). Hisob yaratish: [backend/README.md](backend/README.md), 5–6-qadamlar. Sahifa qidiruv tizimlariga yopiq (`noindex`, robots.txt).

- **Video qo'llanmalar:** qo'shish va tahrirlash, saytda e'lon qilish / qoralama, tartib (↑ ↓), o'chirish. Video havolasi kiritilayotganda darhol tekshiriladi va ko'rinishi chiqadi.
- **Demo so'rovlar:** holat (Yangi, Bog'lanildi, Yopildi, Spam), admin izohi, qo'ng'iroq, o'chirish, Excel uchun CSV.
- **Sozlamalar:** Telegram bildirishnomalari (bot tokeni, chat ID, sinov xabari), adminlar haqida yo'riqnoma.

Barcha tekshiruvlar backend'da: brauzer faqat funksiyalarni chaqiradi, jadvallarga to'g'ridan-to'g'ri kira olmaydi.

### Video qo'llanma qo'shish

1. Videoni YouTube'ga yuklang (ochiq yoki «Ro'yxatga kiritilmagan» — *Unlisted*) yoki .mp4 / .webm faylni https manzilga joylang.
2. `/admin/` → **«Yangi video»**: sarlavha, video havolasi, qisqa tavsif, bo'lim, (ixtiyoriy) imkoniyat, biznes turlari, daraja, davomiyligi, qadamlar.
3. **«Saytda e'lon qilish»** ni yoqing → «Saqlash». Video saytda darhol paydo bo'ladi:
   - «Video qo'llanmalar» sahifasida (qidiruv va filtrlar bilan),
   - tanlangan biznes turlari sahifalarida («Barcha bizneslar» — hammasida),
   - «Imkoniyatlar» sahifasida — bo'lim bo'yicha; «Imkoniyat» tanlansa, aynan o'sha kartochkada «Video qo'llanmani ko'rish» chiqadi,
   - «Tanlangan» yoqilsa — bosh sahifada birinchi.

Video hali yo'q joyda «Bu bo'lim uchun video qo'llanma tez orada qo'shiladi» yoziladi — soxta video ko'rsatilmaydi.

### Backend'siz: o'zingiz tayyorlagan videolarni qo'shish (hozir shu ishlatiladi)

Video fayl (.mp4, .mov, .mkv, .webm — telefon yoki OBS yozuvi) yoki YouTube havolasi — bitta buyruq:

```powershell
npm run video -- add "C:\Videolar\kassa.mp4" --title "Kassada sotuv" --section savdo --capability kassa `
  --description "Tovarni topish va to'lov" --steps "Savdo bo'limini oching | Tovarni qidiring | Sotish" --featured
npm run video -- add "https://youtu.be/XXXXXXXXXXX" --title "Omborga kirim" --section ombor --duration 3:20
npm run video -- list                        # ro'yxat
npm run video -- remove kassada-sotuv        # o'chirish
npm run build; bash deploy/deploy-vps.sh     # saytga chiqarish (fayllar ham yuklanadi) — «Joylash» bo'limi
```

Fayl veb uchun tayyorlanadi: H.264 + AAC, «faststart» (darhol boshlanadi), eni ko'pi bilan 1920; tayyor .mp4 qayta kodlanmaydi.
Muqova, davomiylik va sahifa manzili (sarlavhadan) o'zi olinadi; havolada `?v=<xesh>` — video almashtirilsa, brauzer eskisini ko'rsatmaydi.
Bo'limlar: `boshlash, savdo, ombor, taminot, mijozlar, xodimlar, hisobot, restoran, platforma`; `--industries` (vergul bilan) — biznes turlari.
Kerak: ffmpeg (`FFMPEG`; bo'lmasa ilova loyihasining `promo/` papkasidagisi). Backend ulangach videolar `/admin/` dan boshqariladi.

## Ilovani yuklab olish — `/yuklab-olish/`

Windows dasturi (.exe) va Android ilovasi (.apk) saytning o'zidan beriladi: `tizimchi.com/yuklab/<fayl>`, qisqa havolalar
`tizimchi.com/yuklab/windows` va `tizimchi.com/yuklab/android` — doim eng yangi faylga (Telegram'da ulashish uchun).
Sahifada versiya, hajm, SHA-256 va Android imzo sertifikati ko'rsatiladi; iPhone — Safari orqali, macOS/Linux — brauzer orqali o'rnatiladi.

```powershell
# 1) Ilova loyihasida (dokon_app) yig'ish: cd desktop; npm run build   va   npm run android
npm run yuklab                               # 2) eng yangi fayllar → yuklab/ va frontend/content/downloads.json
npm run build; bash deploy/deploy-vps.sh     # 3) serverga: faqat yangi fayllar yuklanadi, serverda SHA-256 tekshiriladi
```

Windows dasturi hozircha raqamli sertifikatsiz — sahifa «Windows himoya qildi» oynasida nima qilishni va faylni tekshirishni ochiq yozadi.
Sertifikat olingach (`signed: true`), bu ogohlantirish sahifadan o'zi yo'qoladi. Eski versiyalar serverda qoladi (ulashilgan havolalar ishlaydi).
**SEO:** har bir video uchun alohida sahifa (`/video-qollanmalar/<manzil>/`, `VideoObject` bilan) sayt navbatdagi build'da yaratiladi; undan oldin video `/video-qollanmalar/korish/?v=<manzil>` da ochiladi.

## Demo so'rovi formasi

Forma (bosh sahifa → «Demo» va `/aloqa/`) so'rovni backend'dagi `site_lead_submit()` ga yuboradi → `site_leads` jadvaliga yoziladi → Telegram ulangan bo'lsa, xabar keladi.

- «So'rovingiz qabul qilindi» faqat server `{ ok: true }` qaytarganda chiqadi. Xato bo'lsa forma ochiq qoladi, telefon va Telegram ko'rsatiladi. Backend ulanmagan bo'lsa — buni ochiq aytadi.
- Tekshiruv brauzerda va serverda (ism, +998 telefon, biznes turi, rozilik). Spamdan himoya va IP haqida — [backend/README.md](backend/README.md).
- So'rovlar 12 oy saqlanadi (maxfiylik siyosati 2.7, 3.6, 5.3-bandlar).

## Matnlarni o'zgartirish

Matnlar `frontend/content/*.mjs` da. O'zgartirgach `npm run build` (`npm run dev` o'zi yangilaydi).

- **Faqat haqiqatan bor imkoniyatni yozing.** Yo'q narsa — `limits` ro'yxatiga («Hozircha mavjud emas»), shart bilan ishlaydigani — `notes` ga yoki `status: "test" | "setup"` bilan. Soxta statistika, mijozlar soni, «kafolat», «eng yaxshi» kabi da'volarni test to'xtatadi.
- O'zbekcha apostrofni oddiy yozing: `o'`, `g'`, `ma'lumot` — sayt o'zi `o‘`, `g‘`, `ma’lumot` ga almashtiradi.
- Yangi biznes turi: `taxonomy.mjs` → `INDUSTRIES`, `industries.mjs` → yangi obyekt va `backend/schema.sql` → `site_private.industry_list()` (bir xil bo'lishi shart — `npm run test:db` aytadi), so'ng SQL Editor'da schema.sql ni qayta ishga tushiring va `npm run og`.
- Huquqiy matnlar — `content/legal.mjs`; o'zgartirsangiz `LEGAL.UPDATED` sanasini yangilang. Ilovadagi matn o'zgarsa, bu yerni ham moslang.

## Joylash (hosting)

`npm run build` → **`dist/`** — oddiy statik sayt. HTTPS shart.

- **Netlify** (eng oson, bepul):
  - *qo'lda:* app.netlify.com → «Add new site» → «Deploy manually» → `dist/` papkasini sudrab tashlang;
  - *Git orqali:* repozitoriyni ulang — `netlify.toml` tayyor (build: `npm run build`, papka: `dist`). Backend manzili va kalitni *Site configuration → Environment variables* da bering.
  - Domen: *Domain management* → `tizimchi.com`, so'ng `SITE_URL` ni yangilab qayta build qiling.
- **Cloudflare Pages:** build buyrug'i `npm run build`, papka `dist`; `_headers` va `_redirects` qo'llab-quvvatlanadi.
- **O'z serveringiz (VPS, Caddy) — hozir shu ishlatiladi (tizimchi.com, Contabo):**
  ```bash
  npm run build
  SERVER=root@109.199.101.152 KEY=~/.ssh/tizimchi_vps bash deploy/deploy-vps.sh
  ```
  `dist/` → `/var/www/tizimchi-sayt` (yangi papkaga yuklanib, bir zumda almashtiriladi), `media/` → `/var/www/tizimchi-media`
  (saytdan oldin; sayt ishora qilgan har bir video `media/` da borligi tekshiriladi), `yuklab/` → `/var/www/tizimchi-yuklab`
  (faqat yangi fayllar, so'ng serverda SHA-256), Caddy sayt fayli `/etc/caddy/sites/tizimchi.com.caddy`
  (shablon — `deploy/Caddyfile`: CSP `dist/.csp` dan, HTTPS, kesh, `/media/`, `/yuklab/`, 404).
  Serverdagi Caddy — `/etc/caddy/sites/*.caddy` ni import qiladi (Tizimchi ilovasining `deploy/server-setup.sh` sozlaydi).
- **Ilova havolalari:** `APP_URL = https://tizimchi.com/ilova` — barqaror manzil; Caddy uni ilovaning amaldagi joyiga
  yo'naltiradi (yo'l va so'rov saqlanadi). `app.tizimchi.com` ishga tushishi bilan `tizimchi-app-switch` taymeri
  (`deploy/server/`) yo'naltirishni o'zi o'shanga o'tkazadi; ilova yana ko'chsa — sayt qayta build qilinmaydi.
- **GitHub Pages** tavsiya etilmaydi: xavfsizlik sarlavhalarini (CSP) qo'yib bo'lmaydi.

## Testlar

```powershell
npm run test:build   # build: sahifalar, SEO, sitemap, havolalar, CSP, rasmlar, tipografiya, /admin/, backend sozlamasi, maxfiy kalit himoyasi
npm run test:db      # backend: schema.sql haqiqiy PostgreSQL 17 da (PGlite) — huquqlar, tekshiruv, spam, IP, 12 oy, Telegram, sayt bilan bir xillik
npm run test:ui      # brauzer (Edge/Chrome, headless, CSP bilan): menyu, tablar, forma, video filtrlari, pleyer va /admin/ to'liq oqimi
```

## Ekran rasmlari va OG

| Buyruq | Nima qiladi |
|---|---|
| `npm run shots` | Ilovaning haqiqiy ekranlarini qayta suratga oladi → `frontend/assets/shots/`. Ilova loyihasi kerak: `APP_DIR` (standart `../dokon_app`), Chrome (`CHROME`) |
| `npm run og` | Ijtimoiy tarmoq rasmlari (1200×630) → `frontend/assets/og/` (sarlavhalar o'zgarganda) |
| `npm run video` | O'zingiz tayyorlagan video qo'llanmani qo'shish / ro'yxat / o'chirish — «Sayt boshqaruvi» bo'limida batafsil |
| `npm run yuklab` | Windows o'rnatgichi va Android ilovasini saytga tayyorlash — «Ilovani yuklab olish» bo'limida batafsil |
| `npm run assets` | Inter shrifti va Lucide ikonkalarini qayta yuklaydi (yangi ikonka kerak bo'lganda — ro'yxat `scripts/assets.mjs` da) |

## Analitika

Hozircha **ulanmagan** (maxfiylik siyosatida «reklama kuzatuvchilari ishlatilmaydi»). Sayt hodisalarni tayyorlab qo'ygan — `tizimchi:track` (window CustomEvent):
`hero_cta_clicked`, `industry_card_opened`, `tutorial_opened`, `tutorial_video_started`, `tutorial_video_completed` (.mp4), `demo_form_started`, `demo_form_submitted`.
Hodisalarda shaxsiy ma'lumot yo'q. Ulash: `window.TizimchiAnalytics = { track(name, props) { … } }` ni belgilaydigan **o'z domeningizdagi** skript, provayder manzilini `scripts/build.mjs` dagi CSP (`connect-src`) ga qo'shing va maxfiylik siyosatini yangilang.

## SEO va sifat

- Har bir sahifa: noyob `<title>` va tavsif, canonical, Open Graph va Twitter rasmlari (har biznes turi uchun alohida), `lang="uz"`, bitta H1, non-yo'l.
- `sitemap.xml`, `robots.txt`, JSON-LD: Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList, VideoObject (faqat haqiqiy video uchun). Soxta reyting va sharhlar yo'q.
- Ekran kadrlari webp, `srcset` bilan, o'lchamlari yozilgan (sahifa siljimaydi); shrift o'z serverdan.
- Klaviatura bilan to'liq boshqariladi (menyu, tablar, akkordeon, forma, admin oynalari), ko'rinadigan fokus, `prefers-reduced-motion` hurmat qilinadi.
