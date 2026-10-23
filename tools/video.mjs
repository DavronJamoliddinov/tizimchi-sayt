// O'zingiz tayyorlagan video qo'llanmalarni saytga qo'shish (backend ulanmagan bo'lsa; ulangach — /admin/ orqali).
// Manba: video fayl (.mp4, .mov, .mkv, .webm, .avi) yoki YouTube havola. Natija — frontend/content/tutorials.json dagi yozuv;
// fayl bo'lsa, u veb uchun tayyorlanadi: media/qollanmalar/<manzil>.mp4 (H.264 + AAC, «faststart» — darhol boshlanadi,
// eni ko'pi bilan 1920) va <manzil>.jpg muqova. So'ng: npm run build → bash deploy/deploy-vps.sh (videolar ham yuklanadi).
//
//   npm run video -- add <fayl | YouTube havola> --title "Kassada sotuv" --section savdo
//        [--capability kassa] [--industries umumiy,dorixona] [--level beginner|intermediate|advanced]
//        [--description "..."] [--steps "1-qadam | 2-qadam | ..."] [--slug kassada-sotuv] [--featured] [--sort 10]
//        [--poster 12]  (muqova — shu soniyadagi kadr)   [--duration 2:35]  (faqat YouTube uchun)
//   npm run video -- list
//   npm run video -- remove <manzil>
//
// FFMPEG — ffmpeg (standart: PATH, bo'lmasa ilova loyihasining promo/ papkasidagi); MEDIA_URL — videolar manzili.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = path.resolve(ROOT, process.env.APP_DIR || "../dokon_app");
const LIST = path.join(ROOT, "frontend", "content", "tutorials.json");
const OUT = path.join(ROOT, "media", "qollanmalar");
const MEDIA_URL = (process.env.MEDIA_URL || "https://tizimchi.com/media/qollanmalar").replace(/\/+$/, "");
const T = await import("../frontend/src/client/tutorials.js");
const { SECTIONS, INDUSTRIES, LEVELS } = await import("../frontend/content/taxonomy.mjs");
const { CAPABILITY_GROUPS } = await import("../frontend/content/capabilities.mjs");

const die = (m) => { console.error(`✖ ${m}`); process.exit(1); };
const readList = () => (fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : []);
const writeList = (rows) => fs.writeFileSync(LIST, JSON.stringify(rows, null, 2) + "\n");
const fmt = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "—");

/* ---------- Buyruq qatori ---------- */
const [cmd, ...rest] = process.argv.slice(2);
const pos = [], opt = {};
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    if (rest[i + 1] != null && !rest[i + 1].startsWith("--")) opt[k] = rest[++i];
    else opt[k] = true;
  } else pos.push(a);
}

/* ---------- ffmpeg ---------- */
function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return "ffmpeg";
  const p = path.join(APP_DIR, "promo", "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
  if (fs.existsSync(p)) return p;
  die("ffmpeg topilmadi — o'rnating (ffmpeg.org) yoki FFMPEG=<ffmpeg.exe yo'li> bering");
}
const run = (bin, args, inherit = false) => {
  const r = spawnSync(bin, args, { encoding: "utf8", stdio: inherit ? ["ignore", "inherit", "inherit"] : "pipe", maxBuffer: 1 << 26 });
  if (r.status !== 0) die(`${path.basename(bin)}: ${(r.stderr || "").trim().slice(-800) || `chiqish kodi ${r.status}`}`);
  return r.stdout;
};

