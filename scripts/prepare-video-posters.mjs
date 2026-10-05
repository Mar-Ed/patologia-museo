import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const ffmpeg = require("../.media-tools/node_modules/ffmpeg-static");
const root = path.resolve("public/patologias");
const jobs = fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).flatMap(entry => {
  const directory = path.join(root, entry.name);
  return fs.readdirSync(directory).filter(file => file.endsWith(".web.mp4"))
    .map(file => ({ input: path.join(directory, file), output: path.join(directory, `${file}.poster.webp`) }));
});

async function videoDuration(input) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-hide_banner", "-nostdin", "-i", input], { windowsHide: true });
    let output = "";
    child.stderr.on("data", chunk => { output += chunk; });
    child.on("error", reject);
    child.on("close", () => {
      const duration = output.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!duration) { reject(new Error(`Cannot determine video duration: ${input}`)); return; }
      resolve(Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]));
    });
  });
}

// Skip opening fades and select a representative frame; never alter the video.
for (const job of jobs) {
  if (fs.existsSync(job.output) && fs.statSync(job.output).size > 0 && !process.argv.includes("--force")) continue;
  const duration = await videoDuration(job.input);
  let usable = false;
  for (const fraction of [0.25, 0.5, 0.75, 0.1]) {
    const position = duration * fraction;
    await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-ss", String(position), "-i", job.input,
      "-map", "0:V:0", "-vf", "thumbnail=30,scale='min(960,iw)':-2", "-frames:v", "1",
      "-c:v", "libwebp", "-quality", "80", "-threads", "2", job.output], { windowsHide: true });
    let errors = "";
    child.stderr.on("data", chunk => { errors += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0 || !fs.existsSync(job.output) || !fs.statSync(job.output).size) reject(new Error(`${job.input}: ${errors || "No preview frame generated"}`));
      else resolve();
    });
    });
    const stats = await sharp(fs.readFileSync(job.output)).stats();
    if (stats.channels.some(channel => channel.stdev > 8 && channel.mean > 10)) { usable = true; break; }
  }
  if (!usable) throw new Error(`Only blank frames found: ${job.input}`);
  console.log(`OK: ${path.relative(root, job.output)}`);
}
console.log(`${jobs.length} video previews ready.`);
