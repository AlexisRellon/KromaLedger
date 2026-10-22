import type { Invoice, Transaction } from "../models";

export interface CashflowInput {
  month: string;
  transactions: Array<Pick<Transaction, "date" | "amountMinor" | "categoryId"> & { type?: string; feeMinor?: number }>;
  subscriptions: Array<{ amountMinor: number; billingCycle: "WEEKLY" | "MONTHLY" | "YEARLY"; active: boolean }>;
  invoices: Pick<Invoice, "id" | "totalMinor" | "paidMinor" | "status">[];
}

export interface CashflowAnalytics {
  netOutflowMinor: number;
  fixedBurnPercent: number;
  categories: Array<{ categoryId: string; amountMinor: number }>;
  partialInvoices: Array<{ invoiceId: string; paidMinor: number; totalMinor: number; percentPaid: number }>;
}

export function calculateCashflow(input: CashflowInput): CashflowAnalytics {
  const monthlyTransactions = input.transactions.filter((transaction) => transaction.date.startsWith(`${input.month}-`));
  const regularOutflows = monthlyTransactions.filter((transaction) => transaction.type !== "TRANSFER" && transaction.amountMinor < 0);
  const transferFeeOutflows = monthlyTransactions.filter((t) => t.type === "TRANSFER" && (t.feeMinor ?? 0) > 0);

  const totalRegularOutflow = regularOutflows.reduce((sum, t) => sum - t.amountMinor, 0);
  const totalTransferFees = transferFeeOutflows.reduce((sum, t) => sum + (t.feeMinor ?? 0), 0);
  const totalOutflowMinor = totalRegularOutflow + totalTransferFees;

  const totalInflowMinor = monthlyTransactions
    .filter((t) => t.type !== "TRANSFER" && t.amountMinor > 0)
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const netOutflowMinor = totalOutflowMinor - totalInflowMinor;

  const monthlyFixedMinor = input.subscriptions.filter((subscription) => subscription.active).reduce((sum, subscription) => {
    const monthly = subscription.billingCycle === "WEEKLY" ? subscription.amountMinor * 52 / 12
      : subscription.billingCycle === "YEARLY" ? subscription.amountMinor / 12 : subscription.amountMinor;
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
  const categories = [...byCategory].map(([categoryId, amountMinor]) => ({ categoryId, amountMinor }))
    .sort((a, b) => b.amountMinor - a.amountMinor || a.categoryId.localeCompare(b.categoryId));
  const partialInvoices = input.invoices.filter((invoice) => invoice.paidMinor > 0 && invoice.paidMinor < invoice.totalMinor).map((invoice) => ({
    invoiceId: invoice.id, paidMinor: invoice.paidMinor, totalMinor: invoice.totalMinor,
    percentPaid: Math.round(invoice.paidMinor / invoice.totalMinor * 100),
  }));
  return {
    netOutflowMinor,
    fixedBurnPercent: totalOutflowMinor === 0 ? 0 : Math.round(monthlyFixedMinor / totalOutflowMinor * 10000) / 100,
    categories,
    partialInvoices,
  };
}

export interface CashForecastInput {
  totalCashMinor: number;
  month: string;
  transactions: Array<{ date: string; amountMinor: number; type?: string; feeMinor?: number; subscriptionId?: string }>;
  subscriptions: Array<{ id: string; title: string; amountMinor: number; active: boolean; nextBillingDate: string }>;
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
  pendingSubscriptions: Array<{ id: string; title: string; amountMinor: number; nextBillingDate: string }>;
}

export function calculateCashForecast(input: CashForecastInput): CashForecast {
  const monthPrefix = `${input.month}-`;
  const monthlyTx = input.transactions.filter((t) => t.date.startsWith(monthPrefix));

  const inflowsMinor = monthlyTx
    .filter((t) => t.type !== "TRANSFER" && t.amountMinor > 0)
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const outflowsMinor = monthlyTx
    .reduce((sum, t) => {
      if (t.type === "TRANSFER") {
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
