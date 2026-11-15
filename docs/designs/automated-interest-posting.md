# Automated Per-Account Interest Posting (PH Digital Banks)

*   **Author:** Alexis John Rellon
*   **Status:** Approved
*   **Date:** 2026-11-15

--------------------------------------------------------------------------------

## Overview

KromaLedger is a local-first personal finance PWA backed by on-device IndexedDB (`KromaLedgerDB`). This design adds per-wallet automated interest-posting rules tailored for Philippines digital banks (such as MariBank, Maya, and GoTyme), prioritizing built-in bank presets with user-editable overrides. Interest posts as a distinct `INTEREST` transaction type on an `Asia/Manila` (UTC+8) schedule, treats the bank app as the source of truth via inline editing, and keeps past or verified entries locked.

## The Problem

Users holding funds in Philippines digital banks receive daily interest (e.g., MariBank, Maya) or monthly interest (e.g., GoTyme) that varies by balance tier, promo boosts, and 20% Final Withholding Tax (FWT). Today, KromaLedger users must manually log each interest credit as an `Incoming cash` transaction:

1.  **Manual toil:** Logging daily ₱5–₱50 interest credits every day creates friction and missed days.
2.  **Analytics distortion:** Recording interest as `Incoming cash` mixes passive yield with active income in cashflow reports.
3.  **Bank-app drift:** Even if automated, bank apps apply proprietary cutoff times, promo caps, and centavo rounding that can differ by ₱0.01+ from any formula, so users need a fast way to correct posted amounts to match their bank receipts without losing compounding accuracy.

## Goals

*   Eliminate daily manual interest entry by automating per-wallet interest posting with built-in PH digital bank presets (MariBank, Maya, GoTyme) and full user-editable overrides (rates, tiers, promo boosts, withholding tax, rounding).
*   Evaluate interest windows in `Asia/Manila` (UTC+8) using deterministic catch-up on app open/focus plus a foreground midnight timer.
*   Record interest as a distinct `INTEREST` transaction type excluded from `totalInflowMinor` and tracked in a separate `interestEarnedMinor` metric.
*   Treat the bank app as the source of truth: auto-posted entries start as `Estimated` and can be edited inline to `Verified`, with subsequent compounding calculated from the updated `wallet.balanceMinor`.
*   Keep past and verified entries locked; restrict automatic recalculation to unconfirmed entries inside the active posting window.
*   Show a non-ledger "Accrued this month (est.)" preview on wallet cards for monthly-payout presets (e.g., GoTyme) while posting to the ledger only on payout day.
*   Prevent stale catch-up posts after multi-day absences by surfacing a Baulito reminder modal (`missed X days`) on app open so users can log missed transfers before interest catch-up runs.

## Non-Goals

*   Server-side cron infrastructure or cloud-hosted user ledger synchronization.
*   Live bank API integration or web scraping to fetch real-time balances or promo rates.
*   Retroactive recalculation of locked historical `INTEREST` entries when old transactions are backdated or edited.

## Open Questions

None at this stage.

## Critical User Journeys (CUJs)

### CUJ 1: Enable Automated Daily Interest via Bank Preset

*   **Given**: A user has a MariBank wallet in KromaLedger with a balance of ₱120,000.00.
*   **When**: The user opens wallet interest settings, selects the MariBank preset (3.25% up to ₱100,000, 3.75% above ₱100,000, 20% FWT, daily payout), and chooses "Start from today".
*   **Then**: The preset is copied into a per-wallet `InterestRule` without backfilling years of prior history, and the next `Asia/Manila` midnight boundary posts an `Estimated` `INTEREST` transaction for that day.

### CUJ 2: Reconcile Estimated Interest Against Bank Receipt

*   **Given**: KromaLedger auto-posted an `Estimated` `INTEREST` entry of ₱9.86 for today, while the MariBank app credited ₱9.87.
*   **When**: The user taps the entry in the wallet activity feed and edits the amount to ₱9.87.
*   **Then**: The entry transitions to `Verified` (`isEstimated: false`, `locked: true`), `wallet.balanceMinor` updates atomically by +₱0.01, and tomorrow's interest calculation compounds on the verified balance.

