export function isExactVersion(version) {
  return typeof version === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version);
}

export function verifyPackage(pkg, lock) {
  const errors = [];
  if (pkg.name !== "kromaledger" || pkg.private !== true) errors.push("package must be private and named kromaledger");
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [name, version] of Object.entries(dependencies)) if (!isExactVersion(version)) errors.push(`${name} has a non-exact version: ${version}`);
  for (const name of ["react", "react-dom"]) if (!/^19\.\d+\.\d+$/.test(dependencies[name] ?? "")) errors.push(`${name} must use a stable exact React 19 version`);
  const locked = lock.packages?.[""];
  if (!locked || locked.name !== pkg.name || locked.version !== pkg.version) errors.push("package-lock root identity does not match package.json");
  for (const field of ["dependencies", "devDependencies"]) {
    const expected = pkg[field] ?? {};
    const actual = locked?.[field] ?? {};
    if (Object.keys(expected).length !== Object.keys(actual).length || Object.entries(expected).some(([name, version]) => actual[name] !== version)) errors.push(`package-lock root ${field} do not match package.json`);
  }
  return errors;
}
