# AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements

## 0. CONTEXT &amp; ARCHITECTURAL GUARDRAILS

We are refining the 8-mode \*\*NEW ENTRY\*\* modal (`Expense`, `Incoming cash`, `Transfer`, `E-wallet cash-in`, `Subscription`, `Invoice`, `Loan`, `Installment`) in \*\*Kaban\*\*.

- \*\*Headless Core Rule\*\*: All calculation helpers (installment amortization, invoice line-item totals) MUST live as pure TypeScript functions in `src/core/engine/` with zero DOM/Dexie imports.

- \*\*Neobrutalist Visual Continuity\*\*: Preserve the exact border weights (`border-2 border-[#18181B]`), rounded corners (`rounded-2xl` / `rounded-xl`), hard shadows (`shadow-[3px_3px_0px_#18181B]`), warm cream sub-containers (`bg-[#F7F3EB]`), and `JetBrains Mono` (`font-mono tabular-nums`) numeric inputs.

- \*\*Dependency Lock\*\*: Do NOT install any new npm packages or modify `package.json`.

---

## 1. REFINEMENT 1: Differentiate `Installment` from `Loan`

Currently, `Installment` renders the exact same form and helper text as `Loan`. Refactor the `Installment` tab so it models BNPL / 0% or interest-bearing purchase splits (e.g., SPayLater, BillEase, credit/debit card installments) while keeping `Loan` for cash debt schedules.

### Requirements for `Installment` Mode:

1. \*\*Helper Copy\*\*: Replace the loan copy inside the sub-card with:

   `"Enter the total purchase price (or total installment payable) above. If a downpayment is entered, it is deducted immediately and the remaining principal is split across your chosen tenor."`

2. \*\*Tenor Selector Pills (`TENOR (MONTHS)`)\*\*:

   - Render quick-select Neobrutalist pills: `3m`, `6m`, `9m`, `12m`, `24m`, plus a compact `Custom` numeric input.

   - Active pill style: `bg-[#B85028] text-white border-2 border-[#18181B] shadow-[2px_2px_0px_#18181B]`.

3. \*\*Downpayment &amp; Monthly Override Row\*\*:

   - Left input: `DOWNPAYMENT (₱)` (defaults to `0.00`).

   - Right input: `MONTHLY AMORTIZATION (₱)` (auto-computed as `(Amount - Downpayment) / Tenor`, but editable if the user wants to input an exact provider-quoted monthly payment with interest).

4. \*\*Live Amortization Summary Box\*\* (mirrors the `Transfer` summary box style):

   - `Financed Principal`: `₱(Amount - Downpayment)`

   - `Monthly Cutoff (x Tenor)`: `₱Monthly × N mos`

   - `Total Installment Cost`: `₱(Downpayment + Monthly * Tenor)` (and display a subtle badge if `Total > Amount` showing `Implied Interest: +₱X.XX`).

### Reference Implementation (`src/core/engine/installmentCalc.ts` + UI Snippet):