### CUJ 3: Multi-Day Absence Catch-Up via Baulito Modal

*   **Given**: A user has not opened KromaLedger for 4 days and made a deposit in their bank app 2 days ago.
*   **When**: The user opens KromaLedger.
*   **Then**: Baulito displays a reminder modal (*"You missed 4 days"*) with options to **Log missed entries first** (deferring catch-up interest until the user finishes logging) or **Post estimated interest now** (running deterministic catch-up immediately).

### CUJ 4: Monthly-Payout Bank Preview (GoTyme)

*   **Given**: A user enables the GoTyme monthly-payout preset on a savings wallet.
*   **When**: The user views the wallet card mid-month.
*   **Then**: No daily `INTEREST` transactions pollute the ledger or inflate spendable balance; instead, the wallet card displays a non-ledger *"Accrued this month (est.)"* figure until the monthly payout date posts the `INTEREST` transaction.

## Technical Plan (Architecture)

### 1. System Data Flow

Because KromaLedger is a 100% on-device PWA backed by IndexedDB (`KromaLedgerDB`), automated interest posting runs through the deterministic `reconcile()` pipeline rather than a server cron job. `ForegroundReconcile` (`src/adapters/web-dexie/WebBootstrap.tsx`) evaluates the current `Asia/Manila` (UTC+8) calendar date (`todayManila`) on app open, window focus, and via a foreground timer scheduled for the next `00:00 Asia/Manila`.

```text
App Open / Focus / Midnight Timer
        │
        ▼
getTodayManila() (UTC+8)
        │
        ├──[Active InterestRule & missedDays >= 1]──► Baulito Missed-Days Modal
        │                                                ├── "Log missed entries first" ──► Defer interest catch-up
        │                                                └── "Post estimated interest now" ──► Proceed to reconcile()
        │
        └──[No missed-days block]──────────────────────► DexieStorageRepo.reconcile(todayManila)
                                                                │
                                                                ▼
                                                        interestEngine.evaluateInterestRules()
                                                                ├── Daily rules: post missing periodKeys (YYYY-MM-DD)
                                                                ├── Monthly rules: post on payout day (YYYY-MM)
                                                                └── Current-window & !locked & isEstimated: recalculate
```

### 2. Core Data Models (`src/core/models/index.ts`)

1.  **Transaction Type & Metadata:**
    *   Extend `transactionTypeSchema` (`L11`) with `"INTEREST"`.
    *   Add optional `interestMeta` on `transactionSchema`:
        *   `ruleId: string`
        *   `periodKey: string` (`YYYY-MM-DD` for daily payouts, `YYYY-MM` for monthly payouts)
        *   `isEstimated: boolean` (`true` when auto-posted, `false` once user-verified or edited)
        *   `locked: boolean` (`false` while inside the active posting window and unverified; `true` once past the window or user-verified)
        *   `grossMinor: number` (pre-tax centavos)
        *   `taxMinor: number` (withheld tax centavos)
2.  **`InterestRule` Schema:**
    *   `id: string`, `walletId: string`, `enabled: boolean`
    *   `presetId?: string`, `presetVersion?: number` (copied on selection so preset updates never silently overwrite user rules)
    *   `tiers: Array<{ upToMinor: number | null; rateBps: number }>` (e.g. MariBank: `[{ upToMinor: 10_000_000, rateBps: 325 }, { upToMinor: null, rateBps: 375 }]`)
    *   `tierMode: "MARGINAL" | "WHOLE_BALANCE"`
    *   `promoBoostBps: number` (default `0`), `promoCapMinor?: number`, `promoExpiresOn?: string`
    *   `withholdingTaxBps: number` (default `2000` for 20% PH Final Withholding Tax)
    *   `dayCountBasis: 365 | 366 | 360` (default `365`)
    *   `payoutFrequency: "DAILY" | "MONTHLY"`, `monthlyPayoutDay?: number`
    *   `rounding: "FLOOR" | "HALF_UP"` (default `"FLOOR"`)
    *   `startDate: string` (`YYYY-MM-DD` Manila date; defaults to today so existing wallets do not backfill years of history)
    *   `lastPostedPeriodKey?: string`

