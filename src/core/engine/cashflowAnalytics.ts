import type { Invoice, Transaction } from "../models";

export interface CashflowInput {
  month: string;
  transactions: Array<
    Pick<Transaction, "date" | "amountMinor" | "categoryId"> & {
      type?: string;
      feeMinor?: number;
      cashIn?: boolean;
    }
  >;
  subscriptions: Array<{
    amountMinor: number;
    billingCycle: "WEEKLY" | "MONTHLY" | "YEARLY";
    active: boolean;
  }>;
  invoices: Pick<Invoice, "id" | "totalMinor" | "paidMinor" | "status">[];
}

export interface CashflowAnalytics {
  netOutflowMinor: number;
  fixedBurnPercent: number;
  categories: Array<{ categoryId: string; amountMinor: number }>;
  partialInvoices: Array<{
    invoiceId: string;
    paidMinor: number;
    totalMinor: number;
    percentPaid: number;
  }>;
}

function isTransferOrCashIn(t: { type?: string; cashIn?: boolean }): boolean {
  return t.type === "TRANSFER" || t.type === "EWALLET_CASH_IN" || t.cashIn === true;
}

export function calculateCashflow(input: CashflowInput): CashflowAnalytics {
  const monthlyTransactions = input.transactions.filter((transaction) =>
    transaction.date.startsWith(`${input.month}-`)
  );
  const regularOutflows = monthlyTransactions.filter(
    (transaction) => !isTransferOrCashIn(transaction) && transaction.amountMinor < 0
  );
  const transferFeeOutflows = monthlyTransactions.filter(
    (t) => isTransferOrCashIn(t) && (t.feeMinor ?? 0) > 0
  );

  const totalRegularOutflow = regularOutflows.reduce((sum, t) => sum - t.amountMinor, 0);
  const totalTransferFees = transferFeeOutflows.reduce((sum, t) => sum + (t.feeMinor ?? 0), 0);
  const totalOutflowMinor = totalRegularOutflow + totalTransferFees;

  const totalInflowMinor = monthlyTransactions
    .filter((t) => !isTransferOrCashIn(t) && t.amountMinor > 0)
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const netOutflowMinor = totalOutflowMinor - totalInflowMinor;

  const monthlyFixedMinor = input.subscriptions
    .filter((subscription) => subscription.active)
    .reduce((sum, subscription) => {
      const monthly =
        subscription.billingCycle === "WEEKLY"
          ? (subscription.amountMinor * 52) / 12
          : subscription.billingCycle === "YEARLY"
          ? subscription.amountMinor / 12
          : subscription.amountMinor;
      return sum + monthly;
    }, 0);

  const byCategory = new Map<string, number>();
  for (const transaction of regularOutflows) {
    const id = transaction.categoryId ?? "uncategorized";
    byCategory.set(id, (byCategory.get(id) ?? 0) - transaction.amountMinor);
  }
  for (const t of transferFeeOutflows) {
    const id = t.categoryId ?? "transfer-fee";
    byCategory.set(id, (byCategory.get(id) ?? 0) + (t.feeMinor ?? 0));
  }
  const categories = [...byCategory]
    .map(([categoryId, amountMinor]) => ({ categoryId, amountMinor }))
    .sort((a, b) => b.amountMinor - a.amountMinor || a.categoryId.localeCompare(b.categoryId));

  const partialInvoices = input.invoices
    .filter((invoice) => invoice.paidMinor > 0 && invoice.paidMinor < invoice.totalMinor)
    .map((invoice) => ({
      invoiceId: invoice.id,
      paidMinor: invoice.paidMinor,
      totalMinor: invoice.totalMinor,
      percentPaid: Math.round((invoice.paidMinor / invoice.totalMinor) * 100),
    }));

  return {
    netOutflowMinor,
    fixedBurnPercent:
      totalOutflowMinor === 0
        ? 0
        : Math.round((monthlyFixedMinor / totalOutflowMinor) * 10000) / 100,
    categories,
    partialInvoices,
  };
}

