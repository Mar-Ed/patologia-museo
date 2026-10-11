import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadContentModules } from "./content-modules.mjs";

const { content } = loadContentModules();
for (const [slug, count] of [["amelia-parcial-anterior-y-anuro-en-vacuno", 11], ["escoliosis-ovina-ii", 6], ["hipospadia-en-ovino", 43]]) {
  const record = content.getCaseContent(slug);
  assert.ok(record.videos.length > 0);
  assert.equal(record.gallery.length, count, `Videos must coexist with specimen photos: ${slug}`);
}
let mixedCases = 0;
for (const { slug } of content.getPathologyRecords()) {
  const record = content.getCaseContent(slug);
  assert.equal(record.item.galleryCount, record.gallery.length);
  assert.equal(record.galleryPreviews.length, record.gallery.length);
  if (record.videos.length && record.gallery.length) mixedCases++;
  for (const [index, original] of record.gallery.entries()) {
    assert.ok(fs.existsSync(path.join("public", decodeURIComponent(original))), `Missing full-size photo: ${original}`);
    const preview = record.galleryPreviews[index];
    assert.ok(preview && fs.existsSync(path.join("public", preview.src)), `Missing optimized photo: ${original}`);
  }
}
console.log(`Gallery checks passed: ${mixedCases} cases display videos and photos together; all photo originals and previews exist.`);
