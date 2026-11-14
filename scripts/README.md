# scripts

## Overview
Repository maintenance, policy verification, and asset-fetching Node.js ESM utilities for KromaLedger. These standalone scripts enforce exact package/lockfile version policies, check platform portability boundaries across `src/`, and download institution brand icons into `public/brands`.

## Interface
- `[lockPolicy.mjs:isExactVersion]`: `isExactVersion(version)` — exported predicate returning `true` when `version` is an exact SemVer string (`^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`).
- `[lockPolicy.mjs:verifyPackage]`: `verifyPackage(pkg, lock)` — exported validator returning an array of policy error strings comparing `package.json` and `package-lock.json` metadata and dependency maps.
- `[verify-lock.mjs]`: CLI entry script (`npm run verify:lock`) reading `../package.json` and `../package-lock.json` and validating them via `[lockPolicy.mjs:verifyPackage]`.
- `[verify-portability.mjs]`: CLI portability checker (`--self-test` flag supported) scanning `../src/` via `[verify-portability.mjs:files]` and `[verify-portability.mjs:intrinsicJsxLines]` to measure `core/` and `state/` line share and detect browser/platform-only leaks.
- `[downloadBrands.mjs]`: CLI asset script defining `[downloadBrands.mjs:institutions]`, `[downloadBrands.mjs:download]`, and `[downloadBrands.mjs:run]` to fetch PNG logos for 19 financial institutions.
- Subdirectories: None.

## Invariants
- `[lockPolicy.mjs:verifyPackage]`: `pkg.name` must be `"kaban"` or `"kromaledger"` and `pkg.private` must be `true`.
- `[lockPolicy.mjs:verifyPackage]`: Every entry across `pkg.dependencies` and `pkg.devDependencies` must satisfy `[lockPolicy.mjs:isExactVersion]` (no ranges like `^` or `~`).
- `[lockPolicy.mjs:verifyPackage]`: Both `react` and `react-dom` in `dependencies` must match `/^19\.\d+\.\d+$/`.
- `[lockPolicy.mjs:verifyPackage]`: `lock.packages[""]` must exist with matching `name`, `version`, `dependencies`, and `devDependencies` exact key/value maps against `pkg`.
- `[verify-portability.mjs]`: Source files under `src/core/` and `src/state/` (`.ts`, `.tsx`, `.css`) must not match `[verify-portability.mjs:browserOnly]`, `[verify-portability.mjs:dexieImport]`, `[verify-portability.mjs:webModuleImport]`, `[verify-portability.mjs:intrinsicFactory]`, or lowercase/namespaced `JSXOpeningElement` nodes detected by `[verify-portability.mjs:intrinsicJsxLines]`.
- `[verify-portability.mjs]`: Portable nonblank lines under `src/core/` and `src/state/` must be at least `10%` of total nonblank `.ts`/`.tsx`/`.css` lines in `src/` with zero violations, otherwise `process.exitCode` is set to `1`.
- `[downloadBrands.mjs:run]`: Downloads are executed sequentially across `[downloadBrands.mjs:institutions]` rather than concurrently.

## Side Effects
- `[verify-lock.mjs]`: Reads `../package.json` and `../package-lock.json` from disk, writes status/errors to `console.log`/`console.error`, and sets `process.exitCode = 1` on policy errors.
- `[verify-portability.mjs]`: Recursively reads `.ts`, `.tsx`, and `.css` files under `../src/`, logs summary/errors to `console.log`/`console.error`, sets `process.exitCode = 1` on threshold or violation failures, and calls `process.exit(0)` when invoked with `--self-test`.
- `[downloadBrands.mjs]`: Creates `public/brands` under `process.cwd()` (`fs.mkdirSync(..., { recursive: true })`), performs outbound HTTPS GET requests to `https://img.logo.dev/<domain>?token=...&size=128&format=png`, writes `<id>.png` files to disk on HTTP 2xx responses, and logs progress/warnings/errors to `console`.

## Verification
- Run: `npm test`
- Run: `npm run verify:lock`
