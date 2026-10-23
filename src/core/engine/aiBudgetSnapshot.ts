import {
  dateOnlySchema,
  type Category,
  type Invoice,
  type Subscription,
  type Transaction,
  type Wallet,
  type WeeklyBudgetSnapshot,
} from "../models";

function parseDateUtc(dateStr: string): Date {
  dateOnlySchema.parse(dateStr);
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) throw new RangeError(`Invalid date: ${dateStr}`);
  return date;
}

function formatDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getIsoWeekBoundaries(todayStr: string): { start: string; end: string; daysRemaining: number } {
  const current = parseDateUtc(todayStr);
  // getUTCDay: 0 is Sun, 1 is Mon, ..., 6 is Sat
  const dayOfWeek = current.getUTCDay();
  // Monday is 1; Sunday is 7
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  const daysToMonday = 1 - isoDay;
  const daysToSunday = 7 - isoDay;

  const monday = addDaysUtc(current, daysToMonday);
  const sunday = addDaysUtc(current, daysToSunday);

  return {
    start: formatDateUtc(monday),
    end: formatDateUtc(sunday),
    daysRemaining: daysToSunday + 1, // inclusive of today
  };
}

export interface BuildSnapshotInput {
  today: string;
  currency?: string;
  wallets: Wallet[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  transactions: Transaction[];
  categories: Category[];
}

export function buildWeeklyBudgetSnapshot(input: BuildSnapshotInput): WeeklyBudgetSnapshot {
  const currency = input.currency ?? "PHP";
  const { start: weekStartDate, end: weekEndDate, daysRemaining } = getIsoWeekBoundaries(input.today);

  // Liquid cash: sum of non-credit wallets with positive/actual balances
  const totalLiquidCashMinor = input.wallets
    .filter((w) => w.type !== "CREDIT")
    .reduce((sum, w) => sum + (w.balanceMinor || 0), 0);

  // Subscriptions due this week (active and nextBillingDate between today and Sunday)
  const subscriptionsMinor = input.subscriptions
    .filter((s) => s.active && s.nextBillingDate >= input.today && s.nextBillingDate <= weekEndDate)
    .reduce((sum, s) => sum + s.amountMinor, 0);

  // Invoices due this week
  const unpaidPayableInvoicesMinor = input.invoices
    .filter((inv) => inv.direction === "PAYABLE" && inv.status !== "PAID" && inv.dueDate >= input.today && inv.dueDate <= weekEndDate)
    .reduce((sum, inv) => sum + Math.max(0, inv.totalMinor - inv.paidMinor), 0);

  const expectedReceivablesMinor = input.invoices
    .filter((inv) => inv.direction === "RECEIVABLE" && inv.status !== "PAID" && inv.dueDate >= input.today && inv.dueDate <= weekEndDate)
    .reduce((sum, inv) => sum + Math.max(0, inv.totalMinor - inv.paidMinor), 0);

  const netObligationsMinor = (subscriptionsMinor + unpaidPayableInvoicesMinor) - expectedReceivablesMinor;

  // 30-day discretionary spending history
  const thirtyDaysAgo = formatDateUtc(addDaysUtc(parseDateUtc(input.today), -30));
  const recentExpenses = input.transactions.filter(
    (t) => t.date >= thirtyDaysAgo && t.date <= input.today && t.type === "EXPENSE" && t.amountMinor < 0
  );

  const totalRecentExpenseMinor = recentExpenses.reduce((sum, t) => sum + Math.abs(t.amountMinor), 0);
  const avgDailyExpenseMinor = Math.round(totalRecentExpenseMinor / 30);

  // Category breakdown for past 30 days
  const categoryMap = new Map<string, string>();
  for (const c of input.categories) {
    categoryMap.set(c.id, c.name);
  }

  const categoryTotals = new Map<string, number>();
  for (const t of recentExpenses) {
    const catName = (t.categoryId && categoryMap.get(t.categoryId)) || "General / Uncategorized";
    categoryTotals.set(catName, (categoryTotals.get(catName) ?? 0) + Math.abs(t.amountMinor));
  }

  const sortedCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([categoryName, amountMinor]) => ({
      categoryName,
      amountMinor,
      percent: totalRecentExpenseMinor > 0 ? Math.round((amountMinor / totalRecentExpenseMinor) * 100) : 0,
    }));

  return {
    today: input.today,
    weekStartDate,
    weekEndDate,
    daysRemainingInWeek: daysRemaining,
    currency,
    totalLiquidCashMinor,
    dueThisWeek: {
      subscriptionsMinor,
      unpaidPayableInvoicesMinor,
      expectedReceivablesMinor,
      netObligationsMinor,
    },
    discretionaryBurnHistory: {
      avgDailyExpenseMinor,
      topCategoriesPastMonth: sortedCategories,
    },
  };
}
