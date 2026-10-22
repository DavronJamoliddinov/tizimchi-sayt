-- =====================================================================
--  tizimchi_sayt — BACKEND (Supabase / PostgreSQL 15+)
--
--  Saytga kerak bo'lgan hamma narsa shu faylda:
--    • video qo'llanmalar (site_tutorials) — saytda faqat e'lon qilinganlari ko'rinadi;
--    • demo so'rovlari (site_leads) — tekshiruv, spamdan himoya, 12 oy saqlash;
--    • sayt adminlari (site_private.admins) — /admin/ sahifasi shu hisoblar bilan ishlaydi;
--    • Telegram xabari (ixtiyoriy, pg_net orqali) — yangi so'rov kelganda.
--
--  O'rnatish: Supabase → SQL Editor → shu faylni to'liq qo'yib «Run». Qayta ishga tushirish xavfsiz:
--  mavjud ma'lumotga tegmaydi, faqat yetishmayotganini qo'shadi va funksiyalarni yangilaydi.
--  Batafsil: backend/README.md
--
--  Xavfsizlik:
--    • Jadvallarga brauzer (anon, authenticated) to'g'ridan-to'g'ri kira olmaydi — RLS yoqilgan, huquqlar olingan.
--      O'qish va yozish faqat quyidagi funksiyalar orqali; har biri o'zi tekshiradi.
--    • IP manzilning o'zi saqlanmaydi: faqat maxfiy tuz bilan hisoblangan qaytarib bo'lmaydigan kod (spam cheklovi uchun).
--    • Admin funksiyalari faqat site_private.admins ro'yxatidagi hisoblarga ishlaydi.
--    • Taksonomiya kodlari (biznes turlari, bo'limlar, darajalar) — frontend/content/taxonomy.mjs bilan bir xil
--      (tests/db.test.mjs solishtiradi).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Kengaytma: pg_net (Telegram xabari uchun). Bo'lmasa — xabar yuborilmaydi, qolgan hammasi ishlaydi.
-- ---------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net yoqilmadi (%). Telegram xabarlari ishlamaydi — qolgan hammasi ishlaydi.', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- 1. Yopiq sxema: sozlamalar, adminlar, ichki yordamchilar (API orqali ko'rinmaydi)
-- ---------------------------------------------------------------------
create schema if not exists site_private;
revoke all on schema site_private from public;
do $$ begin
  execute 'revoke all on schema site_private from anon, authenticated';
exception when undefined_object then null; end $$;

create table if not exists site_private.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
revoke all on table site_private.settings from public;

-- IP kodlash uchun maxfiy tuz: bir marta, tasodifiy (≈244 bit)
insert into site_private.settings (key, value)
values ('ip_salt', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

create table if not exists site_private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
revoke all on table site_private.admins from public;

-- ---------------------------------------------------------------------
-- 2. Taksonomiya (frontend/content/taxonomy.mjs bilan bir xil tartibda)
-- ---------------------------------------------------------------------
create or replace function site_private.industry_list() returns jsonb
language sql immutable as $$
  select '[["restoran","Restoran va kafe"],["dokon","Do''kon"],["supermarket","Supermarket"],["dorixona","Dorixona"],
           ["avto-ehtiyot-qismlar","Avto ehtiyot qismlar"],["qurilish-mollari","Qurilish mollari"],["xojalik-mollari","Xo''jalik mollari"],
           ["ombor","Ombor va ulgurji savdo"],["mehmonxona","Mehmonxona"],["oquv-markazi","O''quv markazi"],["boshqa","Boshqa bizneslar"]]'::jsonb
$$;

create or replace function site_private.section_list() returns jsonb
language sql immutable as $$
  select '[["boshlash","Boshlash va sozlash"],["savdo","Savdo va kassa"],["ombor","Ombor va mahsulotlar"],
           ["taminot","Ta''minotchilar va xaridlar"],["mijozlar","Mijozlar va qarzlar"],["xodimlar","Xodimlar va nazorat"],
           ["hisobot","Hisobotlar va tahlil"],["restoran","Restoran moduli"],["platforma","Platforma va xavfsizlik"]]'::jsonb
$$;

create or replace function site_private.level_codes() returns text[]
language sql immutable as $$ select array['beginner', 'intermediate', 'advanced'] $$;

