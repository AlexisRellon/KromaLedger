# AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine

## 0. CONTEXT & ARCHITECTURAL GUARDRAILS
Now that the 8-mode `NEW ENTRY` modal (`Expense`, `Incoming cash`, `Transfer`, `E-wallet cash-in`, `Subscription`, `Invoice`, `Loan`, `Installment`) is complete, we are building the **Financial Intelligence & Analytics Engine** for **Kaban**.
- **Headless Core Rule**: All 5 analytics calculators MUST live in `src/core/engine/cashflowAnalytics.ts` as pure, deterministic TypeScript functions with **ZERO** DOM, `window`, or `Dexie` imports so they remain 100% portable to React Native.
- **Golden Ledger Rule (No Double-Counting)**:
  - `Transfer` and `E-wallet cash-in` principal amounts MUST NEVER inflate monthly `IN` or `OUT` cashflow totals. Only their attached `feePhp` counts as an expense outflow.
  - `Loan` and `Installment` entries only impact monthly cashflow by their scheduled monthly payment slice, while their remaining unpaid principal tracks under debt/commitments.
- **Neobrutalist + Subtle Heritage Styling**:
  - Maintain `border-2 border-[#18181B]`, `rounded-2xl`, hard offset shadows (`shadow-[4px_4px_0px_#18181B]`), `JetBrains Mono` (`font-mono tabular-nums`) figures, and solid `#FFFFFF` surfaces behind all charts and data rows.
  - Use subtle `#pattern-tnalak-circuit` watermarks (`opacity-[0.04]`) strictly when an analytics module has an empty state (`length === 0`).

---

## 1. MODULE 1: Friction & Fee Leakage Tracker (`Transfer` + `E-wallet cash-in`)
Tracks how much money is lost to convenience and transfer fees (`InstaPay`, `PESONet`, `7-Eleven` OTC cash-ins) versus how much is saved using zero-fee routes (e.g., `MariBank InstaPay fee: FREE`).

### Pure Engine Implementation (`src/core/engine/cashflowAnalytics.ts`):
```typescript
export interface FeeLeakageReport {
  totalFeesLostPhp: number;
  transferFeesPhp: number;
  cashInFeesPhp: number;
  freeTransferCount: number;
  estimatedSavingsPhp: number; // Assumes standard ₱15 InstaPay benchmark per free transfer
  byChannel: Record<'INSTAPAY' | 'PESONET' | 'OTC_CASH_IN', number>;
}

export function calculateFeeLeakage(
  entries: Array<{
    kind: 'TRANSFER' | 'EWALLET_CASH_IN';
    channel?: 'INSTAPAY' | 'PESONET';
    feePhp: number;
  }>,
  standardTransferFeeBenchmark = 15
): FeeLeakageReport {
  let transferFeesPhp = 0;
  let cashInFeesPhp = 0;
  let freeTransferCount = 0;
  const byChannel = { INSTAPAY: 0, PESONET: 0, OTC_CASH_IN: 0 };

  for (const item of entries) {
    const fee = Math.max(0, item.feePhp || 0);
    if (item.kind === 'TRANSFER') {
      transferFeesPhp += fee;
      if (fee === 0) {
        freeTransferCount += 1;
      }
      const ch = item.channel === 'PESONET' ? 'PESONET' : 'INSTAPAY';
      byChannel[ch] = Number((byChannel[ch] + fee).toFixed(2));
    } else if (item.kind === 'EWALLET_CASH_IN') {
      cashInFeesPhp += fee;
      byChannel.OTC_CASH_IN = Number((byChannel.OTC_CASH_IN + fee).toFixed(2));
    }
  }

  return {
    totalFeesLostPhp: Number((transferFeesPhp + cashInFeesPhp).toFixed(2)),
    transferFeesPhp: Number(transferFeesPhp.toFixed(2)),
    cashInFeesPhp: Number(cashInFeesPhp.toFixed(2)),
    freeTransferCount,
    estimatedSavingsPhp: Number((freeTransferCount * standardTransferFeeBenchmark).toFixed(2)),
    byChannel,
  };
}
```

---

## 2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend")
Upgrades the dashboard's `PREDICTED CASH • MONTH-END` into a 4-part waterfall showing how `Total Liquid Cash` is partitioned across upcoming obligations due in the current cycle:
1. **Unpaid Subscriptions Due** (`Subscription` active items remaining this month)
2. **Scheduled Debt & Installment Cutoffs** (`Loan` + `Installment` slices unpaid this month)
3. **Unpaid Payable Invoices** (`Invoice` where `direction === 'PAYABLE'` and `status !== 'PAID'` due this month)
4. **True Safe-to-Spend Cash** + **Daily Burn Allowance (`₱/day`)**

