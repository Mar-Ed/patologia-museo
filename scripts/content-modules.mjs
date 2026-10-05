import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
export function readModule(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, process, ...globals, require: name => Object.hasOwn(imports, name) ? imports[name] : require(name) }, { filename: file });
  return exports;
}
function cache(fn) {
  const values = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!values.has(key)) values.set(key, fn(...args));
    return values.get(key);
  };
}
export function loadContentModules(sourceFileSystem = fs) {
  const metadata = readModule("lib/pathologies.ts");
  const profiles = readModule("lib/scientific-profiles.ts");
  const imports = {};
  for (const file of fs.readdirSync("lib/content/patologias").filter(file => file.endsWith(".ts") && file !== "index.ts")) {
    imports[`./${file.slice(0, -3)}`] = readModule(`lib/content/patologias/${file}`);
  }
  const text = readModule("lib/content/patologias/index.ts", imports);
  const videos = readModule("lib/pathology-videos.ts");
  const media = readModule("lib/prepared-media.ts", { react: { cache } });
  const content = readModule("lib/pathology-content.ts", {
    "server-only": {}, react: { cache }, "./pathologies": metadata,
    "node:fs": sourceFileSystem, "./scientific-profiles": profiles, "./content/patologias": text,
    "./pathology-videos": videos, "./prepared-media": media,
  });
  return { metadata, content, media, text };
}
