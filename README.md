# KromaLedger

KromaLedger is a local-first expense, subscription, and invoice tracker. The web app stores its ledger in the browser's `KromaLedgerDB` IndexedDB database; it has no account or backend service.

Use Node.js 22.12 or later. From the repository root:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The first launch creates sample entries. Later launches keep the existing vault.

Run the project checks with:

```sh
npm run verify:lock
npm run typecheck
npm test
npm run build
node scripts/verify-portability.mjs
```

The portability checker counts nonblank TypeScript, TSX, and CSS source lines under `src`. It requires at least 75% in `src/core` and `src/state` and rejects browser-only references, DOM event types, and intrinsic web JSX in those directories. Its own small self-check is `node scripts/verify-portability.mjs --self-test`.

`src/core` holds the data model and calculations. `src/state` holds portable UI state and query orchestration. `src/adapters` contains IndexedDB, files, backup, and browser startup code; `src/ui` renders the web interface. Dependencies are exact-pinned, and `.npmrc` disables install scripts.

The vault screen downloads a ZIP containing `db-dump.json` and attachment bytes. The ZIP is **not encrypted**, so keep exported copies private. Restoring a ZIP **replaces the current local vault** after validating the archive; the replacement uses one database transaction. Export the current vault first if you want to keep it. Receipts and PDFs stay on this device unless you export them.

Satoshi, Cabinet Grotesk, and JetBrains Mono are bundled under `public/fonts` so the app does not request fonts from a CDN. Their license texts are in the same directory.
