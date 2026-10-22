# Backend — Supabase (bepul tarif yetarli)

Saytning backend'i — bitta fayl: **`backend/schema.sql`**. U o'z Supabase loyihangizda quyidagilarni yaratadi:

| Nima | Vazifasi |
|---|---|
| `site_tutorials` | Video qo'llanmalar. Saytda faqat e'lon qilinganlari ko'rinadi (`site_tutorials_public()`). |
| `site_leads` | Saytdagi demo so'rovlari. Faqat `site_lead_submit()` orqali yoziladi: tekshiruv, spamdan himoya, 12 oy saqlash. |
| `site_private.admins` | Sayt adminlari — `/admin/` sahifasiga kira oladigan hisoblar. |
| `site_private.settings` | Telegram bot tokeni, chat ID'lar, IP kodlash uchun maxfiy tuz (API orqali ko'rinmaydi). |

Edge function, Docker yoki Supabase CLI **kerak emas** — hammasi SQL Editor orqali o'rnatiladi.

## O'rnatish (10 daqiqa, bir marta)

1. **supabase.com** → «Start your project» → yangi loyiha (*New project*). Region — sizga yaqini (masalan, *Central EU (Frankfurt)*). Ma'lumotlar bazasi parolini saqlab qo'ying.
2. **SQL Editor** → «New query» → `backend/schema.sql` faylining **butun** matnini qo'ying → **Run**.
   Natija: *Success. No rows returned*. Qayta ishga tushirish xavfsiz — mavjud ma'lumotga tegmaydi.
3. **Database → Extensions** → `pg_net` yoqilganini tekshiring (schema.sql o'zi yoqishga urinadi). Bu faqat Telegram xabarlari uchun kerak.
4. **Authentication → Sign In / Providers** → Email: **«Allow new users to sign up»** ni o'chiring (tavsiya). Bo'lmasa ham begona odam ro'yxatdan o'tsa, admin bo'lib qolmaydi — lekin ortiqcha hisoblar kerak emas.
5. **Authentication → Users → Add user → Create new user**: email va kuchli parol, **«Auto Confirm User»** belgisi bilan.
6. **SQL Editor**'da shu hisobni admin qiling:
   ```sql
   select public.site_admin_add('siz@example.com');
   ```
7. Ulanish ma'lumotlari:
   - **Project URL** — *Project Settings → Data API* (yoki yuqoridagi «Connect» tugmasi): `https://<loyiha>.supabase.co`
   - **Ochiq kalit** — *Project Settings → API Keys*: **Publishable key** (`sb_publishable_…`) yoki «Legacy API keys» dagi **anon public** (`eyJ…`).

   Ikkalasini `frontend/site.config.mjs` ga yozing (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) yoki hostingda muhit o'zgaruvchisi qilib bering.
   > **service_role** / **secret** (`sb_secret_…`) kalitni hech qachon saytga yozmang — u butun bazaga ruxsat beradi. Build bunday kalitni ko'rsa to'xtaydi.
8. `npm run build` → `dist/` ni hostingga yuklang (README.md → «Joylash»).
9. Saytda **`/admin/`** → 5-qadamdagi email va parol bilan kiring. **Sozlamalar** → Telegram (ixtiyoriy):
   - Telegram'da **@BotFather** → `/newbot` → bot tokenini oling;
   - o'z botingizga `/start` yozing (bot sizga yoza olishi uchun shart);
   - chat ID'ingizni **@userinfobot** dan oling;
   - token va chat ID'ni kiritib «Saqlash» → «Sinov xabari».

## Xavfsizlik qanday ta'minlangan

- Jadvallarda **RLS yoqilgan** va brauzer rollaridan (`anon`, `authenticated`) barcha huquqlar **olingan**: jadvalni to'g'ridan-to'g'ri o'qib ham, yozib ham bo'lmaydi.
- Brauzer faqat funksiyalarni chaqiradi, har biri o'zi tekshiradi:
  - mehmon (`anon`): `site_tutorials_public()` — faqat e'lon qilingan videolar; `site_lead_submit()` — so'rov yuborish;
  - kirgan foydalanuvchi: admin funksiyalari — ichida `site_private.admins` ro'yxati tekshiriladi, admin bo'lmasa — «Ruxsat yo'q».
- `site_admin_add()` / `site_admin_remove()` brauzerdan chaqirilmaydi — faqat SQL Editor'dan.
- Funksiyalar `security definer` + `search_path = ''` (to'liq nomlar) — Supabase tavsiyasi bo'yicha.
- **Spamdan himoya:** yashirin maydon va juda tez yuborilgan forma (bot) saqlanmaydi; bitta raqamdan soatiga 3, bitta IP'dan soatiga 10, hammasi bo'lib 10 daqiqada 60 ta so'rov.
- **IP manzilning o'zi saqlanmaydi:** faqat maxfiy tuz bilan hisoblangan qaytarib bo'lmaydigan 32 belgili kod (cheklov uchun).
- **12 oy:** undan eski so'rovlar avtomatik o'chiriladi (maxfiylik siyosati, 5.3-band).
- Telegram tokeni javoblarda to'liq qaytarilmaydi (faqat oxirgi 4 belgisi).

## Admin qo'shish va olib tashlash

```sql
select public.site_admin_add('yangi@example.com');     -- avval Authentication → Users'da hisob yarating
select public.site_admin_remove('eski@example.com');
```
Parol — *Authentication → Users* da o'zgartiriladi.

## Bepul tarif haqida

- Bepul loyiha uzoq vaqt ishlatilmasa, Supabase uni **to'xtatib qo'yishi** mumkin (hozirgi qoida — Supabase saytida). Panelda **«Restore project»** bilan qayta yoqiladi.
  Shu vaqtda sayt baribir ochiladi: video qo'llanmalar build vaqtidagi nusxadan ko'rinadi, forma esa telefon va Telegram'ni taklif qiladi.
- Avtomatik zaxira nusxa bepul tarifda yo'q: so'rovlarni vaqti-vaqti bilan `/admin/` → «Demo so'rovlar» → «Excel (CSV)» orqali yuklab oling.

## Muammolar

| Belgi | Sababi va yechim |
|---|---|
| `/admin/` da «Backend o'rnatilmagan yoki eskirgan» | `schema.sql` ishga tushirilmagan yoki boshqa loyihaga ulangan — 2-qadamni bajaring, `SUPABASE_URL` ni tekshiring. |
| «Email yoki parol noto'g'ri» | Authentication → Users'da email to'g'riligini tekshiring, kerak bo'lsa parolni yangilang. |
| «Email tasdiqlanmagan» | Foydalanuvchini «Auto Confirm User» bilan yarating yoki ro'yxatda tasdiqlang. |
| «admin huquqi berilmagan» | SQL Editor: `select public.site_admin_add('email');` |
| Telegram xabari kelmayapti | pg_net yoqilganmi (3-qadam), botga `/start` yozilganmi, chat ID to'g'rimi — «Sinov xabari» bilan tekshiring. |
| Video saytda ko'rinmayapti | Videoda «Saytda e'lon qilish» yoqilganmi; brauzer keshini yangilang. |

Testlar: `npm run test:db` — `schema.sql` ni haqiqiy PostgreSQL 17 da (PGlite) ishga tushirib, huquqlar, tekshiruvlar, spam cheklovi, Telegram va sayt bilan bir xillikni tekshiradi.
