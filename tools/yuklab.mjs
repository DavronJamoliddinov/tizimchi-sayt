// Ilovani yuklab olish fayllari: Windows o'rnatgichi (.exe) va Android ilovasi (.apk) → yuklab/ (git'ga tushmaydi) va
// frontend/content/downloads.json (versiya, hajm, SHA-256, imzo — «Yuklab olish» sahifasi shundan chiziladi).
// So'ng: npm run build → bash deploy/deploy-vps.sh (fayllar tizimchi.com/yuklab/ ga yuklanadi, serverda SHA-256 tekshiriladi).
//
//   npm run yuklab                         — ilova loyihasidagi eng yangi fayllar (APP_DIR, standart ../dokon_app):
//                                            desktop/dist/Tizimchi-Setup-<versiya>.exe va mobile/dist/Tizimchi-<versiya>.apk
//                                            (yig'ish: ilova loyihasida «cd desktop && npm run build» va «npm run android»)
//   npm run yuklab -- --windows <fayl.exe> --android <fayl.apk>   — aniq fayllar (nomida versiya bo'lishi shart)
//
// APK imzosi apksigner bilan tekshiriladi (Android SDK bo'lsa); imzo sertifikati sahifada ko'rsatiladi.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = path.resolve(ROOT, process.env.APP_DIR || "../dokon_app");
const OUT = path.join(ROOT, "yuklab");
const META = path.join(ROOT, "frontend", "content", "downloads.json");
const die = (m) => { console.error(`✖ ${m}`); process.exit(1); };

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const vnum = (v) => v.split(".").reduce((a, n) => a * 1000 + Number(n), 0);
/** papkadagi eng yangi versiyali fayl */
function newest(dir, re) {
  if (!fs.existsSync(dir)) return null;
  const hits = fs.readdirSync(dir).map((f) => ({ f, m: re.exec(f) })).filter((x) => x.m).sort((a, b) => vnum(b.m[1]) - vnum(a.m[1]));
  return hits.length ? path.join(dir, hits[0].f) : null;
}
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const today = () => new Date().toISOString().slice(0, 10);

/** Windows Authenticode imzosi (faqat Windows'da tekshiriladi; boshqa tizimda — noma'lum) */
function exeSigned(file) {
  if (process.platform !== "win32") return null;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", `(Get-AuthenticodeSignature -LiteralPath '${file.replace(/'/g, "''")}').Status`], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() === "Valid" : null;
}

/** APK imzosi: apksigner verify (Android SDK va JDK bo'lsa) → sertifikat SHA-256; bo'lmasa — ilovaning assetlinks.json idan */
function apkCert(file) {
  const win = process.platform === "win32";
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), ".local");
  const subdirs = (d) => (fs.existsSync(d) ? fs.readdirSync(d).map((x) => path.join(d, x)) : []);
  const sdk = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, path.join(local, "Android", "Sdk")]
    .filter(Boolean).find((p) => fs.existsSync(path.join(p, "build-tools")));
  const bt = sdk && fs.readdirSync(path.join(sdk, "build-tools")).filter((v) => /^\d+\.\d+\.\d+$/.test(v)).sort((a, b) => vnum(b) - vnum(a))[0];
  // apksigner Java'da ishlaydi: ilovaning mobile/build-apk.mjs i qidiradigan joylar
  const jdk = [process.env.JAVA_HOME, "C:/Program Files/Android/Android Studio/jbr", path.join(local, "Programs", "Android Studio", "jbr"),
    ...subdirs("C:/Program Files/Android/openjdk"), ...subdirs("C:/Program Files/Eclipse Adoptium"), ...subdirs("C:/Program Files/Microsoft")]
    .filter(Boolean).find((h) => fs.existsSync(path.join(h, "bin", win ? "java.exe" : "java")));
  if (bt && jdk) {
    const exe = path.join(sdk, "build-tools", bt, win ? "apksigner.bat" : "apksigner");
    const r = spawnSync(win ? `"${exe}"` : exe, ["verify", "--print-certs", `"${file}"`], { encoding: "utf8", shell: win, env: { ...process.env, JAVA_HOME: jdk } });
    if (r.status !== 0) die(`APK imzosi yaroqsiz: ${(r.stderr || r.stdout).trim().slice(0, 400)}`);
    const hex = (/certificate SHA-256 digest:\s*([0-9a-f]{64})/i.exec(r.stdout) || [])[1];
    if (hex) return hex.toUpperCase().match(/../g).join(":");
  }
  try {
    const links = JSON.parse(fs.readFileSync(path.join(APP_DIR, "web", ".well-known", "assetlinks.json"), "utf8"));
    console.log("  ! apksigner topilmadi — imzo ilovaning assetlinks.json idan olindi (APK shu kalit bilan imzolangan bo'lishi kerak)");
    return links[0].target.sha256_cert_fingerprints[0];
  } catch (_) {
    return null;
  }
}

const sources = {
  windows: opt("windows") || newest(path.join(APP_DIR, "desktop", "dist"), /^Tizimchi-Setup-(\d+\.\d+\.\d+)\.exe$/),
  android: opt("android") || newest(path.join(APP_DIR, "mobile", "dist"), /^Tizimchi-(\d+\.\d+\.\d+)\.apk$/),
};
const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, "utf8")) : {};
fs.mkdirSync(OUT, { recursive: true });
let changed = 0;
for (const [plat, src] of Object.entries(sources)) {
  if (!src) { console.log(`  ${plat}: fayl topilmadi — o'tkazib yuborildi${meta[plat] ? ` (saytda avvalgisi qoladi: ${meta[plat].file})` : ""}`); continue; }
  if (!fs.existsSync(src)) die(`${plat}: ${src} yo'q`);
  const version = (/(\d+\.\d+\.\d+)/.exec(path.basename(src)) || [])[1];
  if (!version) die(`${plat}: fayl nomida versiya yo'q (masalan Tizimchi-Setup-2.11.0.exe): ${src}`);
  const file = plat === "windows" ? `Tizimchi-Setup-${version}.exe` : `Tizimchi-${version}.apk`;
  const sum = sha256(src);
  const entry = { file, version, bytes: fs.statSync(src).size, sha256: sum, date: meta[plat]?.sha256 === sum ? meta[plat].date : today() };
  if (plat === "windows") entry.signed = exeSigned(src);
  if (plat === "android") { entry.cert_sha256 = apkCert(src); entry.min_android = "8.0"; }
  fs.copyFileSync(src, path.join(OUT, file));
  if (JSON.stringify(meta[plat]) !== JSON.stringify(entry)) changed++;
  meta[plat] = entry;
  console.log(`✓ ${plat}: ${file} — ${(entry.bytes / 1048576).toFixed(1)} MB, SHA-256 ${sum.slice(0, 16)}…${plat === "windows" ? `, imzo: ${entry.signed ? "bor" : "yo'q"}` : ""}`);
}
fs.writeFileSync(META, JSON.stringify(meta, null, 2) + "\n");
console.log(`→ ${path.relative(ROOT, META)}${changed ? "" : " (o'zgarmadi)"}; saytga chiqarish: npm run build, so'ng bash deploy/deploy-vps.sh`);
