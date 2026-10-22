import { describe, expect, it } from "vitest";
import { invoiceSchema, transactionSchema, type Invoice, type InvoiceItem, type Subscription, type Transaction, type Wallet } from "../../src/core/models";
import { commitInvoice, confirmSubscriptionCycle, detachSubscriptionHistory, detachWalletReferences, settleInvoice, type LedgerCommandGateway, type LedgerCommandUnit } from "../../src/core/engine/ledgerCommands";

const invoice = (overrides: Partial<Invoice> = {}): Invoice => invoiceSchema.parse({
  id: "inv", title: "Invoice", direction: "RECEIVABLE", dueDate: "2026-10-20", status: "PENDING",
  subtotalMinor: 1000, taxMinor: 0, discountMinor: 0, totalMinor: 1000, paidMinor: 0,
  currency: "PHP", itemIds: [], ...overrides,
});
const payment = (amountMinor = 400): Transaction => transactionSchema.parse({
  id: "pay", date: "2026-10-20", title: "Payment", amountMinor, currency: "PHP",
  type: "INCOME", invoiceId: "inv",
});
const item = (id: string): InvoiceItem => ({ id, invoiceId: "inv", description: id, quantity: 1, unitPriceMinor: 1000 });

function memoryGateway(initial: Invoice) {
  const state = {
    invoice: initial,
    items: [] as InvoiceItem[],
    payments: [] as Transaction[],
    subscription: undefined as Subscription | undefined,
    wallets: [] as Wallet[],
  };
  const gateway: LedgerCommandGateway = {
    async atomic(_scope, work) {
      const unit: LedgerCommandUnit = {
        getInvoice: async () => state.invoice,
        getSubscription: async () => state.subscription,
        putSubscription: async (value) => { state.subscription = value; },
        putInvoice: async (value) => { state.invoice = value; },
        replaceInvoiceItems: async (_id, values) => { state.items = values; },
        addTransaction: async (value) => { state.payments.push(value); },
        getWallet: async (id) => state.wallets.find((w) => w.id === id),
      };
      return work(unit);
    },
  };
  return { gateway, state };
}

describe("portable atomic invoice commands", () => {
  it("commits invoice and line items as one validated operation", async () => {
    const { gateway, state } = memoryGateway(invoice());
    await commitInvoice(gateway, invoice({ itemIds: ["a"] }), [item("a")]);
    expect(state.items.map((row) => row.id)).toEqual(["a"]);
    expect(state.invoice.itemIds).toEqual(["a"]);
  });

  it("rejects inconsistent item refs before touching the unit", async () => {
    const { gateway, state } = memoryGateway(invoice());
    await expect(commitInvoice(gateway, invoice({ itemIds: ["missing"] }), [item("a")])).rejects.toThrow(/references/);
    expect(state.items).toEqual([]);
  });

  it("settles partial and full invoices atomically with status transitions", async () => {
    const { gateway, state } = memoryGateway(invoice());
    const partial = await settleInvoice(gateway, "inv", payment(400));
    expect(partial.status).toBe("PARTIAL");
    expect(partial.paidMinor).toBe(400);
    const paid = await settleInvoice(gateway, "inv", payment(600));
    expect(paid.status).toBe("PAID");
    expect(state.payments).toHaveLength(2);
  });

  it("confirms one deterministic manual subscription cycle and advances its date", async () => {
    const { gateway, state } = memoryGateway(invoice());
    state.wallets = [{ id: "wallet-1", name: "Wallet", type: "BANK", currency: "PHP", balanceMinor: 50000, color: "#fff", isDefault: true }];
    state.subscription = { id: "weekly", title: "Cloud", amountMinor: 1000, currency: "PHP", billingCycle: "WEEKLY", nextBillingDate: "2026-10-19", active: true, autoLog: false, walletId: "wallet-1" };
    const row: Transaction = { id: "sub:weekly:2026-10-19", date: "2026-10-19", title: "Cloud", amountMinor: -1000, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", subscriptionId: "weekly", walletId: "wallet-1" };
    const next = await confirmSubscriptionCycle(gateway, row);
    expect(next.nextBillingDate).toBe("2026-10-26");
    expect(next.autoLog).toBe(false);
    expect(state.payments).toEqual([row]);
    await expect(confirmSubscriptionCycle(gateway, row)).rejects.toThrow();
    expect(state.payments).toHaveLength(1);
  });

  it("rejects manual subscription confirmation when wallet has insufficient balance", async () => {
    const { gateway, state } = memoryGateway(invoice());
    state.wallets = [{ id: "wallet-low", name: "Low", type: "BANK", currency: "PHP", balanceMinor: 500, color: "#fff", isDefault: true }];
    state.subscription = { id: "weekly", title: "Cloud", amountMinor: 1000, currency: "PHP", billingCycle: "WEEKLY", nextBillingDate: "2026-10-19", active: true, autoLog: false, walletId: "wallet-low" };
    const row: Transaction = { id: "sub:weekly:2026-10-19", date: "2026-10-19", title: "Cloud", amountMinor: -1000, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", subscriptionId: "weekly", walletId: "wallet-low" };
    await expect(confirmSubscriptionCycle(gateway, row)).rejects.toThrow(/Insufficient balance/);
  });

  it("rejects manual subscription confirmation when subscription has no linked wallet", async () => {
    const { gateway, state } = memoryGateway(invoice());
    state.subscription = { id: "weekly", title: "Cloud", amountMinor: 1000, currency: "PHP", billingCycle: "WEEKLY", nextBillingDate: "2026-10-19", active: true, autoLog: false };
    const row: Transaction = { id: "sub:weekly:2026-10-19", date: "2026-10-19", title: "Cloud", amountMinor: -1000, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", subscriptionId: "weekly" };
    await expect(confirmSubscriptionCycle(gateway, row)).rejects.toThrow(/requires a linked wallet/);
  });

  it("detaches historical subscription payments while retaining ledger rows", () => {
    const historical = { ...payment(100), subscriptionId: "sub-a", type: "SUBSCRIPTION_PAYMENT" as const };
    const detached = detachSubscriptionHistory([historical], "sub-a");
    expect(detached).toEqual([expect.objectContaining({ id: "pay", amountMinor: 100, subscriptionId: undefined })]);
    expect(detachSubscriptionHistory([historical], "sub-other")).toEqual([historical]);
  });

  it("clears deleted wallet references from subscriptions and ledger entries", () => {
    const subscription = { id: "sub-a", title: "Plan", amountMinor: 100, currency: "PHP" as const, billingCycle: "MONTHLY" as const, nextBillingDate: "2026-10-20", active: true, autoLog: false, walletId: "wallet-a" };
    const transaction = { ...payment(100), walletId: "wallet-a" };
    expect(detachWalletReferences([transaction], [subscription], "wallet-a")).toEqual({
      transactions: [expect.objectContaining({ id: "pay", walletId: undefined })],
      subscriptions: [expect.objectContaining({ id: "sub-a", walletId: undefined })],
    });
  });

  it("rejects cross-currency settlement before writing", async () => {
    const { gateway, state } = memoryGateway(invoice());
    await expect(settleInvoice(gateway, "inv", { ...payment(100), currency: "USD" })).rejects.toThrow();
    expect(state.payments).toEqual([]);
  });

  it("does not record overpayment", async () => {
    const { gateway, state } = memoryGateway(invoice());
    await expect(settleInvoice(gateway, "inv", payment(1001))).rejects.toThrow();
    expect(state.payments).toEqual([]);
  });
});
