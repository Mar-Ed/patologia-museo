import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readModule } from "./content-modules.mjs";

const data = readModule("lib/publications.ts");
const { publications, filterPublications } = data;
assert.equal(publications.length, 14);
assert.equal(new Set(publications.map(item => item.id)).size, publications.length);
assert.equal(new Set(publications.map(item => item.url)).size, publications.length);
assert.ok(publications.every(item => /^https:\/\/doi\.org\/10\./.test(item.url)));
assert.ok(publications.every(item => item.journal && item.abstract && item.dateLabel));
assert.ok(publications.every(item => !("isDemo" in item) && item.authors.length > 0));
assert.ok(publications.every(item => new Set(item.authors).size === item.authors.length));
assert.ok(!JSON.stringify(publications).match(/PUB-DEMO|Autor de ejemplo|resumen ficticio/i));
assert.equal(filterPublications(publications, "SINDÁCTILIA", "", "")[0].id, "PUB-001");
assert.equal(filterPublications(publications, "bovinos monorquidismo", "", "")[0].id, "PUB-006");
assert.equal(filterPublications(publications, "", "2025", "Reporte de caso")[0].id, "PUB-007");
assert.equal(filterPublications(publications, "no-existe", "", "").length, 0);
assert.deepEqual(Array.from(filterPublications(publications, "  ", "", ""), item => item.year), [2026, 2026, 2026, 2026, 2026, 2026, 2025, 2025, 2025, 2025, 2025, 2024, 2024, 2024]);

const states = [];
let cursor = 0;
const hooks = {
  ...React,
  useMemo: fn => fn(),
  useState: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
};
const icon = () => null;
const imports = {
  "@/lib/publications": data,
  "lucide-react": { ArrowUpRight: icon, BookOpen: icon, ChevronDown: icon, FileText: icon, Search: icon, X: icon },
  "./publications-browser.module.css": { __esModule: true, default: new Proxy({}, { get: (_target, name) => String(name) }) },
};
const { PublicationsBrowser } = readModule("components/publications-browser.tsx", { ...imports, react: hooks }, {
  fetch: () => { throw new Error("Publication filters must not make network requests"); },
});
const nodes = element => Array.isArray(element) ? element.flatMap(nodes) : !element || typeof element !== "object" ? [] : [element, ...nodes(element.props?.children)];
function render() { cursor = 0; return nodes(PublicationsBrowser({ items: publications })); }
const count = () => render().filter(node => node.type === "article").length;
function change(id, value) { render().find(node => node.props?.id === id).props.onChange({ target: { value } }); }
assert.equal(count(), 14);
assert.equal(render().filter(node => node.type === "details").length, 14);
assert.equal(render().filter(node => node.type === "a").length, 14);
for (const id of ["publicaciones-busqueda", "publicaciones-anio", "publicaciones-tipo"]) {
  assert.ok(render().some(node => node.type === "label" && node.props.htmlFor === id));
}
change("publicaciones-busqueda", "mandibular");
assert.equal(count(), 1);
change("publicaciones-anio", "2025");
assert.equal(count(), 0);
assert.ok(render().some(node => node.type === "h3" && node.props.children === "No encontramos publicaciones"));
render().find(node => node.type === "button" && node.props.children === "Mostrar todas las publicaciones").props.onClick();
assert.equal(count(), 14);
change("publicaciones-tipo", "Nota técnica");
assert.equal(count(), 2);
assert.ok(render().some(node => node.props?.role === "status" && node.props["aria-atomic"] === "true"));

const actual = readModule("components/publications-browser.tsx", imports).PublicationsBrowser;
const staticHtml = renderToStaticMarkup(React.createElement(actual, { items: publications }));
assert.equal((staticHtml.match(/<article /g) ?? []).length, 14);
assert.ok(staticHtml.includes('class="card"'));
assert.equal((staticHtml.match(/Ejemplo ficticio/g) ?? []).length, 6);
const realItem = { ...publications[0], url: "https://example.org/publicacion.pdf" };
const realHtml = renderToStaticMarkup(React.createElement(actual, { items: [realItem] }));
assert.ok(realHtml.includes('href="https://example.org/publicacion.pdf"'));
assert.ok(realHtml.includes('rel="noopener noreferrer"'));
assert.ok(!renderToStaticMarkup(React.createElement(actual, { items: [{ ...realItem, url: "javascript:alert(1)" }] })).includes('href="javascript:'));

const production = fs.readFileSync(".next/server/app/publicaciones.html", "utf8");
assert.ok(!production.includes("Vista de demostración"));
assert.ok(!production.includes('name="robots" content="noindex'));
assert.equal((production.match(/Ejemplo ficticio/g) ?? []).length, 6);
assert.ok(production.includes('aria-current="page"'));
for (const publication of publications) {
  assert.ok(production.includes(publication.title));
  assert.ok(production.includes(publication.journal));
  assert.ok(production.includes(`href="${publication.url}"`));
}
for (const page of ["index", "museo", "educacion", "catalogo"]) {
  assert.ok(fs.readFileSync(`.next/server/app/${page}.html`, "utf8").includes('href="/publicaciones"'), `Navigation missing on ${page}`);
}
assert.ok(fs.readFileSync(".next/server/app/sitemap.xml.body", "utf8").includes("/publicaciones"));
const css = fs.readFileSync("components/publications-browser.module.css", "utf8");
assert.ok(css.includes("grid-template-columns: minmax(0, 1fr)"));
assert.ok(css.includes("prefers-reduced-motion"));
assert.ok(css.includes(":focus-visible"));
assert.ok(css.includes("min-height: 44px"));
console.log("Publications: 14 articles, unique DOI links, SSR content, search/combined filters/reset, safe links, accessible controls, mobile CSS, indexing and site navigation: OK.");
