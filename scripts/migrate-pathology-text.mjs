// One-time mechanical migration: keep every published text field unchanged.
// Never run as part of dev/build or overwrite independently edited case files.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadContentModules } from "./content-modules.mjs";

const output = path.resolve("lib/content/patologias");
if (fs.existsSync(output)) throw new Error("Edited pathology data already exists; migration refuses to overwrite it.");
const { content } = loadContentModules();
const records = content.getPathologyRecords().map(item => {
  const record = content.getCaseContent(item.slug);
  return { slug: item.slug, data: {
    summary: record.item.summary, system: record.system,
    documentSections: record.documentSections, sections: record.sections,
    localCases: record.localCases, sourceCount: record.sourceCount,
  } };
});
fs.mkdirSync(output, { recursive: true });
const hashes = {};
for (const { slug, data } of records) {
  const source = `import type { PathologyText } from "../../pathology-text";\n\nconst content: PathologyText = ${JSON.stringify(data, null, 2)};\n\nexport default content;\n`;
  fs.writeFileSync(path.join(output, `${slug}.ts`), source);
  hashes[slug] = createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
const registry = [
  'import type { PathologyText } from "../../pathology-text";',
  ...records.map(({ slug }, index) => `import case${index + 1} from "./${slug}";`),
  "", "// Only imported by the server content loader: browsers receive their current case, not the entire archive.",
  "export const pathologyText: Record<string, PathologyText> = {",
  ...records.map(({ slug }, index) => `  "${slug}": case${index + 1},`),
  "};", "",
].join("\n");
fs.writeFileSync(path.join(output, "index.ts"), registry);
fs.writeFileSync("scripts/reports/pathology-text-migration.json", JSON.stringify({ records: records.length, hashes }, null, 2) + "\n");
console.log(`Migrated ${records.length} cases to editable TypeScript. Source documents and media untouched.`);
