import { describe, expect, it } from "vitest";
import { calculateCashflow } from "../../src/core/engine/cashflowAnalytics";

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
});