### 3. PH Bank Registry & Calculation Engine

*   **Shared PH Bank Registry (`src/core/engine/phBankRegistry.ts`):** Unifies the PH bank alias matching already in `src/core/engine/transferFees.ts` with versioned default interest presets (MariBank, Maya Bank, GoTyme Bank, CIMB, OwnBank, etc.). Wallet setup uses `wallet.institution` to suggest the matching preset.
*   **`Asia/Manila` Date Utility (`src/core/engine/manilaDate.ts`):** Converts any `Date` to `YYYY-MM-DD` in `Asia/Manila` (`UTC+8`, no DST) using fixed `+08:00` offset arithmetic or `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" })`.
*   **Interest Engine (`src/core/engine/interestEngine.ts`):**
    *   Uses integer-centavo (`BigInt`) arithmetic for `principalMinor * rateBps * days / (10000 * dayCountBasis)` before applying `withholdingTaxBps` and deterministic rounding (`FLOOR` or `HALF_UP`).
    *   Applies `promoBoostBps` (up to `promoCapMinor` when `periodKey <= promoExpiresOn`).
    *   Uses deterministic transaction IDs: `interest:${walletId}:${periodKey}`, matching `sub:${subscription.id}:${payment.date}` in `ledgerCommands.ts`.
    *   Skips creating ₱0.00 transactions when net interest rounds to `0` minor units, advancing `lastPostedPeriodKey` instead.
    *   Provides `estimateMonthlyAccruedMinor(rule, wallet, transactions, todayManila)` as a pure read-only calculation for the wallet card *"Accrued this month (est.)"* preview on monthly-payout presets.

### 4. Lock Boundary, In-Window Recalculation, & Inline Verification

*   **Past / Verified Lock:** Any `INTEREST` transaction with `periodKey < currentWindowKey` or `interestMeta.locked === true` or `interestMeta.isEstimated === false` is immutable to automated recalculation.
*   **Active Window Recalculation:** If an `INTEREST` transaction exists for `currentWindowKey` with `isEstimated === true` and `!locked`, and the wallet balance changes due to a transaction within that window, `reconcile()` updates its `amountMinor` and adjusts `wallet.balanceMinor` by the delta.
*   **Bank-App Source-of-Truth Edit:** Editing an `INTEREST` entry's amount inline sets `isEstimated = false` and `locked = true`, and atomically updates `wallet.balanceMinor` by `(newAmountMinor - oldAmountMinor)`. All subsequent days automatically compound from the updated `wallet.balanceMinor`.

### 5. Storage, Backup, & Analytics Isolation

*   **IndexedDB (`src/adapters/web-dexie/db.ts`):** Bump `KabanDB` to `version(6)` adding `interestRules: "&id,walletId,enabled"`.
*   **Backup (`src/adapters/backup/zipVault.ts`):** Add `interestRules` to `SyncDumpPayload` and `syncDumpSchema` so full-vault ZIP and QR exports/imports preserve interest rules.
*   **Cashflow Analytics (`src/core/engine/cashflowAnalytics.ts`):** Exclude `type === "INTEREST"` from `totalInflowMinor` and add `interestEarnedMinor: number` to `CashflowAnalytics` so passive interest never inflates active income.

### 6. UI Components

*   **Wallet Interest Settings:** Accessible from wallet edit/detail view; prioritizes PH bank preset selection (auto-detected from `wallet.institution`) with full inline override controls for tiers, promo boost, tax, and rounding, plus "Start from today" vs. optional backfill date.
*   **Activity Feed Inline Edit & Badge:** `INTEREST` entries display an `Estimated` (`~`) or `Verified` badge and support one-tap inline amount editing to match the bank app receipt.
*   **Wallet Card Monthly Preview:** Monthly-payout wallets display a subtle *"Accrued this month (est.)"* line computed by `estimateMonthlyAccruedMinor()`.
*   **Baulito Missed-Days Modal:** Rendered in `WebBootstrap.tsx` (reusing `KabanMascot` `alert-peek` pose) when `missedDays >= 1` and at least one enabled `InterestRule` exists, offering **Log missed entries first** (sets a session deferral flag until the user clicks "Calculate Interest" or finishes logging) and **Post estimated interest now**.

