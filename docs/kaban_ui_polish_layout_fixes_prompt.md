# AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes

## 0. CONTEXT & OBJECTIVE
Based on visual inspection of the current **Kaban** `LEDGER OVERVIEW` implementation, we need 5 surgical UI/UX refinements to eliminate text clipping (`TOTAL LIQUID C...`, `₱10,392...`), remove a leftover prompt artifact badge (`Module 4`), un-cramp the bottom-left analytics cards, enrich flat empty states, and introduce a clean `Overview | Analytics` view toggle so mobile users aren't forced to scroll through 9 heavy cards at once.

- **Guardrails**: Do not modify `package.json` or `src/core/` business logic. Keep all Neobrutalist borders (`border-2 border-[#18181B]`), shadows (`shadow-[4px_4px_0px_#18181B]`), and `JetBrains Mono` (`font-mono tabular-nums`) figures intact.

---

## 1. FIX 1: Eliminate Text & Number Truncation in `CommittedWaterfallCard.tsx`
### Problem:
Inside `COMMITTED CASHFLOW WATERFALL`, the top 3 summary boxes (`TOTAL LIQUID C...`) and the bottom 4 legend boxes (`Subscript...`, `Loans/Ins...`, `Safe-to-S...`, `₱10,392...`) truncate with ellipses (`truncate`) because a 4-column grid inside a single dashboard column is too narrow for formatted PHP currency strings.

### Solution:
1. **Never truncate currency amounts**: Remove `truncate` from all `₱` amount spans inside `CommittedWaterfallCard.tsx`. Use responsive font sizing (`text-sm sm:text-base font-mono font-bold tracking-tight whitespace-nowrap`) so every digit of `₱10,768.36` and `₱10,392.38` is 100% visible.
2. **Switch the bottom 4-item breakdown from `grid-cols-4` to `grid-cols-2` (2x2 Bento Grid)**:
   - Use crisp, non-truncating labels: `Subscriptions`, `Loans & Installments`, `Payable Invoices`, and `Uncommitted Cash`.
3. **Shorten the first top box label** from `TOTAL LIQUID CASH` to `LIQUID CASH` so it never clips as `TOTAL LIQUID C...`.

### Reference Implementation (`CommittedWaterfallCard.tsx` Legend Grid):
```tsx
{/* Top 3-Card Summary Row — Zero Truncation */}
<div className="grid grid-cols-3 gap-2.5">
  <div className="rounded-xl border-2 border-[#18181B] bg-white p-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
      Liquid Cash
    </p>
    <p className="mt-1 font-mono text-sm sm:text-base font-bold text-[#18181B] whitespace-nowrap">
      ₱{waterfall.totalLiquidPhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
    </p>
  </div>

  <div className="rounded-xl border-2 border-[#18181B] bg-[#FEF3C7] p-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
      Committed
    </p>
    <p className="mt-1 font-mono text-sm sm:text-base font-bold text-amber-900 whitespace-nowrap">
      ₱{waterfall.totalCommittedPhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
    </p>
  </div>

  <div className="rounded-xl border-2 border-[#18181B] bg-[#DCFCE7] p-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-950">
      Safe-to-Spend
    </p>
    <p className="mt-1 font-mono text-sm sm:text-base font-bold text-emerald-900 whitespace-nowrap">
      ₱{waterfall.trueSafeToSpendPhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
    </p>
  </div>
</div>

{/* Bottom 2x2 Legend Grid (Replaces cramped 4-column row) */}
<div className="grid grid-cols-2 gap-2.5 pt-1">
  {[
    { label: 'Subscriptions', amount: waterfall.lockedSubscriptionsPhp, dotBg: 'bg-[#F4C95D]' },
    { label: 'Loans & Installments', amount: waterfall.lockedDebtAndInstallmentsPhp, dotBg: 'bg-[#B85028]' },
    { label: 'Payable Invoices', amount: waterfall.lockedPayableInvoicesPhp, dotBg: 'bg-[#4A154B]' },
    { label: 'Safe-to-Spend', amount: waterfall.trueSafeToSpendPhp, dotBg: 'bg-[#86EFAC]', tint: 'bg-[#EAFBF1]' },
  ].map((item) => (
    <div
      key={item.label}
      className={`flex items-center justify-between rounded-xl border-2 border-[#18181B] px-3 py-2 ${
        item.tint ?? 'bg-white'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full border border-[#18181B] ${item.dotBg}`} />
        <span className="text-[11px] font-semibold text-neutral-700">{item.label}</span>
      </div>
      <span className="font-mono text-xs font-bold text-[#18181B] whitespace-nowrap ml-2">
        ₱{item.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </span>
    </div>
  ))}