/** Ro'yxatdagi kodlar (tartib saqlanadi) */
create or replace function site_private.codes(p jsonb) returns text[]
language sql immutable as $$
  select coalesce(array_agg(x.v ->> 0 order by x.n), '{}') from jsonb_array_elements(p) with ordinality as x(v, n)
$$;

create or replace function site_private.label(p jsonb, p_code text) returns text
language sql immutable as $$
  select coalesce((select x ->> 1 from jsonb_array_elements(p) as x where x ->> 0 = p_code limit 1), p_code)
$$;

-- ---------------------------------------------------------------------
-- 3. Yordamchilar
-- ---------------------------------------------------------------------
/** Telefon: 901234567 yoki +998 90 123 45 67 → 998901234567; noto'g'ri bo'lsa null */
create or replace function site_private.uz_phone(t text) returns text
language sql immutable as $$
  select case when length(d) = 9 then '998' || d
              when length(d) = 12 and left(d, 3) = '998' then d end
    from (select regexp_replace(coalesce(t, ''), '\D', '', 'g') as d) x
$$;

/** «Kassada birinchi sotuv» → «kassada-birinchi-sotuv» (sarlavhadan manzil) */
create or replace function site_private.slugify(t text) returns text
language sql immutable as $$
  select regexp_replace(left(regexp_replace(regexp_replace(lower(regexp_replace(coalesce(t, ''), '[‘’ʻʼ`'']', '', 'g')),
           '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'), 80), '-+$', '')
$$;

/**
 * Video manzili: YouTube (youtu.be, youtube.com/watch, /shorts/, /embed/, /live/) yoki https orqali .mp4/.m4v/.webm fayl.
 * Sayt (frontend/src/client/tutorials.js → parseVideo) xuddi shu qoida bilan ko'rsatadi — bu yerda qabul qilingan manzil
 * saytda albatta ochiladi (tests/db.test.mjs solishtiradi).
 */
create or replace function site_private.video_url_ok(p_url text) returns boolean
language plpgsql immutable as $$
declare
  u text := btrim(coalesce(p_url, ''));
  m text[];
  host text;
  path text;
  query text;
  vid text := '';
begin
  if u = '' or length(u) > 500 or u ~ '\s' then return false; end if;
  m := regexp_match(u, '^[hH][tT][tT][pP][sS]://([^/?#]+)([^?#]*)(?:\?([^#]*))?(?:#.*)?$');
  if m is null then return false; end if;
  host := regexp_replace(lower(regexp_replace(regexp_replace(m[1], '^.*@', ''), ':[0-9]*$', '')), '^(www|m)\.', '');
  path := coalesce(nullif(m[2], ''), '/');
  query := coalesce(m[3], '');
  if host = 'youtu.be' then
    vid := split_part(substr(path, 2), '/', 1);
  elsif host in ('youtube.com', 'youtube-nocookie.com') then
    if path = '/watch' then
      vid := coalesce((regexp_match('&' || query, '&v=([^&]*)'))[1], '');
    else
      vid := coalesce((regexp_match(path, '^/(?:embed|shorts|live)/([^/?#]+)'))[1], '');
    end if;
  end if;
  if vid <> '' then return vid ~ '^[A-Za-z0-9_-]{11}$'; end if;
  return path ~* '\.(mp4|m4v|webm)$';
end $$;

/** https manzil yoki null (bo'sh qiymat — null) */
create or replace function site_private.https_or_null(p text, p_max int default 500) returns text
language plpgsql immutable as $$
declare v text := btrim(coalesce(p, ''));
begin
  if v = '' then return null; end if;
  if v !~ '^https://\S+$' or length(v) > p_max then
    raise exception 'Rasm va subtitr manzili https:// bilan boshlanishi kerak';
  end if;
  return v;
end $$;

/** Matn yoki massiv → toza qatorlar ro'yxati (bo'shlari tashlanadi) */
create or replace function site_private.text_list(p jsonb, p_sep text, p_max_items int, p_max_len int) returns text[]
language sql immutable as $$
  select coalesce(array_agg(left(btrim(x), p_max_len) order by n), '{}')
    from (
      select x, n from (
        select v as x, n from jsonb_array_elements_text(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) with ordinality as a(v, n)
        union all
        select v, n from regexp_split_to_table(case when jsonb_typeof(p) = 'string' then p #>> '{}' else '' end, p_sep) with ordinality as b(v, n)
      ) s where btrim(x) <> ''
      order by n limit p_max_items
    ) t
$$;

create or replace function site_private.html(p text) returns text
language sql immutable as $$ select replace(replace(replace(coalesce(p, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;') $$;

create or replace function site_private.fmt_phone(p text) returns text
language sql immutable as $$
  select case when p ~ '^998[0-9]{9}$'
              then '+998 ' || substr(p, 4, 2) || ' ' || substr(p, 6, 3) || ' ' || substr(p, 9, 2) || ' ' || substr(p, 11, 2)
              else coalesce(p, '') end
$$;

create or replace function site_private.setting(p_key text) returns text
language sql stable security definer set search_path = '' as $$
  select value from site_private.settings where key = p_key
$$;

create or replace function site_private.pg_net_ready() returns boolean
language sql stable as $$
  select exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'net' and p.proname = 'http_post')
$$;

/**
 * Telegram xabari (HTML) — sozlangan barcha chatlarga. Xabar pg_net navbatiga qo'yiladi va tranzaksiyadan keyin
 * yuboriladi (so'rov kutib qolmaydi). Sozlanmagan yoki pg_net yo'q bo'lsa — 0, xato emas.
 */
create or replace function site_private.tg_send(p_text text) returns int
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_token text := site_private.setting('telegram_bot_token');
  v_chats text := site_private.setting('telegram_chat_ids');
  v_chat text;
  n int := 0;
begin
  if coalesce(v_token, '') = '' or coalesce(v_chats, '') = '' or not site_private.pg_net_ready() then return 0; end if;
  foreach v_chat in array string_to_array(v_chats, ',') loop
    v_chat := btrim(v_chat);
    continue when v_chat = '';
    execute 'select net.http_post(url := $1, body := $2)'
      using 'https://api.telegram.org/bot' || v_token || '/sendMessage',
            jsonb_build_object('chat_id', v_chat, 'text', p_text, 'parse_mode', 'HTML', 'disable_web_page_preview', true);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function site_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from site_private.admins a where a.user_id = auth.uid())
$$;

create or replace function site_private.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not site_private.is_admin() then
    raise exception 'Ruxsat yo''q: bu amal faqat sayt adminlari uchun' using errcode = '42501';
  end if;
end $$;

revoke all on all functions in schema site_private from public;

-- ---------------------------------------------------------------------
-- 4. Jadvallar
-- ---------------------------------------------------------------------
create table if not exists public.site_tutorials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(btrim(title)) between 3 and 160),
  description text not null default '' check (length(description) <= 2000),
  video_url text not null check (video_url ~ '^https://' and length(video_url) <= 500),
  thumbnail_url text check (thumbnail_url is null or (thumbnail_url ~ '^https://' and length(thumbnail_url) <= 500)),
  captions_url text check (captions_url is null or (captions_url ~ '^https://' and length(captions_url) <= 500)),
  industries text[] not null default '{umumiy}' check (cardinality(industries) between 1 and 20),
  product_section text not null default 'boshlash' check (product_section ~ '^[a-z0-9-]{2,40}$'),
  capability text check (capability is null or capability ~ '^[a-z0-9-]{2,60}$'),
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  duration_sec int check (duration_sec is null or duration_sec between 1 and 36000),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  steps text[] not null default '{}' check (cardinality(steps) <= 40),
  transcript text check (transcript is null or length(transcript) <= 20000),
  sort_order int not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists site_tutorials_pub_idx on public.site_tutorials (is_published, sort_order);

create table if not exists public.site_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 80),
  phone text not null check (phone ~ '^998[0-9]{9}$'),
  business_name text check (business_name is null or length(business_name) <= 120),
  business_type text not null check (business_type ~ '^[a-z0-9-]{2,40}$'),
  comment text check (comment is null or length(comment) <= 1000),
  page text check (page is null or length(page) <= 200),
  ip_hash text,                        -- IP'ning o'zi emas: maxfiy tuz bilan kodlangan (spam cheklovi uchun)
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  note text check (note is null or length(note) <= 1000),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_leads_created_idx on public.site_leads (created_at desc);
create index if not exists site_leads_phone_idx on public.site_leads (phone, created_at desc);
create index if not exists site_leads_ip_idx on public.site_leads (ip_hash, created_at desc);
create index if not exists site_leads_status_idx on public.site_leads (status, created_at desc);

alter table public.site_tutorials enable row level security;
alter table public.site_leads enable row level security;
-- Siyosat yo'q va huquq yo'q: brauzer jadvallarni to'g'ridan-to'g'ri o'qiy ham, yoza ham olmaydi (faqat funksiyalar orqali)
revoke all on table public.site_tutorials, public.site_leads from public;
do $$ begin
  execute 'revoke all on table public.site_tutorials, public.site_leads from anon, authenticated';
  execute 'grant select, insert, update, delete on table public.site_tutorials, public.site_leads to service_role';
exception when undefined_object then null; end $$;

-- ---------------------------------------------------------------------
-- 5. Ochiq funksiyalar (sayt mehmoni)
-- ---------------------------------------------------------------------
/** Saytga: faqat e'lon qilingan videolar, ochiq maydonlar bilan (kim tahrirlagani berilmaydi) */
create or replace function public.site_tutorials_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', t.id, 'slug', t.slug, 'title', t.title, 'description', t.description, 'video_url', t.video_url,
           'thumbnail_url', t.thumbnail_url, 'captions_url', t.captions_url, 'industries', to_jsonb(t.industries),
           'product_section', t.product_section, 'capability', t.capability, 'difficulty', t.difficulty,
           'duration_sec', t.duration_sec, 'tags', to_jsonb(t.tags), 'steps', to_jsonb(t.steps), 'transcript', t.transcript,
           'sort_order', t.sort_order, 'is_featured', t.is_featured, 'published_at', t.published_at, 'updated_at', t.updated_at)
         order by t.sort_order, t.published_at desc nulls last), '[]'::jsonb)
    from public.site_tutorials t
   where t.is_published