export interface CashForecastInput {
  totalCashMinor: number;
  month: string;
  transactions: Array<{
    date: string;
    amountMinor: number;
    type?: string;
    feeMinor?: number;
    cashIn?: boolean;
    subscriptionId?: string;
  }>;
  subscriptions: Array<{
    id: string;
    title: string;
    amountMinor: number;
    active: boolean;
    nextBillingDate: string;
  }>;
}

export interface CashForecast {
  totalCashMinor: number;
  inflowsMinor: number;
  outflowsMinor: number;
  netGainLossMinor: number;
  isNetGain: boolean;
  upcomingSubsMinor: number;
  upcomingSubsCount: number;
  projectedCashMinor: number;
  pendingSubscriptions: Array<{
    id: string;
    title: string;
    amountMinor: number;
    nextBillingDate: string;
  }>;
}

export function calculateCashForecast(input: CashForecastInput): CashForecast {
  const monthPrefix = `${input.month}-`;
  const monthlyTx = input.transactions.filter((t) => t.date.startsWith(monthPrefix));

  const inflowsMinor = monthlyTx
    .filter((t) => !isTransferOrCashIn(t) && t.amountMinor > 0)
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const outflowsMinor = monthlyTx.reduce((sum, t) => {
    if (isTransferOrCashIn(t)) {
      return sum + (t.feeMinor ?? 0);
    }
    return t.amountMinor < 0 ? sum - t.amountMinor : sum;
  }, 0);

  const netGainLossMinor = inflowsMinor - outflowsMinor;
  const isNetGain = netGainLossMinor >= 0;

  const paidDatesBySubId = new Set(
    monthlyTx
      .filter((t) => t.type === "SUBSCRIPTION_PAYMENT" && t.subscriptionId)
      .map((t) => `${t.subscriptionId}:${t.date}`)
  );

  const pendingSubscriptions = input.subscriptions
    .filter((sub) => {
      if (!sub.active) return false;
      if (paidDatesBySubId.has(`${sub.id}:${sub.nextBillingDate}`)) return false;
      // Scheduled for or due by the end of this month
      return sub.nextBillingDate <= `${input.month}-31`;
    })
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))
    .map((sub) => ({
      id: sub.id,
      title: sub.title,
      amountMinor: sub.amountMinor,
      nextBillingDate: sub.nextBillingDate,
    }));

  const upcomingSubsMinor = pendingSubscriptions.reduce((sum, s) => sum + s.amountMinor, 0);
  const projectedCashMinor = input.totalCashMinor - upcomingSubsMinor;

  return {
    totalCashMinor: input.totalCashMinor,
    inflowsMinor,
    outflowsMinor,
    netGainLossMinor,
    isNetGain,
    upcomingSubsMinor,
    upcomingSubsCount: pendingSubscriptions.length,
    projectedCashMinor,
    pendingSubscriptions,
  };
}

// ==========================================
// MODULE 1: Friction & Fee Leakage Tracker
// ==========================================

export interface FeeLeakageReport {
  totalFeesLostPhp: number;
  transferFeesPhp: number;
  cashInFeesPhp: number;
  freeTransferCount: number;
  estimatedSavingsPhp: number; // Assumes standard ₱15 InstaPay benchmark per free transfer
  byChannel: Record<"INSTAPAY" | "PESONET" | "OTC_CASH_IN", number>;
}

export interface FeeLeakageEntry {
  kind: "TRANSFER" | "EWALLET_CASH_IN";
  channel?: "INSTAPAY" | "PESONET" | string;
  feePhp?: number;
  feeMinor?: number;
}

