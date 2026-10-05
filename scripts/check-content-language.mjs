import assert from "node:assert/strict";
import fs from "node:fs";
import { loadContentModules } from "./content-modules.mjs";

const { content, text } = loadContentModules();
// Unicode boundaries avoid flagging Spanish words such as «reportó» or «reportándose».
// Bibliographic titles and accepted names (Prune Belly, Bos taurus, Sonic Hedgehog)
// retain their official spelling; reference IDs are not reader-facing prose.
const englishNarrative = /(?<![\p{L}\p{N}_])(?:the|with|was|were|which|and|this|its|are|has|have|their|from|between|known|syndrome|first case|syndactyly|keywords|key words|scoliosis|cyclopia|anencephaly|palatoschisis|hemopericardium|hydranencephaly|freaky|rye grass|like|report|study|sheep|cattle|sow|cleft|newborn|congenital|disease|malformation|findings|diagnosis|treatment)(?![\p{L}\p{N}_])/iu;
const reviewed = [
  "hendidura-de-paladar-o-palatosquisis-en-ternero",
  "hemopericardio", "escoliosis-ovina-ii", "ciclopia-felina-ii",
  "ciclopia-y-arrinia-canina", "anencefalia-y-acrania-ovino",
  "hidranencefalia-y-cifosis-congenita-grave-en-bovino",
  "amelia-posterior-total-de-ovino", "diprosopia-parcial-en-ovino",
  "diprosopia-parcial-en-ovino-ii", "diprosopia-en-caprinos",
  "craneotoracopago-en-cuy-2", "craneotoracopago-en-ovino",
  "monorquidismo-unilateral-en-bovino", "caso-sindactilia-porcino",
  "sindactilia-en-porcino", "sindrome-de-prune-belly-y-afasia",
  "leiomioma-en-vacuno",
];
function inspect(value, field) {
  if (typeof value === "string") {
    assert.ok(!englishNarrative.test(value), `Untranslated narrative: ${field}: ${value}`);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key !== "referenceIds") inspect(child, `${field}.${key}`);
    }
  }
}
for (const [slug, entry] of Object.entries(text.pathologyText)) inspect(entry, slug);
for (const item of content.getCatalog()) inspect(item.summary, `catalog.${item.slug}.summary`);

const facts = {
  "hendidura-de-paladar-o-palatosquisis-en-ternero": ["Bos taurus", "Holstein", "un mes", "El Álamo, Otuzco", "deglución"],
  "hemopericardio": ["bovino adulto", "necropsia", "taponamiento cardíaco", "líquido seroso"],
  "escoliosis-ovina-ii": ["ovino macho", "criolla", "miasis", "larvas de dípteros", "necropsia"],
  "ciclopia-felina-ii": ["posibilidad", "organogénesis temprana", "sin establecer una causa definitiva"],
  "ciclopia-y-arrinia-canina": ["Moreno et al. (2008)", "feto de sexo femenino", "párpados fusionados", "Pérez (2010)", "ocho casos", "dos de ellos", "probóscides bilaterales"],
  "anencefalia-y-acrania-ovino": ["Cajamarca", "neonato hembra", "cóndilos occipitales", "ausencia de conductos auditivos"],
  "hidranencefalia-y-cifosis-congenita-grave-en-bovino": ["diagnóstico presuntivo", "hipoplasia pulmonar", "hipoplasia renal", "no se pudo determinar la etiología"],
  "amelia-posterior-total-de-ovino": ["Cuyumalca", "noviembre del 2015", "15 de cada 1 000", "Flech, 2006"],
  "diprosopia-parcial-en-ovino": ["Otuzco", "La Libertad", "tres lenguas", "monta natural"],
  "diprosopia-parcial-en-ovino-ii": ["Otuzco", "La Libertad", "tres lenguas", "monta natural"],
  "craneotoracopago-en-cuy-2": ["cuatro miembros anteriores y cuatro posteriores", "Christian Jara Honores", "raigrás", "Cavia porcellus"],
  "craneotoracopago-en-ovino": ["02 de noviembre del 2012", "heterópagos asimétricos", "Hellin", "0,01 (1/100)"],
  "monorquidismo-unilateral-en-bovino": ["circunferencia escrotal", "túbulos seminíferos", "Urdaneta de Romero, 1998"],
  "caso-sindactilia-porcino": ["San Isidro", "nació muerto", "21/09/2012", "Fernández Rafael Lorenzo"],
  "sindactilia-en-porcino": ["Sindactilia: adherencia congénita o accidental", "21 de septiembre de 2012"],
  "sindrome-de-prune-belly-y-afasia": ["En 1839 Frohlich", "tipo Prune Belly", "quistes hepáticos serosos"],
  "leiomioma-en-vacuno": ["tipo Prune Belly", "Holstein", "quistes hepáticos serosos"],
};
for (const [slug, expected] of Object.entries(facts)) {
  const entry = JSON.stringify(text.pathologyText[slug]);
  for (const fact of expected) assert.ok(entry.includes(fact), `Missing translated fact: ${slug}: ${fact}`);
}
const escapeHtml = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
for (const slug of reviewed) {
  const record = content.getCaseContent(slug);
  assert.ok(record, `Unpublished case: ${slug}`);
  inspect(record.documentSections, `${slug}.publishedDocuments`);
  inspect(record.sections, `${slug}.publishedSections`);
  const html = fs.readFileSync(`.next/server/app/patologias/${slug}.html`, "utf8");
  assert.ok(html.includes(escapeHtml(record.item.summary.slice(0, 100))), `Spanish summary missing from production HTML: ${slug}`);
  for (const section of record.documentSections) {
    for (const paragraph of section.paragraphs) assert.ok(html.includes(escapeHtml(paragraph)), `Spanish paragraph missing from production HTML: ${slug}.${section.id}`);
  }
  const entry = text.pathologyText[slug];
  for (const section of entry.documentSections) {
    assert.equal(new Set(section.paragraphs).size, section.paragraphs.length, `Duplicate translated paragraph: ${slug}.${section.id}`);
  }
}
console.log(`Language: ${Object.keys(text.pathologyText).length} Spanish case narratives audited; ${reviewed.length} corrected pages verified in production HTML; catalog summaries and clinical details preserved.`);
