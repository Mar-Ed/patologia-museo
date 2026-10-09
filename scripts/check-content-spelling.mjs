import assert from "node:assert/strict";
import fs from "node:fs";
import { loadContentModules } from "./content-modules.mjs";

const { metadata, content, text } = loadContentModules();
// Only unambiguous missing accents: do not alter «si», «esta», «ano», «nucleicos»,
// accepted medical variants, official references, URLs, identifiers or filenames.
const missingAccent = /(?<![\p{L}\p{N}_])(?:celulas|vesicula|sindrome|cronica|congenita|vertebras|ciclopia|patologia|parpado|megaureter|numero|gonadas|bifido|retrogrado|metaplasico)(?![\p{L}\p{N}_])/iu;
const technicalFields = new Set(["id", "referenceIds", "cover", "galleryOrder"]);
function inspect(value, field) {
  if (typeof value === "string") {
    assert.ok(!missingAccent.test(value), `Missing accent in ${field}: ${value}`);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (!technicalFields.has(key)) inspect(child, `${field}.${key}`);
    }
  }
}
for (const [slug, entry] of Object.entries(text.pathologyText)) inspect(entry, slug);
const catalog = content.getCatalog();
const escapeHtml = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
for (const item of metadata.pathologies) {
  const record = content.getCaseContent(item.slug);
  for (const image of [record.item.cover, ...record.gallery].filter(Boolean)) {
    assert.ok(fs.existsSync(`public${decodeURIComponent(image)}`), `Image path changed or missing: ${item.slug}: ${image}`);
  }
  inspect(record.item.name, `${item.slug}.name`);
  inspect(record.item.summary, `${item.slug}.summary`);
  assert.equal(catalog.find(entry => entry.slug === item.slug)?.name, item.name);
  const html = fs.readFileSync(`.next/server/app/patologias/${item.slug}.html`, "utf8");
  assert.ok(html.includes(`<h1>${escapeHtml(item.name)}</h1>`), `Corrected heading missing in production: ${item.slug}`);
}
assert.ok(metadata.findPathology("tumor-de-celulas-escamosas-enucleacion-de-ojo").name.includes("Células"));
const ocularSlug = "tumor-de-celulas-escamosas-enucleacion-de-ojo";
const ocularRecord = content.getCaseContent(ocularSlug);
assert.ok(!JSON.stringify(ocularRecord).includes("B.O.S.C.C."), "Removed abbreviation must not appear in the ocular case");
assert.ok(!fs.readFileSync(`.next/server/app/patologias/${ocularSlug}.html`, "utf8").includes("B.O.S.C.C."), "Removed abbreviation must not appear in production HTML");
assert.equal(metadata.findPathology("escoliosis-ovina-ii").name, "Escoliosis ovina II");
assert.equal(content.getCaseContent("leiomioma-en-vacuno").videos.length, 0);
console.log(`Spelling: ${Object.keys(text.pathologyText).length} case texts audited; ${catalog.length} catalog names and production headings verified; leiomyoma video removed.`);
