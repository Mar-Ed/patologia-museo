import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { loadContentModules } from "./content-modules.mjs";

const sourceRoot = path.join(process.cwd(), "public", "patologias");
const { content, text } = loadContentModules();
const selectedCovers = new Set(Object.values(text.pathologyText).map(record => record.cover).filter(Boolean));
const outputRoot = path.join(process.cwd(), "public", "media", "patologias");
const generatedRoot = path.join(process.cwd(), ".generated");
fs.mkdirSync(outputRoot, { recursive: true });
fs.mkdirSync(generatedRoot, { recursive: true });
const previousFile = path.join(generatedRoot, "media.json");
const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, "utf8")) : {};
const manifest = {};
const jobs = [];
let originals = 0, prepared = 0;
for (const folder of fs.readdirSync(sourceRoot, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  for (const file of fs.readdirSync(path.join(sourceRoot, folder.name))) {
    if (/^(portada|catalogo.*)\.webp$/i.test(file) || /\.poster\.webp$/i.test(file)) jobs.push({ folder: folder.name, file });
  }
}

// Derived assets only: never rewrite or delete museum originals or Markdown.
async function prepare({ folder, file }) {
  const source = path.join(sourceRoot, folder, file);
  const buffer = fs.readFileSync(source);
  const hash = createHash("sha256").update("museum-preview-v1:1200:82").update(buffer).digest("hex").slice(0, 20);
  const src = `/media/patologias/${hash}-1200.webp`;
  const url = `/patologias/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
  const thumbnail = file.toLowerCase() === "portada.webp" || selectedCovers.has(url) ? `/media/patologias/${hash}-256.webp` : undefined;
  const outputs = [src, ...(thumbnail ? [thumbnail] : [])];
  originals += buffer.length;
  if (previous[url]?.src === src && previous[url]?.thumbnail === thumbnail && outputs.every(output => fs.existsSync(path.join("public", output)))) {
    manifest[url] = previous[url];
  } else {
    const metadata = await sharp(buffer).metadata();
    if (!fs.existsSync(path.join("public", src))) await sharp(buffer).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join("public", src));
    if (thumbnail && !fs.existsSync(path.join("public", thumbnail))) await sharp(buffer).rotate().resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join("public", thumbnail));
    const blur = await sharp(buffer).rotate().resize({ width: 12, height: 12, fit: "inside" }).webp({ quality: 35 }).toBuffer();
    manifest[url] = { src, ...(thumbnail ? { thumbnail } : {}), blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`, width: metadata.width, height: metadata.height };
  }
  prepared += fs.statSync(path.join("public", src)).size;
}
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    await prepare(job);
  }
}));
fs.writeFileSync(previousFile, JSON.stringify(manifest));

// Extract once before dev/build. The list never loads complete case documents.
const brief = text => {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= 180) return value;
  return value.slice(0, 177).replace(/\s+\S*$/, "") + "…";
};
const catalog = content.getPathologyRecords().map(record => {
  const { item } = content.getCaseContent(record.slug);
  return {
    id: item.id, slug: item.slug, name: item.name, species: item.species,
    category: item.category, summary: brief(item.summary),
    ...(item.featured ? { featured: true } : {}),
    ...(item.cover ? { cover: item.coverThumbnail ?? item.cover } : {}),
  };
});
const catalogJson = JSON.stringify(catalog);
fs.writeFileSync(path.join(generatedRoot, "catalog.json"), catalogJson);
console.log(`Prepared ${catalog.length} catalog records (${(Buffer.byteLength(catalogJson) / 1024).toFixed(1)} KiB), ${jobs.length} image previews: ${(originals / 1048576).toFixed(1)} → ${(prepared / 1048576).toFixed(1)} MiB. Originals preserved.`);