## Alternatives Considered

### Alternative A: Server-Side Midnight Cron Job

*   **Pros**: Posts interest even when the user never opens the browser or PWA.
*   **Cons**: Requires a hosted backend database, user authentication, and server-side ledger sync—none of which exist in KromaLedger's local-first architecture.
*   **Reason for Rejection**: Rejected by author: KromaLedger is 100% on-device (IndexedDB `KromaLedgerDB` with static Cloudflare Pages hosting), so a server cron cannot write to the user's local ledger; deterministic `Asia/Manila` catch-up in `reconcile()` achieves identical ledger results on app open/focus.

### Alternative B: Log Interest as Standard `INCOME` (`Incoming cash`)

*   **Pros**: Requires no changes to `transactionTypeSchema` or `cashflowAnalytics.ts`.
*   **Cons**: Mixes passive ₱5–₱50 daily interest credits with active salary/business inflows in cashflow reports and provides no structured metadata (`isEstimated`, `locked`, `periodKey`) for bank-app reconciliation.
*   **Reason for Rejection**: Rejected by author: interest requires a distinct `INTEREST` transaction type to separate passive yield into `interestEarnedMinor` and support Estimated vs. Verified reconciliation.

### Alternative C: Hardcoded Bank Formulas Without User Overrides

*   **Pros**: Simpler wallet settings UI with fewer editable fields.
*   **Cons**: PH digital banks frequently revise base rates, promo mission boosts, and balance caps; any formula mismatch or unannounced rate change would force users to wait for an app release or see persistent centavo drift.
*   **Reason for Rejection**: Rejected by author: the bank app is the source of truth, so presets must be copied into editable per-wallet rules and users must be able to override rates and edit posted amounts inline.

### Alternative D: Auto-Recalculate All Historical Interest on Backdated Edits

*   **Pros**: Keeps historical interest strictly consistent with backdated deposits or withdrawals.
*   **Cons**: Silently mutates previously reconciled/verified ledger entries and shifts historical balances that the user already matched against their bank app.
*   **Reason for Rejection**: Rejected by author: past and verified entries stay locked; only unconfirmed entries within the active posting window recalculate, while missed multi-day absences are surfaced beforehand via the Baulito missed-days modal.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Backward Compatibility & Zero-Loss Migration:** Bumping `KabanDB` to `version(6)` in `src/adapters/web-dexie/db.ts` must preserve `"KromaLedgerDB"` and all existing tables/records without data loss, and `zipVault.ts` must import older v1–v5 backups that lack `interestRules` without failing schema validation.
*   **Integer Precision:** All interest math must execute in `BigInt` / integer minor units (centavos) with explicit rounding (`FLOOR` or `HALF_UP`) so floating-point drift never corrupts `wallet.balanceMinor`.
*   **Timezone Determinism:** All interest window boundaries must use `Asia/Manila` (`UTC+8`) regardless of the device's local OS timezone or browser locale.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Phase 1: Core Models, Date/Bank Registry, & Interest Engine

