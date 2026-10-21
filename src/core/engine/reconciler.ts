import type { Invoice, Subscription, Transaction } from "../models";

export interface PendingConfirmation {
  id: string;
  subscriptionId: string;
  title: string;
  date: string;
  amountMinor: number;
}

export interface ReconcileInput {
  subscriptions: Subscription[];
  invoices: Invoice[];
  lastReconciledDate?: string;
  currentDate: string;
}

export interface ReconcileResult {
  subscriptions: Subscription[];
  invoices: Invoice[];
  transactions: Transaction[];
  pendingConfirmations: PendingConfirmation[];
  lastReconciledDate: string;
}

function asUtcDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new RangeError(`Invalid calendar date: ${value}`);
  return date;
}

function cycleDate(start: Date, cycle: Subscription["billingCycle"], count: number): string {
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const day = start.getUTCDate();
  let result: Date;
  if (cycle === "WEEKLY") {
    result = new Date(start.getTime());
    result.setUTCDate(day + count * 7);
  } else {
    const targetYear = cycle === "YEARLY" ? year + count : year + Math.floor((month + count) / 12);
    const targetMonth = cycle === "YEARLY" ? month : (month + count) % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    result = new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay)));
  }
  return result.toISOString().slice(0, 10);
}

export function reconcile(input: ReconcileInput): ReconcileResult {
  const now = asUtcDate(input.currentDate);
  if (input.lastReconciledDate && now < asUtcDate(input.lastReconciledDate)) throw new RangeError("Reconciliation date cannot move backwards");
  const transactions: Transaction[] = [];
  const pendingConfirmations: PendingConfirmation[] = [];
  const subscriptions = input.subscriptions.map((subscription) => {
    if (!subscription.active) return subscription;
    const anchor = asUtcDate(subscription.billingAnchorDate ?? subscription.nextBillingDate);
    let count = 0;
    let dueDate = cycleDate(anchor, subscription.billingCycle, count);
    while (dueDate < subscription.nextBillingDate) {
      if (count++ >= 10000) throw new RangeError("Subscription has too many missed billing cycles");
      dueDate = cycleDate(anchor, subscription.billingCycle, count);
    }
    let cycles = 0;
    while (dueDate <= input.currentDate) {
      if (cycles++ >= 10000) throw new RangeError("Subscription has too many missed billing cycles");
      if (subscription.autoLog) {
        transactions.push({
          id: `sub:${subscription.id}:${dueDate}`, date: dueDate, title: subscription.title,
          amountMinor: -subscription.amountMinor, currency: subscription.currency,
          type: "SUBSCRIPTION_PAYMENT", subscriptionId: subscription.id, categoryId: subscription.categoryId,
          walletId: subscription.walletId,
        });
      } else {
        pendingConfirmations.push({ id: `sub:${subscription.id}:${dueDate}`, subscriptionId: subscription.id, title: subscription.title, date: dueDate, amountMinor: subscription.amountMinor });
      }
      count += 1;
      dueDate = cycleDate(anchor, subscription.billingCycle, count);
    }
    return subscription.autoLog && cycles ? { ...subscription, billingAnchorDate: subscription.billingAnchorDate ?? subscription.nextBillingDate, nextBillingDate: dueDate } : subscription;
  });
  transactions.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  pendingConfirmations.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const invoices = input.invoices.map((invoice) => invoice.status === "PENDING" || invoice.status === "PARTIAL"
    ? invoice.dueDate < input.currentDate ? { ...invoice, status: "OVERDUE" as const } : invoice
    : invoice);
  return { subscriptions, invoices, transactions, pendingConfirmations, lastReconciledDate: input.currentDate };
}
