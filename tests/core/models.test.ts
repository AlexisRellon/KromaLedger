import { describe, expect, it } from "vitest";
import { formatCurrency, formatWalletLabel, transactionSchema } from "../../src/core/models";

describe("core models", () => {
  it("validates transactions in integer minor units", () => {
    expect(transactionSchema.safeParse({ id: "1", date: "2026-10-20", title: "Lunch", amountMinor: -1250, currency: "PHP", type: "EXPENSE" }).success).toBe(true);
    expect(transactionSchema.safeParse({ id: "1", date: "2026-10-20", title: "Lunch", amountMinor: -12.5, currency: "PHP", type: "EXPENSE" }).success).toBe(false);
  });
  it("formats PHP amounts with the peso sign by default", () => expect(formatCurrency(123456)).toContain("₱1,234.56"));

  it("formats wallet labels with institution and name with deduplication", () => {
    expect(formatWalletLabel({ name: "Checking", institution: "BDO" })).toBe("BDO · Checking");
    expect(formatWalletLabel({ name: "GCash", institution: "GCash" })).toBe("GCash");
    expect(formatWalletLabel({ name: "Physical Cash" })).toBe("Physical Cash");
    expect(formatWalletLabel({ name: "Vault", institution: "  " })).toBe("Vault");
  });
});
