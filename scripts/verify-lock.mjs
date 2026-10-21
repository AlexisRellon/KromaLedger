import { readFile } from "node:fs/promises";
import { verifyPackage } from "./lockPolicy.mjs";

const [pkg, lock] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8").then(JSON.parse),
]);
const errors = verifyPackage(pkg, lock);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Dependency versions and lockfile are exact and consistent.");
}