#### 1. `src/core/models/index.ts` (Modify)
*   **Type / Scope**: Core Zod schemas & TypeScript types
*   **Proposed Changes**: Extend `transactionTypeSchema` with `"INTEREST"`. Add `interestMetaSchema` (`ruleId: idSchema`, `periodKey: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/)`, `isEstimated: z.boolean()`, `locked: z.boolean()`, `grossMinor: amountSchema.nonnegative()`, `taxMinor: amountSchema.nonnegative()`) as an optional field on `transactionSchema`. Define `interestTierSchema` (`upToMinor: amountSchema.positive().nullable()`, `rateBps: amountSchema.nonnegative().max(100000)`), `interestRuleSchema`, and `InterestRule` type covering `id: idSchema`, `walletId: idSchema`, `enabled: z.boolean()`, `presetId: z.string().optional()`, `presetVersion: z.number().int().positive().optional()`, `tiers: z.array(interestTierSchema).min(1)` (with `.refine()` requiring strictly increasing `upToMinor` values and `null` allowed only on the final tier), `tierMode: z.enum(["MARGINAL", "WHOLE_BALANCE"])`, `promoBoostBps: amountSchema.nonnegative().max(100000).default(0)`, `promoCapMinor: amountSchema.positive().optional()`, `promoExpiresOn: dateOnlySchema.optional()`, `withholdingTaxBps: amountSchema.nonnegative().max(10000).default(2000)`, `dayCountBasis: z.union([z.literal(365), z.literal(366), z.literal(360)]).default(365)`, `payoutFrequency: z.enum(["DAILY", "MONTHLY"])`, `monthlyPayoutDay: z.number().int().min(1).max(31).optional()`, `rounding: z.enum(["FLOOR", "HALF_UP"]).default("FLOOR")`, `startDate: dateOnlySchema`, and `lastPostedPeriodKey: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional()`.
*   **Rationale**: Provides shared schema validation and type safety across the engine, storage, backup, and UI layers.

#### 2. `src/core/engine/manilaDate.ts` (Create)
*   **Type / Scope**: Core date/time utility
*   **Proposed Changes**: Export `getTodayManila(now?: Date): string`, `addDaysManila(dateOnly: string, days: number): string`, `msUntilNextManilaMidnight(now?: Date): number`, and `getManilaMonthKey(dateOnly: string): string` using fixed `UTC+8` (`Asia/Manila`) calendar arithmetic.
*   **Rationale**: Aligns all interest posting windows and midnight timers to `Asia/Manila` regardless of the user's device timezone.

#### 3. `src/core/engine/phBankRegistry.ts` (Create)
*   **Type / Scope**: Core PH digital bank preset registry
*   **Proposed Changes**: Export `PH_DIGITAL_BANK_ALIASES` and versioned PH digital bank presets (MariBank, Maya Bank, GoTyme Bank, CIMB Bank, OwnBank) with `presetId`, `presetVersion`, `aliases`, `tiers`, `tierMode`, `withholdingTaxBps` (`2000`), `dayCountBasis`, `payoutFrequency`, `monthlyPayoutDay`, and `rounding`. Export `matchBankPreset(institution?: string)`.
*   **Rationale**: Centralizes PH bank interest presets and enables automatic preset suggestion from `wallet.institution`.

#### 4. `src/core/engine/transferFees.ts` (Modify)
*   **Type / Scope**: Core transfer fee rules
*   **Proposed Changes**: Import `PH_DIGITAL_BANK_ALIASES` from `phBankRegistry.ts` for digital-bank alias matching instead of duplicating alias arrays.
*   **Rationale**: Keeps bank alias matching in one place across transfer-fee detection and interest-preset detection.

#### 5. `src/core/engine/interestEngine.ts` (Create)
*   **Type / Scope**: Core interest calculation & catch-up engine
*   **Proposed Changes**:
    *   Implement `calculatePeriodInterest(principalMinor, rule, periodKey)` using `BigInt` arithmetic and `FLOOR` or `HALF_UP` rounding. Base tier interest applies across `rule.tiers` (`MARGINAL` slices each bracket up to `upToMinor`; `WHOLE_BALANCE` applies the matching bracket rate to the full principal). If `promoBoostBps > 0` and `(!promoExpiresOn || periodKey <= promoExpiresOn)`, add boost interest on `min(principalMinor, promoCapMinor ?? principalMinor)`.
    *   Implement `evaluateInterestRules(input)` returning new or updated `INTEREST` transactions, updated `InterestRule` cursors (`lastPostedPeriodKey`), and `walletBalanceDeltas`:
        *   **Posting windows:** At `todayManila` (`00:00 Asia/Manila`), `DAILY` rules post completed days up to `currentWindowKey = addDaysManila(todayManila, -1)` (`YYYY-MM-DD`). `MONTHLY` rules post on `min(monthlyPayoutDay ?? 1, daysInMonth)` with `periodKey = YYYY-MM` and `currentWindowKey = getManilaMonthKey(todayManila)`, summing daily accruals across the month.
        *   **Multi-day catch-up:** Compounds day-by-day starting from `wallet.balanceMinor` plus each preceding catch-up day's net interest.
        *   **Lock enforcement:** Skip any existing `INTEREST` transaction where `periodKey < currentWindowKey || interestMeta.locked || !interestMeta.isEstimated`. Recalculate only when `periodKey === currentWindowKey && interestMeta.isEstimated && !interestMeta.locked`. Skip creating ₱0.00 transactions when net interest rounds to `0` minor units, advancing `lastPostedPeriodKey` instead.
    *   Export `estimateMonthlyAccruedMinor(rule, wallet, transactions, todayManila)` for monthly-payout wallet card previews.
