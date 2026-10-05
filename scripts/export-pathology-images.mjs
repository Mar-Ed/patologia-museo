import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import sharp from "sharp";
import { isImageDirectory } from "./image-source-policy.mjs";

const require = createRequire(import.meta.url);
const sourceRoot = path.resolve("public/documentos_patologia_actualizados");
const targetRoot = path.resolve("public/patologias");
const exportReportPath = path.resolve("scripts/reports/pathology-image-export.json");
const apply = process.argv.includes("--apply");
const reportPath = apply ? exportReportPath : path.resolve("scripts/reports/pathology-image-audit.json");
const extensions = /\.(jpe?g|jfif|png|webp|gif|heic|heif|bmp|tiff?|avif)$/i;
const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const slug = value => value.replace(/\(CD.*\)/i, "").replace(/}/g, "").trim().toLowerCase().replace(/[^a-z0-9ñáéíóú]+/gi, "-").replace(/^-|-$/g, "");
const hash = data => crypto.createHash("sha256").update(data).digest("hex");
const sort = (a, b) => a.localeCompare(b, "es", { numeric: true });
function walk(directory, insideImages = false) {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => sort(a.name, b.name)).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file, insideImages || isImageDirectory(entry.name)) : insideImages && entry.isFile() && extensions.test(entry.name) ? [file] : [];
  });
}
let decodeHeic;
async function encode(file, data) {
  if (/\.hei[cf]$/i.test(file)) {
    decodeHeic ??= require("../.media-tools/node_modules/heic-decode");
    const image = await decodeHeic({ buffer: data });
    return sharp(Buffer.from(image.data), { raw: { width: image.width, height: image.height, channels: 4 } }).webp({ quality: 80 }).toBuffer();
  }
  // Same settings as the previous exporter: existing conversions match byte-for-byte.
  return sharp(data).webp({ quality: 80 }).toBuffer();
}

const previous = fs.existsSync(exportReportPath) ? JSON.parse(fs.readFileSync(exportReportPath, "utf8")) : { pathologies: [] };
const previousImages = new Map(previous.pathologies.flatMap(item => item.images).filter(item => item.sourceHash && item.destination).map(item => [item.source, item]));
const folders = fs.readdirSync(targetRoot, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name);
const report = { source: "public/documentos_patologia_actualizados", mode: apply ? "apply" : "audit", summary: { pathologies: 0, sourceImages: 0, added: 0, existing: 0, duplicates: 0, failures: 0 }, pathologies: [] };
const sources = fs.readdirSync(sourceRoot, { withFileTypes: true }).filter(item => item.isDirectory()).sort((a, b) => sort(a.name, b.name));
if (new Set(sources.map(item => normalize(slug(item.name)))).size !== sources.length) throw new Error("Source folders have ambiguous destination names");
async function processFolder(sourceFolder) {
  const id = slug(sourceFolder.name);
  const matches = folders.filter(folder => normalize(folder) === normalize(id));
  if (matches.length > 1) throw new Error(`Ambiguous destination: ${sourceFolder.name}`);
  const destinationFolder = matches[0] ?? id;
  const directory = path.join(targetRoot, destinationFolder);
  const sourceDirectory = path.join(sourceRoot, sourceFolder.name);
  // Only descend into image collections: root photos are intentionally excluded.
  const files = walk(sourceDirectory).sort(sort);
  const result = { sourceFolder: sourceFolder.name, destinationFolder, sourceImages: files.length, added: 0, existing: 0, duplicates: 0, failures: 0, images: [] };
  const existingFiles = fs.existsSync(directory) ? fs.readdirSync(directory).filter(file => /^(portada|catalogo.*)\.webp$/i.test(file)) : [];
  const known = new Map(existingFiles.map(file => [hash(fs.readFileSync(path.join(directory, file))), path.join(directory, file)]));
  const seenSources = new Map();
  let hasCover = existingFiles.some(file => /^portada\.webp$/i.test(file));
  let next = Math.max(0, ...existingFiles.map(file => Number(file.match(/^catalogo(\d+)\.webp$/i)?.[1] ?? 0))) + 1;
  for (const file of files) {
    const source = path.relative(sourceRoot, file).split(path.sep).join("/");
    const data = fs.readFileSync(file);
    const sourceHash = hash(data);
    const entry = { source, sourceHash };
    try {
      const prior = previousImages.get(source);
      let found = seenSources.get(sourceHash);
      if (found) {
        entry.status = "duplicate"; entry.destination = found; result.duplicates++;
      } else if (prior && prior.sourceHash === sourceHash && fs.existsSync(path.resolve(prior.destination)) && hash(fs.readFileSync(path.resolve(prior.destination))) === prior.outputHash) {
        entry.status = "existing"; entry.destination = prior.destination; entry.outputHash = prior.outputHash; result.existing++;
      } else {
        const encoded = await encode(file, data);
        const outputHash = hash(encoded);
        found = known.get(outputHash);
        entry.outputHash = outputHash;
        if (found) {
          entry.status = "existing"; entry.destination = path.relative(process.cwd(), found).split(path.sep).join("/"); result.existing++;
        } else {
          const name = !hasCover ? "portada.webp" : `catalogo${next++}.webp`;
          const output = path.join(directory, name);
          entry.status = apply ? "added" : "missing"; entry.destination = path.relative(process.cwd(), output).split(path.sep).join("/");
          if (apply) { fs.mkdirSync(directory, { recursive: true }); fs.writeFileSync(output, encoded, { flag: "wx" }); }
          known.set(outputHash, output); hasCover = true; result.added++;
        }
      }
      if (!entry.outputHash && entry.destination && fs.existsSync(path.resolve(entry.destination))) entry.outputHash = hash(fs.readFileSync(path.resolve(entry.destination)));
      seenSources.set(sourceHash, entry.destination);
    } catch (error) { entry.status = "failed"; entry.error = error.message; result.failures++; }
    result.images.push(entry);
  }
  report.pathologies.push(result);
  report.summary.pathologies++;
  report.summary.sourceImages += files.length;
  for (const key of ["added", "existing", "duplicates", "failures"]) report.summary[key] += result[key];
  console.log(`${sourceFolder.name}: ${files.length} source, ${result.added} ${apply ? "added" : "missing"}, ${result.existing} existing, ${result.duplicates} duplicates, ${result.failures} failed`);
}
let nextFolder = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (nextFolder < sources.length) await processFolder(sources[nextFolder++]);
}));
report.pathologies.sort((a, b) => sort(a.sourceFolder, b.sourceFolder));
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
process.exitCode = report.summary.failures ? 1 : 0;
