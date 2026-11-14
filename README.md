# Kaban Blueprint

**Kaban** (formerly KromaLedger) is a local-first, on-device financial vault and tracker for daily expenses, recurring subscriptions, itemized client invoices, and physical wallets. Built with a tactile Philippine neobrutalist aesthetic, it operates entirely in the browser using IndexedDB with zero remote tracking, zero account sign-ups, and zero cloud lock-in.

---

## System Overview

Kaban follows a ports-and-adapters architecture with a strict portability boundary:
- Platform-agnostic domain models, ports, and financial engines live under `src/core/`.
- State orchestration (`StorageContext`, Zustand stores, TanStack Query hooks, and toolkit-agnostic presentation ports) lives under `src/state/`.
- Browser persistence (Dexie IndexedDB `KromaLedgerDB`), ZIP/QR Air-Sync backup, Web Notifications, and the Netlify AI client live under `src/adapters/`, while the React UI lives under `src/ui/`.
- A legacy Netlify serverless proxy (`netlify/functions/gemma.ts`; Netlify hosting is now deprecated—the frontend is hosted on Cloudflare Pages via `wrangler` CLI and `wrangler.jsonc`) mediates optional Google Generative Language API calls with per-IP hourly rate limiting and multi-key rotation, while `scripts/` and `design/` house build/portability verification and brand asset generation scripts.

## Local Interface & Invariants

- `default export` (`defineConfig(({ mode }) => ...)`): [vite.config.ts](./vite.config.ts) — Configures Vite, React, Tailwind CSS v4, `VitePWA` (`registerType: "autoUpdate"`, Workbox runtime caching for `/fonts/` and `img.logo.dev`), Rollup `manualChunks` (`vendor-react`, `vendor-query`, `vendor-db`, `vendor-utils`), and Vitest (`test: { environment: "node" }`).
- **Cloudflare Pages Deployment Config**: [wrangler.jsonc](./wrangler.jsonc) configures Cloudflare Pages (`name: "kaban"`, `pages_build_output_dir: "./dist"`, `compatibility_date: "2026-11-06"`) for `wrangler` CLI deployments.
- **Dev Function Proxy Invariant**: `vite.config.ts` registers the `netlify-functions-dev-proxy` middleware to route local `/.netlify/functions/gemma` HTTP requests to `./netlify/functions/gemma.ts`.
- **Local Side Effects**: `vite.config.ts` invokes `loadEnv(mode, proc.cwd(), "")` and merges loaded variables into `process.env` during Vite startup.

## Subdirectories & System Boundaries

- `src`: [./src/README.md](./src/README.md) - Application entrypoint (`App.tsx`, `main.tsx`) and layered source packages (`core`, `adapters`, `state`, `ui`).
- `netlify`: [./netlify/README.md](./netlify/README.md) - Deprecated Netlify hosting runtime containing the legacy rate-limited Google Generative Language proxy (`gemma.ts`).
- `scripts`: [./scripts/README.md](./scripts/README.md) - Node.js ESM verification and asset scripts (`verify-lock.mjs`, `lockPolicy.mjs`, `verify-portability.mjs`, `downloadBrands.mjs`).
- `design`: [./design/README.md](./design/README.md) - Kaban and Baulito brand identity explorations, font outline study, and verified `logo-kit` asset pipeline.

## Global Invariants

- **Strict Headless Portability**: `src/core/` and `src/state/` must remain free of browser-only globals, DOM/intrinsic JSX elements, and Dexie imports, and must represent at least 10% of nonblank `.ts`/`.tsx`/`.css` lines in `src/` (`scripts/verify-portability.mjs`).
- **Exact Dependency & Lockfile Policy**: `package.json` (`private: true`, `name` `"kaban"` or `"kromaledger"`) and `package-lock.json` must pin exact SemVer dependency versions (no `^`/`~` ranges) with `react`/`react-dom` on `19.x` (`scripts/lockPolicy.mjs`).
- **Minor-Unit & Atomic Ledger Integrity**: Monetary values across `src/core/`, `src/adapters/web-dexie/`, and `src/adapters/backup/` operate on `Number.isSafeInteger` minor units; mutations affecting balances, reconciliation, or vault restore execute inside atomic Dexie `rw` transactions.
- **Database Compatibility**: To preserve existing user vaults during the rebrand, the underlying IndexedDB database identifier remains `KromaLedgerDB`. Backups export as `kaban-vault-YYYY-MM-DD.zip`, while legacy `kromaledger-vault-*.zip` archives remain importable.

## Global Side Effects

