import { describe, expect, it } from "vitest";
import { calculateCashflow, calculateCashForecast } from "../../src/core/engine/cashflowAnalytics";

describe("calculateCashflow", () => {
  it("returns month outflow, fixed burn share, category totals, and partial invoice progress", () => {
    const result = calculateCashflow({ month: "2026-10", transactions: [
      { date: "2026-10-01", amountMinor: -10000, categoryId: "food" },
      { date: "2026-10-02", amountMinor: 200000,  },
      { date: "2026-09-30", amountMinor: -99999,  },
    ], subscriptions: [{ amountMinor: 4000, billingCycle: "MONTHLY", active: true }], invoices: [{ id: "i", totalMinor: 10000, paidMinor: 2500, status: "PARTIAL" }, { id: "late", totalMinor: 10000, paidMinor: 500, status: "OVERDUE" }] });
    expect(result).toMatchObject({ netOutflowMinor: -190000, fixedBurnPercent: 40, categories: [{ categoryId: "food", amountMinor: 10000 }], partialInvoices: [
      { invoiceId: "i", paidMinor: 2500, totalMinor: 10000, percentPaid: 25 },
      { invoiceId: "late", paidMinor: 500, totalMinor: 10000, percentPaid: 5 },
    ] });
  });

  it("calculates 3-tier metrics: total cash, net gain/loss, and subscription-predicted cash", () => {
    const forecast = calculateCashForecast({
      totalCashMinor: 500000, // 5,000.00 liquid cash
      month: "2026-10",
      transactions: [
        { date: "2026-10-05", amountMinor: 150000 }, // +1,500 inflow
        { date: "2026-10-10", amountMinor: -50000 }, // -500 outflow
        { date: "2026-10-12", amountMinor: -30000, type: "SUBSCRIPTION_PAYMENT", subscriptionId: "sub-netflix" }, // already paid
        { date: "2026-09-28", amountMinor: -80000 }, // out of month
      ],
      subscriptions: [
        { id: "sub-netflix", title: "Netflix", amountMinor: 30000, active: true, nextBillingDate: "2026-11-12" }, // paid this month, rolls to Nov
        { id: "sub-spotify", title: "Spotify", amountMinor: 15000, active: true, nextBillingDate: "2026-10-25" }, // pending this month
        { id: "sub-cloud", title: "Cloud Hosting", amountMinor: 20000, active: true, nextBillingDate: "2026-10-28" }, // pending this month
        { id: "sub-paused", title: "Gym", amountMinor: 10000, active: false, nextBillingDate: "2026-10-30" }, // inactive
      ],
    });

    expect(forecast.totalCashMinor).toBe(500000);
    expect(forecast.inflowsMinor).toBe(150000);
    expect(forecast.outflowsMinor).toBe(80000); // 50000 + 30000
    expect(forecast.netGainLossMinor).toBe(70000); // 150000 - 80000 = +700
    expect(forecast.isNetGain).toBe(true);
    expect(forecast.upcomingSubsMinor).toBe(35000); // Spotify (15000) + Cloud (20000)
    expect(forecast.upcomingSubsCount).toBe(2);
    expect(forecast.projectedCashMinor).toBe(465000); // 500000 - 35000
    expect(forecast.pendingSubscriptions).toEqual([
      { id: "sub-spotify", title: "Spotify", amountMinor: 15000, nextBillingDate: "2026-10-25" },
      { id: "sub-cloud", title: "Cloud Hosting", amountMinor: 20000, nextBillingDate: "2026-10-28" },
    ]);
  });

  it("excludes transfer principal from net outflow/inflows and counts only transfer fees as outflow", () => {
    const cashflow = calculateCashflow({
      month: "2026-10",
      transactions: [
        { date: "2026-10-05", amountMinor: -50000, categoryId: "groceries" }, // regular expense ₱500
        { date: "2026-10-10", amountMinor: 100000, type: "TRANSFER", feeMinor: 1000 }, // ₱1,000 transfer with ₱10 fee
        { date: "2026-10-15", amountMinor: 50000, type: "TRANSFER", feeMinor: 0 }, // ₱500 transfer with ₱0 fee
      ],
      subscriptions: [],
      invoices: [],
    });

    // Total outflow should be 50,000 (groceries) + 1,000 (fee) = 51,000; not including the 100,000 or 50,000 transfer amounts!
    expect(cashflow.netOutflowMinor).toBe(51000);
    expect(cashflow.categories).toEqual(
      expect.arrayContaining([
        { categoryId: "groceries", amountMinor: 50000 },
        { categoryId: "transfer-fee", amountMinor: 1000 },
      ])
    );
  });
});