### Pure Engine Implementation:
```typescript
export interface CashflowWaterfall {
  totalLiquidPhp: number;
  lockedSubscriptionsPhp: number;
  lockedDebtAndInstallmentsPhp: number;
  lockedPayableInvoicesPhp: number;
  totalCommittedPhp: number;
  trueSafeToSpendPhp: number;
  dailySafeAllowancePhp: number;
  commitmentRatioPercent: number;
}

export function calculateCommittedWaterfall(params: {
  totalLiquidPhp: number;
  unpaidSubscriptionsThisMonthPhp: number;
  unpaidLoanAndInstallmentSlicesPhp: number;
  unpaidPayableInvoicesThisMonthPhp: number;
  remainingDaysInMonth: number;
}): CashflowWaterfall {
  const subs = Math.max(0, params.unpaidSubscriptionsThisMonthPhp);
  const debt = Math.max(0, params.unpaidLoanAndInstallmentSlicesPhp);
  const payables = Math.max(0, params.unpaidPayableInvoicesThisMonthPhp);

  const totalCommittedPhp = Number((subs + debt + payables).toFixed(2));
  const trueSafeToSpendPhp = Number((params.totalLiquidPhp - totalCommittedPhp).toFixed(2));
  const days = Math.max(1, params.remainingDaysInMonth);
  const dailySafeAllowancePhp = Number(
    (Math.max(0, trueSafeToSpendPhp) / days).toFixed(2)
  );

  const commitmentRatioPercent =
    params.totalLiquidPhp > 0
      ? Math.min(100, Math.round((totalCommittedPhp / params.totalLiquidPhp) * 100))
      : 0;

  return {
    totalLiquidPhp: Number(params.totalLiquidPhp.toFixed(2)),
    lockedSubscriptionsPhp: subs,
    lockedDebtAndInstallmentsPhp: debt,
    lockedPayableInvoicesPhp: payables,
    totalCommittedPhp,
    trueSafeToSpendPhp,
    dailySafeAllowancePhp,
    commitmentRatioPercent,
  };
}
```

---

## 3. MODULE 3: Debt & Installment Payoff Horizon (`Loan` + `Installment`)
Tracks active `Loan` and `Installment` plans, computing the exact **Remaining Balance**, **Progress %**, **Capped Final Payment** (honoring the rule: *"The final payment is capped at the remaining balance"*), and projected **Debt-Free Date**.

### Pure Engine Implementation:
```typescript
export interface PayoffPlanSummary {
  id: string;
  title: string;
  kind: 'LOAN' | 'INSTALLMENT';
  repaymentWalletId: string;
  totalObligationPhp: number;
  amountPaidPhp: number;
  remainingBalancePhp: number;
  nextInstallmentChargePhp: number; // Capped at remainingBalancePhp on final cutoff
  remainingInstallmentsCount: number;
  progressPercent: number;
}

export function evaluatePayoffHorizon(plan: {
  id: string;
  title: string;
  kind: 'LOAN' | 'INSTALLMENT';
  repaymentWalletId: string;
  totalObligationPhp: number;
  amountPaidPhp: number;
  scheduledPaymentPhp: number;
}): PayoffPlanSummary {
  const remainingBalancePhp = Math.max(
    0,
    Number((plan.totalObligationPhp - plan.amountPaidPhp).toFixed(2))
  );
  const scheduled = Math.max(0.01, plan.scheduledPaymentPhp);
  const nextInstallmentChargePhp = Number(
    Math.min(scheduled, remainingBalancePhp).toFixed(2)
  );
  const remainingInstallmentsCount =
    remainingBalancePhp === 0 ? 0 : Math.ceil(remainingBalancePhp / scheduled);
  const progressPercent =
    plan.totalObligationPhp > 0
      ? Math.min(100, Math.round((plan.amountPaidPhp / plan.totalObligationPhp) * 100))
      : 100;

  return {
    id: plan.id,
    title: plan.title,
    kind: plan.kind,
    repaymentWalletId: plan.repaymentWalletId,
    totalObligationPhp: plan.totalObligationPhp,
    amountPaidPhp: plan.amountPaidPhp,
    remainingBalancePhp,
    nextInstallmentChargePhp,
    remainingInstallmentsCount,
    progressPercent,
  };
}
```

---

## 4. MODULE 4: Per-Wallet Liquidity & Shortfall Radar
Cross-references each wallet's current balance (`MariBank • Debit Card`, `GoTyme • Cash in Vault`, `Cash • Cash on Hand`) against the upcoming auto-debits (`PAID WITH:` on `Subscription` and `REPAYMENT WALLET:` on `Loan` / `Installment`) assigned to that specific wallet this month.
- Emits a **`SHORTFALL_WARNING`** badge if a wallet's scheduled obligations exceed its current available balance, prompting a 1-tap `Transfer` or `E-wallet cash-in` to cover the gap.

