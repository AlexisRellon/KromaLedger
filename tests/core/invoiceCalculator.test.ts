import { describe, expect, it } from "vitest";
import { calculateInvoice } from "../../src/core/engine/invoiceCalculator";

describe("calculateInvoice", () => {
  const base = { items: [{ description: "Design", quantity: 2, unitPriceMinor: 1250 }], taxRateBps: 1000, discountMinor: 100, paidMinor: 0, dueDate: "2026-10-24", currentDate: "2026-10-20", draft: false };
  it("calculates quantity, tax and discount in integer minor units", () => {
    expect(calculateInvoice(base)).toMatchObject({ subtotalMinor: 2500, taxMinor: 240, totalMinor: 2640, remainingMinor: 2640, status: "PENDING" });
  });
  it("rounds half minor units upward and tracks partial payment", () => {
    expect(calculateInvoice({ ...base, items: [{ description: "Odd tax", quantity: 1, unitPriceMinor: 5 }], taxRateBps: 1000, discountMinor: 0, paidMinor: 2 })).toMatchObject({ taxMinor: 1, totalMinor: 6, remainingMinor: 4, status: "PARTIAL" });
  });
  it("marks zero balance paid and refuses overpayment", () => {
    expect(calculateInvoice({ ...base, paidMinor: 2640 }).status).toBe("PAID");
    expect(() => calculateInvoice({ ...base, paidMinor: 2641 })).toThrow();
  });
  it("keeps drafts and marks unpaid invoices overdue only after due date", () => {
    expect(calculateInvoice({ ...base, draft: true, currentDate: "2027-01-01" }).status).toBe("DRAFT");
    expect(calculateInvoice({ ...base, currentDate: "2026-10-24" }).status).toBe("PENDING");
    expect(calculateInvoice({ ...base, currentDate: "2026-10-25" }).status).toBe("OVERDUE");
  });
  it("keeps large fractional unit prices cent-exact", () => {
    expect(calculateInvoice({ ...base, items: [{ description: "Precision", quantity: 0.5, unitPriceMinor: 9007199254740970 }], taxRateBps: 0, discountMinor: 0, paidMinor: 0 })).toMatchObject({ subtotalMinor: 4503599627370485, totalMinor: 4503599627370485 });
  });
  it("rejects invalid quantities and discounts beyond subtotal", () => {
    expect(() => calculateInvoice({ ...base, items: [{ description: "bad", quantity: 0, unitPriceMinor: 20 }] })).toThrow();
    expect(() => calculateInvoice({ ...base, discountMinor: 2501 })).toThrow();
    expect(() => calculateInvoice({ ...base, dueDate: "2026-02-30" })).toThrow();
  });
});
