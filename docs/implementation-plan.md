# KromaLedger implementation plan

## Phase 1: guardrails and portable core — implemented
- Exact dependency versions, npm settings, Vite/React 19/TypeScript, and lock verification are configured.
- Zod models, ports, integer minor-unit math, date-only validation, invoice calculations, deterministic reconciliation, numpad evaluation, cashflow analytics, and demo seed factory are implemented with focused tests.

## Phase 2: local vault, state, wallets, and settings — implemented; portability extraction active
- Dexie stores and repository/file adapters provide CRUD, reconciliation, wallets, profiles, attachment isolation, and local image compression. Storage context, React Query hooks, and Zustand state inject persistence.
- ZIP backup validation/export/restore is transactionally safe and preserves binary attachment data.
- ledgerCommands.ts now owns portable validation and atomic invoice-with-items save and settlement workflows through a transaction-scoped command gateway. Subscription history detachment prevents dangling references after deleting a subscription.
- Current source portability measurement is 726/7417 nonblank lines (9.8%) under node scripts/verify-portability.mjs; the requested 75% gate remains unmet. Most of the remaining source is presentational React/DOM implementation in src/ui/components and src/ui/screens. Keep extracting real form, selector, and domain behavior into src/core/src/state; do not move JSX/DOM or inflate line counts to satisfy the metric.

## Phase 3: interface and installability — implemented; final interaction audit active
- Local-font PWA includes dashboard, pending/subscription hub, wallets, settings, and quick-add flows, with local-only persistence.
- Invoice settlement is available for every unpaid invoice. Recent subscription activity labels its actual billing cycle.
- Final checks still include dialog keyboard/focus behavior, vault restore confirmation and quota/persistence status, and offline image compression verification.

## Phase 4: integration verification — active
- Latest npm run typecheck passes.
- Focused gateway and Dexie storage verification passes: 16 tests across 2 files, including concurrent settlement, deletion-history preservation, and ZIP export/restore after deletion.
- Run the full test suite, exact dependency lock checks, portability checker, production build, PWA/offline browser smoke, and graph update after remaining implementation work.