- **On-Device Browser Storage**: Reads and mutates IndexedDB (`KromaLedgerDB` across 11 object stores), `localStorage` (`kaban_*` and legacy `kromaledger_*` keys), `sessionStorage`, and `blob:` Object URLs.
- **Browser APIs & Permissions**: Requests persistent storage (`navigator.storage.persist()`), camera access (`navigator.mediaDevices.getUserMedia`) for QR Air-Sync scanning, Web Notifications (`Notification`), and ZIP archive downloads / `location.reload()` after vault restores.
- **External Network Calls**: Optional AI budget advisor requests target `/.netlify/functions/gemma`, which forwards HTTPS `POST` requests to `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`; `scripts/downloadBrands.mjs` fetches institution icons from `https://img.logo.dev/`.

## System Verification

- Run: `npm test`
- Run: `npm run typecheck`
- Run: `npm run verify:lock`
- Run: `node scripts/verify-portability.mjs`
- Run: `npm run build`

---

## Brand Metaphor & Design

*Kaban* is the Filipino term for a traditional wooden or metal-reinforced storage chest used by families to safeguard heirlooms, vital records, land titles, and hard-earned savings.

Reflecting this heritage of private custody, Kaban abandons sterile fintech glass in favor of a tactile **Neobrutalist Paper** system:
- **Paper Canvas**: Warm cream paper base (`#FAF8F5`) layered with subtle ledger graph lines.
- **Charcoal Ink**: Bold 2px dark ink borders (`#18181B`) and hard offset shadows (`3px 3px 0px #18181B`).
- **Heritage Palette**: Royal Plum (`#4A154B`), Lavender (`#EDE9FE`), and Kaban Gold (`#F59E0B` / `#FBBF24`), accompanied by fresh mint (`#10B981`) and rose (`#F43F5E`) ledger indicators.
- **Authentic Local Typography**: **Dangwa** (Filipino public transport brush lettering by Aaron Amar) and **Bantayog** (Philippine monument display lettering by Jad Maza), paired with **Satoshi** (modern body grotesque) and **JetBrains Mono** (monospaced tabular financial numbers).

---

## Getting Started

### Prerequisites
- Node.js 22.12 or later
- npm 10.x or later

### Installation & Development
```sh
npm ci
npm run dev
```

Open the local URL printed by Vite in your browser. On first launch, Kaban initializes the local database with sample entries. Subsequent launches maintain your existing on-device vault.

---

## Deployment (Cloudflare Pages)

Kaban is deployed on Cloudflare Pages at **https://kaban-ckh.pages.dev** with zero cold starts, global edge distribution, and zero monthly cost on the free tier.

SPA routing (`public/_redirects`), security headers, and long-term asset caching (`public/_headers`) are preconfigured and copied into `dist/` during build.

### Option A: Automatic Git Deploy (Recommended)
1. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select repository `Kaban`.
3. Set build configuration:
   - **Framework preset**: `None` or `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**. Cloudflare assigns a free `*.pages.dev` subdomain automatically.

### Option B: Wrangler CLI Deploy
```sh
npm run build
npx wrangler pages deploy dist --project-name=kaban
```

---

## Local Vault & Atomic Backup

Kaban stores your financial data entirely on this device.
- **Exporting a Vault**: The vault screen exports a ZIP archive containing `db-dump.json` and all receipt/invoice attachments. Keep exported ZIP archives secure and private.
- **Restoring a Vault**: Restoring an archive performs an atomic single-transaction replacement of your local vault after validating file integrity and schema versions.

---

## Self-Hosted Fonts & Provenance

All font assets are bundled locally in [`./public/fonts/`](./public/fonts/) to eliminate external network requests:
- **Dangwa**: Brush typeface by Aaron Amar (Manila, Philippines). Sourced from Behance. 100% Free for Commercial and Personal Use ([`Dangwa-LICENSE.txt`](./public/fonts/Dangwa-LICENSE.txt)).
- **Bantayog**: Rough monument typeface by Jad Maza (© 2020). Single-user free license ([`Licensing - Bantayog [FREE].txt`](./public/fonts/Licensing%20-%20Bantayog%20%5BFREE%5D.txt)). Web embedding permitted via local `@font-face` per Jad Maza EULA (https://jadmaza.gumroad.com/p/eula-free).
- **Satoshi & Cabinet Grotesk**: Variable grotesque typefaces by Indian Type Foundry. Free commercial use ([`Satoshi-LICENSE.txt`](./public/fonts/Satoshi-LICENSE.txt), [`CabinetGrotesk-LICENSE.txt`](./public/fonts/CabinetGrotesk-LICENSE.txt)).
- **JetBrains Mono**: Monospaced tabular numerals by JetBrains. SIL Open Font License 1.1 ([`JetBrainsMono-OFL.txt`](./public/fonts/JetBrainsMono-OFL.txt)).
