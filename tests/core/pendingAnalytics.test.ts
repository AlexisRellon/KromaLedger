import { describe, expect, it } from "vitest";
import { buildInvoicePayment, selectPendingOverview } from "../../src/core/engine/pendingAnalytics";
import type { Invoice, Subscription } from "../../src/core/models";

const sub = (id: string, date: string, autoLog: boolean): Subscription => ({ id, title: id, amountMinor: 100, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: date, billingAnchorDate: date, active: true, autoLog });
const invoice = (id: string, status: Invoice["status"], paidMinor: number, dueDate: string): Invoice => ({ id, title: id, direction: "RECEIVABLE", dueDate, status, subtotalMinor: 1000, taxMinor: 0, discountMinor: 0, totalMinor: 1000, paidMinor, currency: "PHP", itemIds: [] });

describe("pending analytics", () => {
  it("includes overdue manual cycles for confirmation, future cycles, and partial balances", () => {
    const view = selectPendingOverview("2026-10-20", "2026-10-27", {
      subscriptions: [sub("manual", "2026-10-01", false), sub("auto-overdue", "2026-10-01", true), sub("soon", "2026-10-24", true)],
      invoices: [invoice("partial", "OVERDUE", 400, "2026-10-01"), invoice("paid", "PAID", 1000, "2026-10-22"), invoice("due", "PENDING", 0, "2026-10-22")],
    });
    expect(view.subscriptions.map((s) => s.id)).toEqual(["manual", "soon"]);
    expect(view.invoices.map((i) => i.id)).toEqual(["due"]);
    expect(view.partials.map((i) => i.id)).toEqual(["partial"]);
  });

  it("builds signed settlements and rejects zero, unsafe, and overpayment amounts", () => {
    expect(buildInvoicePayment(invoice("inv", "PARTIAL", 400, "2026-10-20"), "6", "2026-10-20", "pay-1")).toMatchObject({ amountMinor: 600, type: "INCOME", invoiceId: "inv" });
    expect(() => buildInvoicePayment(invoice("inv", "PARTIAL", 400, "2026-10-20"), "6.01", "2026-10-20", "x")).toThrow();
    expect(() => buildInvoicePayment(invoice("inv2", "PENDING", 0, "2026-10-20"), "0", "2026-10-20", "x")).toThrow();
  });
});
