import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const JSZip = require("C:/Users/marce/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/jszip");
const WordExtractor = require("../.media-tools/node_modules/word-extractor");
const root = path.resolve("public/documentos_patologia_actualizados");
const decode = value => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
async function main() {
  const input = process.argv[2];
  if (input === "pie-zambo") {
    const document = await new WordExtractor().extract(path.join(root, "PIE ZAMBO EN CUY (CD)", "PATO LOGYA TERMINADA1.doc"));
    if (process.argv.includes("--archive")) {
      fs.mkdirSync("work/document-recovery", { recursive: true });
      fs.writeFileSync("work/document-recovery/pie-zambo-texto-integral.md", `# Transcripción integral del documento original de pie zambo\n\n${document.getBody().replace(/\n{3,}/g, "\n\n")}\n`);
    }
    console.log(document.getBody());
    return;
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(root, "Sindactilia en porcino (CD)", "IMAGENES", "sindactilia -diapos.pptx")));
  const slides = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  for (const slide of slides) {
    const xml = await zip.file(slide).async("string");
    console.log(`\n## ${slide}\n`);
    for (const paragraph of xml.match(/<a:p[ >][\s\S]*?<\/a:p>/g) ?? []) {
      const text = [...paragraph.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(match => decode(match[1])).join("");
      if (text.trim()) console.log(text);
    }
    console.log(`Pictures: ${(xml.match(/<p:pic>/g) ?? []).length}`);
  }
  for (const note of Object.keys(zip.files).filter(name => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name))) {
    const xml = await zip.file(note).async("string");
    const text = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(match => decode(match[1])).join("\n");
    if (text.trim()) console.log(`\n${note}\n${text}`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
