# Core Domain Engine

## Overview
Platform-agnostic financial calculation, reconciliation, command orchestration, transfer fee lookup, and AI snapshot preparation engines operating on integer minor units and ISO `YYYY-MM-DD` dates.

## Interface
- `getIsoWeekBoundaries(referenceDate: Date)`, `BuildSnapshotInput`, `buildWeeklyBudgetSnapshot(input: BuildSnapshotInput): WeeklyBudgetSnapshot`: [aiBudgetSnapshot.ts:buildWeeklyBudgetSnapshot] — Computes UTC Monday–Sunday weekly spend, liquid cash (excluding `CREDIT` wallets), 30-day burn, and top 4 categories.
- `buildGemmaBudgetPrompt(request: AIAdvisorRequest): { systemInstruction: string; userPrompt: string }`: [aiPrompts.ts:buildGemmaBudgetPrompt] — Formats XML-delimited financial context, last 8 chat turns, and prompt for Gemma/Gemini.
- `calculateCashflow`, `calculateCashForecast`, `calculateFeeLeakage`, `calculateCommittedWaterfall`, `evaluatePayoffHorizon`, `analyzeWalletLiquidity`, `getAgingBucket`, `analyzeInvoiceAging`: [cashflowAnalytics.ts:calculateCashflow] — Monthly cashflow, forecast, PH transfer fee leakage, committed cash waterfall, payoff horizon, wallet runway (`<15%` `TIGHT`, `<0` `SHORTFALL_WARNING`), and invoice aging analytics.
- `convenienceFeeMinor(principalMinor: number, mode: "FIXED" | "PERCENT", value: string): number`: [convenienceFee.ts:convenienceFeeMinor] — BigInt basis-point convenience fee calculation with half-up rounding and safe-integer checks.
- `buildDailyInsight(input): { message: string; question: string }`: [dailyInsight.ts:buildDailyInsight] — Prioritizes daily assistant insight prompts (wallet shortfall > overdue > upcoming due > fees > total > welcome).
- `DemoSeed`, `createDemoSeed(today: string): DemoSeed`: [demoSeed.ts:createDemoSeed] — Generates Zod-validated demo seed data (7 categories, 9 transactions, 3 subscriptions, 2 invoices/items, 4 wallets, 1 profile, `appMeta`).
- `InstallmentBreakdown`, `calculateInstallmentPlan(totalAmount, downpayment, tenorMonths, manualMonthlyOverride?)`: [installmentCalc.ts:calculateInstallmentPlan] — Computes amortized installment schedules, final-month remainder, and implied interest.
- `InvoiceCalculationInput`, `InvoiceCalculation`, `calculateInvoice(input)`, `computeInvoiceTotals`: [invoiceCalculator.ts:calculateInvoice] — BigInt milli-quantity and basis-point tax invoice totals and calendar/range validation.
- `LedgerTable`, `LedgerCommandUnit`, `LedgerCommandGateway`, `detachSubscriptionHistory`, `detachWalletReferences`, `confirmSubscriptionCycle`, `commitInvoice`, `settleInvoice`: [ledgerCommands.ts:commitInvoice] — Atomic ledger command functions executing over an abstract `LedgerCommandGateway`.
- `LineItemDraft`, `lineTotalMinor`, `addLineItem`, `updateLineItem`, `removeLineItem`, `previewLineItems`: [lineItemWorkflow.ts:addLineItem] — Pure invoice line-item draft state transitions.
- `parseMinorInput(raw: string): number`, `sanitizeMoneyInput`, `sanitizeQuantityInput`, `blockInvalidNumberKeys`: [moneyInput.ts:parseMinorInput] — Strict currency/quantity parsing and input sanitization.
- `scheduledPaymentMinor(invoice: Invoice): number`, `obligationDueDate(invoice: Invoice, paidMinor: number): string`: [obligationSchedule.ts:obligationDueDate] — Computes obligation cutoff amounts and next due dates.
- `selectPendingOverview`, `buildInvoicePayment`: [pendingAnalytics.ts:selectPendingOverview] — Filters 7-day upcoming obligations and builds validated invoice settlement transactions.
- `PendingConfirmation`, `ReconcileInput`, `ReconcileResult`, `cycleDate(dateStr, cycle)`, `reconcile(input)`: [reconciler.ts:reconcile] — Advances recurring subscriptions, auto-logs or warns/postpones on low balance, queues manual confirmations, emits due reminders, and marks past-due invoices `OVERDUE`.
- `TransferChannel`, `TransferFeeRule`, `BANK_TRANSFER_FEE_RULES`, `findFeeRule`, `TransferFeeDetectionResult`, `parseTransferRouteFromText`, `detectTransferFee`, `lookupTransferFee`: [transferFees.ts:detectTransferFee] — 35 Philippine bank and e-wallet InstaPay/PESONet transfer fee rules and route detection.
- `WalletActivityFilters`, `EMPTY_ACTIVITY_FILTERS`, `filterWalletActivity`: [walletActivity.ts:filterWalletActivity] — Pure case-insensitive search, type, and date-range filter sorted descending by date.

## Invariants
- Monetary math uses integer minor units and BigInt arithmetic where fractional precision occurs (`convenienceFeeMinor`, `calculateInvoice`), enforcing safe integer bounds [convenienceFee.ts:convenienceFeeMinor], [invoiceCalculator.ts:calculateInvoice], [moneyInput.ts:parseMinorInput].
- `reconcile` rejects backward clock drift (`currentDate < lastReconciledDate`), caps auto-logged cycles per subscription at 10,000, postpones insufficient-balance `autoLog` cycles by 1 day with a `WARNING`, and assigns deterministic cycle IDs (`sub:<id>:<date>`) [reconciler.ts:reconcile], [ledgerCommands.ts:confirmSubscriptionCycle].
- `settleInvoice` enforces an optimistic concurrency check on `paidMinor` inside atomic gateway transactions and updates wallet balances only when `walletId` is supplied [ledgerCommands.ts:settleInvoice].
- `detectTransferFee` returns `0` fee for same-institution transfers and `DIRECT` / `MANUAL` channels [transferFees.ts:detectTransferFee].

## Side Effects
- Mutates records exclusively through caller-supplied `LedgerCommandGateway` abstractions in `ledgerCommands.ts` (no direct IndexedDB, network, or DOM I/O in any engine module) [ledgerCommands.ts:LedgerCommandGateway].

## Verification
- Run: `npm test`