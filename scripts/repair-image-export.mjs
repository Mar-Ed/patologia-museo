import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { isAllowedImageSource } from "./image-source-policy.mjs";

const workspace = fs.realpathSync(process.cwd());
const targetRoot = fs.realpathSync(path.resolve("public/patologias"));
const manifestPath = path.resolve("scripts/reports/pathology-image-export.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const hash = data => crypto.createHash("sha256").update(data).digest("hex");
const apply = process.argv.includes("--apply");
const backupRoot = path.resolve("work/image-export-recovery", new Date().toISOString().replace(/[:.]/g, "-"));
assert.ok(backupRoot.startsWith(workspace + path.sep));
assert.ok(targetRoot.startsWith(workspace + path.sep));
const plan = [];
for (const item of manifest.pathologies) {
  const directory = path.resolve(targetRoot, item.destinationFolder);
  assert.ok(directory.startsWith(targetRoot + path.sep));
  if (!fs.existsSync(directory)) continue;
  assert.equal(fs.realpathSync(directory), directory);
  const allowedHashes = new Set(item.images.filter(image => isAllowedImageSource(image.source)).map(image => image.outputHash));
  const allowedDestinations = new Set(item.images.filter(image => isAllowedImageSource(image.source)).map(image => path.resolve(image.destination)));
  const recordedDestinations = new Set(item.images.map(image => path.resolve(image.destination)));
  const recordedHashes = new Set(item.images.map(image => image.outputHash));
  for (const file of fs.readdirSync(directory).filter(file => /^(portada|catalogo.*)\.webp$/i.test(file))) {
    const source = path.join(directory, file);
    assert.equal(fs.realpathSync(source), source);
    const outputHash = hash(fs.readFileSync(source));
    if (allowedDestinations.has(source)) continue;
    // Preserve pre-existing copies not represented by the report only if their
    // content is identical to an image from an authorized subfolder.
    if (!recordedDestinations.has(source) && allowedHashes.has(outputHash)) continue;
    // Do not touch unrecognized or edited files without evidence of provenance.
    assert.ok(recordedHashes.has(outputHash), `Unrecognized image; manual review required: ${source}`);
    const destination = path.resolve(backupRoot, path.relative(targetRoot, source));
    assert.ok(destination.startsWith(backupRoot + path.sep));
    plan.push({ source, destination, outputHash });
  }
}
console.log(JSON.stringify({ mode: apply ? "apply" : "audit", imagesToArchive: plan.length, affectedPathologies: new Set(plan.map(item => path.dirname(item.source))).size, backupRoot }, null, 2));
if (apply && plan.length) {
  // All final targets have been validated above before any move is performed.
  fs.mkdirSync(backupRoot, { recursive: true });
  fs.copyFileSync(manifestPath, path.join(backupRoot, "original-export-report.json"), fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(path.join(backupRoot, "recovery-plan.json"), JSON.stringify(plan, null, 2), { flag: "wx" });
  for (const item of plan) {
    assert.ok(!fs.existsSync(item.destination));
    assert.equal(hash(fs.readFileSync(item.source)), item.outputHash);
    fs.mkdirSync(path.dirname(item.destination), { recursive: true });
    fs.renameSync(item.source, item.destination);
  }
  console.log(`Archived ${plan.length} incorrectly exported images; originals, Markdown and videos unchanged.`);
}
