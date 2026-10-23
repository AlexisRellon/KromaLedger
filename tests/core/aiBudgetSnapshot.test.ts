import { describe, expect, it } from "vitest";
import { buildWeeklyBudgetSnapshot, getIsoWeekBoundaries } from "../../src/core/engine/aiBudgetSnapshot";
import { type Category, type Invoice, type Subscription, type Transaction, type Wallet } from "../../src/core/models";

describe("aiBudgetSnapshot", () => {
  it("calculates ISO week boundaries correctly for a mid-week date", () => {
    // 2026-10-21 is Wednesday
    const bounds = getIsoWeekBoundaries("2026-10-21");
    expect(bounds.start).toBe("2026-10-19"); // Monday
    expect(bounds.end).toBe("2026-10-25"); // Sunday
    expect(bounds.daysRemaining).toBe(5); // Wed, Thu, Fri, Sat, Sun
  });

  it("calculates ISO week boundaries correctly for a Sunday", () => {
    // 2026-10-25 is Sunday
    const bounds = getIsoWeekBoundaries("2026-10-25");
    expect(bounds.start).toBe("2026-10-19");
    expect(bounds.end).toBe("2026-10-25");
    expect(bounds.daysRemaining).toBe(1);
  });

  it("builds a structured weekly budget snapshot from ledger data", () => {
    const wallets: Wallet[] = [
      { id: "w1", name: "Cash", type: "CASH", currency: "PHP", balanceMinor: 500000, color: "#D9F938", isDefault: true },
      { id: "w2", name: "Bank", type: "BANK", currency: "PHP", balanceMinor: 1500000, color: "#45B69C", isDefault: false },
      { id: "w3", name: "Credit Card", type: "CREDIT", currency: "PHP", balanceMinor: -200000, color: "#E0533C", isDefault: false },
    ];

    const subscriptions: Subscription[] = [
      { id: "s1", title: "Cloud Storage", amountMinor: 50000, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: "2026-10-22", active: true, autoLog: true },
      { id: "s2", title: "Gym (Next Month)", amountMinor: 200000, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: "2026-11-05", active: true, autoLog: true },
    ];

    const invoices: Invoice[] = [
      {
        id: "inv1",
        title: "Internet Bill",
        direction: "PAYABLE",
        dueDate: "2026-10-24",
        status: "PENDING",
        subtotalMinor: 150000,
        taxMinor: 0,
        discountMinor: 0,
        totalMinor: 150000,
        paidMinor: 0,
        currency: "PHP",
        itemIds: [],
      },
      {
        id: "inv2",
        title: "Consulting Client",
        direction: "RECEIVABLE",
        dueDate: "2026-10-23",
        status: "PENDING",
        subtotalMinor: 300000,
        taxMinor: 0,
        discountMinor: 0,
        totalMinor: 300000,
        paidMinor: 0,
        currency: "PHP",
        itemIds: [],
      },
    ];

    const categories: Category[] = [
      { id: "cat-food", name: "Food & Dining", type: "EXPENSE" },
      { id: "cat-transit", name: "Transportation", type: "EXPENSE" },
    ];

    const transactions: Transaction[] = [
      { id: "t1", date: "2026-10-20", title: "Groceries", amountMinor: -60000, currency: "PHP", type: "EXPENSE", categoryId: "cat-food" },
      { id: "t2", date: "2026-10-15", title: "Fuel", amountMinor: -40000, currency: "PHP", type: "EXPENSE", categoryId: "cat-transit" },
      { id: "t3", date: "2026-10-01", title: "Dinner", amountMinor: -50000, currency: "PHP", type: "EXPENSE", categoryId: "cat-food" },
    ];

    const snapshot = buildWeeklyBudgetSnapshot({
      today: "2026-10-21",
      currency: "PHP",
      wallets,
      subscriptions,
      invoices,
      transactions,
      categories,
    });

    // Liquid cash excludes credit card: 5,000 + 15,000 = 20,000 PHP (2,000,000 minor)
    expect(snapshot.totalLiquidCashMinor).toBe(2000000);

    // Subscriptions due this week: only s1 (50,000 minor)
    expect(snapshot.dueThisWeek.subscriptionsMinor).toBe(50000);

    // Unpaid payables due this week: inv1 (150,000 minor)
    expect(snapshot.dueThisWeek.unpaidPayableInvoicesMinor).toBe(150000);

    // Expected receivables due this week: inv2 (300,000 minor)
    expect(snapshot.dueThisWeek.expectedReceivablesMinor).toBe(300000);

    // Net obligations: (50,000 + 150,000) - 300,000 = -100,000 minor
    expect(snapshot.dueThisWeek.netObligationsMinor).toBe(-100000);

    // Days remaining: Wed..Sun = 5 days
    expect(snapshot.daysRemainingInWeek).toBe(5);

    // Top categories: Food (110,000) & Transit (40,000)
    expect(snapshot.discretionaryBurnHistory.topCategoriesPastMonth[0]?.categoryName).toBe("Food & Dining");
  });
});
