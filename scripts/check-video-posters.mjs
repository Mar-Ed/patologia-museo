import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import sharp from "sharp";

const root = path.resolve("public/patologias");
let count = 0;
let bytes = 0;
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = path.join(root, entry.name);
  // Previews remain valid assets even after local videos are moved off-site.
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith(".poster.webp"))) {
    const poster = path.join(directory, file);
    assert.ok(fs.existsSync(poster), `Missing preview: ${poster}`);
    const data = fs.readFileSync(poster);
    const metadata = await sharp(data).metadata();
    const stats = await sharp(data).stats();
    assert.equal(metadata.format, "webp");
    assert.ok(metadata.width > 0 && metadata.width <= 960 && metadata.height > 0);
    assert.ok(stats.channels.some(channel => channel.stdev > 8 && channel.mean > 10), `Blank preview: ${poster}`);
    bytes += fs.statSync(poster).size;
    count++;
  }
}
assert.ok(count > 0);
console.log(JSON.stringify({ previews: count, totalKiB: Math.round(bytes / 1024), averageKiB: Math.round(bytes / count / 1024) }, null, 2));
