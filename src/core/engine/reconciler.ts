import { formatCurrency, type AppNotification, type Invoice, type Subscription, type Transaction, type Wallet } from "../models";

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
  wallets?: Wallet[];
}

export interface ReconcileResult {
  subscriptions: Subscription[];
  invoices: Invoice[];
  transactions: Transaction[];
  pendingConfirmations: PendingConfirmation[];
  notifications: AppNotification[];
  lastReconciledDate: string;
}

function asUtcDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new RangeError(`Invalid calendar date: ${value}`);
  return date;
}

function addDaysUtc(value: string, days: number): string {
  const date = asUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetweenUtc(fromDate: string, toDate: string): number {
  const a = asUtcDate(fromDate);
  const b = asUtcDate(toDate);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function cycleDate(start: Date, cycle: Subscription["billingCycle"], count: number): string {
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
  const notifications: AppNotification[] = [];

  const walletMap = input.wallets ? new Map(input.wallets.map((w) => [w.id, { ...w }])) : null;

  const subscriptions = input.subscriptions.map((subscription) => {
    if (!subscription.active) return subscription;

    // Upcoming reminders (3 days ahead or due today)
    const daysUntilDue = daysBetweenUtc(input.currentDate, subscription.nextBillingDate);
    if (daysUntilDue === 3) {
      notifications.push({
        id: `notif:sub-upcoming:${subscription.id}:${subscription.nextBillingDate}:3`,
        title: `Upcoming: ${subscription.title}`,
        message: `${subscription.title} (${formatCurrency(subscription.amountMinor, subscription.currency)}) is due in 3 days on ${subscription.nextBillingDate}.`,
        type: "INFO",
        createdAt: `${input.currentDate}T00:00:00.000Z`,
        read: false,
        entityType: "SUBSCRIPTION",
        entityId: subscription.id,
        actionLink: "PENDING",
      });
    } else if (daysUntilDue === 0) {
      notifications.push({
        id: `notif:sub-upcoming:${subscription.id}:${subscription.nextBillingDate}:0`,
        title: `Due Today: ${subscription.title}`,
        message: `${subscription.title} (${formatCurrency(subscription.amountMinor, subscription.currency)}) is due today.`,
        type: "ALERT",
        createdAt: `${input.currentDate}T00:00:00.000Z`,
        read: false,
        entityType: "SUBSCRIPTION",
        entityId: subscription.id,
        actionLink: "PENDING",
      });
    }

    const anchor = asUtcDate(subscription.billingAnchorDate ?? subscription.nextBillingDate);
    let count = 0;
    let dueDate = cycleDate(anchor, subscription.billingCycle, count);
    while (dueDate < subscription.nextBillingDate) {
      if (count++ >= 10000) throw new RangeError("Subscription has too many missed billing cycles");
      dueDate = cycleDate(anchor, subscription.billingCycle, count);
    }
    let cycles = 0;
    let currentNextBillingDate = subscription.nextBillingDate;
    const anchorToKeep = subscription.billingAnchorDate ?? subscription.nextBillingDate;

    while (dueDate <= input.currentDate) {
      if (cycles++ >= 10000) throw new RangeError("Subscription has too many missed billing cycles");

      if (subscription.autoLog) {
        if (walletMap) {
          const wallet = subscription.walletId ? walletMap.get(subscription.walletId) : undefined;
          if (!wallet || wallet.balanceMinor < subscription.amountMinor) {
            const tomorrow = addDaysUtc(input.currentDate, 1);
            notifications.push({
              id: `notif:sub-insufficient:${subscription.id}:${dueDate}`,
              title: `Insufficient Balance: ${subscription.title}`,
              message: wallet
                ? `${subscription.title} (${formatCurrency(subscription.amountMinor, subscription.currency)}) could not be deducted from ${wallet.name} (Balance: ${formatCurrency(wallet.balanceMinor, wallet.currency)}). Next retry moved to ${tomorrow}.`
                : `${subscription.title} (${formatCurrency(subscription.amountMinor, subscription.currency)}) has no linked wallet. Next retry moved to ${tomorrow}.`,
              type: "WARNING",
              createdAt: `${input.currentDate}T00:00:00.000Z`,
              read: false,
              entityType: "SUBSCRIPTION",
              entityId: subscription.id,
              actionLink: "PENDING",
            });
            return {
              ...subscription,
              billingAnchorDate: anchorToKeep,
              nextBillingDate: tomorrow,
            };
          }
          wallet.balanceMinor -= subscription.amountMinor;
        }

        transactions.push({
          id: `sub:${subscription.id}:${dueDate}`,
          date: dueDate,
          title: subscription.title,
          amountMinor: -subscription.amountMinor,
          currency: subscription.currency,
          type: "SUBSCRIPTION_PAYMENT",
          subscriptionId: subscription.id,
          categoryId: subscription.categoryId,
          walletId: subscription.walletId,
        });
      } else {
        pendingConfirmations.push({
          id: `sub:${subscription.id}:${dueDate}`,
          subscriptionId: subscription.id,
          title: subscription.title,
          date: dueDate,
          amountMinor: subscription.amountMinor,
        });
      }
      count += 1;
      dueDate = cycleDate(anchor, subscription.billingCycle, count);
      currentNextBillingDate = dueDate;
    }

    return subscription.autoLog && cycles
      ? { ...subscription, billingAnchorDate: anchorToKeep, nextBillingDate: currentNextBillingDate }
      : subscription;
  });

  transactions.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  pendingConfirmations.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));

  const invoices = input.invoices.map((invoice) =>
    invoice.status === "PENDING" || invoice.status === "PARTIAL"
      ? invoice.dueDate < input.currentDate
        ? { ...invoice, status: "OVERDUE" as const }
        : invoice
      : invoice
  );

  return {
    subscriptions,
    invoices,
    transactions,
    pendingConfirmations,
    notifications,
    lastReconciledDate: input.currentDate,
  };
}
