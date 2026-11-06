import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { exportVault, restoreVault } from "../../src/adapters/backup/zipVault";
import { buildEntryDraft } from "../../src/state/entryDraft";
import { buildInvoicePayment } from "../../src/core/engine/pendingAnalytics";
import { scheduledPaymentMinor } from "../../src/core/engine/obligationSchedule";
import type { Invoice, Transaction, Wallet } from "../../src/core/models";

let db: KromaLedgerDB;
let repo: DexieStorageRepo;
const base = { id: (prefix: string) => `${prefix}-1`, today: "2026-11-01", date: "2027-01-31", title: "Payment", amount: "100.01", walletId: "cash" };
const wallet = (id: string, type: Wallet["type"], balanceMinor = 200000): Wallet => ({ id, type, balanceMinor, currency: "PHP", name: id, color: "#fff", isDefault: false });
const cashIn = (overrides: Partial<Transaction> = {}): Transaction => ({ id: "cash-in", date: base.date, title: "7-Eleven cash-in", amountMinor: 100000, currency: "PHP", type: "TRANSFER", walletId: "cash", toWalletId: "gcash", feeMinor: 1000, cashIn: true, cashInProvider: "7-Eleven", cashInFeeBps: 100, ...overrides });

async function createObligation(): Promise<Invoice> {
  const draft = buildEntryDraft({ ...base, mode: "INSTALLMENT", paymentAmount: "33.34", cycle: "MONTHLY" });
  if (draft.kind !== "INVOICE") throw new Error("Expected invoice");
  await repo.saveInvoiceWithItems(draft.invoice, draft.items);
  return draft.invoice;
}

beforeEach(async () => {
  db = new KromaLedgerDB();
  await db.delete();
  db = new KromaLedgerDB();
  repo = new DexieStorageRepo(db);
  await repo.saveWallet(wallet("cash", "CASH"));
  await repo.saveWallet(wallet("gcash", "E_WALLET", 5000));
});
afterEach(() => db.close());