*   **Rationale**: Isolates financial math, tiering, withholding tax, and lock-boundary enforcement in a pure unit-testable module.

#### 6. `tests/core/interestEngine.test.ts` (Create)
*   **Type / Scope**: Unit tests
*   **Proposed Changes**: Test `BigInt` tier/tax/rounding math (MariBank 3.25%/3.75% >₱100k, Maya boosted cap, GoTyme monthly payout with `monthlyPayoutDay` clamping), `Asia/Manila` midnight boundary rollover, `FLOOR` vs `HALF_UP`, ₱0.00 skip behavior, lock immutability on past/verified entries, and in-window recalculation.
*   **Rationale**: Validates interest math, window boundaries, and lock enforcement.

**Phase 1 Checkpoint:** `npm run typecheck && npx vitest run tests/core/interestEngine.test.ts`

---

### Phase 2: Reconciler, Cashflow Analytics, Storage & Backup

#### 7. `src/core/engine/reconciler.ts` (Modify)
*   **Type / Scope**: Core reconciliation engine
*   **Proposed Changes**: Extend `ReconcileInput` with optional `interestRules?: InterestRule[]`, `existingTransactions?: Transaction[]`, and `deferInterest?: boolean`; extend `ReconcileResult` with `interestRules?: InterestRule[]` and `walletBalanceDeltas?: Record<string, number>`. Invoke `evaluateInterestRules()` when `deferInterest` is false and append resulting `INTEREST` transactions.
*   **Rationale**: Integrates automated interest catch-up into KromaLedger's reconciliation pass.

#### 8. `src/core/engine/cashflowAnalytics.ts` (Modify)
*   **Type / Scope**: Core analytics engine
*   **Proposed Changes**: Exclude `t.type === "INTEREST"` from `totalInflowMinor` in `calculateCashflow()`, add `interestEarnedMinor: number` to `CashflowAnalytics`, and exclude `INTEREST` from recurring operating cashflows in `calculateCashForecast()` and `analyzeWalletLiquidity()`.
*   **Rationale**: Prevents passive interest credits from inflating active income or recurring cashflow forecasts while surfacing total interest earned separately.

#### 9. `src/core/ports/IStorageRepo.ts` (Modify)
*   **Type / Scope**: Core storage port interface
*   **Proposed Changes**: Add `listInterestRules(walletId?: string): Promise<InterestRule[]>`, `saveInterestRule(rule: InterestRule): Promise<void>`, `deleteInterestRule(id: string): Promise<void>`, and `verifyInterestTransaction(txId: string, actualAmountMinor: number): Promise<Transaction>`. Update `reconcile(currentDate: string, options?: { deferInterest?: boolean }): Promise<ReconcileResult>`.
*   **Rationale**: Exposes interest rule CRUD, verified amount editing, and deferred interest reconciliation through the storage abstraction.

#### 10. `src/adapters/web-dexie/db.ts` (Modify)
*   **Type / Scope**: IndexedDB schema (Dexie)
*   **Proposed Changes**: Add `interestRules!: Table<InterestRule, string>` and bump `KabanDB` to `this.version(6).stores({ interestRules: "&id,walletId,enabled" })`.
*   **Rationale**: Persists per-wallet interest rules on-device while preserving `"KromaLedgerDB"` backward compatibility.

