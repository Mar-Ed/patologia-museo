import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

export type PreparedImage = { src: string; thumbnail?: string; blurDataURL: string; width: number; height: number };
const readManifest = cache((): Record<string, PreparedImage> => {
  const file = path.join(process.cwd(), ".generated", "media.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
});
export function getPreparedImage(url: string): PreparedImage | undefined { return readManifest()[url]; }