export function calculateFeeLeakage(
  entries: FeeLeakageEntry[],
  standardTransferFeeBenchmark = 15
): FeeLeakageReport {
  let transferFeesPhp = 0;
  let cashInFeesPhp = 0;
  let freeTransferCount = 0;
  const byChannel: Record<"INSTAPAY" | "PESONET" | "OTC_CASH_IN", number> = {
    INSTAPAY: 0,
    PESONET: 0,
    OTC_CASH_IN: 0,
  };

  for (const item of entries) {
    const rawFee = item.feePhp !== undefined ? item.feePhp : (item.feeMinor ?? 0) / 100;
    const fee = Math.max(0, rawFee || 0);

    if (item.kind === "TRANSFER") {
      transferFeesPhp += fee;
      if (fee === 0) {
        freeTransferCount += 1;
      }
      const ch = item.channel?.toUpperCase() === "PESONET" ? "PESONET" : "INSTAPAY";
      byChannel[ch] = Number((byChannel[ch] + fee).toFixed(2));
    } else if (item.kind === "EWALLET_CASH_IN") {
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

// ==========================================
// MODULE 2: Committed Cashflow Waterfall
// ==========================================

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
  const subs = Math.max(0, params.unpaidSubscriptionsThisMonthPhp || 0);
  const debt = Math.max(0, params.unpaidLoanAndInstallmentSlicesPhp || 0);
  const payables = Math.max(0, params.unpaidPayableInvoicesThisMonthPhp || 0);

  const totalCommittedPhp = Number((subs + debt + payables).toFixed(2));
  const trueSafeToSpendPhp = Number((params.totalLiquidPhp - totalCommittedPhp).toFixed(2));
  const days = Math.max(1, params.remainingDaysInMonth || 1);
  const dailySafeAllowancePhp = Number(
    (Math.max(0, trueSafeToSpendPhp) / days).toFixed(2)
  );

  const commitmentRatioPercent =
    params.totalLiquidPhp > 0
      ? Math.min(100, Math.round((totalCommittedPhp / params.totalLiquidPhp) * 100))
      : 0;

  return {
    totalLiquidPhp: Number(params.totalLiquidPhp.toFixed(2)),
    lockedSubscriptionsPhp: Number(subs.toFixed(2)),
    lockedDebtAndInstallmentsPhp: Number(debt.toFixed(2)),
    lockedPayableInvoicesPhp: Number(payables.toFixed(2)),
    totalCommittedPhp,
    trueSafeToSpendPhp,
    dailySafeAllowancePhp,
    commitmentRatioPercent,
  };
}

// ==========================================
// MODULE 3: Debt & Installment Payoff Horizon
// ==========================================

export interface PayoffPlanSummary {
  id: string;
  title: string;
  kind: "LOAN" | "INSTALLMENT";
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
  kind: "LOAN" | "INSTALLMENT";
  repaymentWalletId: string;
  totalObligationPhp: number;
  amountPaidPhp: number;
  scheduledPaymentPhp: number;
}): PayoffPlanSummary {
  const totalObligation = Math.max(0, plan.totalObligationPhp || 0);
  const amountPaid = Math.max(0, plan.amountPaidPhp || 0);
  const remainingBalancePhp = Math.max(
    0,
    Number((totalObligation - amountPaid).toFixed(2))
  );
  const scheduled = Math.max(0.01, plan.scheduledPaymentPhp || 0);
  const nextInstallmentChargePhp = Number(
    Math.min(scheduled, remainingBalancePhp).toFixed(2)
  );
  const remainingInstallmentsCount =
    remainingBalancePhp === 0 ? 0 : Math.ceil(remainingBalancePhp / scheduled);
  const progressPercent =
    totalObligation > 0
      ? Math.min(100, Math.round((amountPaid / totalObligation) * 100))
      : 100;

  return {
    id: plan.id,
    title: plan.title,
    kind: plan.kind,
    repaymentWalletId: plan.repaymentWalletId,
    totalObligationPhp: Number(totalObligation.toFixed(2)),
    amountPaidPhp: Number(amountPaid.toFixed(2)),
    remainingBalancePhp,
    nextInstallmentChargePhp,
    remainingInstallmentsCount,
    progressPercent,
  };
}

// ==========================================
// MODULE 4: Per-Wallet Liquidity & Shortfall Radar
// ==========================================

export interface WalletRunwayStatus {
  walletId: string;
  walletName: string;
  availableBalancePhp: number;
  scheduledOutflowsPhp: number;
  projectedEndingBalancePhp: number;
  shortfallPhp: number;
  status: "HEALTHY" | "TIGHT" | "SHORTFALL_WARNING";
}

export function analyzeWalletLiquidity(
  wallets: Array<{ id: string; name: string; balancePhp: number }>,
  scheduledCommitments: Array<{ walletId: string; amountPhp: number }>
): WalletRunwayStatus[] {
  return wallets.map((wallet) => {
    const scheduledOutflowsPhp = Number(
      scheduledCommitments
        .filter((c) => c.walletId === wallet.id)
        .reduce((sum, c) => sum + Math.max(0, c.amountPhp || 0), 0)
        .toFixed(2)
    );
    const projectedEndingBalancePhp = Number(
      (wallet.balancePhp - scheduledOutflowsPhp).toFixed(2)
    );
    const shortfallPhp =
      projectedEndingBalancePhp < 0 ? Math.abs(projectedEndingBalancePhp) : 0;

    let status: WalletRunwayStatus["status"] = "HEALTHY";
    if (shortfallPhp > 0) {
      status = "SHORTFALL_WARNING";
    } else if (wallet.balancePhp > 0 && projectedEndingBalancePhp / wallet.balancePhp < 0.15) {
      status = "TIGHT";
    }

    return {
      walletId: wallet.id,
      walletName: wallet.name,
      availableBalancePhp: Number(wallet.balancePhp.toFixed(2)),
      scheduledOutflowsPhp,
      projectedEndingBalancePhp,
      shortfallPhp: Number(shortfallPhp.toFixed(2)),
      status,
    };
  });
}

// ==========================================
// MODULE 5: Invoice Aging, Tax & Discount Ledger
// ==========================================

export type AgingBucket = "CURRENT" | "OVERDUE_1_15" | "OVERDUE_16_30" | "OVERDUE_30_PLUS";

export interface InvoiceAgingReport {
  totalReceivablesPhp: number;
  uncollectedReceivablesPhp: number;
  totalUncollectedReceivablesPhp: number;
  totalPayablesPhp: number;
  unpaidPayablesPhp: number;
  totalUnpaidPayablesPhp: number;
  netUncollectedPhp: number;
  byAgingBucket: Record<AgingBucket, number>;
  receivablesByAging: Record<AgingBucket, number>;
  payablesByAging: Record<AgingBucket, number>;
  totalTaxPhp: number;
  taxPhp: number;
  totalDiscountPhp: number;
  discountPhp: number;
}

export interface InvoiceAgingInputItem {
  id?: string;
  title?: string;
  direction?: "RECEIVABLE" | "PAYABLE";
  dueDate: string;
  status?: "DRAFT" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | string;
  totalPhp?: number;
  paidPhp?: number;
  taxPhp?: number;
  discountPhp?: number;
  totalMinor?: number;
  paidMinor?: number;
  taxMinor?: number;
  discountMinor?: number;
}

function calculateDaysOverdue(dueDate: string, asOfDate: string): number {
  if (!dueDate || !asOfDate) return 0;
  const [dy, dm, dd] = dueDate.split("-").map(Number);
  const [ay, am, ad] = asOfDate.split("-").map(Number);
  if (!dy || !dm || !dd || !ay || !am || !ad) return 0;
  const dueUtc = Date.UTC(dy, dm - 1, dd);
  const asOfUtc = Date.UTC(ay, am - 1, ad);
  return Math.floor((asOfUtc - dueUtc) / (1000 * 60 * 60 * 24));
}

export function getAgingBucket(dueDate: string, asOfDate: string): AgingBucket {
  const days = calculateDaysOverdue(dueDate, asOfDate);
  if (days <= 0) return "CURRENT";
  if (days <= 15) return "OVERDUE_1_15";
  if (days <= 30) return "OVERDUE_16_30";
  return "OVERDUE_30_PLUS";
}

export function analyzeInvoiceAging(
  invoices: InvoiceAgingInputItem[],
  asOfDate?: string
): InvoiceAgingReport {
  const today = asOfDate || new Date().toISOString().slice(0, 10);

  let totalReceivables = 0;
  let uncollectedReceivables = 0;
  let totalPayables = 0;
  let unpaidPayables = 0;
  let cumulativeTax = 0;
  let cumulativeDiscount = 0;

  const receivablesByAging: Record<AgingBucket, number> = {
    CURRENT: 0,
    OVERDUE_1_15: 0,
    OVERDUE_16_30: 0,
    OVERDUE_30_PLUS: 0,
  };

  const payablesByAging: Record<AgingBucket, number> = {
    CURRENT: 0,
    OVERDUE_1_15: 0,
    OVERDUE_16_30: 0,
    OVERDUE_30_PLUS: 0,
  };

  for (const item of invoices) {
    const total = Math.max(
      0,
      item.totalPhp !== undefined ? item.totalPhp : (item.totalMinor ?? 0) / 100
    );
    const paid = Math.max(
      0,
      item.paidPhp !== undefined ? item.paidPhp : (item.paidMinor ?? 0) / 100
    );
    const tax = Math.max(
      0,
      item.taxPhp !== undefined ? item.taxPhp : (item.taxMinor ?? 0) / 100
    );
    const discount = Math.max(
      0,
      item.discountPhp !== undefined ? item.discountPhp : (item.discountMinor ?? 0) / 100
    );

    cumulativeTax += tax;
    cumulativeDiscount += discount;

    const isPaid = item.status === "PAID" || paid >= total;
    const unpaid = isPaid ? 0 : Math.max(0, Number((total - paid).toFixed(2)));

    const bucket = getAgingBucket(item.dueDate, today);

    const direction = item.direction ?? "RECEIVABLE";
    if (direction === "RECEIVABLE") {
      totalReceivables += total;
      uncollectedReceivables += unpaid;
      receivablesByAging[bucket] = Number(
        (receivablesByAging[bucket] + unpaid).toFixed(2)
      );
    } else {
      totalPayables += total;
      unpaidPayables += unpaid;
      payablesByAging[bucket] = Number(
        (payablesByAging[bucket] + unpaid).toFixed(2)
      );
    }
  }

  const roundedUncollectedReceivables = Number(uncollectedReceivables.toFixed(2));
  const roundedUnpaidPayables = Number(unpaidPayables.toFixed(2));
  const roundedTax = Number(cumulativeTax.toFixed(2));
  const roundedDiscount = Number(cumulativeDiscount.toFixed(2));

  return {
    totalReceivablesPhp: Number(totalReceivables.toFixed(2)),
    uncollectedReceivablesPhp: roundedUncollectedReceivables,
    totalUncollectedReceivablesPhp: roundedUncollectedReceivables,
    totalPayablesPhp: Number(totalPayables.toFixed(2)),
    unpaidPayablesPhp: roundedUnpaidPayables,
    totalUnpaidPayablesPhp: roundedUnpaidPayables,
    netUncollectedPhp: Number((roundedUncollectedReceivables - roundedUnpaidPayables).toFixed(2)),
    byAgingBucket: { ...receivablesByAging },
    receivablesByAging,
    payablesByAging,
    totalTaxPhp: roundedTax,
    taxPhp: roundedTax,
    totalDiscountPhp: roundedDiscount,
    discountPhp: roundedDiscount,
  };
}
