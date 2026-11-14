# Analytics UI Components

## Overview
Stateless Bento-grid visualization cards rendering committed cashflow waterfall, per-wallet liquidity shortfall alerts, Philippine transfer fee leakage and payoff horizons, and invoice aging/tax summaries.

## Interface
- `CommittedWaterfallCard({ waterfall }: { waterfall: CashflowWaterfall })`: [CommittedWaterfallCard.tsx:CommittedWaterfallCard] — Displays liquid cash, committed obligations, true safe-to-spend balance, and daily safe allowance.
- `FeeLeakageAndPayoffRow({ feeReport, payoffPlans })`: [FeeLeakageAndPayoffRow.tsx:FeeLeakageAndPayoffRow] — Displays transfer/cash-in fee leakage vs. zero-fee benchmark alongside debt/installment payoff timelines.
- `InvoiceAgingAndTaxCard({ report, totalInvoiceCount })`: [InvoiceAgingAndTaxCard.tsx:InvoiceAgingAndTaxCard] — Displays receivable/payable aging buckets, tax collected, and discounts granted.
- `WalletShortfallAlertCard({ wallets }: { wallets: WalletRunwayStatus[] })`: [WalletShortfallAlertCard.tsx:WalletShortfallAlertCard] — Lists per-wallet liquid balances, upcoming commitments, and shortfall/tight-runway alerts.

## Invariants
- All four cards are pure presentation components over precomputed `core/engine/cashflowAnalytics` DTOs, clamping progress/ratio visuals safely within `[0, 100]`% and formatting monetary values in PHP minor/major units [CommittedWaterfallCard.tsx:CommittedWaterfallCard], [FeeLeakageAndPayoffRow.tsx:FeeLeakageAndPayoffRow], [InvoiceAgingAndTaxCard.tsx:InvoiceAgingAndTaxCard], [WalletShortfallAlertCard.tsx:WalletShortfallAlertCard].

## Side Effects
- None

## Verification
- Run: `npm test`