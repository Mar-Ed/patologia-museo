import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readStyles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readStyles(path);
    return entry.name.endsWith(".css") ? [readFileSync(path, "utf8")] : [];
  });
}

// Check emitted assets, not source CSS: development can hide missing build styles.
const css = readStyles(join(process.cwd(), ".next", "static")).join("\n");
for (const selector of [
  ".footer-layout", ".footer-brand", ".footer-email", ".footer-address",
  ".footer-map-preview", ".footer-map-link", ".site-footer",
]) {
  assert.ok(css.includes(selector), `Production CSS is missing ${selector}`);
}
assert.match(css, /@media[^{}]*900px/, "Missing tablet footer breakpoint");
assert.match(css, /@media[^{}]*540px/, "Missing mobile footer breakpoint");
console.log("Footer production CSS: layout, map, contact and responsive breakpoints present.");