</div>
```

---

## 2. FIX 2: Replace the `Module 4` Debug Badge on `INVOICE AGING & TAX LEDGER`
### Problem:
The `INVOICE AGING & TAX LEDGER` card header currently displays a pill badge reading `Module 4`, which is a leftover internal spec label rather than a user-facing financial status badge.

### Solution:
Replace the static `Module 4` badge with a dynamic status pill driven by the invoice aging data:
- If `overdueCount > 0`: render `<span className="rounded-full border-2 border-[#18181B] bg-[#FDF2F2] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#B91C1C]">{overdueCount} Overdue</span>`
- If `overdueCount === 0 && openReceivablesCount > 0`: render `<span className="rounded-full border-2 border-[#18181B] bg-[#DCFCE7] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#15803D]">100% Current</span>`
- If no open invoices exist: render `<span className="rounded-full border-2 border-[#18181B] bg-[#F7F3EB] px-2.5 py-0.5 font-mono text-[11px] font-bold text-neutral-700">0 Open</span>`

---

## 3. FIX 3: Un-Cramp `TRANSFER & CASH-IN FRICTION` and `INSTALLMENT & LOAN HORIZON`
### Problem:
Placing `TRANSFER & CASH-IN FRICTION` and `INSTALLMENT & LOAN HORIZON` side-by-side (`grid-cols-2`) inside the left column squeezes both cards into narrow vertical strips.

### Solution:
Stack those two cards vertically (`grid-cols-1 gap-5`) inside the left column so each module spans the full width of the column, matching `COMMITTED CASHFLOW WATERFALL` above them:
- In `TRANSFER & CASH-IN FRICTION`, display a horizontal 3-pill summary bar even when `totalFeesLostPhp === 0` (`InstaPay Fees: ₱0.00` | `OTC Cash-In: ₱0.00` | `Free Transfers Saved: ₱0.00`) so the card looks informative at all times.
- In `INSTALLMENT & LOAN HORIZON`, align the `0 obligations` pill to the top-right header row next to the title instead of wrapping it beneath the subtitle.

---

## 4. FIX 4: Tactile Neobrutalist Empty States with Quick-Action Triggers
### Problem:
`RECENT ACTIVITY`, `TOP CATEGORIES`, `TRANSFER & CASH-IN FRICTION`, and `INSTALLMENT & LOAN HORIZON` currently render plain gray text (`No entries match this filter.`) floating in empty white space.

### Solution:
Create a reusable `<TactileEmptyState />` primitive (`src/ui/primitives/TactileEmptyState.tsx`) that wraps empty card bodies in a warm dashed well (`rounded-xl border-2 border-dashed border-[#18181B]/25 bg-[#FAF6F0]/70 p-5 text-center relative overflow-hidden`) with the subtle `opacity-[0.04]` Filipino weave watermark and an optional 1-tap action pill that opens `NewEntryModal` directly to that relevant tab:

```tsx
interface TactileEmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function TactileEmptyState({ message, actionLabel, onAction }: TactileEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#18181B]/25 bg-[#FAF6F0]/70 px-4 py-6 text-center">
      {/* Subtle heritage background watermark */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-[#18181B] opacity-[0.04]"
      >
        <rect width="100%" height="100%" fill="url(#pattern-tnalak-circuit)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <p className="text-xs font-medium text-neutral-600">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full border-2 border-[#18181B] bg-white px-3.5 py-1 font-mono text-[11px] font-bold text-[#18181B] shadow-[2px_2px_0px_#18181B] hover:bg-[#F4C95D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
```
- Wire `+ Log Expense` on `RECENT ACTIVITY` & `TOP CATEGORIES`.
- Wire `+ Log Transfer / Cash-in` on `TRANSFER & CASH-IN FRICTION` (opens `NewEntryModal` with `activeTab = 'TRANSFER'`).
- Wire `+ Add Loan or Installment` on `INSTALLMENT & LOAN HORIZON` (opens `NewEntryModal` with `activeTab = 'INSTALLMENT'`).

---

## 5. FIX 5: Dashboard View Mode Switcher (`Core Ledger` vs. `Deep Analytics`)
### Problem:
Rendering all 9 cards simultaneously makes mobile viewports require excessive vertical scrolling.

### Solution:
In the `LEDGER OVERVIEW` header row (next to the `MONTH: November 2026` selector), add a compact 3-way Neobrutalist view filter pill:
- `All Cards` (default on desktop `lg:` screens)
- `Core Ledger` (default on mobile `<lg` screens: shows `Total Liquid Cash`, `Wallets & Accounts`, `Recent Activity`, `Cashflow Breakdown`, and `Monthly Burn`)
- `Deep Analytics` (shows `Committed Cashflow Waterfall`, `Per-Wallet Liquidity & Shortfall Radar`, `Invoice Aging & Tax Ledger`, `Transfer & Cash-In Friction`, and `Installment & Loan Horizon`)

---

## 6. VERIFICATION CHECKLIST
- [ ] Confirm zero `...` ellipsis truncation on any currency figure or label inside `COMMITTED CASHFLOW WATERFALL`.
- [ ] Confirm `Module 4` badge is completely removed from `INVOICE AGING & TAX LEDGER` and replaced with the dynamic status pill (`100% Current` / `N Overdue`).
- [ ] Confirm `TRANSFER & CASH-IN FRICTION` and `INSTALLMENT & LOAN HORIZON` stack cleanly at full column width (`grid-cols-1`).
- [ ] Run `tsc --noEmit` and `vitest run` to verify zero type or test regressions.