/** «O'zbekcha sarlavha» → «ozbekcha-sarlavha» */
const slugify = (s) => String(s).toLowerCase()
  .replace(/[ʻʼ‘’'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10);
const parseDuration = (v) => {
  if (v == null || v === true) return null;
  const m = /^(?:(\d+):)?(\d+)$/.exec(String(v).trim());
  if (!m) die(`--duration: «${v}» — masalan 2:35 yoki 155`);
  return (Number(m[1] || 0) * 60) + Number(m[2]);
};

/* ---------- add ---------- */
function add() {
  const src = pos[0];
  if (!src) die("Video fayl yoki YouTube havolasini bering: npm run video -- add <fayl | havola> --title \"...\" --section savdo");
  const title = typeof opt.title === "string" ? opt.title.trim() : "";
  if (!title) die("--title \"Sarlavha\" shart");
  const sections = SECTIONS.map(([c]) => c);
  if (!sections.includes(opt.section)) die(`--section: ${sections.join(", ")}`);
  const group = CAPABILITY_GROUPS.find((g) => g.id === opt.section);
  const capability = typeof opt.capability === "string" ? opt.capability : null;
  if (capability && !group?.items.some((x) => x.id === capability)) {
    die(`--capability «${opt.section}» bo'limida: ${(group?.items || []).map((x) => x.id).join(", ") || "yo'q"}`);
  }
  const industries = typeof opt.industries === "string" ? opt.industries.split(",").map((s) => s.trim()).filter(Boolean) : [T.ALL];
  const known = [T.ALL, ...INDUSTRIES.map(([c]) => c)];
  for (const i of industries) if (!known.includes(i)) die(`--industries: ${known.join(", ")}`);
  const level = typeof opt.level === "string" ? opt.level : "beginner";
  if (!LEVELS.some(([c]) => c === level)) die(`--level: ${LEVELS.map(([c]) => c).join(", ")}`);
  const slug = typeof opt.slug === "string" ? opt.slug : slugify(title);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) die(`Manzil (slug) noto'g'ri: «${slug}» — --slug lotin harf, raqam va «-» bilan bering`);
  const steps = typeof opt.steps === "string" ? opt.steps.split("|").map((s) => s.trim()).filter(Boolean) : [];

  const rows = readList();
  const old = rows.find((r) => r.slug === slug);
  let video_url, thumbnail_url = "", duration_sec;
  if (/^https?:\/\//i.test(src)) {
    const v = T.parseVideo(src);
    if (!v) die("Havola qabul qilinmadi: faqat YouTube (youtube.com/watch, youtu.be, /shorts/) yoki https .mp4/.webm");
    video_url = src.trim();
    duration_sec = parseDuration(opt.duration) ?? old?.duration_sec ?? null;
  } else {
    if (!fs.existsSync(src)) die(`Fayl topilmadi: ${src}`);
    const FFMPEG = findFfmpeg();
    const FFPROBE = FFMPEG === "ffmpeg" ? "ffprobe" : path.join(path.dirname(FFMPEG), "ffprobe.exe");
    const info = JSON.parse(run(FFPROBE, ["-v", "error", "-show_entries",
      "format=duration:stream=codec_type,codec_name,pix_fmt,width", "-of", "json", src]));
    const vs = info.streams.find((s) => s.codec_type === "video");
    const as = info.streams.find((s) => s.codec_type === "audio");
    if (!vs) die("Faylda video yo'q");
    fs.mkdirSync(OUT, { recursive: true });
    const mp4 = path.join(OUT, `${slug}.mp4`), jpg = path.join(OUT, `${slug}.jpg`), tmp = `${mp4}.tmp.mp4`;
    // Brauzerlar uchun tayyor bo'lsa — qayta kodlanmaydi (sifat yo'qolmaydi), faqat boshiga ko'chiriladi (faststart)
    const ready = /\.mp4$/i.test(src) && vs.codec_name === "h264" && vs.pix_fmt === "yuv420p" && vs.width <= 1920 && (!as || as.codec_name === "aac");
    console.log(ready ? "▶ video tayyor — faqat vebga moslanadi" : "▶ veb uchun kodlanmoqda (H.264 + AAC) — uzun videoda bir necha daqiqa…");
    run(FFMPEG, ["-y", "-loglevel", "error", "-stats", "-i", src,
      ...(ready ? ["-c", "copy"] : ["-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
        "-vf", "scale='trunc(min(1920,iw)/2)*2':-2", ...(as ? ["-c:a", "aac", "-b:a", "128k", "-ac", "2"] : ["-an"])]),
      "-map_metadata", "-1", "-movflags", "+faststart", tmp], true);
    fs.renameSync(tmp, mp4);
    const dur = Number(JSON.parse(run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "json", mp4])).format.duration);
    duration_sec = Math.round(dur);
    const at = opt.poster != null && opt.poster !== true ? Number(opt.poster) : Math.min(dur * 0.15, 20);
    if (!(at >= 0 && at < dur)) die(`--poster: 0 … ${Math.floor(dur)} soniya`);
    run(FFMPEG, ["-y", "-loglevel", "error", "-ss", at.toFixed(2), "-i", mp4, "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", "-q:v", "3", jpg]);
    video_url = `${MEDIA_URL}/${slug}.mp4?v=${hash(mp4)}`;
    thumbnail_url = `${MEDIA_URL}/${slug}.jpg?v=${hash(jpg)}`;
    console.log(`  ${path.relative(ROOT, mp4)} — ${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB, ${fmt(duration_sec)}`);
  }

  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const row = {
    id: old?.id || crypto.randomUUID(), slug, title,
    description: typeof opt.description === "string" ? opt.description.trim() : old?.description || "",
    video_url, thumbnail_url, captions_url: null, industries, product_section: opt.section, capability, difficulty: level,
    duration_sec, tags: old?.tags || [], steps: steps.length ? steps : old?.steps || [], transcript: old?.transcript || "",
    sort_order: opt.sort != null && opt.sort !== true ? Number(opt.sort) : old?.sort_order ?? (Math.max(0, ...rows.map((r) => r.sort_order || 0)) + 10),
    is_featured: opt.featured === true || (opt.featured == null && old?.is_featured === true),
    published_at: old?.published_at || now, updated_at: now,
  };
  if (!T.normalize(row)) die("Yozuv sayt qoidalariga mos kelmadi (sarlavha, manzil yoki video havolasini tekshiring)");
  writeList(old ? rows.map((r) => (r.slug === slug ? row : r)) : [...rows, row]);
  console.log(`✓ ${old ? "yangilandi" : "qo'shildi"}: «${title}» → /video-qollanmalar/${slug}/`);
  console.log("  Saytga chiqarish: npm run build, so'ng bash deploy/deploy-vps.sh");
}

