import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import sharp from "sharp";
import { isAllowedImageSource, isImageDirectory } from "./image-source-policy.mjs";

for (const folder of ["IMAGENES", "Imágenes_", "img", "IMAGEN_", "__IMÁGENES!!", "01_img", "IMAGENES RECORTADAS"]) assert.ok(isImageDirectory(folder), folder);
assert.ok(!isAllowedImageSource("Patología/IMG_123.jpg"));
assert.ok(!isAllowedImageSource("Patología/Documentos/IMG_123.jpg"));
assert.ok(isAllowedImageSource("Patología/Imágenes_/detalle/IMG_123.jpg"));

const report = JSON.parse(fs.readFileSync("scripts/reports/pathology-image-export.json", "utf8"));
assert.equal(report.summary.failures, 0);
const sourceRoot = path.resolve(report.source);
const destinationRoot = path.resolve("public/patologias");
const images = report.pathologies.flatMap(item => item.images);
assert.equal(images.length, report.summary.sourceImages);
const destinations = new Set();
for (const item of images) {
  assert.ok(isAllowedImageSource(item.source), `Image outside an authorized subfolder: ${item.source}`);
  const source = path.resolve(sourceRoot, item.source);
  const destination = path.resolve(item.destination);
  assert.ok(source.startsWith(sourceRoot + path.sep));
  assert.ok(destination.startsWith(destinationRoot + path.sep));
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex"), item.sourceHash, `Original changed: ${item.source}`);
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(destination)).digest("hex"), item.outputHash, `Export mismatch: ${item.destination}`);
  destinations.add(destination);
}
const coveredDestinations = destinations.size;
for (const folder of fs.readdirSync(destinationRoot, { withFileTypes: true }).filter(item => item.isDirectory())) {
  const authorizedHashes = new Set(report.pathologies.filter(item => item.destinationFolder === folder.name).flatMap(item => item.images.map(image => image.outputHash)));
  // Video previews are derived from videos, not photographs from image folders.
  for (const file of fs.readdirSync(path.join(destinationRoot, folder.name)).filter(file => /\.webp$/i.test(file) && !file.endsWith(".poster.webp"))) {
    const destination = path.join(destinationRoot, folder.name, file);
    assert.ok(authorizedHashes.has(crypto.createHash("sha256").update(fs.readFileSync(destination)).digest("hex")), `Image with unauthorized provenance: ${destination}`);
    destinations.add(destination);
  }
}
let next = 0;
const unique = [...destinations];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < unique.length) {
    const file = unique[next++];
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, "webp", file);
    assert.ok(metadata.width > 0 && metadata.height > 0, file);
  }
}));
const example = report.pathologies.find(item => item.sourceFolder === "Craneotoracópago cuy");
assert.ok(example && example.images.length === example.sourceImages);
assert.equal(example.sourceImages, 8);
assert.equal(report.pathologies.find(item => item.sourceFolder === "VESICULA DOBLE EN CANINO").sourceImages, 20);
console.log(JSON.stringify({ pathologies: report.summary.pathologies, originalsUnchanged: images.length, coveredDestinations, validWebpImages: destinations.size, craneotoracopago: example.sourceImages }, null, 2));
