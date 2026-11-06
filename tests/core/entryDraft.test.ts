import { describe, expect, it, vi } from "vitest";
import { ENTRY_FIELD_META, buildEntryDraft, parseMinorInput } from "../../src/state/entryDraft";
import { blockInvalidNumberKeys, sanitizeMoneyInput, sanitizeQuantityInput } from "../../src/core/engine/moneyInput";

const base = { id: (prefix: string) => `${prefix}-1`, today: "2026-10-20", date: "2026-10-20", title: "Lunch", amount: "123.45", currency: "PHP" as const, categoryId: "dining" };

describe("entry draft factory", () => {
  it("parses user money input exactly into safe minor units", () => {
    expect(parseMinorInput("123.45")).toBe(12345);
    expect(parseMinorInput("1.2")).toBe(120);
    expect(parseMinorInput("₱123.45")).toBe(12345);
    expect(parseMinorInput("1,234.50")).toBe(123450);
    expect(() => parseMinorInput("1.005")).toThrow();
    expect(() => parseMinorInput("90071992547409.92")).toThrow();
  });

  it("strictly sanitizes money and quantity inputs for price fields", () => {
    expect(sanitizeMoneyInput("abc12.345xyz")).toBe("12.34");
    expect(sanitizeMoneyInput("100..50.99")).toBe("100.50");
    expect(sanitizeMoneyInput("₱ 5,000.75")).toBe("5000.75");
    expect(sanitizeQuantityInput("12.3456")).toBe("12.345");

    const preventDefault = vi.fn();
    blockInvalidNumberKeys({ key: "e", currentTarget: { value: "12" }, preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);

    const preventDot = vi.fn();
    blockInvalidNumberKeys({ key: ".", currentTarget: { value: "12.5" }, preventDefault: preventDot });
    expect(preventDot).toHaveBeenCalledTimes(1);

    const allowDigit = vi.fn();
    blockInvalidNumberKeys({ key: "5", currentTarget: { value: "12" }, preventDefault: allowDigit });
    expect(allowDigit).not.toHaveBeenCalled();
  });

  it("builds signed expense, transfer, and anchored subscription records", () => {
    expect(buildEntryDraft({ ...base, mode: "EXPENSE", walletId: "w-1" })).toMatchObject({ kind: "EXPENSE", transaction: { amountMinor: -12345, categoryId: "dining", walletId: "w-1" } });
    expect(buildEntryDraft({
      ...base,
      mode: "TRANSFER",
      walletId: "w-mari",
      toWalletId: "w-gcash",
      feeMinor: 1000,
      channel: "INSTAPAY",
    })).toMatchObject({
      kind: "TRANSFER",
      transaction: {
        amountMinor: 12345,
        type: "TRANSFER",
        walletId: "w-mari",
        toWalletId: "w-gcash",
        feeMinor: 1000,
        channel: "INSTAPAY",
      },
    });
    expect(buildEntryDraft({ ...base, mode: "SUBSCRIPTION", cycle: "MONTHLY", autoLog: false, walletId: "w-2" })).toMatchObject({ kind: "SUBSCRIPTION", subscription: { amountMinor: 12345, nextBillingDate: base.date, billingAnchorDate: base.date, autoLog: false, walletId: "w-2" } });
  });

  it("calculates invoice totals and stable item references in the portable workflow", () => {
    const result = buildEntryDraft({ ...base, mode: "INVOICE", direction: "RECEIVABLE", dueDate: "2026-10-24", lines: [{ description: "Design", quantity: 2, unitPriceMinor: 5000 }], taxRateBps: 1200, discountMinor: 500 });
    expect(result).toMatchObject({ kind: "INVOICE", invoice: { subtotalMinor: 10000, taxMinor: 1140, discountMinor: 500, totalMinor: 10640, status: "PENDING" } });
    if (result.kind === "INVOICE") expect(result.items).toEqual([{ id: "item-1", invoiceId: "invoice-1", description: "Design", quantity: 2, unitPriceMinor: 5000 }]);
  });

  it("rejects malformed or inconsistent dates before persistence", () => {
    expect(() => buildEntryDraft({ ...base, mode: "INVOICE", direction: "RECEIVABLE", dueDate: "2026-02-30", lines: [{ description: "x", quantity: 1, unitPriceMinor: 10 }], taxRateBps: 0, discountMinor: 0 })).toThrow();
  });

  it("exposes ENTRY_FIELD_META for every entry kind, with aliases matching their base modes", () => {
    const eightModes = ["EXPENSE", "INCOME", "TRANSFER", "CASH_IN", "SUBSCRIPTION", "INVOICE", "LOAN", "INSTALLMENT"] as const;
    for (const mode of eightModes) {
      const meta = ENTRY_FIELD_META[mode];
      expect(meta.titleLabel).toBeTruthy();
      expect(meta.titlePlaceholder).toBeTruthy();
      expect(meta.dateLabel).toBeTruthy();
    }
    expect(ENTRY_FIELD_META.INCOMING_CASH).toEqual(ENTRY_FIELD_META.INCOME);
    expect(ENTRY_FIELD_META.EWALLET_CASH_IN).toEqual(ENTRY_FIELD_META.CASH_IN);
    expect(ENTRY_FIELD_META.EXPENSE.titleLabel).toBe("MERCHANT / NOTE");
    expect(ENTRY_FIELD_META.SUBSCRIPTION.dateLabel).toBe("NEXT BILLING DATE");
    expect(ENTRY_FIELD_META.INSTALLMENT.titlePlaceholder).toBe("e.g. Mechanical Keyboard (SPayLater 6m)");
  });

  it("preserves customLabels on transaction, transfer, subscription, obligation, and invoice drafts", () => {
    const labels = ["#TaxDeductible", "#ClientWork"];
    expect(buildEntryDraft({ ...base, mode: "EXPENSE", walletId: "w-1", customLabels: labels })).toMatchObject({ kind: "EXPENSE", transaction: { customLabels: labels } });
    expect(buildEntryDraft({ ...base, mode: "TRANSFER", walletId: "w-mari", toWalletId: "w-gcash", feeMinor: 0, customLabels: labels })).toMatchObject({ kind: "TRANSFER", transaction: { customLabels: labels } });
    expect(buildEntryDraft({ ...base, mode: "SUBSCRIPTION", cycle: "MONTHLY", autoLog: false, walletId: "w-2", customLabels: labels })).toMatchObject({ kind: "SUBSCRIPTION", subscription: { customLabels: labels } });
    expect(buildEntryDraft({ ...base, mode: "LOAN", amount: "100.00", paymentAmount: "50.00", walletId: "w-3", cycle: "MONTHLY", customLabels: labels })).toMatchObject({ kind: "INVOICE", invoice: { customLabels: labels } });
    expect(buildEntryDraft({ ...base, mode: "INSTALLMENT", amount: "100.00", paymentAmount: "50.00", walletId: "w-3", cycle: "MONTHLY", customLabels: labels })).toMatchObject({ kind: "INVOICE", invoice: { customLabels: labels } });
    expect(buildEntryDraft({ ...base, mode: "INVOICE", direction: "RECEIVABLE", dueDate: "2026-10-24", lines: [], amount: "10.00", taxRateBps: 0, discountMinor: 0, customLabels: labels }));
  });
});
