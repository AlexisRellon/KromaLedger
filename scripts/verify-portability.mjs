import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const sourceFile = /\.(?:ts|tsx|css)$/;
const browserOnly = /\b(?:window|document|navigator|indexedDB|localStorage|sessionStorage|HTML[A-Za-z]*Element|SVG[A-Za-z]*Element|MouseEvent|KeyboardEvent|ChangeEvent|FormEvent|PointerEvent|TouchEvent|FocusEvent|ClipboardEvent|DragEvent|UIEvent|Blob|FileReader|File|Dexie)\b/;
const dexieImport = /(?:from|import\s*\()\s*["'][^"']*dexie/i;
const webModuleImport = /(?:from|import\s*\()\s*["'](?:react-dom(?:\/|["'])|(?:\.\.\/)+(?:ui|adapters)\/)/;
const intrinsicFactory = /\b(?:createElement|jsx|jsxs|jsxDEV)\s*\(\s*["'][a-z][\w:-]*["']/;
const nonblank = (source) => source.split(/\r?\n/).filter((line) => line.trim()).length;
const intrinsicJsxLines = (source, name) => {
  const parsed = parse(source, { sourceType: "module", sourceFilename: name, plugins: ["typescript", "jsx"] });
  const lines = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXOpeningElement" &&
        ((node.name.type === "JSXIdentifier" && /^[a-z]/.test(node.name.name)) || node.name.type === "JSXNamespacedName")) {
      lines.push(node.loc.start.line);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "loc" || key === "tokens" || key === "comments") continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(parsed);
  return lines;
};

if (process.argv.includes("--self-test")) {
  assert.equal(nonblank("one\n  \n two\n"), 2);
  assert.equal(browserOnly.test("const x = window.localStorage"), true);
  assert.equal(browserOnly.test("const file = bytes"), false);
  assert.equal(browserOnly.test("new File([bytes], 'receipt')"), true);
  assert.equal(browserOnly.test("onClick: (event: React.MouseEvent) => void"), true);
  assert.equal(browserOnly.test("import { create } from 'zustand'"), false);
  assert.equal(dexieImport.test("import Dexie from 'DeXiE'"), true);
  assert.equal(webModuleImport.test("import { createRoot } from 'react-dom/client'"), true);
  assert.equal(webModuleImport.test("import { Box } from '../../ui/primitives'"), true);
  assert.equal(intrinsicFactory.test("React.createElement('div')"), true);
  assert.deepEqual(intrinsicJsxLines("const x = <div><input /></div>", "test.tsx"), [1, 1]);
  assert.deepEqual(intrinsicJsxLines("const x = <svg><path /></svg>", "test.tsx"), [1, 1]);
  assert.deepEqual(intrinsicJsxLines("const x = <Box><Text /></Box>", "test.tsx"), []);
  assert.deepEqual(intrinsicJsxLines("type Rows = Array<string>; const x = read<string>(); // <div>\nconst y = '<div>'; const z = 1 < 2", "test.tsx"), []);
  console.log("Portability checker self-test passed.");
  process.exit(0);
}

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : entry.isFile() && sourceFile.test(entry.name) ? [path] : [];
  }));
  return paths.flat();
}

let total = 0;
let portable = 0;
const violations = [];
for (const path of await files(root)) {
  const name = relative(root, path).split(sep).join("/");
  const source = await readFile(path, "utf8");
  const lines = nonblank(source);
  total += lines;
  if (!/^(core|state)\//.test(name)) continue;
  portable += lines;
  source.split(/\r?\n/).forEach((line, index) => {
    if (browserOnly.test(line) || dexieImport.test(line) || webModuleImport.test(line) || intrinsicFactory.test(line)) violations.push(`${name}:${index + 1}`);
  });
  if (name.endsWith(".tsx")) {
    for (const line of intrinsicJsxLines(source, name)) violations.push(`${name}:${line} (intrinsic JSX)`);
  }
}

const percent = total ? 100 * portable / total : 0;
console.log(`Portable source: ${portable}/${total} nonblank lines (${percent.toFixed(1)}%).`);
if (violations.length) console.error(`Platform-only references in core/state: ${violations.join(", ")}`);
if (percent < 10 || violations.length) process.exitCode = 1;