$$;

/**
 * Demo so'rovi (saytdagi forma to'g'ridan-to'g'ri chaqiradi).
 *   Bot tuzog'i: yashirin «website» maydoni to'ldirilgan yoki forma 2,5 soniyadan tez yuborilgan — saqlanmaydi,
 *   lekin { ok: true } qaytadi (bot farqini sezmasin).
 *   Cheklov: bitta raqamdan soatiga 3, bitta IP'dan soatiga 10, hammasi bo'lib 10 daqiqada 60 ta.
 *   Saqlash muddati: 12 oy (maxfiylik siyosati, 2.7 va 5.3-bandlar).
 */
create or replace function public.site_lead_submit(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name text := left(nullif(btrim(coalesce(p ->> 'name', '')), ''), 80);
  v_phone text := site_private.uz_phone(p ->> 'phone');
  v_bname text := left(nullif(btrim(coalesce(p ->> 'business_name', '')), ''), 120);
  v_type text := lower(nullif(btrim(coalesce(p ->> 'business_type', '')), ''));
  v_comment text := left(nullif(btrim(coalesce(p ->> 'comment', '')), ''), 1000);
  v_page text := left(nullif(btrim(coalesce(p ->> 'page', '')), ''), 200);
  v_elapsed numeric;
  v_headers jsonb;
  v_ip text;
  v_hash text;
  v_site text;
begin
  if jsonb_typeof(p) is distinct from 'object' then raise exception 'Noto''g''ri so''rov'; end if;
  -- Bot tuzog'i
  begin v_elapsed := (p ->> 'elapsed')::numeric; exception when others then v_elapsed := null; end;
  if btrim(coalesce(p ->> 'website', '')) <> '' or (v_elapsed is not null and v_elapsed >= 0 and v_elapsed < 2500) then
    return jsonb_build_object('ok', true);
  end if;
  -- Tekshiruv
  if v_name is null or length(v_name) < 2 then raise exception 'Ismingizni yozing'; end if;
  if v_phone is null then raise exception 'Telefon raqamini to''liq kiriting: +998 XX XXX XX XX'; end if;
  if v_type is null or not (v_type = any (site_private.codes(site_private.industry_list()))) then raise exception 'Biznes turini tanlang'; end if;
  if coalesce(p ->> 'consent', '') <> 'true' then raise exception 'Ma''lumotlarni qayta ishlashga rozilik bering'; end if;
  -- IP (Supabase API so'rov sarlavhalari) → kod; IP'ning o'zi hech qayerga yozilmaydi
  begin v_headers := nullif(current_setting('request.headers', true), '')::jsonb; exception when others then v_headers := null; end;
  v_ip := nullif(btrim(coalesce(v_headers ->> 'cf-connecting-ip', v_headers ->> 'x-real-ip',
                                split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1))), '');
  if v_ip is not null then
    v_hash := left(encode(sha256(convert_to(site_private.setting('ip_salt') || '|' || left(v_ip, 64), 'UTF8')), 'hex'), 32);
  end if;
  -- 12 oydan eski so'rovlar o'chiriladi
  delete from public.site_leads where created_at < now() - interval '12 months';
  -- Spam cheklovi
  if (select count(*) from public.site_leads where phone = v_phone and created_at > now() - interval '1 hour') >= 3
     or (v_hash is not null and (select count(*) from public.site_leads where ip_hash = v_hash and created_at > now() - interval '1 hour') >= 10)
     or (select count(*) from public.site_leads where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'Juda ko''p so''rov. Birozdan keyin qayta urinib ko''ring yoki bizga qo''ng''iroq qiling';
  end if;
  insert into public.site_leads (name, phone, business_name, business_type, comment, page, ip_hash)
  values (v_name, v_phone, v_bname, v_type, v_comment, v_page, v_hash);
  -- Telegram (sozlangan bo'lsa)
  v_site := site_private.setting('site_url');
  perform site_private.tg_send(concat_ws(e'\n',
    '📩 <b>Saytdan demo so''rovi</b>',
    site_private.html(v_name) || ' · ' || site_private.fmt_phone(v_phone),
    site_private.html(site_private.label(site_private.industry_list(), v_type)) || case when v_bname is not null then ' · ' || site_private.html(v_bname) else '' end,
    case when v_comment is not null then '💬 ' || site_private.html(left(v_comment, 600)) end,
    case when v_page is not null then 'Sahifa: ' || site_private.html(v_page) end,
    case when v_site is not null then 'Admin: ' || site_private.html(v_site) || '/admin/' end));
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- 6. Admin funksiyalari (/admin/ sahifasi; kirgan va site_private.admins ro'yxatidagi hisob)
-- ---------------------------------------------------------------------
/** Kirgan foydalanuvchi admin'mi */
create or replace function public.site_admin_me() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('is_admin', site_private.is_admin(),
                            'email', (select u.email from auth.users u where u.id = auth.uid()))
$$;

/** Barcha videolar (qoralamalar ham), admin tartibida */
create or replace function public.site_tutorials_admin() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform site_private.require_admin();
  return (select coalesce(jsonb_agg(to_jsonb(t) - 'updated_by' order by t.sort_order, t.created_at desc), '[]'::jsonb) from public.site_tutorials t);
end $$;

/** Saqlash: barcha maydonlar shu yerda tekshiriladi. p.id bo'sh — yangi video. */
create or replace function public.site_tutorial_save(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_id uuid;
  v_title text := left(btrim(coalesce(p ->> 'title', '')), 160);
  v_slug text := left(btrim(coalesce(p ->> 'slug', '')), 80);
  v_url text := btrim(coalesce(p ->> 'video_url', ''));
  v_section text := btrim(coalesce(p ->> 'product_section', ''));
  v_inds text[];
  v_level text := coalesce(nullif(btrim(coalesce(p ->> 'difficulty', '')), ''), 'beginner');
  v_cap text := nullif(btrim(coalesce(p ->> 'capability', '')), '');
  v_dur int;
  v_pub boolean := coalesce(p ->> 'is_published', '') = 'true';
  v_prev public.site_tutorials;
  v_row public.site_tutorials;
begin
  perform site_private.require_admin();
  if coalesce(p ->> 'id', '') <> '' then
    begin v_id := (p ->> 'id')::uuid; exception when others then raise exception 'Video topilmadi'; end;
    select * into v_prev from public.site_tutorials where id = v_id;
    if not found then raise exception 'Video topilmadi'; end if;
  end if;
  if length(v_title) < 3 then raise exception 'Sarlavha kamida 3 belgi bo''lsin'; end if;
  if v_slug = '' then v_slug := site_private.slugify(v_title); end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Manzil (slug) faqat kichik lotin harflari, raqam va chiziqchadan iborat bo''lsin';
  end if;
  if not site_private.video_url_ok(v_url) then
    raise exception 'Video manzili noto''g''ri: YouTube havolasi yoki https orqali .mp4 fayl kerak';
  end if;
  if not (v_section = any (site_private.codes(site_private.section_list()))) then raise exception 'Bo''limni tanlang'; end if;
  v_inds := site_private.text_list(p -> 'industries', ',', 20, 40);
  if cardinality(v_inds) = 0 or 'umumiy' = any (v_inds) then v_inds := array['umumiy'];
  else
    v_inds := array(select d.x from (select distinct on (u.x) u.x, u.n from unnest(v_inds) with ordinality as u(x, n) order by u.x, u.n) d order by d.n);
    if exists (select 1 from unnest(v_inds) x where not (x = any (site_private.codes(site_private.industry_list())))) then
      raise exception 'Biznes turi noto''g''ri';
    end if;
  end if;
  if not (v_level = any (site_private.level_codes())) then raise exception 'Daraja noto''g''ri'; end if;
  if v_cap is not null and v_cap !~ '^[a-z0-9-]{2,60}$' then raise exception 'Imkoniyat kodi noto''g''ri'; end if;
  begin v_dur := round(coalesce(nullif(p ->> 'duration_sec', ''), '0')::numeric)::int; exception when others then v_dur := 0; end;
  if v_dur < 0 or v_dur > 36000 then v_dur := 0; end if;

  if v_prev.id is not null then
    update public.site_tutorials set
      slug = v_slug, title = v_title, description = left(btrim(coalesce(p ->> 'description', '')), 2000), video_url = v_url,
      thumbnail_url = site_private.https_or_null(p ->> 'thumbnail_url'), captions_url = site_private.https_or_null(p ->> 'captions_url'),
      industries = v_inds, product_section = v_section, capability = v_cap, difficulty = v_level, duration_sec = nullif(v_dur, 0),
      tags = array(select lower(x) from unnest(site_private.text_list(p -> 'tags', ',', 12, 40)) x),
      steps = site_private.text_list(p -> 'steps', e'\r?\n', 40, 400),
      transcript = nullif(left(btrim(coalesce(p ->> 'transcript', '')), 20000), ''),
      is_featured = coalesce(p ->> 'is_featured', '') = 'true', is_published = v_pub,
      published_at = coalesce(v_prev.published_at, case when v_pub then now() end),
      updated_at = now(), updated_by = auth.uid()
    where id = v_prev.id
    returning * into v_row;
  else
    insert into public.site_tutorials (slug, title, description, video_url, thumbnail_url, captions_url, industries, product_section,
      capability, difficulty, duration_sec, tags, steps, transcript, is_featured, is_published, published_at, sort_order, updated_by)
    values (v_slug, v_title, left(btrim(coalesce(p ->> 'description', '')), 2000), v_url,
      site_private.https_or_null(p ->> 'thumbnail_url'), site_private.https_or_null(p ->> 'captions_url'), v_inds, v_section,
      v_cap, v_level, nullif(v_dur, 0), array(select lower(x) from unnest(site_private.text_list(p -> 'tags', ',', 12, 40)) x),
      site_private.text_list(p -> 'steps', e'\r?\n', 40, 400), nullif(left(btrim(coalesce(p ->> 'transcript', '')), 20000), ''),
      coalesce(p ->> 'is_featured', '') = 'true', v_pub, case when v_pub then now() end,
      coalesce((select max(sort_order) from public.site_tutorials), 0) + 10, auth.uid())
    returning * into v_row;
  end if;
  return to_jsonb(v_row) - 'updated_by';
exception when unique_violation then
  raise exception 'Bu manzil (slug) band — boshqasini yozing';
end $$;

create or replace function public.site_tutorial_delete(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform site_private.require_admin();
  delete from public.site_tutorials where id = p_id;
  if not found then raise exception 'Video topilmadi'; end if;
  return jsonb_build_object('ok', true);
end $$;

/** Tartib: bitta yuqoriga (-1) yoki pastga (1); hammasi 10, 20, 30... ga qayta raqamlanadi */
create or replace function public.site_tutorial_move(p_id uuid, p_dir int) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_ids uuid[];
  i int;
  j int;
  tmp uuid;
begin
  perform site_private.require_admin();
  select array_agg(id order by sort_order, created_at desc) into v_ids from public.site_tutorials;
  i := array_position(v_ids, p_id);
  if i is null then raise exception 'Video topilmadi'; end if;
  j := i + case when p_dir < 0 then -1 else 1 end;
  if j >= 1 and j <= cardinality(v_ids) then
    tmp := v_ids[i]; v_ids[i] := v_ids[j]; v_ids[j] := tmp;
  end if;
  update public.site_tutorials t set sort_order = x.n * 10
    from unnest(v_ids) with ordinality as x(id, n)
   where t.id = x.id and t.sort_order is distinct from x.n * 10;
  return jsonb_build_object('ok', true);
end $$;

/** So'rovlar: holat bo'yicha (new | contacted | closed | spam | all) va har holat soni */
create or replace function public.site_leads_admin(p_status text default 'new') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_status text := coalesce(nullif(p_status, ''), 'all');
begin
  perform site_private.require_admin();
  delete from public.site_leads where created_at < now() - interval '12 months';
  return jsonb_build_object(
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'phone', l.phone, 'business_name', l.business_name,
                'business_type', l.business_type, 'comment', l.comment, 'page', l.page, 'status', l.status, 'note', l.note,
                'created_at', l.created_at, 'updated_at', l.updated_at) order by l.created_at desc), '[]'::jsonb)
                from (select * from public.site_leads where v_status = 'all' or status = v_status order by created_at desc limit 500) l),
    'counts', (select jsonb_build_object(
                'new', count(*) filter (where status = 'new'), 'contacted', count(*) filter (where status = 'contacted'),
                'closed', count(*) filter (where status = 'closed'), 'spam', count(*) filter (where status = 'spam'), 'all', count(*))
                from public.site_leads));
end $$;

/** So'rov holati va/yoki izohi */
create or replace function public.site_lead_update(p_id uuid, p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_status text := p ->> 'status';
begin
  perform site_private.require_admin();
  if v_status is not null and v_status not in ('new', 'contacted', 'closed', 'spam') then raise exception 'Noto''g''ri holat'; end if;
  update public.site_leads set
    status = coalesce(v_status, status),
    note = case when p ? 'note' then nullif(left(btrim(coalesce(p ->> 'note', '')), 1000), '') else note end,
    updated_at = now()
  where id = p_id;
  if not found then raise exception 'So''rov topilmadi'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.site_lead_delete(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform site_private.require_admin();
  delete from public.site_leads where id = p_id;
  if not found then raise exception 'So''rov topilmadi'; end if;
  return jsonb_build_object('ok', true);
end $$;

/** Sozlamalar: Telegram (token to'liq qaytarilmaydi — faqat oxirgi 4 belgisi) */
create or replace function public.site_settings_admin() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_token text;
begin
  perform site_private.require_admin();
  v_token := site_private.setting('telegram_bot_token');
  return jsonb_build_object(
    'telegram_token_set', coalesce(v_token, '') <> '',
    'telegram_token_hint', case when coalesce(v_token, '') <> '' then '…' || right(v_token, 4) end,
    'telegram_chat_ids', coalesce(site_private.setting('telegram_chat_ids'), ''),
    'site_url', coalesce(site_private.setting('site_url'), ''),
    'pg_net', site_private.pg_net_ready());
end $$;

/** Saqlash: kalit p'da bo'lsa — yangilanadi (bo'sh qiymat — o'chiradi), bo'lmasa — o'zgarmaydi */
create or replace function public.site_settings_save(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v text;
  v_ids text[];
begin
  perform site_private.require_admin();
  if p ? 'telegram_bot_token' then
    v := btrim(coalesce(p ->> 'telegram_bot_token', ''));
    if v = '' then delete from site_private.settings where key = 'telegram_bot_token';
    elsif v !~ '^[0-9]{5,12}:[A-Za-z0-9_-]{30,64}$' then
      raise exception 'Telegram bot tokeni noto''g''ri: @BotFather bergan «123456789:AA…» ko''rinishidagi kalit kerak';
    else
      insert into site_private.settings (key, value) values ('telegram_bot_token', v)
      on conflict (key) do update set value = excluded.value, updated_at = now();
    end if;
  end if;
  if p ? 'telegram_chat_ids' then
    v_ids := array(select btrim(x) from regexp_split_to_table(coalesce(p ->> 'telegram_chat_ids', ''), '[,\s]+') x where btrim(x) <> '');
    if cardinality(v_ids) > 5 then raise exception 'Ko''pi bilan 5 ta chat'; end if;
    if exists (select 1 from unnest(v_ids) x where x !~ '^(-?[0-9]{3,20}|@[A-Za-z0-9_]{5,32})$') then
      raise exception 'Chat ID noto''g''ri: raqam (masalan 123456789) yoki @kanal_nomi';
    end if;
    if cardinality(v_ids) = 0 then delete from site_private.settings where key = 'telegram_chat_ids';
    else
      insert into site_private.settings (key, value) values ('telegram_chat_ids', array_to_string(v_ids, ','))
      on conflict (key) do update set value = excluded.value, updated_at = now();
    end if;
  end if;
  if p ? 'site_url' then
    v := rtrim(btrim(coalesce(p ->> 'site_url', '')), '/');
    if v ~ '^https://[a-z0-9.-]+(:[0-9]+)?$' or v ~ '^http://(localhost|127\.0\.0\.1)(:[0-9]+)?$' then
      insert into site_private.settings (key, value) values ('site_url', v)
      on conflict (key) do update set value = excluded.value, updated_at = now();
    end if;
  end if;
  return public.site_settings_admin();
end $$;

/** Sinov xabari */
create or replace function public.site_telegram_test() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare n int;
begin
  perform site_private.require_admin();
  if not site_private.pg_net_ready() then
    raise exception 'Supabase''da pg_net kengaytmasi yoqilmagan: Database → Extensions → pg_net';
  end if;
  if coalesce(site_private.setting('telegram_bot_token'), '') = '' or coalesce(site_private.setting('telegram_chat_ids'), '') = '' then
    raise exception 'Avval bot tokeni va chat ID ni saqlang';
  end if;
  n := site_private.tg_send('✅ <b>Tizimchi sayti</b>' || e'\n' || 'Telegram xabarlari ulandi: yangi demo so''rovlari shu yerga keladi.');
  return jsonb_build_object('queued', n);
end $$;

-- ---------------------------------------------------------------------
-- 7. Adminlarni boshqarish — faqat SQL Editor'dan (postgres), brauzerdan chaqirib bo'lmaydi
--    1) Supabase → Authentication → Users → «Add user»: email va parol, «Auto Confirm User» belgisi bilan.
--    2) select public.site_admin_add('siz@example.com');
-- ---------------------------------------------------------------------
create or replace function public.site_admin_add(p_email text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
  if v_id is null then
    raise exception 'Bunday foydalanuvchi yo''q: avval Authentication → Users → «Add user» orqali % ni qo''shing', p_email;
  end if;
  insert into site_private.admins (user_id, email) values (v_id, lower(btrim(p_email)))
  on conflict (user_id) do update set email = excluded.email;
  return 'Admin qo''shildi: ' || lower(btrim(p_email));
end $$;

create or replace function public.site_admin_remove(p_email text) returns text
language plpgsql volatile security definer set search_path = '' as $$
begin
  delete from site_private.admins where lower(email) = lower(btrim(p_email));
  if not found then return 'Bunday admin yo''q: ' || p_email; end if;
  return 'Admin olib tashlandi: ' || lower(btrim(p_email));
end $$;

-- ---------------------------------------------------------------------
-- 8. Huquqlar: kim qaysi funksiyani chaqira oladi
-- ---------------------------------------------------------------------
revoke all on function public.site_tutorials_public(), public.site_lead_submit(jsonb), public.site_admin_me(),
  public.site_tutorials_admin(), public.site_tutorial_save(jsonb), public.site_tutorial_delete(uuid), public.site_tutorial_move(uuid, int),
  public.site_leads_admin(text), public.site_lead_update(uuid, jsonb), public.site_lead_delete(uuid), public.site_settings_admin(),
  public.site_settings_save(jsonb), public.site_telegram_test(), public.site_admin_add(text), public.site_admin_remove(text) from public;
do $$ begin
  -- sayt mehmoni (anon) va kirgan foydalanuvchi: faqat ochiq funksiyalar
  execute 'grant execute on function public.site_tutorials_public(), public.site_lead_submit(jsonb) to anon, authenticated, service_role';
  -- kirgan foydalanuvchi: admin funksiyalari (ichida admin ekani tekshiriladi)
  execute 'grant execute on function public.site_admin_me(), public.site_tutorials_admin(), public.site_tutorial_save(jsonb),
    public.site_tutorial_delete(uuid), public.site_tutorial_move(uuid, int), public.site_leads_admin(text), public.site_lead_update(uuid, jsonb),
    public.site_lead_delete(uuid), public.site_settings_admin(), public.site_settings_save(jsonb), public.site_telegram_test() to authenticated';
  execute 'revoke all on function public.site_admin_add(text), public.site_admin_remove(text) from anon, authenticated';
exception when undefined_object then null; end $$;

-- API (PostgREST) yangi funksiyalarni darhol ko'rsin
notify pgrst, 'reload schema';
