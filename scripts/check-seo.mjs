import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { loadContentModules } from "./content-modules.mjs";

const origin = "https://www.museopatologiaveterinaria.com";
const { content } = loadContentModules();
const records = content.getCatalog();
const manifest = JSON.parse(fs.readFileSync(".next/prerender-manifest.json", "utf8"));
const routes = Object.keys(manifest.routes).filter(route => !route.startsWith("/_") && !["/robots.txt", "/sitemap.xml"].includes(route));
const linked = new Set();
// Node fetch normalizes Host; use the HTTP client to exercise domain routing.
function requestWithHost(url, host) {
  return new Promise((resolve, reject) => {
    const client = new URL(url).protocol === "https:" ? https : http;
    client.get(url, { headers: { Host: host } }, response => {
      response.resume();
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers }));
    }).on("error", reject);
  });
}
for (const route of routes) {
  const html = fs.readFileSync(`.next/server/app${route === "/" ? "/index" : route}.html`, "utf8");
  const canonical = `${origin}${route === "/" ? "" : route}`;
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `Canonical: ${route}`);
  assert.ok(html.includes(`property="og:url" content="${canonical}"`), `Open Graph URL: ${route}`);
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(!html.includes("museo-patologia.vercel.app"));
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `Single H1: ${route}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.ok(schemas.some(schema => schema["@graph"]?.some(node => node["@type"] === "Museum")), `Museum schema: ${route}`);
  if (route.startsWith("/patologias/")) {
    assert.ok(html.includes("Qué observar, qué describir"), `Anatomy in initial HTML: ${route}`);
    assert.ok(html.includes("Interpretar con evidencia"), `Diagnosis in initial HTML: ${route}`);
    assert.ok(html.includes("Fuentes para profundizar"), `Bibliography in initial HTML: ${route}`);
    assert.ok(!html.includes('class="gallery-photo"'), `Gallery remains deferred: ${route}`);
    assert.ok(schemas.some(schema => schema["@type"] === "BreadcrumbList"));
    assert.ok(schemas.some(schema => schema["@type"] === "LearningResource"));
  }
  if (route === "/catalogo" || route.startsWith("/catalogo/pagina/")) {
    for (const match of html.matchAll(/href="\/patologias\/([^"?#]+)"/g)) linked.add(match[1]);
    const page = Number(route.match(/\/pagina\/(\d+)$/)?.[1] ?? 1);
    const cards = [...html.matchAll(/class="scientific-card"/g)];
    assert.equal(cards.length, Math.min(24, records.length - (page - 1) * 24));
    for (const record of records.slice((page - 1) * 24, page * 24)) assert.ok(html.includes(`href="/patologias/${record.slug}"`), `Correct page slice: ${record.slug}`);
  }
}
for (const record of records) assert.ok(linked.has(record.slug), `Reachable without clicks: ${record.slug}`);

const xml = fs.readFileSync(".next/server/app/sitemap.xml.body", "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length);
assert.deepEqual([...urls].sort(), routes.map(route => `${origin}${route}`).sort());
assert.ok(!xml.includes("<lastmod>"), "Do not invent modification dates");
const robots = fs.readFileSync(".next/server/app/robots.txt.body", "utf8");
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(robots.includes("Allow: /"));
assert.ok(fs.existsSync("public/social-card.png"));

if (process.argv[2]) {
  const base = process.argv[2];
  for (const path of ["/", "/robots.txt", "/sitemap.xml", "/social-card.png", "/catalogo/pagina/4", "/catalogo/desarrollo/pagina/3", `/patologias/${records.at(-1).slug}`]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    assert.ok(!response.headers.get("x-robots-tag")?.includes("noindex"), path);
    await response.arrayBuffer();
  }
  for (const path of ["/catalogo/pagina/999", "/documentos_patologia_actualizados/test.docx", "/nuevos_word/test.docx", "/patologias/wry-nose/documento-1.md"]) assert.equal((await fetch(`${base}${path}`)).status, 404, path);
  for (const host of ["museopatologiaveterinaria.com", "museo-patologia.vercel.app", "www.museopatologiaveterinaria.com"]) {
    const response = await requestWithHost(`${base}/museo?ref=seo`, host);
    assert.equal(response.status, 308);
    assert.equal(response.headers.location, `${origin}/museo?ref=seo`);
  }
  const preview = await requestWithHost(`${base}/museo`, "museo-preview.vercel.app");
  assert.match(preview.headers["x-robots-tag"], /noindex/);
  console.log("HTTP: sitemap, robots, pages, images, 404s, domain redirects and preview noindex OK.");
}
console.log(`SEO: ${routes.length} canonical URLs, ${records.length} linked pathology pages, complete scientific HTML and valid JSON-LD OK.`);