/* ---------- list / remove ---------- */
function list() {
  const rows = readList();
  if (!rows.length) return console.log("Hozircha video yo'q — qo'shish: npm run video -- add <fayl | havola> --title \"...\" --section savdo");
  for (const r of [...rows].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))) {
    const kind = T.parseVideo(r.video_url)?.kind === "youtube" ? "YouTube" : "fayl";
    console.log(`${String(r.sort_order ?? "").padStart(4)}  ${r.slug.padEnd(36)} ${fmt(r.duration_sec).padStart(6)}  ${kind.padEnd(7)} ${r.product_section}${r.is_featured ? "  ★" : ""}  ${r.title}`);
  }
}
function remove() {
  const slug = pos[0];
  const rows = readList();
  if (!rows.some((r) => r.slug === slug)) die(`«${slug}» yo'q — ro'yxat: npm run video -- list`);
  writeList(rows.filter((r) => r.slug !== slug));
  for (const ext of ["mp4", "jpg"]) fs.rmSync(path.join(OUT, `${slug}.${ext}`), { force: true });
  console.log(`✓ o'chirildi: ${slug} (serverdan keyingi deploy'da o'chadi)`);
}

if (cmd === "add") add();
else if (cmd === "list") list();
else if (cmd === "remove") remove();
else die("Buyruq: add | list | remove (yo'riqnoma — tools/video.mjs boshida)");
