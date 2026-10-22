// @ts-check
/* Statik fayllarni dist/assets/ ga xesh bilan ko'chirish: nom.<xesh>.kengaytma — brauzer ularni 1 yil keshlaydi (immutable),
   fayl o'zgarsa nomi ham o'zgaradi. HTML va CSS fayllarga faqat asset("yo'l") orqali murojaat qilinadi. */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname, basename, relative, sep } from "node:path";

export const hash8 = (/** @type {Buffer | string} */ buf) => createHash("sha256").update(buf).digest("hex").slice(0, 8);

/** Papkadagi barcha fayllar (rekursiv) */
export function walk(/** @type {string} */ dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

export class Assets {
  /** @param {string} distDir */
  constructor(distDir) {
    this.dist = distDir;
    /** @type {Map<string, string>} mantiqiy yo'l → /assets/... (xeshli) */
    this.map = new Map();
    /** @type {{ path: string, bytes: number }[]} */
    this.files = [];
  }

  /** Faylni qo'shish: logical — "img/logo.svg" kabi; content — Buffer yoki matn */
  add(/** @type {string} */ logical, /** @type {Buffer | string} */ content) {
    const ext = extname(logical);
    const hashed = `${logical.slice(0, -ext.length)}.${hash8(content)}${ext}`;
    const out = join(this.dist, "assets", ...hashed.split("/"));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, content);
    const url = `/assets/${hashed}`;
    this.map.set(logical, url);
    this.files.push({ path: url, bytes: Buffer.byteLength(content) });
    return url;
  }

  /** Papkadagi fayllarni nisbiy yo'l bilan qo'shish: addDir(".../shots", "shots") → "shots/d-hisobot@1x.webp" */
  addDir(/** @type {string} */ srcDir, /** @type {string} */ prefix, filter = (/** @type {string} */ _f) => true) {
    for (const f of walk(srcDir)) {
      const rel = relative(srcDir, f).split(sep).join("/");
      if (filter(rel)) this.add(`${prefix}/${rel}`, readFileSync(f));
    }
  }

  /** Mantiqiy yo'l → xeshli URL (yo'q bo'lsa — build to'xtaydi: buzuq havola saytga chiqmasin) */
  url(/** @type {string} */ logical) {
    const u = this.map.get(logical);
    if (!u) throw new Error(`Asset topilmadi: ${logical}`);
    return u;
  }

  has(/** @type {string} */ logical) { return this.map.has(logical); }

  get totalBytes() { return this.files.reduce((s, f) => s + f.bytes, 0); }
}

export const fileName = (/** @type {string} */ p) => basename(p);
