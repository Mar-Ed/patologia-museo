import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadContentModules, readModule } from "./content-modules.mjs";

const { content } = loadContentModules();
const { DocumentSynthesis } = readModule("components/document-synthesis.tsx");
for (const slug of ["sindactilia-en-porcinos", "caso-sindactilia-porcino"]) {
  const section = content.getCaseContent(slug).documentSections.find(section => section.id === "morfologia");
  assert.equal(section.groups.length, 3);
  assert.equal(section.groups.flatMap(group => group.fields).length, 12);
  assert.equal(section.paragraphs.length, 1, "Keep the anatomical narrative separate from clinical metadata");
  assert.ok(!section.paragraphs.some(text => text.includes("❖")));
  const html = renderToStaticMarkup(React.createElement(DocumentSynthesis, { document: section }));
  assert.equal((html.match(/<dl /g) ?? []).length, 3);
  assert.equal((html.match(/<dt>/g) ?? []).length, 12);
  assert.equal((html.match(/<dd>/g) ?? []).length, 12);
  assert.ok(html.includes("21/09/2012") && html.includes("Fernández Rafael Lorenzo") && html.includes("1,5 años"));
  const page = fs.readFileSync(`.next/server/app/patologias/${slug}.html`, "utf8");
  assert.ok(page.includes('class="clinical-record-fields"'), "Structured fields must be present in the production HTML");
}
const narrative = content.getCaseContent("milagritos").documentSections.find(section => section.id === "concepto");
const narrativeHtml = renderToStaticMarkup(React.createElement(DocumentSynthesis, { document: narrative }));
assert.equal((narrativeHtml.match(/<p>/g) ?? []).length, 6, "Ungrouped narratives must remain unchanged");
assert.ok(!narrativeHtml.includes("clinical-record-fields"));
function cssFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? cssFiles(file) : file.endsWith(".css") ? [fs.readFileSync(file, "utf8")] : [];
  });
}
const css = cssFiles(".next/static").join("\n").replace(/\s/g, "");
assert.ok(css.includes(".clinical-record-fields"));
assert.match(css, /@media\([^)]*(?:max-width:540px|width<=540px)[^)]*\)\{[^}]*\}[\s\S]*?\.clinical-record-fields\{grid-template-columns:minmax\(0,1fr\)/, "Mobile fields must stack in one column");
console.log("Clinical layout: 12 individually labeled fields, three independent groups, mobile layout, production HTML/CSS and unmodified narratives OK.");