```tsx
// 1. Pure calculation helper in src/core/engine/installmentCalc.ts

export interface InstallmentBreakdown {

  financedPrincipal: number;

  monthlyAmortization: number;

  finalMonthPayment: number;

  totalPayable: number;

  impliedInterest: number;

}

export function calculateInstallmentPlan(

  totalAmount: number,

  downpayment: number,

  tenorMonths: number,

  manualMonthlyOverride?: number

): InstallmentBreakdown {

  const safeTotal = Math.max(0, totalAmount);

  const safeDown = Math.min(Math.max(0, downpayment), safeTotal);

  const safeTenor = Math.max(1, Math.floor(tenorMonths));

  const financedPrincipal = Number((safeTotal - safeDown).toFixed(2));

  if (manualMonthlyOverride &amp;&amp; manualMonthlyOverride &gt; 0) {

    const monthly = Number(manualMonthlyOverride.toFixed(2));

    const totalPayable = Number((safeDown + monthly \* safeTenor).toFixed(2));

    return {

      financedPrincipal,

      monthlyAmortization: monthly,

      finalMonthPayment: monthly,

      totalPayable,

      impliedInterest: Math.max(0, Number((totalPayable - safeTotal).toFixed(2))),

    };

  }

  // Standard even split with centavo-accurate final month cap

  const baseMonthly = Math.floor((financedPrincipal / safeTenor) * 100) / 100;

  const previousMonthsSum = Number((baseMonthly * (safeTenor - 1)).toFixed(2));

  const finalMonthPayment = Number((financedPrincipal - previousMonthsSum).toFixed(2));

  return {

    financedPrincipal,

    monthlyAmortization: baseMonthly,

    finalMonthPayment,

    totalPayable: safeTotal,

    impliedInterest: 0,

  };

}

// 2. UI Sub-Card inside NewEntryModal when activeTab === 'INSTALLMENT'
const TENOR_PRESETS = [3, 6, 9, 12, 24] as const;

<div className="rounded-2xl border-2 border-[#18181B] bg-[#F7F3EB] p-4 space-y-4">
  <p className="text-xs leading-relaxed text-neutral-700">
    Enter the total purchase price above. Any downpayment is deducted immediately and the remaining balance is scheduled across your tenor.
  </p>

  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-2">
      Tenor (Months)
    </label>
    <div className="flex flex-wrap gap-2">
      {TENOR_PRESETS.map((months) => (
        <button
          key={months}
          type="button"
          onClick={() => {
            setTenorMonths(months);
            setManualMonthlyOverride(undefined);
          }}
          className={`px-3.5 py-1.5 rounded-xl border-2 border-[#18181B] font-mono text-xs font-semibold transition ${
            tenorMonths === months
              ? 'bg-[#B85028] text-white shadow-[2px_2px_0px_#18181B]'
              : 'bg-white text-[#18181B] hover:bg-neutral-100'
          }`}
        >
          {months}m
        </button>
      ))}
    </div>
  </div>

  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-1">
        Downpayment (₱)
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={downpayment || ''}
        onChange={(e) => setDownpayment(parseFloat(e.target.value) || 0)}
        placeholder="0.00"
        className="w-full rounded-xl border-2 border-[#18181B] bg-white px-3 py-2 font-mono text-sm"
      />
    </div>
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-1">
        Monthly Cutoff (₱)
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={manualMonthlyOverride ?? breakdown.monthlyAmortization}
        onChange={(e) => setManualMonthlyOverride(parseFloat(e.target.value) || undefined)}
        className="w-full rounded-xl border-2 border-[#18181B] bg-white px-3 py-2 font-mono text-sm"
      />
    </div>
  </div>

  {/* Live Summary Box matching Transfer mode */}
  <div className="rounded-xl border-2 border-[#18181B] bg-white p-3 space-y-1.5 text-xs">
    <div className="flex justify-between text-neutral-600">
      <span>Financed Principal:</span>
      <span className="font-mono">₱{breakdown.financedPrincipal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-neutral-600">
      <span>Schedule ({tenorMonths} mos):</span>
      <span className="font-mono">₱{breakdown.monthlyAmortization.toFixed(2)} / mo</span>
    </div>
    {breakdown.impliedInterest > 0 && (
      <div className="flex justify-between text-amber-800 font-medium">
        <span>Implied Interest / Fee:</span>
        <span className="font-mono">+₱{breakdown.impliedInterest.toFixed(2)}</span>
      </div>
    )}
    <div className="border-t border-neutral-200 pt-1.5 flex justify-between font-bold text-[#18181B]">
      <span>Total Installment Payable:</span>
      <span className="font-mono text-[#4A154B]">₱{breakdown.totalPayable.toFixed(2)}</span>
    </div>
  </div>
</div>
```

## 2. REFINEMENT 2: Auto-Sync `Invoice line items` with `Top AMOUNT (PHP)`
In Invoice mode, if the user adds at least 1 line item (`lineItems.length > 0`), the top AMOUNT (`PHP`) input must automatically reflect the calculated Grand Total (`Subtotal + Tax - Discount`) and become read-only so header amount and line-item math never drift apart.

Reference Implementation:

