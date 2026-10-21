# KromaLedger acceptance checklist

Source: [codex_master_prompt.md](codex_master_prompt.md). This is a **2026-10-21 worktree checkpoint**, not a completion claim. Re-run all gates after the current wallet, settings, and portability changes settle.

| Requirement | Current evidence and remaining check |
| --- | --- |
| Exact React 19 pins, private package, hardened `.npmrc`, immutable lock | `npm run verify:lock` passes on this worktree. Final `npm ci` and lock check remain. |
| Strict TypeScript, tests, production build | `npm run typecheck` passes; `npm test` passes **57 tests in 16 files**. Production build has not been rerun against this worktree. |
| At least 75% of all application source lines in portable `src/core` and `src/state` | **Failing:** `node scripts/verify-portability.mjs` reports **726/7,332 nonblank `src` TS/TSX/CSS lines (9.9%)**. The checker found no browser-only references in core/state. This requirement is open; formatting or padding does not satisfy it. |
| Portable domain math, validation, and reconciler | Tests cover integer minor-unit invoice math, line items, month-end/leap subscription cycles, deterministic transaction IDs, overdue states, numpad parsing, and cashflow analytics. |
| IndexedDB storage and attachment isolation | `KromaLedgerDB` uses Dexie; attachment metadata and bytes have separate tables. Adapter tests pass, including wallet and invoice operations. Recheck browser flows after current changes. |
| Full local backup and atomic restore | Tests cover ZIP round trip, malformed data, missing bytes, and rollback on an injected write failure. Archive contains `db-dump.json` and attachments; **it is not encrypted**. Restore explicitly replaces current local data after a warning. Recheck final browser flow. |
| Boot and foreground reconciliation | Source and tests show boot and visibility reconciliation plus manual subscription confirmation. Recheck after storage-port refactor. |
| Demo data | Seed tests pass; prototype-date calculations previously yielded ₱24,500 net outflow and 40% fixed share. Recheck fresh install and restoration in final browser run. |
| Dashboard, quick add, pending hub, wallets, and settings | Components exist and domain tests pass for entry/edit/remove and wallets. A previous browser snapshot verified itemized invoice save, partial/full settlement, PDF receipt export/restore, and responsive widths. The current changed worktree needs a fresh browser pass, including newly added screens. |
| Visual system and local fonts | Satoshi, Cabinet Grotesk, and JetBrains Mono assets and license texts are bundled under `public/fonts`. A previous browser snapshot loaded all three locally; recheck final build. |
| Offline installable PWA | A previous Chromium snapshot reported valid manifest and zero installability errors, offline service-worker reload, and no external runtime requests. Recheck after final rebuild. |
| Accessibility and data safety | Restore has an explicit overwrite step; modal keyboard and focus behavior, query-read failures, and final data safety need browser regression checks. |

The prompt's four workstreams were sequenced with isolated ownership under the available agent slots. The workspace had no Git repository at kickoff, so atomic commits were not an applicable gate then.
