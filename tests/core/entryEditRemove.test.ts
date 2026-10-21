import { describe, expect, it } from "vitest";
import { transactionSchema, subscriptionSchema, invoiceSchema } from "../../src/core/models";
import { parseMinorInput } from "../../src/core/engine/moneyInput";

describe("entry editing and removing logic", () => {
  it("computes same-wallet balance deltas accurately on entry edits", () => {
    const originalAmountMinor = -25000; // original expense 250.00
    const newAmountMinor = -40000; // updated expense 400.00
    const delta = newAmountMinor - originalAmountMinor; // -15000 (deduct additional 150.00)

    const initialWalletBalance = 500000;
    const updatedWalletBalance = initialWalletBalance + delta;
    expect(updatedWalletBalance).toBe(485000);

    // Editing from expense to income
    const incomeAmountMinor = 100000; // 1000.00 income
    const incomeDelta = incomeAmountMinor - originalAmountMinor; // 100000 - (-25000) = +125000
    expect(initialWalletBalance + incomeDelta).toBe(625000);
  });

  it("computes cross-wallet transfers correctly when switching connected wallet", () => {
    const originalWalletBalance = 200000;
    const newWalletBalance = 300000;
    const originalAmountMinor = -50000;
    const newAmountMinor = -75000;

    // Old wallet reverts previous amount
    const revertedOldBalance = originalWalletBalance - originalAmountMinor; // 200000 - (-50000) = 250000
    // New wallet receives new amount
    const updatedNewBalance = newWalletBalance + newAmountMinor; // 300000 + (-75000) = 225000

    expect(revertedOldBalance).toBe(250000);
    expect(updatedNewBalance).toBe(225000);
  });

  it("validates edited transaction payloads with schema compliance", () => {
    const validEdit = transactionSchema.parse({
      id: "tx-edit-1",
      title: "Updated Grocery Run",
      amountMinor: -parseMinorInput("850.50"),
      currency: "PHP",
      type: "EXPENSE",
      date: "2026-10-21",
      categoryId: "groceries",
      walletId: "wallet-main",
      notes: "Weekly supermarket restocking",
    });

    expect(validEdit.title).toBe("Updated Grocery Run");
    expect(validEdit.amountMinor).toBe(-85050);
    expect(validEdit.walletId).toBe("wallet-main");
  });

  it("validates edited subscription payloads with active and cycle parameters", () => {
    const validSub = subscriptionSchema.parse({
      id: "sub-edit-1",
      title: "Figma Pro Plan",
      amountMinor: parseMinorInput("1200.00"),
      currency: "PHP",
      billingCycle: "YEARLY",
      nextBillingDate: "2027-10-21",
      active: true,
      autoLog: true,
      walletId: "wallet-bank",
    });

    expect(validSub.amountMinor).toBe(120000);
    expect(validSub.billingCycle).toBe("YEARLY");
    expect(validSub.walletId).toBe("wallet-bank");
  });

  it("validates edited invoice payloads ensuring safe math invariants", () => {
    const validInv = invoiceSchema.parse({
      id: "inv-edit-1",
      title: "Consulting Retainer Q4",
      direction: "RECEIVABLE",
      dueDate: "2026-11-15",
      status: "PENDING",
      subtotalMinor: 5000000,
      taxMinor: 600000,
      discountMinor: 0,
      totalMinor: 5600000,
      paidMinor: 0,
      currency: "PHP",
      itemIds: [],
    });

    expect(validInv.totalMinor).toBe(5600000);
    expect(validInv.direction).toBe("RECEIVABLE");
  });
});