#### 11. `src/adapters/web-dexie/DexieStorageRepo.ts` (Modify)
*   **Type / Scope**: Dexie storage repository implementation
*   **Proposed Changes**:
    *   Implement `listInterestRules`, `saveInterestRule`, `deleteInterestRule`, and atomic `verifyInterestTransaction(txId, actualAmountMinor)` (rejects `actualAmountMinor < 0`, missing transactions, or `type !== "INTEREST"`; updates `amountMinor`, sets `isEstimated = false` and `locked = true` while preserving `grossMinor`/`taxMinor` as original estimate metadata, and adjusts `wallet.balanceMinor` by `actualAmountMinor - oldAmountMinor` inside a Dexie `rw` transaction).
    *   Update `reconcile(currentDate, options)`: include `this.db.interestRules` in `this.db.transaction("rw", [...])`, pass `interestRules`, existing `INTEREST` transactions, and `options?.deferInterest` to `reconcile()`, **skip `t.type === "INTEREST"` in the existing `result.transactions` balance-update loop**, and apply `result.walletBalanceDeltas` + persist updated `interestRules` atomically.
    *   Update `deleteWallet(id)` to delete associated `interestRules` by `walletId`, and clear `interestRules` in `clearAllData()` and `resetToDemo()`.
*   **Rationale**: Prevents double-counting `INTEREST` balance updates and keeps wallets, rules, and transactions consistent under atomic IndexedDB transactions.

#### 12. `src/adapters/backup/zipVault.ts` (Modify)
*   **Type / Scope**: Vault backup & restore
*   **Proposed Changes**: Add optional `interestRules: z.array(interestRuleSchema).optional()` to `dumpSchema` (which `syncDumpSchema` extends) and `SyncDumpPayload`. Export `interestRules` during ZIP/QR backup, and include `db.interestRules` in the explicit Dexie `rw` transaction table lists in `restoreVault()` and `restoreSyncPayload()`. In `validateSyncDump`, reject `interestRules` referencing a `walletId` missing from `wallets`. In `restoreSyncPayload` and `restoreVault`, clear `interestRules` in `"OVERWRITE"` mode and upsert via `bulkPut` in `"MERGE"` mode (ignoring missing `interestRules` on v1–v5 backups).
*   **Rationale**: Preserves interest rules across vault backups and restores without breaking older backup files.

#### 13. `tests/core/reconciler.test.ts`, `tests/core/cashflowAnalytics.test.ts`, `tests/adapters/vault.test.ts`, & `tests/adapters/storage.test.ts` (Modify)
*   **Type / Scope**: Unit & adapter integration tests
*   **Proposed Changes**: Add test cases for `reconciler` interest deferral/catch-up, `cashflowAnalytics` `interestEarnedMinor` isolation, `zipVault` v5/v6 export/import (`MERGE` and `OVERWRITE`), and `DexieStorageRepo` `verifyInterestTransaction` + `reconcile()` single-application balance updates + `deleteWallet` cascade.
*   **Rationale**: Verifies reconciler integration, analytics isolation, backup compatibility, and Dexie atomicity.

**Phase 2 Checkpoint:** `npm run typecheck && npm test`

---

### Phase 3: React Query, Bootstrap, & UI

#### 14. `src/state/useUIStore.ts` & `src/state/queries/index.ts` (Modify)
*   **Type / Scope**: UI state store & React Query hooks
*   **Proposed Changes**: Add `interestDeferred: boolean` and `missedInterestDays: number` (with setters) to `src/state/useUIStore.ts`. In `src/state/queries/index.ts`, add `useInterestRules(walletId?)`, `useSaveInterestRule()`, `useDeleteInterestRule()`, `useVerifyInterestTransaction()`, and update `useReconcileCommand` to accept `{ currentDate: string; deferInterest?: boolean }`, invalidating `wallets`, `transactions`, and `interestRules` queries on settlement.
*   **Rationale**: Connects UI components to the storage layer and tracks session deferral state across screens.

