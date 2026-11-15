# Automated Per-Account Interest Posting (PH Digital Banks)

* **Author:** Alexis John Rellon
* **Date:** 2026-11-15

## Overview

KromaLedger users with Philippines digital bank accounts (such as MariBank, Maya, and GoTyme) currently have to log daily or monthly interest credits manually as `Incoming cash`. This feature adds per-account automated interest-posting rules that prioritize built-in PH digital bank presets (with user-editable overrides), post a distinct `INTEREST` ledger entry type on an `Asia/Manila` (UTC+8) schedule, and treat the bank app as the source of truth so users can edit any posted amount while keeping past entries locked.

## Analysis

* **Local-First PWA vs. Background Cron (Contradiction & Resolution):** KromaLedger ("Kaban") is a 100% on-device local-first PWA backed by IndexedDB (`KromaLedgerDB` via `DexieStorageRepo.ts`) and static Cloudflare Pages hosting (`wrangler.jsonc`), with no server-side user ledger database. A server cron job cannot write to a user's local IndexedDB while the app is closed. Instead, the existing deterministic `reconcile()` engine (`src/core/engine/reconciler.ts`) can be upgraded to evaluate `Asia/Manila` (UTC+8) calendar dates (`todayManila`), deterministically catching up any missed `periodKey`s when the app opens or regains focus, paired with a lightweight foreground timer if the app is open at midnight `Asia/Manila`.
* **Self-Correcting Principal Anchor:** Bank apps apply proprietary cutoffs, promo mission boosts, 20% Final Withholding Tax (FWT), and centavo rounding that can drift by ₱0.01+ from any formula. Auto-posted entries should be marked as **Estimated** (`isEstimated: true`) until confirmed or edited by the user (**Verified**, `isEstimated: false, locked: true`). Because editing a posted interest entry atomically updates `wallet.balanceMinor`, the next day's interest calculation automatically compounds off the bank-verified balance with zero cumulative drift.
* **Lock Boundary, Multi-Day Gaps, & In-Window Recalculation:** Past entries (`periodKey < currentWindowKey`, `locked === true`, or `isEstimated === false`) stay strictly immutable to automatic recalculation. Only an unconfirmed entry still inside the active posting window (`periodKey === currentWindowKey` and `isEstimated === true` and `!locked`) recalculates if the user logs or edits a transaction within that window. To handle multi-day gaps where a user forgets to open the app or log transfers, opening the app after missed days triggers a **Baulito** reminder modal (*"You missed X days"*) with a CTA to log missed transactions **before** running interest catch-up (or to post estimated interest immediately if nothing changed).
* **Tiered Rates, Tax, and Integer Math:** PH digital banks use both marginal bracket tiers (e.g., first ₱100k at rate A, excess at rate B) and whole-balance threshold tiers, plus 20% FWT. Rules need a declarative `tiers` schedule with `tierMode: "MARGINAL" | "WHOLE_BALANCE"`, `withholdingTaxBps` (default `2000`), `dayCountBasis` (`365 | 366 | 360`), `payoutFrequency` (`"DAILY" | "MONTHLY"`), and deterministic integer-centavo rounding (`FLOOR` or `HALF_UP`). Zero or negative balances skip creating ₱0.00 clutter entries and simply advance `lastPostedPeriodKey`.
* **Preset Staleness & Shared PH Bank Registry:** Digital banks change rates and promo caps often. Presets should be versioned (`presetVersion`) and copied into the wallet's `InterestRule` on selection so preset updates never silently overwrite user-configured rules. Because `src/core/engine/transferFees.ts` already matches PH bank aliases, bank metadata (aliases, transfer fees, and default interest presets) can live in a shared PH Bank Registry.
* **Schema, Backup, & Analytics Impact:**
  * `src/core/models/index.ts`: Extend `transactionTypeSchema` with `"INTEREST"`, add optional `interestMeta` (`ruleId`, `periodKey`, `isEstimated`, `locked`, `grossMinor`, `taxMinor`), and define `InterestRule`.
  * `src/adapters/web-dexie/db.ts` & `src/adapters/backup/zipVault.ts`: Bump `KabanDB` to `version(6)` with an `interestRules` table and include `interestRules` in `SyncDumpPayload` export/import.
  * Deterministic IDs (`interest:${walletId}:${periodKey}`) prevent duplicate posts, matching `sub:${subscription.id}:${payment.date}` in `ledgerCommands.ts`.
  * **Analytics Isolation:** `calculateCashflow()` (`src/core/engine/cashflowAnalytics.ts`) currently sums all positive non-transfer transactions into `totalInflowMinor`. `INTEREST` entries will be excluded from `totalInflowMinor` and tracked in a separate `interestEarnedMinor` bucket so passive daily interest does not skew active income metrics.
  * **Monthly Payout Preview:** For monthly-crediting presets (e.g., GoTyme), ledger transactions post only on the monthly payout date to keep the spendable balance accurate, while the wallet card displays a non-ledger "Accrued this month (est.)" estimation.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Per-wallet automated interest rules prioritizing built-in PH digital bank presets (MariBank, Maya, GoTyme, etc.) with full user-editable overrides (rates, tiers, promo boosts, tax, rounding).
  * `Asia/Manila` (UTC+8) midnight-aligned deterministic catch-up in `reconcile()` on app open/focus, plus a foreground midnight timer.
  * Distinct `INTEREST` transaction type (excluded from `totalInflowMinor`, tracked in `interestEarnedMinor`) with Estimated vs. Verified state and one-tap inline amount editing.
  * Non-ledger "Accrued this month (est.)" preview on wallet cards for monthly-payout presets.
  * Strict lock on past/verified entries; recalculation restricted to the active posting window, plus a Baulito missed-days reminder modal on app open to let users log missed transactions before catch-up interest is posted.
  * Backup/restore support (`zipVault.ts`) and "Start from today" default for existing wallets (with optional backfill).
