// One-time parity audit against the text captured before removing source documents.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadContentModules } from "./content-modules.mjs";

const { content } = loadContentModules();
const baseline = JSON.parse(fs.readFileSync("scripts/reports/pathology-text-migration.json", "utf8"));
const records = content.getPathologyRecords();
assert.equal(records.length, baseline.records);
for (const { slug } of records) {
  const record = content.getCaseContent(slug);
  const text = { summary: record.item.summary, system: record.system,
    documentSections: record.documentSections, sections: record.sections,
    localCases: record.localCases, sourceCount: record.sourceCount };
  const hash = createHash("sha256").update(JSON.stringify(text)).digest("hex");
  assert.equal(hash, baseline.hashes[slug], `Migration altered published content: ${slug}`);
}
console.log(`Migration parity OK: all text fields preserved for ${records.length} cases.`);