describe("payment workflows persist atomically", () => {
  it("persists a custom expense label and links it to an expense", async () => {
    const label = { id: "custom-pet-care", name: "Pet care", type: "EXPENSE" as const };
    await repo.saveCategory(label);
    const draft = buildEntryDraft({ ...base, mode: "EXPENSE", amount: "12.50", categoryId: label.id });
    if (!("transaction" in draft)) throw new Error("Expected expense");
    await repo.saveTransaction(draft.transaction);
    expect(await repo.listCategories()).toContainEqual(label);
    expect(await repo.getTransaction(draft.transaction.id)).toMatchObject({ categoryId: label.id, amountMinor: -1250 });
  });

  it("credits incoming cash, and editing or deleting reverses its wallet impact", async () => {
    const draft = buildEntryDraft({ ...base, mode: "INCOME" });
    if (!("transaction" in draft)) throw new Error("Expected transaction");
    await repo.saveTransaction(draft.transaction);
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(210001);
    await repo.saveTransaction({ ...draft.transaction, amountMinor: 5000 });
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(205000);
    await repo.deleteTransaction(draft.transaction.id);
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(200000);
  });

  it("debits cash principal plus fee and credits only the e-wallet principal, including edit/delete", async () => {
    await repo.saveTransaction(cashIn());
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(99000);
    expect((await repo.getWallet("gcash"))?.balanceMinor).toBe(105000);
    await repo.saveTransaction(cashIn({ amountMinor: 50000, feeMinor: 250, cashInFeeBps: undefined }));
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(149750);
    expect((await repo.getWallet("gcash"))?.balanceMinor).toBe(55000);
    await repo.deleteTransaction("cash-in");
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(200000);
    expect((await repo.getWallet("gcash"))?.balanceMinor).toBe(5000);
  });

  it("rejects unfunded, invalid-route or cross-currency cash-ins without partial writes", async () => {
    await expect(repo.saveTransaction(cashIn({ amountMinor: 200000 }))).rejects.toThrow(/Insufficient/);
    await expect(repo.saveTransaction(cashIn({ walletId: "gcash", toWalletId: "cash" }))).rejects.toThrow(/cash source/);
    await expect(repo.saveTransaction(cashIn({ currency: "USD" }))).rejects.toThrow(/currency/);
    expect(await repo.listTransactions()).toEqual([]);
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(200000);
    expect((await repo.getWallet("gcash"))?.balanceMinor).toBe(5000);
  });

  it("charges an automatic subscription once under concurrent clicks and keeps its month-end anchor", async () => {
    await repo.saveSubscription({ id: "sub", title: "Cloud", amountMinor: 1000, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: "2027-01-31", active: true, autoLog: true, walletId: "cash" });
    const payment: Transaction = { id: "sub:sub:2027-01-31", date: "2027-01-31", title: "Cloud", amountMinor: -1000, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", subscriptionId: "sub", walletId: "cash" };
    const results = await Promise.allSettled([repo.confirmSubscriptionPayment(payment), repo.confirmSubscriptionPayment(payment)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await repo.listTransactions()).toHaveLength(1);
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(199000);
    expect(await repo.getSubscription("sub")).toMatchObject({ nextBillingDate: "2027-02-28", billingAnchorDate: "2027-01-31", autoLog: true });
    await repo.reconcile("2027-01-31");
    expect(await repo.listTransactions()).toHaveLength(1);
  });

  it("records partial scheduled payments, advances completed cycles, caps the last payment and rejects duplicate submissions", async () => {
    let invoice = await createObligation();
    const first = buildInvoicePayment(invoice, "16.67", "2027-01-31", "pay-1", "cash");
    invoice = await repo.recordInvoicePayment(invoice.id, first);
    expect(invoice.dueDate).toBe("2027-01-31");
    expect(scheduledPaymentMinor(invoice)).toBe(1667);
    await expect(repo.saveInvoiceWithItems({ ...invoice, paidMinor: 0 }, [])).rejects.toThrow(/reopen/);
    await expect(repo.recordInvoicePayment(invoice.id, first)).rejects.toThrow();
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(198333);
    invoice = await repo.recordInvoicePayment(invoice.id, buildInvoicePayment(invoice, "16.67", "2027-01-31", "pay-2", "cash"));
    expect(invoice.dueDate).toBe("2027-02-28");
    invoice = await repo.recordInvoicePayment(invoice.id, buildInvoicePayment(invoice, "33.34", "2027-02-28", "pay-3", "cash"));
    expect(invoice.dueDate).toBe("2027-03-31");
    expect(scheduledPaymentMinor(invoice)).toBe(3333);
    await expect(repo.recordInvoicePayment(invoice.id, { ...first, id: "overpay", amountMinor: -3334 })).rejects.toThrow(/exceed/);
    invoice = await repo.recordInvoicePayment(invoice.id, buildInvoicePayment(invoice, "33.33", "2027-03-31", "pay-4", "cash"));
    expect(invoice).toMatchObject({ status: "PAID", paidMinor: 10001 });
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(189999);
  });

  it("reverses repayment schedules on edit/delete and clears deleted repayment wallet references", async () => {
    const invoice = await createObligation();
    const payment = buildInvoicePayment(invoice, "33.34", base.date, "pay-1", "cash");
    await repo.recordInvoicePayment(invoice.id, payment);
    await repo.saveTransaction({ ...payment, amountMinor: -1667 });
    expect(await repo.getInvoice(invoice.id)).toMatchObject({ paidMinor: 1667, dueDate: "2027-01-31" });
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(198333);
    await repo.deleteTransaction(payment.id);
    expect(await repo.getInvoice(invoice.id)).toMatchObject({ paidMinor: 0, dueDate: "2027-01-31" });
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(200000);
    await repo.deleteWallet("cash");
    expect((await repo.getInvoice(invoice.id))?.obligation?.walletId).toBeUndefined();
  });

  it("round-trips optional cash-in and obligation metadata through vault export/import", async () => {
    const invoice = await createObligation();
    await repo.saveTransaction(cashIn());
    const vault = await exportVault(db, "2026-11-01");
    await restoreVault(db, vault.data);
    expect(await repo.getInvoice(invoice.id)).toEqual(invoice);
    expect(await repo.getTransaction("cash-in")).toEqual(cashIn());
    expect((await repo.getWallet("cash"))?.balanceMinor).toBe(99000);
  });
});