#### 15. `src/adapters/web-dexie/WebBootstrap.tsx` (Modify)
*   **Type / Scope**: App lifecycle & reconciliation bootstrap
*   **Proposed Changes**: Switch both `boot()` and `ForegroundReconcile` from `format(new Date(), "yyyy-MM-dd")` to `getTodayManila()`. Schedule a foreground timeout using `msUntilNextManilaMidnight()`. In both `boot()` and `ForegroundReconcile`, compute missed interest days by comparing `todayManila` against each enabled `InterestRule.lastPostedPeriodKey` (or `startDate`)—never `appMeta.lastReconciledDate`. If `missedDays >= 1` for any enabled rule, set `missedInterestDays` in `useUIStore` to open `BaulitoMissedDaysModal` and pass `deferInterest: true` to `repo.reconcile()` until resolved.
*   **Rationale**: Schedules reconciliation at `Asia/Manila` midnight and prevents stale catch-up interest from posting before missed transactions are logged.

#### 16. `src/ui/components/BaulitoMissedDaysModal.tsx` (Create)
*   **Type / Scope**: UI modal component
*   **Proposed Changes**: Render a modal using `KabanMascot` (`pose="alert-peek"`) displaying `"You missed X days"` with two actions: **Log missed entries first** (sets `interestDeferred = true`, closes the modal, and opens `QuickAddDrawer`) and **Post estimated interest now** (clears `interestDeferred`, closes the modal, and runs `reconcile(getTodayManila(), { deferInterest: false })`).
*   **Rationale**: Prompts users after multi-day absences to log missed transfers before catch-up interest posts.

#### 17. `src/ui/components/WalletInterestSettings.tsx`, `src/ui/screens/HomeDashboard.tsx`, `src/ui/screens/WalletsScreen.tsx`, `src/ui/components/PhysicalWalletCard.tsx`, `src/ui/components/WalletActivity.tsx`, `src/ui/components/EditEntryModal.tsx`, `src/ui/components/ActivityFilters.tsx`, & `src/core/engine/walletActivity.ts` (Create / Modify)
*   **Type / Scope**: UI wallet settings, deferred banner, card preview, & activity feed reconciliation
*   **Proposed Changes**:
    *   Create `WalletInterestSettings.tsx` (preset picker prioritizing PH digital banks, editable tiers/promo boost/tax/rounding, and `"Start from today"` default vs. optional backfill from a user-selected `startDate`).
    *   Render a deferred-interest banner with a **"Calculate Interest"** button in `HomeDashboard.tsx` and `WalletsScreen.tsx` when `interestDeferred` is true.
    *   Update `PhysicalWalletCard.tsx` to render *"Accrued this month (est.)"* via `estimateMonthlyAccruedMinor()` for monthly-payout rules.
    *   Update `WalletActivity.tsx` to badge `INTEREST` entries as `Estimated` (`~`) or `Verified` with inline amount editing via `verifyInterestTransaction()`, update `ActivityFilters.tsx` and `walletActivity.ts` to include `"INTEREST"` filtering, and restrict `EditEntryModal.tsx` on `INTEREST` transactions to editing `amountMinor` and `notes` only.
*   **Rationale**: Lets users select or customize bank presets, log missed entries before catch-up, and reconcile estimated interest against bank receipts.

**Phase 3 Checkpoint:** `npm run build && npm test`

### Verification Plan

*   **Compilation/Build**: `npm run typecheck` and `npm run build`
*   **Unit & Engine Tests**: `npm test` (`vitest run`) covering `tests/core/interestEngine.test.ts`, `tests/core/reconciler.test.ts`, `tests/core/cashflowAnalytics.test.ts`, `tests/adapters/vault.test.ts`, and `tests/adapters/storage.test.ts`.
*   **Manual / Integration Checks**:
    *   Verify `KabanDB` v5 → v6 upgrade in browser IndexedDB preserves existing wallets and transactions.
    *   Verify inline edit of an `Estimated` `INTEREST` entry transitions it to `Verified` (`locked: true`), updates `wallet.balanceMinor`, and compounds the next day from the edited balance.
    *   Verify `BaulitoMissedDaysModal` appears when `lastPostedPeriodKey < yesterdayManila` with an active `InterestRule` and defers interest posting until confirmed.

--------------------------------------------------------------------------------

*Drafted with EGM*