### Pure Engine Implementation:
```typescript
export interface WalletRunwayStatus {
  walletId: string;
  walletName: string;
  availableBalancePhp: number;
  scheduledOutflowsPhp: number;
  projectedEndingBalancePhp: number;
  shortfallPhp: number;
  status: 'HEALTHY' | 'TIGHT' | 'SHORTFALL_WARNING';
}

export function analyzeWalletLiquidity(
  wallets: Array<{ id: string; name: string; balancePhp: number }>,
  scheduledCommitments: Array<{ walletId: string; amountPhp: number }>
): WalletRunwayStatus[] {
  return wallets.map((wallet) => {
    const scheduledOutflowsPhp = Number(
      scheduledCommitments
        .filter((c) => c.walletId === wallet.id)
        .reduce((sum, c) => sum + c.amountPhp, 0)
        .toFixed(2)
    );
    const projectedEndingBalancePhp = Number(
      (wallet.balancePhp - scheduledOutflowsPhp).toFixed(2)
    );
    const shortfallPhp =
      projectedEndingBalancePhp < 0 ? Math.abs(projectedEndingBalancePhp) : 0;

    let status: WalletRunwayStatus['status'] = 'HEALTHY';
    if (shortfallPhp > 0) {
      status = 'SHORTFALL_WARNING';
    } else if (wallet.balancePhp > 0 && projectedEndingBalancePhp / wallet.balancePhp < 0.15) {
      status = 'TIGHT';
    }

    return {
      walletId: wallet.id,
      walletName: wallet.name,
      availableBalancePhp: wallet.balancePhp,
      scheduledOutflowsPhp,
      projectedEndingBalancePhp,
      shortfallPhp,
      status,
    };
  });
}
```

---

## 5. MODULE 5: Invoice Aging, Tax & Discount Ledger (`Invoice`)
Aggregates all `Receivable (+)` and `Payable (-)` invoices to show:
- **Uncollected Receivables by Aging Bucket**: `Current (Not Yet Due)`, `1–15 Days Overdue`, `16–30 Days Overdue`, `30+ Days Overdue`.
- **Tax & Discount Summary**: Cumulative `TAX %` (in PHP) and `DISCOUNT ₱` across invoices for effortless quarterly tax tracking.

---

## 6. UI COMPONENT SPECIFICATIONS (`src/ui/screens/AnalyticsInsightsSection.tsx`)
Render a new **Neobrutalist Bento Grid** section (either below `Cashflow Breakdown` on `Ledger Overview` or inside the `Upcoming / Insights` view):
1. **`CommittedWaterfallCard.tsx`**:
   - Displays a horizontal segmented Neobrutalist bar (`border-2 border-[#18181B] h-7 rounded-xl overflow-hidden flex`) with distinct solid fills:
     - `Subs`: `#F4C95D` (Ochre)
     - `Loans/Installments`: `#B85028` (Terracotta)
     - `Payables`: `#4A154B` (Plum)
     - `Safe-to-Spend`: `#86EFAC` (Mint)
   - Displays the live **`₱X,XXX.XX / day safe allowance`** pill in the top right.
2. **`WalletShortfallAlertCard.tsx`**:
   - Lists each wallet (`MariBank`, `GoTyme`, `Cash`) with its `Available` vs. `Scheduled Outflows`.
   - If `status === 'SHORTFALL_WARNING'`, render a rose-tinted pill (`bg-[#FDF2F2] text-[#B91C1C] border border-[#18181B]`) reading `"Shortfall: -₱X.XX • Top up wallet"` with a button that opens `NewEntryModal` pre-selected to the **`Transfer`** tab and pre-filled with the exact `shortfallPhp` amount and destination wallet!
3. **`FeeLeakageAndPayoffRow.tsx`**:
   - Left Card (`Transfer & Cash-In Friction`): Shows `Total Fees Paid` vs. a green pill `"Saved ₱X.XX via Free Transfers"`.
   - Right Card (`Installment & Loan Horizon`): Renders Neobrutalist progress bars for active `Loan` and `Installment` items with their remaining cutoff counts and capped final payment badges.

---

## 7. VERIFICATION GATES
1. Write comprehensive Vitest unit tests in `tests/core/cashflowAnalytics.test.ts` covering:
   - Zero double-counting on `Transfer` and `E-wallet cash-in` principals.
   - Final-month payment capping in `evaluatePayoffHorizon`.
   - Exact `shortfallPhp` detection in `analyzeWalletLiquidity`.
2. Run `tsc --noEmit` and `vitest run` to verify 100% test pass rate.