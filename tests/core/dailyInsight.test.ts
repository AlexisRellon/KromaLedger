import { describe, expect, it } from "vitest";
import { buildDailyInsight } from "../../src/core/engine/dailyInsight";
import { invoiceSchema, transactionSchema, walletSchema } from "../../src/core/models";
import { useAIStore } from "../../src/state/useAIStore";

const wallet = walletSchema.parse({ id: "w", name: "Cash", currency: "PHP", balanceMinor: 10000 });
const invoice = invoiceSchema.parse({ id: "i", title: "Bill", direction: "PAYABLE", dueDate: "2026-11-03", status: "PENDING", subtotalMinor: 15000, taxMinor: 0, discountMinor: 0, totalMinor: 15000, paidMinor: 0, currency: "PHP", itemIds: [] });
const base = { today: "2026-11-06", currency: "PHP", name: "Mia", wallets: [wallet], invoices: [invoice], subscriptions: [], transactions: [] };

describe("daily insight", () => {
  it("prioritizes a shortfall and includes it in the prefilled question", () => {
    const insight = buildDailyInsight(base);
    expect(insight.message).toContain("Mia, your recorded balance is ₱50.00 short");
    expect(insight.question).toContain(insight.message);
  });

  it("reports overdue bills before fees when there is no shortfall", () => {
    const fee = transactionSchema.parse({ id: "t", date: "2026-11-01", title: "Transfer", amountMinor: 100, currency: "PHP", type: "TRANSFER", feeMinor: 1500 });
    const insight = buildDailyInsight({ ...base, wallets: [{ ...wallet, balanceMinor: 20000 }], transactions: [fee] });
    expect(insight.message).toContain("₱150.00 in overdue payments");
  });

  it("uses current-month fees and ignores other currencies and future transactions", () => {
    const fee = transactionSchema.parse({ id: "t", date: "2026-11-01", title: "Transfer", amountMinor: 100, currency: "PHP", type: "TRANSFER", feeMinor: 1500 });
    const insight = buildDailyInsight({ ...base, invoices: [{ ...invoice, currency: "USD" }], transactions: [fee, { ...fee, id: "future", date: "2026-11-07", feeMinor: 5000 }] });
    expect(insight.message).toContain("₱15.00 in transfer and cash-in fees");
  });

  it("welcomes users without financial data", () => {
    expect(buildDailyInsight({ ...base, name: "", wallets: [], invoices: [] }).message).toContain("Add a wallet");
  });

  it("opens a prefilled question without sending it and clears it on close", () => {
    const question = buildDailyInsight(base).question;
    const previousId = useAIStore.getState().createNewThread("Previous conversation");
    useAIStore.getState().setMessages([{ id: "old", role: "user", content: "Previous question", timestamp: new Date().toISOString() }]);
    useAIStore.getState().openWithQuestion(question);
    expect(useAIStore.getState().isOpen).toBe(true);
    expect(useAIStore.getState().activeThreadId).not.toBe(previousId);
    expect(useAIStore.getState().threads.some((thread) => thread.id === previousId)).toBe(true);
    expect(useAIStore.getState().messages).toEqual([]);
    expect(useAIStore.getState().initialQuestion).toBe(question);
    expect(useAIStore.getState().isLoading).toBe(false);
    useAIStore.getState().closeModal();
    expect(useAIStore.getState().initialQuestion).toBe("");
  });
});
