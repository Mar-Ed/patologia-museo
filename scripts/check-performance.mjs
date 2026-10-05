import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadContentModules, readModule } from "./content-modules.mjs";

const { metadata, content } = loadContentModules();
const navigation = readModule("lib/catalog-navigation.ts", { "./pathologies": metadata });
const catalog = content.getCatalog();
assert.equal(catalog.length, content.getPathologyRecords().length);
assert.ok(catalog.every(item => item.summary.length <= 180));
assert.ok(!JSON.stringify(catalog).includes("data:image/"));
for (const category of ["all", ...Object.keys(metadata.categoryInfo)]) {
  const pathname = navigation.catalogPath(category);
  assert.equal(navigation.categoryFromPath(pathname), category);
  assert.equal(navigation.categoryFromPath(pathname + "/"), category);
  assert.ok(!pathname.includes("?"));
}
const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
assert.equal(navigation.isPlainNavigation(plain), true);
for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) assert.equal(navigation.isPlainNavigation({ ...plain, [modifier]: true }), false);
assert.equal(navigation.isPlainNavigation({ ...plain, button: 1 }), false);

const manifest = JSON.parse(fs.readFileSync(".generated/media.json", "utf8"));
for (const [original, preview] of Object.entries(manifest)) {
  assert.ok(fs.existsSync(path.join("public", decodeURIComponent(original))));
  assert.match(preview.src, /^\/media\/patologias\/[a-f0-9]{20}-1200\.webp$/);
  assert.ok(fs.existsSync(path.join("public", preview.src)));
  if (preview.thumbnail) assert.ok(fs.existsSync(path.join("public", preview.thumbnail)));
  assert.match(preview.blurDataURL, /^data:image\/webp;base64,/);
  assert.ok(preview.blurDataURL.length < 1024);
}

const prerender = JSON.parse(fs.readFileSync(".next/prerender-manifest.json", "utf8"));
assert.ok(prerender.routes["/catalogo"], "The general catalog must be prerendered");
const metrics = [];
for (const route of ["catalogo", ...Object.keys(metadata.categoryInfo).map(id => `catalogo/${id}`)]) {
  const html = fs.readFileSync(`.next/server/app/${route}.html`, "utf8");
  const category = navigation.categoryFromPath("/" + route);
  const count = catalog.filter(item => category === "all" || item.category === category).length;
  assert.equal((html.match(/class="scientific-card"/g) ?? []).length, Math.min(count, 24));
  metrics.push({ route, records: count, initialCards: Math.min(count, 24), htmlKiB: +(Buffer.byteLength(html) / 1024).toFixed(1), gzipKiB: +(zlib.gzipSync(html).length / 1024).toFixed(1) });
}
const pleuritis = content.getCaseContent("pleuritis-cronica-granulomatosa");
const sourceBytes = fs.statSync(path.join("public", decodeURIComponent(pleuritis.item.cover))).size;
const previewBytes = fs.statSync(path.join("public", pleuritis.item.coverDisplay)).size;
const heroHtml = fs.readFileSync(".next/server/app/patologias/pleuritis-cronica-granulomatosa.html", "utf8");
const hero = [...heroHtml.matchAll(/<img\b[^>]*>/g)].find(match => match[0].includes('class="case-specimen"'))?.[0];
assert.ok(hero?.includes("/media/patologias/"), "Hero must use the prebuilt image, not on-demand optimization");
assert.ok(!hero?.includes("/_next/image"));
assert.ok(!heroHtml.includes('class="viewer-photo"'), "Hidden viewer must not request full-resolution images");
console.log(JSON.stringify({ catalogKiB: +(Buffer.byteLength(JSON.stringify(catalog)) / 1024).toFixed(1), images: Object.keys(manifest).length, pleuritisCover: { originalKiB: +(sourceBytes / 1024).toFixed(1), previewKiB: +(previewBytes / 1024).toFixed(1) }, routes: metrics }, null, 2));

if (process.argv[2]) {
  const base = process.argv[2];
  for (const category of Object.keys(metadata.categoryInfo)) {
    const legacy = await fetch(`${base}/catalogo?categoria=${category}`, { redirect: "manual" });
    assert.equal(legacy.status, 308);
    assert.equal(new URL(legacy.headers.get("location"), base).pathname, navigation.catalogPath(category));
    assert.equal(new URL(legacy.headers.get("location"), base).search, "");
    assert.equal((await fetch(`${base}${navigation.catalogPath(category)}`)).status, 200);
  }
  for (const url of ["/catalogo", pleuritis.item.coverDisplay, catalog.find(item => item.cover).cover]) {
    const response = await fetch(base + url);
    assert.equal(response.status, 200);
    if (url.startsWith("/media/")) assert.match(response.headers.get("cache-control"), /max-age=31536000.*immutable/);
    if (url === "/catalogo") assert.ok(!response.headers.get("cache-control")?.includes("no-store"));
    await response.arrayBuffer();
  }
  assert.equal((await fetch(base + "/catalogo/no-existe")).status, 404);
  assert.equal((await fetch(base + "/patologias/no-existe")).status, 404);
  console.log("HTTP: static catalog, clean redirects, immutable images and 404s OK.");
}
