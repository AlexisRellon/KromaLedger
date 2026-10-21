import type { Invoice, Transaction } from "../models";

export interface CashflowInput {
  month: string;
  transactions: Pick<Transaction, "date" | "amountMinor" | "categoryId">[];
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
  const outflows = monthlyTransactions.filter((transaction) => transaction.amountMinor < 0);
  const totalOutflowMinor = outflows.reduce((sum, transaction) => sum - transaction.amountMinor, 0);
  const netOutflowMinor = -monthlyTransactions.reduce((sum, transaction) => sum + transaction.amountMinor, 0);
  const monthlyFixedMinor = input.subscriptions.filter((subscription) => subscription.active).reduce((sum, subscription) => {
    const monthly = subscription.billingCycle === "WEEKLY" ? subscription.amountMinor * 52 / 12
      : subscription.billingCycle === "YEARLY" ? subscription.amountMinor / 12 : subscription.amountMinor;
    return sum + monthly;
  }, 0);
  const byCategory = new Map<string, number>();
  for (const transaction of outflows) {
    const id = transaction.categoryId ?? "uncategorized";
    byCategory.set(id, (byCategory.get(id) ?? 0) - transaction.amountMinor);
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
