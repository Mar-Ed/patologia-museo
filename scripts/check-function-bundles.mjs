import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

// Next.js traces are local bundle estimates, not Vercel billing totals.
const root = process.cwd();
const routes = ["admin/page", "admin/login/page", "admin/recuperar/page", "admin/restablecer/page", "api/admin/[action]/route", "api/comments/route", "api/comments/like/route", "auth/callback/route"];
const indexRoutes = new Set(["admin/page", "api/admin/[action]/route", "api/comments/route"]);
for (const route of routes) {
  const trace = path.join(root, ".next/server/app", `${route}.js.nft.json`);
  const files = JSON.parse(fs.readFileSync(trace, "utf8")).files.map(file => path.resolve(path.dirname(trace), file));
  const relative = files.map(file => path.relative(root, file).replaceAll("\\", "/"));
  assert.ok(!relative.some(file => file.startsWith("public/")), `${route} must not bundle museum images`);
  if (indexRoutes.has(route)) assert.ok(relative.includes(".generated/catalog.json"), `${route} needs the generated catalog at runtime`);
  const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  assert.ok(bytes < 20 * 1024 * 1024, `${route} exceeds its 20 MiB bundle budget`);
  console.log(`${route}: ${(bytes / 1024 / 1024).toFixed(2)} MiB; no public assets bundled.`);
}
