import { describe, expect, it } from "vitest";
import { calculateInvoice, computeInvoiceTotals } from "../../src/core/engine/invoiceCalculator";

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

describe("computeInvoiceTotals", () => {
  it("sums line items into a subtotal", () => {
    expect(
      computeInvoiceTotals(
        [
          { qty: 2, unitPrice: 1250 },
          { qty: 1, unitPrice: 500 },
        ],
        0,
        0
      )
    ).toEqual({ subtotal: 3000, taxAmount: 0, grandTotal: 3000 });
  });

  it("applies the tax percentage on top of the subtotal", () => {
    expect(computeInvoiceTotals([{ qty: 1, unitPrice: 1000 }], 12, 0)).toEqual({
      subtotal: 1000,
      taxAmount: 120,
      grandTotal: 1120,
    });
  });

  it("deducts the discount from subtotal plus tax", () => {
    expect(computeInvoiceTotals([{ qty: 2, unitPrice: 1000 }], 10, 250)).toEqual({
      subtotal: 2000,
      taxAmount: 200,
      grandTotal: 1950,
    });
  });

  it("floors the grand total at zero when the discount exceeds subtotal plus tax", () => {
    expect(computeInvoiceTotals([{ qty: 1, unitPrice: 500 }], 10, 5000)).toEqual({
      subtotal: 500,
      taxAmount: 50,
      grandTotal: 0,
    });
  });

  it("ignores negative tax and discount inputs", () => {
    expect(computeInvoiceTotals([{ qty: 1, unitPrice: 800 }], -15, -100)).toEqual({
      subtotal: 800,
      taxAmount: 0,
      grandTotal: 800,
    });
  });

  it("rounds each figure to centavos", () => {
    expect(computeInvoiceTotals([{ qty: 1, unitPrice: 99.999 }], 8, 0)).toEqual({
      subtotal: 100,
      taxAmount: 8,
      grandTotal: 108,
    });
  });
});