* **Out-of-Scope Non-Goals:**
  * Server-side cron infrastructure or cloud-hosted user ledger sync (KromaLedger is local-first on-device).
  * Live scraping or bank API integration to fetch real-time promo rates or balances.
  * Retroactive recalculation of locked historical interest entries when old transactions are edited.

## Alternatives Weighed

* **Server-side midnight cron job:** Rejected because KromaLedger has no backend user ledger database; all data lives in the user's browser IndexedDB.
* **Logging interest as standard `Incoming cash` (`INCOME`):** Rejected by author because interest needs a distinct `INTEREST` / system entry type to separate passive interest from active cash inflows and support Estimated vs. Verified reconciliation.
* **Hardcoded bank formulas without user overrides:** Rejected by author because banks change promo tiers/caps frequently and the bank app is the source of truth.
* **Auto-recalculating all historical interest on backdated edits:** Rejected by author to preserve past reconciliation; only the active window recalculates and future days compound from the updated `wallet.balanceMinor`.

## Key Decisions & Staging for Next Steps

* **Resolved Decisions:**
  * Bank app is the source of truth: posted interest entries start as Estimated and can be edited inline to Verified, with future compounding using the updated balance.
  * Presets are prioritized (versioned and copied into per-wallet rules) with full user override support.
  * Execution uses deterministic `Asia/Manila` (UTC+8) catch-up in `reconcile()` on app open/focus plus a foreground midnight timer (no server-side cron).
  * Past/verified entries stay locked; only unconfirmed entries within the active posting window recalculate.
  * Distinct `INTEREST` transaction type, excluded from `totalInflowMinor` and tracked in a separate `interestEarnedMinor` bucket in `cashflowAnalytics.ts`.
  * Monthly-payout presets (e.g., GoTyme) post to the ledger only on payout day and show a non-ledger "Accrued this month (est.)" preview on the wallet card.
  * Multi-day gap handling: when missed days are detected on app open, a Baulito reminder modal alerts the user (`missed X days`) with a CTA to log missed entries before running catch-up interest (or post estimated interest immediately).
