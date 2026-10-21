import { describe, expect, it } from "vitest";
import { isExactVersion, verifyPackage } from "../../scripts/lockPolicy.mjs";

describe("lock policy", () => {
  it("rejects ranges, tags, URLs, and git specs", () => {
    for (const value of ["^1.2.3", "~1.2.3", ">1.2.3", "<1.2.3", "*", "latest", "next", "https://host/pkg.tgz", "git+ssh://host/repo", "1.x"]) expect(isExactVersion(value)).toBe(false);
    expect(isExactVersion("1.2.3")).toBe(true);
  });
  it("requires React 19 and matching exact lockfile roots", () => {
    const pkg = { name: "kromaledger", private: true, version: "1.0.0", dependencies: { react: "19.3.1", "react-dom": "19.3.1" }, devDependencies: { vite: "8.3.4" } };
    const lock = { packages: { "": { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies } } };
    expect(verifyPackage(pkg, lock)).toEqual([]);
    expect(verifyPackage({ ...pkg, dependencies: { ...pkg.dependencies, react: "^19.3.1" } }, lock).length).toBeGreaterThan(0);
    expect(verifyPackage(pkg, { packages: { "": { ...lock.packages[""], devDependencies: { vite: "8.3.5" } } } }).length).toBeGreaterThan(0);
  });
});
