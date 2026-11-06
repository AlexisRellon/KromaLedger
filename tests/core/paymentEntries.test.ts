import { describe, expect, it } from "vitest";
import { convenienceFeeMinor } from "../../src/core/engine/convenienceFee";
import { obligationDueDate, scheduledPaymentMinor } from "../../src/core/engine/obligationSchedule";
import { buildEntryDraft } from "../../src/state/entryDraft";

const base = { id: (prefix: string) => `${prefix}-1`, today: "2026-11-01", date: "2027-01-31", title: "Payment", amount: "100.01", walletId: "cash" };

describe("incoming, cash-in and obligation entry drafts", () => {
  it("credits incoming cash and requires a destination wallet", () => {
    expect(buildEntryDraft({ ...base, mode: "INCOME" })).toMatchObject({ transaction: { type: "INCOME", amountMinor: 10001, walletId: "cash" } });
    expect(() => buildEntryDraft({ ...base, mode: "INCOME", walletId: undefined })).toThrow(/wallet/);
  });

  it("rounds percentage fees once in minor units and accepts fixed or zero fees", () => {
    expect(convenienceFeeMinor(100000, "PERCENT", "1")).toBe(1000);
    expect(convenienceFeeMinor(50, "PERCENT", "1")).toBe(1);
    expect(convenienceFeeMinor(49, "PERCENT", "1")).toBe(0);
    expect(convenienceFeeMinor(12345, "PERCENT", "1.25")).toBe(154);
    expect(convenienceFeeMinor(100000, "FIXED", "12.50")).toBe(1250);
    expect(convenienceFeeMinor(100000, "FIXED", "0.00")).toBe(0);
    expect(convenienceFeeMinor(100000, "PERCENT", "")).toBe(0);
    expect(convenienceFeeMinor(Number.MAX_SAFE_INTEGER - 100, "FIXED", "1")).toBe(100);
    expect(() => convenienceFeeMinor(Number.MAX_SAFE_INTEGER, "PERCENT", "1")).toThrow(/large/);
    expect(() => convenienceFeeMinor(100, "PERCENT", "1.001")).toThrow();
    expect(() => convenienceFeeMinor(100, "FIXED", "-1")).toThrow();
  });

  it("keeps cash-in principal, provider, percentage and wallet route explicit", () => {
    const result = buildEntryDraft({ ...base, mode: "CASH_IN", amount: "1000", toWalletId: "gcash", provider: "7-Eleven", feeMode: "PERCENT", feeValue: "1" });
    expect(result).toMatchObject({ kind: "TRANSFER", transaction: { type: "TRANSFER", amountMinor: 100000, feeMinor: 1000, cashInFeeBps: 100, cashIn: true, cashInProvider: "7-Eleven", walletId: "cash", toWalletId: "gcash" } });
    expect(() => buildEntryDraft({ ...base, mode: "CASH_IN", toWalletId: "cash", provider: "", feeMode: "FIXED", feeValue: "0" })).toThrow(/different/);
  });

  it.each(["LOAN", "INSTALLMENT"] as const)("builds a %s obligation with an anchored schedule and a final remainder", (mode) => {
    const draft = buildEntryDraft({ ...base, mode, paymentAmount: "33.34", cycle: "MONTHLY" });
    expect(draft).toMatchObject({ kind: "INVOICE", invoice: { direction: "PAYABLE", totalMinor: 10001, paidMinor: 0, dueDate: "2027-01-31", obligation: { kind: mode, paymentMinor: 3334, firstDueDate: "2027-01-31", walletId: "cash" } } });
    if (draft.kind !== "INVOICE") throw new Error("Expected obligation");
    expect(obligationDueDate(draft.invoice, 3334)).toBe("2027-02-28");
    expect(obligationDueDate(draft.invoice, 6668)).toBe("2027-03-31");
    expect(scheduledPaymentMinor({ ...draft.invoice, paidMinor: 1667 })).toBe(1667);
    expect(scheduledPaymentMinor({ ...draft.invoice, paidMinor: 6668 })).toBe(3333);
    expect(() => buildEntryDraft({ ...base, mode, paymentAmount: "101", cycle: "MONTHLY" })).toThrow(/exceed/);
  });
});
