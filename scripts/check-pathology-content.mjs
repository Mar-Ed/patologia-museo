import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { loadContentModules, readModule } from "./content-modules.mjs";

const guardedFs = { ...fs, readFileSync(file, ...args) {
  assert.ok(!String(file).toLowerCase().endsWith(".md"), "Website content must never read a Markdown document");
  return fs.readFileSync(file, ...args);
} };
const { content } = loadContentModules(guardedFs);
const videoModule = readModule("lib/pathology-videos.ts");
const catalog = content.getCatalog();
const cleftPalate = content.getCaseContent("hendidura-de-paladar-o-palatosquisis-en-ternero");
const cleftGalleryOrder = ["catalogo1.webp", "catalogo2.webp", "portada.webp", "catalogo4.webp", "catalogo5.webp", "catalogo6.webp", "catalogo7.webp", "catalogo8.webp", "catalogo9.webp", "catalogo10.webp", "catalogo3.webp"];
assert.deepEqual(Array.from(cleftPalate.gallery, url => url.split("/").at(-1)), cleftGalleryOrder, "New cover stays third in the gallery; previous cover goes last");
assert.equal(cleftPalate.gallery[2], cleftPalate.item.cover);
assert.equal(cleftPalate.item.galleryCount, 11);
for (const [index, url] of cleftPalate.gallery.entries()) {
  const prepared = JSON.parse(fs.readFileSync(".generated/media.json", "utf8"))[url];
  assert.equal(cleftPalate.galleryPreviews[index]?.src, prepared.src, "Optimized previews must follow the curated gallery order");
}
const pruneBelly = content.getCaseContent("sindrome-de-prune-belly-y-afasia");
assert.equal(pruneBelly.item.cover, "/patologias/sindrome-de-prune-belly-y-afasia/catalogo4.webp");
assert.ok(pruneBelly.gallery.includes(pruneBelly.item.cover), "Selected cover must remain in the gallery");
assert.match(pruneBelly.item.coverThumbnail, /-256\.webp$/, "Custom cover needs an optimized catalog thumbnail");
assert.equal(catalog.find(item => item.slug === pruneBelly.item.slug).cover, pruneBelly.item.coverThumbnail);
assert.ok(pruneBelly.documentSections.find(section => section.id === "concepto").paragraphs[0].startsWith("En 1839 Frohlich describió por primera vez a un niño que presentaba defecto de la musculatura abdominal lateral, pecho en quilla y falta de descenso testicular."), "Prune Belly description must begin with its historical account, not repeat the hero summary");
assert.ok(pruneBelly.item.summary.startsWith("El Síndrome de Prune Belly"), "Keep the introductory summary unchanged");
const schistosomusDescription = content.getCaseContent("schistosoma-reflexus-incompleto-en-cerdo").documentSections.find(section => section.id === "concepto");
assert.equal(schistosomusDescription.paragraphs.length, 3, "Keep only one Spanish version of the bilingual case summary");
assert.ok(!schistosomusDescription.paragraphs.some(text => text.includes("A sow of") || text.includes("We are before")));
for (const fact of ["Tarapoto (Ungurawi)", "tres años", "160 kg", "diez lechones", "550 g", "región craneal", "agenesia de la pared abdominal"]) assert.ok(schistosomusDescription.paragraphs[0].includes(fact), `Translation must preserve: ${fact}`);
let covers = 0, images = 0, documents = 0, videos = 0;
const noText = [];
const assetUrls = new Set();
for (const item of catalog) {
  const record = content.getCaseContent(item.slug);
  assert.ok(record);
  assert.ok(item.summary.length > 0);
  const assets = [...record.gallery, ...(item.cover ? [item.cover] : [])];
  for (const url of assets) {
    assert.ok(fs.existsSync(path.join("public", decodeURIComponent(url))), `Missing asset: ${url}`);
    assetUrls.add(url);
  }
  const published = JSON.stringify(record, (key, value) => ["blurDataURL", "coverBlur", "posterBlur"].includes(key) ? undefined : value);
  assert.ok(!published.includes("data:image/"));
  assert.ok(!/dedicatoria|agradecimiento|\.md\b|nuestros queridos padres|Consultar Markdown|Documentación textual pendiente|Portada · archivo|Anexo \d/i.test(published), `Unedited source leaked: ${item.slug}`);
  assert.equal(record.sections.length, 5);
  assert.ok(record.references.length > 0 || record.sourceCount > 0);
  assert.ok(record.sections.every(section => section.paragraphs.length || section.points?.length));
  assert.equal(new Set(record.gallery).size, record.gallery.length);
  if (record.videos.length) {
    assert.equal(record.item.galleryCount, record.gallery.length, `Videos must preserve the photo count: ${item.slug}`);
    for (const video of record.videos) {
      const poster = video.poster;
      assert.ok(fs.existsSync(path.join("public", decodeURIComponent(poster))), `Missing video preview: ${poster}`);
      assetUrls.add(poster);
      assert.match(video.url, /^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view\?usp=drive_link$/);
      assert.equal(video.embedUrl, video.url.replace("/view?usp=drive_link", "/preview"));
    }
  }
  covers += Number(Boolean(item.cover)); images += record.gallery.length; videos += record.videos.length; documents += record.sourceCount;
  if (!record.sourceCount) noText.push(item.slug);
}
assert.equal(new Set(catalog.map(item => item.slug)).size, catalog.length);
assert.equal(Object.keys(videoModule.pathologyVideos).length, 14);
assert.equal(videos, 18);
assert.equal(content.getCaseContent("diprosopia-parcial-en-ovino").videos.length, 2);
assert.equal(content.getCaseContent("hipospadia-en-ovino").videos.length, 4);
assert.equal(content.getCaseContent("leiomioma-en-vacuno").videos.length, 1);
for (const slug of Object.keys(videoModule.pathologyVideos)) assert.ok(content.getCaseContent(slug)?.videos.length > 0, `Unlinked video pathology: ${slug}`);
const folders = fs.readdirSync("public/patologias", { withFileTypes: true }).filter(item => item.isDirectory());
for (const folder of folders) assert.ok(!fs.readdirSync(path.join("public/patologias", folder.name)).some(file => /\.md$/i.test(file)), `Source Markdown must not remain in pathology assets: ${folder.name}`);
assert.ok(catalog.length >= folders.length);
assert.ok(content.getCaseContent("artrogriposis-felina").sourceCount > 0);
assert.ok(content.getCaseContent("vesicula-doble-en-canino").documentSections.some(section => section.paragraphs.some(text => text.includes("Kira"))));
assert.ok(content.getCaseContent("pie-zambo-en-cuy").documentSections.some(section => section.paragraphs.some(text => text.includes("Cutí"))));
assert.ok(content.getCaseContent("sindactilia-en-porcino").documentSections.some(section => section.paragraphs.some(text => text.includes("21 de septiembre de 2012"))));
assert.ok(!JSON.stringify(content.getCaseContent("queratomeningocele").documentSections).includes("APARATO REPRODUCTIVO, NORMAL"));
assert.equal(content.getCaseContent("hemopericardio").item.species, "Bovino");
assert.ok(content.getCaseContent("milagritos").sourceCount > 0);
const milagritos = content.getCaseContent("milagritos");
const description = milagritos.documentSections.find(section => section.id === "concepto");
const narrativeFacts = ["Sigueropata", "un solo cerebro", "seis litros de leche al día", "neumonía y shock", "no podía establecerse una etiología definitiva", "supervivencia mayor a la esperada"];
narrativeFacts.forEach((fact, index) => assert.ok(description.paragraphs[index].includes(fact), `Milagritos: missing supplied paragraph ${index + 1}`));
assert.equal(description.paragraphs.length, 6);
assert.ok(milagritos.item.summary.startsWith("El caso “Milagritos” corresponde a un ternero nacido en Cajamarca"));
assert.ok(!/Voy a elaborarlo|no reportado|This report describes|Diprosopia is a rare/.test(JSON.stringify(milagritos)), "Old unedited report must not leak into the case");
assert.ok(content.getCaseContent("vesicula-doble-en-canino").sections[0].paragraphs[0].includes("biliar"));
assert.equal(content.getCaseContent("no-existe"), undefined);
const provisionalUrethra = content.getCaseContent("desciacion-uretral-en-porcino");
assert.equal(provisionalUrethra.sourceCount, 1);
assert.equal(provisionalUrethra.item.species, "Porcino");
assert.equal(provisionalUrethra.system, "Urinario · uretra");
assert.equal(provisionalUrethra.documentSections.length, 5);
assert.equal(provisionalUrethra.localCases.length, 0);
assert.equal(provisionalUrethra.references.length, 3);
assert.ok(provisionalUrethra.item.summary.includes("provisional"));
const incoming = JSON.parse(fs.readFileSync("scripts/reports/new-word-conversion.json", "utf8"));
for (const file of incoming.files) {
  const folder = file.destination.split("/").at(-2);
  const slug = folder.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const record = content.getCaseContent(slug);
  assert.ok(record?.sourceCount > 0, `New Word information missing: ${slug}`);
  assert.ok(!JSON.stringify(record).includes("Te elaboro el informe"));
  assert.ok(record.item.summary.length > 65);
}
assert.equal(content.getCaseContent("miocarcinoma-en-bovino").sourceCount, 2);
for (const slug of ["miocarcinoma-en-bovino", "cancer-de-prostata-en-canino", "leucosis-bovina"]) assert.equal(content.getCaseContent(slug).item.category, "adquirida");
assert.equal(content.getCaseContent("policrusis-en-cuy").item.category, "musculoesqueletica");
console.log(JSON.stringify({ records: catalog.length, covers, galleryImages: images, videos, documents, recordsWithoutText: noText }, null, 2));
if (process.argv[2]) {
  const base = process.argv[2];
  const urls = [...assetUrls, ...catalog.map(item => `/patologias/${item.slug}`), "/", "/catalogo"];
  for (let i = 0; i < urls.length; i += 8) await Promise.all(urls.slice(i, i + 8).map(async url => {
    const response = await fetch(`${base}${url}`, { method: assetUrls.has(url) ? "HEAD" : "GET" });
    assert.equal(response.status, 200, `HTTP failure: ${url}`);
    await response.arrayBuffer();
  }));
  const cover = catalog.find(item => item.cover).cover;
  const optimized = await fetch(`${base}/_next/image?url=${encodeURIComponent(cover)}&w=640&q=75`);
  assert.equal(optimized.status, 200);
  assert.ok(optimized.headers.get("content-type").startsWith("image/"));
  assert.equal((await fetch(`${base}/patologias/no-existe`)).status, 404);
  const documentPath = "documento-1.md";
  assert.equal((await fetch(`${base}/patologias/${encodeURIComponent(folders[0].name)}/${encodeURIComponent(documentPath)}`)).status, 404);
  console.log(`HTTP OK: ${urls.length} pages/assets; image optimization OK; unknown route 404.`);
}