```tsx
// Pure calculation in src/core/engine/invoiceCalculator.ts
export function computeInvoiceTotals(
  lines: Array<{ qty: number; unitPrice: number }>,
  taxPercent: number,
  discountPhp: number
) {
  const subtotal = lines.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const taxAmount = subtotal * (Math.max(0, taxPercent) / 100);
  const grandTotal = Math.max(0, subtotal + taxAmount - Math.max(0, discountPhp));
  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

// Inside NewEntryModal.tsx:
const isAmountLockedByInvoiceLines = activeTab === 'INVOICE' && invoiceLines.length > 0;
const displayedAmount = isAmountLockedByInvoiceLines ? invoiceTotals.grandTotal : amountInput;

// On the top AMOUNT (PHP) input element:
<div className="relative">
  <input
    type="number"
    readOnly={isAmountLockedByInvoiceLines}
    value={displayedAmount}
    onChange={(e) => !isAmountLockedByInvoiceLines && setAmountInput(e.target.value)}
    className={`w-full rounded-2xl border-2 border-[#18181B] px-5 py-4 font-mono text-3xl ${
      isAmountLockedByInvoiceLines ? 'bg-[#F7F3EB] cursor-not-allowed' : 'bg-white'
    }`}
  />
  {isAmountLockedByInvoiceLines && (
    <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[#18181B] bg-[#F4C95D] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#18181B]">
      AUTO-SUMMED ({invoiceLines.length} {invoiceLines.length === 1 ? 'LINE' : 'LINES'})
    </span>
  )}
</div>
```

## 3. REFINEMENT 3: Dynamic Contextual Labels & Placeholders per Tab
Eliminate the hardcoded `e.g. GrabCar Commute` placeholder across non-expense tabs by mapping each `EntryKind` to its exact label and placeholder metadata:

```tsx
export const ENTRY_FIELD_META: Record<
  EntryKind,
  { titleLabel: string; titlePlaceholder: string; dateLabel: string }
> = {
  EXPENSE: {
    titleLabel: 'MERCHANT / NOTE',
    titlePlaceholder: 'e.g. GrabCar Commute',
    dateLabel: 'DATE',
  },
  INCOMING_CASH: {
    titleLabel: 'SOURCE / PAYER',
    titlePlaceholder: 'e.g. November Payroll / Client Retainer',
    dateLabel: 'DATE RECEIVED',
  },
  TRANSFER: {
    titleLabel: 'TRANSFER NOTE / TITLE',
    titlePlaceholder: 'e.g. Debit Card to Cash in Vault',
    dateLabel: 'DATE',
  },
  EWALLET_CASH_IN: {
    titleLabel: 'CASH-IN PROVIDER',
    titlePlaceholder: 'e.g. 7-Eleven CLiQQ / TouchPay',
    dateLabel: 'DATE',
  },
  SUBSCRIPTION: {
    titleLabel: 'SERVICE NAME',
    titlePlaceholder: 'e.g. Netflix / GitHub Copilot',
    dateLabel: 'NEXT BILLING DATE',
  },
  INVOICE: {
    titleLabel: 'CLIENT / VENDOR',
    titlePlaceholder: 'e.g. Acme Corp',
    dateLabel: 'DUE DATE',
  },
  LOAN: {
    titleLabel: 'LENDER / LOAN NOTE',
    titlePlaceholder: 'e.g. SSS Salary Loan / Personal Loan',
    dateLabel: 'FIRST PAYMENT DATE',
  },
  INSTALLMENT: {
    titleLabel: 'ITEM / PLAN NAME',
    titlePlaceholder: 'e.g. Mechanical Keyboard (SPayLater 6m)',
    dateLabel: 'FIRST CUTOFF DATE',
  },
};
```
### 4. REFINEMENT 4: Enable `+ Custom Label` Chip Across All 8 Modes
Currently, the yellow `+ Custom Label pill` (`bg-[#F9E79F] border-2 border-[#18181B]`) is only rendered when `activeTab === 'EXPENSE'`.

Extract `<CustomLabelPicker selectedLabels={labels} onChange={setLabels} />` so it renders right beside `Attach receipt` across all 8 modes.

Ensure selected labels render as removable Neobrutalist micro-pills (`#TaxDeductible ×, #ClientWork ×, #FixedCost ×`) and persist inside `entry.customLabels: string[]` in `KabanDB`.

### 5. VERIFICATION GATES
1. Write unit tests in `tests/core/installmentCalc.test.ts and tests/core/invoiceCalculator.test.ts` verifying centavo rounding and final-month payment capping.

2. Run `tsc --noEmit` and `vitest run` to confirm zero regressions.

3. Verify switching between all 8 tabs in `NewEntryModal` preserves smooth state transitions and updates placeholders dynamically.