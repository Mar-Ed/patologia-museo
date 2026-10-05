import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpeg = require("../.media-tools/node_modules/ffmpeg-static");
const root = path.resolve("public/patologias");
const jobs = fs.readdirSync(root).flatMap(folder => {
  const directory = path.join(root, folder);
  if (!fs.statSync(directory).isDirectory()) return [];
  return fs.readdirSync(directory).filter(file => /\.(mp4|wmv|avi|mts|mov|vob)$/i.test(file) && !file.endsWith(".web.mp4"))
    .map(file => ({ input: path.join(directory, file), output: path.join(directory, `${file}.web.mp4`) }));
});
const failures = [];
async function convert(job) {
  if (!process.argv.includes("--force") && fs.existsSync(job.output) && fs.statSync(job.output).size > 0) return;
  await new Promise(resolve => {
    const process = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", job.input, "-map", "0:V:0", "-map", "0:a?", "-vf", "scale='min(1280,trunc(iw/2)*2)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-threads", "2", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", job.output], { windowsHide: true });
    let errors = "";
    process.stderr.on("data", data => { errors += data; });
    process.on("error", error => { failures.push({ input: job.input, error: error.message }); resolve(); });
    process.on("close", code => {
      if (code !== 0) { failures.push({ input: job.input, error: errors.slice(-1500) }); console.error(errors.slice(-1500)); }
      console.log(`${code === 0 ? "OK" : "FAILED"}: ${path.relative(root, job.input)}`);
      resolve();
    });
  });
}
let next = 0;
await Promise.all(Array.from({ length: 2 }, async () => { while (next < jobs.length) await convert(jobs[next++]); }));
console.log(JSON.stringify({ total: jobs.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
