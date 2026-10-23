import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { exportVault, restoreVault } from "../../src/adapters/backup/zipVault";
import type { Invoice, InvoiceItem, Subscription, Transaction } from "../../src/core/models";

let db: KromaLedgerDB;
let repo: DexieStorageRepo;
let files: DexieFileStore;
const tx = (overrides: Partial<Transaction> = {}): Transaction => ({ id: "tx", date: "2026-10-20", title: "Lunch", amountMinor: -1250, currency: "PHP", type: "EXPENSE", ...overrides });
const sub = (overrides: Partial<Subscription> = {}): Subscription => ({ id: "sub", title: "Netflix", amountMinor: 54900, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: "2026-10-20", active: true, autoLog: false, ...overrides });
const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({ id: "inv", title: "Invoice #104", direction: "RECEIVABLE", dueDate: "2026-10-24", status: "PENDING", subtotalMinor: 10000, taxMinor: 0, discountMinor: 0, totalMinor: 10000, paidMinor: 0, currency: "PHP", itemIds: [], ...overrides });
const item = (id = "line"): InvoiceItem => ({ id, invoiceId: "inv", description: "Design work", quantity: 1, unitPriceMinor: 10000 });

beforeEach(async () => {
  db = new KromaLedgerDB();
  await db.delete();
  db = new KromaLedgerDB();
  repo = new DexieStorageRepo(db);
  files = new DexieFileStore(db);
});
afterEach(() => db.close());

describe("Dexie local vault", () => {
  it("seeds once and exposes dated ledger queries", async () => {
    await repo.initialize("2026-10-20");
    const initial = await repo.listTransactions();
    expect(initial.some((row) => row.title === "GitHub Copilot Pro" && row.amountMinor === -56000)).toBe(true);
    expect(initial.some((row) => row.title === "Client UI Milestone" && row.amountMinor === 1800000)).toBe(true);
    expect(initial.some((row) => row.title === "GrabCar Commute" && row.amountMinor === -24500)).toBe(true);
    expect(await repo.listTransactions("2026-10-01", "2026-10-31")).toHaveLength(initial.length);
    await repo.initialize("2026-10-20");
    expect(await repo.listTransactions()).toHaveLength(initial.length);
    expect(await repo.countTransactions()).toBe(initial.length);
    expect((await repo.getAppMeta()).seedVersion).toBeGreaterThan(0);
  });

  it("supports transaction, category and app metadata CRUD", async () => {
    await repo.initialize("2026-10-20");
    await repo.saveTransaction(tx());
    expect(await repo.getTransaction("tx")).toMatchObject({ id: "tx" });
    expect(await repo.listTransactions("2026-10-20", "2026-10-20")).toContainEqual(expect.objectContaining({ id: "tx" }));
    await repo.deleteTransaction("tx");
    expect(await repo.getTransaction("tx")).toBeUndefined();
    const category = { id: "cat", name: "Dining", color: "#D9F938", type: "EXPENSE" as const };
    await repo.saveCategory(category);
    expect(await repo.listCategories()).toContainEqual(category);
    await repo.deleteCategory("cat");
    expect(await repo.listCategories()).not.toContainEqual(category);
    await repo.saveAppMeta({ id: "app", seedVersion: 3, currency: "PHP", lastReconciledDate: "2026-10-20" });
    expect(await repo.getAppMeta()).toMatchObject({ seedVersion: 3 });
  });

  it("supports local profile and wallet management CRUD", async () => {
    await repo.initialize("2026-10-20");
    const profile = await repo.getProfile();
    expect(profile.name).toBe("Operator");
    await repo.saveProfile({ ...profile, name: "Satoshi Operator", initials: "SO", defaultCurrency: "USD" });
    expect(await repo.getProfile()).toMatchObject({ name: "Satoshi Operator", initials: "SO", defaultCurrency: "USD" });

    const initialWallets = await repo.listWallets();
    expect(initialWallets.length).toBeGreaterThan(0);
    const newWallet = {
      id: "w-crypto",
      name: "Cold Vault",
      type: "CRYPTO" as const,
      currency: "PHP",
      balanceMinor: 5000000,
      color: "#D9F938",
      isDefault: true,
    };
    await repo.saveWallet(newWallet);
    expect(await repo.getWallet("w-crypto")).toMatchObject({ name: "Cold Vault", isDefault: true });
    // Verify previous default is no longer default
    const walletsAfter = await repo.listWallets();
    const otherDefaults = walletsAfter.filter((w) => w.id !== "w-crypto" && w.isDefault);
    expect(otherDefaults).toHaveLength(0);

    // Link transaction to wallet and test auto calculation/sync of balance
    const walletBefore = await repo.getWallet("w-crypto");
    const balBefore = walletBefore!.balanceMinor; // 5000000
    await repo.saveTransaction(tx({ id: "tx-w", walletId: "w-crypto", amountMinor: -25000 }));
    const walletAfterExpense = await repo.getWallet("w-crypto");
    expect(walletAfterExpense?.balanceMinor).toBe(balBefore - 25000);

    // Edit transaction amount on same wallet: automatically syncs balance delta
    await repo.saveTransaction(tx({ id: "tx-w", walletId: "w-crypto", amountMinor: -40000 }));
    const walletAfterEditAmount = await repo.getWallet("w-crypto");
    expect(walletAfterEditAmount?.balanceMinor).toBe(balBefore - 40000);

    // Edit transaction to switch to a different wallet: reverts old wallet, updates new wallet
    const secondWallet = {
      id: "w-bank",
      name: "Bank Vault",
      type: "BANK" as const,
      currency: "PHP",
      balanceMinor: 1000000,
      color: "#64748B",
      isDefault: false,
    };
    await repo.saveWallet(secondWallet);
    await repo.saveTransaction(tx({ id: "tx-w", walletId: "w-bank", amountMinor: -30000 }));
    const cryptoAfterSwitch = await repo.getWallet("w-crypto");
    const bankAfterSwitch = await repo.getWallet("w-bank");
    expect(cryptoAfterSwitch?.balanceMinor).toBe(balBefore); // fully reverted
    expect(bankAfterSwitch?.balanceMinor).toBe(1000000 - 30000); // applied to new wallet

    // Edit transaction to disconnect wallet: reverts previous wallet
    await repo.saveTransaction(tx({ id: "tx-w", walletId: undefined, amountMinor: -30000 }));
    const bankAfterDisconnect = await repo.getWallet("w-bank");
    expect(bankAfterDisconnect?.balanceMinor).toBe(1000000);

    // Re-link to crypto wallet
    await repo.saveTransaction(tx({ id: "tx-w", walletId: "w-crypto", amountMinor: -25000 }));
    expect((await repo.getWallet("w-crypto"))?.balanceMinor).toBe(balBefore - 25000);

    // Delete transaction reverts balance
    await repo.deleteTransaction("tx-w");
    const walletAfterRevert = await repo.getWallet("w-crypto");
    expect(walletAfterRevert?.balanceMinor).toBe(balBefore);

    // Bank Transfer (e.g. MariBank -> GCash with fee)
    const mariWallet = { id: "w-mari", name: "MariBank", type: "BANK" as const, currency: "PHP", balanceMinor: 1000000, color: "#10B981", isDefault: false };
    const gcashWallet = { id: "w-gcash", name: "GCash", type: "E_WALLET" as const, currency: "PHP", balanceMinor: 50000, color: "#007DFE", isDefault: false };
    await repo.saveWallet(mariWallet);
    await repo.saveWallet(gcashWallet);

    const xferTx: Transaction = {
      id: "tx-xfer-1",
      date: "2026-10-20",
      title: "Transfer MariBank to GCash",
      amountMinor: 200000, // ₱2,000.00
      currency: "PHP",
      type: "TRANSFER",
      walletId: "w-mari",
      toWalletId: "w-gcash",
      feeMinor: 1000, // ₱10.00 fee
      channel: "INSTAPAY",
    };
    await repo.saveTransaction(xferTx);

    expect((await repo.getWallet("w-mari"))?.balanceMinor).toBe(1000000 - 201000); // 799,000
    expect((await repo.getWallet("w-gcash"))?.balanceMinor).toBe(50000 + 200000);   // 250,000

    // Edit transfer amount to ₱3,000.00 with ₱0 fee
    await repo.saveTransaction({ ...xferTx, amountMinor: 300000, feeMinor: 0 });
    expect((await repo.getWallet("w-mari"))?.balanceMinor).toBe(1000000 - 300000); // 700,000
    expect((await repo.getWallet("w-gcash"))?.balanceMinor).toBe(50000 + 300000);   // 350,000

    // Delete transfer reverts both wallets
    await repo.deleteTransaction("tx-xfer-1");
    expect((await repo.getWallet("w-mari"))?.balanceMinor).toBe(1000000);
    expect((await repo.getWallet("w-gcash"))?.balanceMinor).toBe(50000);

    // Re-link transaction and delete wallet
    await repo.saveTransaction(tx({ id: "tx-w", walletId: "w-crypto" }));
    expect((await repo.getTransaction("tx-w"))?.walletId).toBe("w-crypto");
    await repo.deleteWallet("w-crypto");
    expect(await repo.getWallet("w-crypto")).toBeUndefined();
    expect((await repo.getTransaction("tx-w"))?.walletId).toBeUndefined();

    // Verify invoice payment edit/delete updates connected wallet AND invoice state
    const testWallet = { id: "w-inv", name: "Invoice Wallet", type: "BANK" as const, currency: "PHP", balanceMinor: 500000, color: "#D9F938", isDefault: false };
    await repo.saveWallet(testWallet);
    const invoice = {
      id: "inv-test",
      title: "Design Services",
      direction: "RECEIVABLE" as const,
      dueDate: "2026-11-01",
      status: "PENDING" as const,
      subtotalMinor: 100000,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 100000,
      paidMinor: 0,
      currency: "PHP",
      itemIds: [],
    };
    await repo.saveInvoice(invoice);

    // Record payment into wallet
    const payment = tx({ id: "pay-1", invoiceId: "inv-test", walletId: "w-inv", amountMinor: 50000, type: "INCOME" as const });
    await repo.saveTransaction(payment);
    expect((await repo.getWallet("w-inv"))?.balanceMinor).toBe(550000);
    expect((await repo.getInvoice("inv-test"))?.paidMinor).toBe(50000);
    expect((await repo.getInvoice("inv-test"))?.status).toBe("PARTIAL");

    // Edit payment amount: wallet balance and invoice adjust synchronously
    await repo.saveTransaction({ ...payment, amountMinor: 80000 });
    expect((await repo.getWallet("w-inv"))?.balanceMinor).toBe(580000);
    expect((await repo.getInvoice("inv-test"))?.paidMinor).toBe(80000);

    // Delete payment reverts wallet balance and invoice status
    await repo.deleteTransaction("pay-1");
    expect((await repo.getWallet("w-inv"))?.balanceMinor).toBe(500000);
    expect((await repo.getInvoice("inv-test"))?.paidMinor).toBe(0);
    expect((await repo.getInvoice("inv-test"))?.status).toBe("PENDING");
  });

  it("wipes all data in danger zone and resets to demo seed", async () => {
    await repo.initialize("2026-10-20");
    expect((await repo.listTransactions()).length).toBeGreaterThan(0);
    expect((await repo.listWallets()).length).toBeGreaterThan(0);

    await repo.clearAllData();
    expect(await repo.listTransactions()).toHaveLength(0);
    expect(await repo.listSubscriptions()).toHaveLength(0);
    expect(await repo.listInvoices()).toHaveLength(0);
    expect(await repo.listWallets()).toHaveLength(0);
    expect((await repo.getProfile()).name).toBe("Anonymous Operator");

    await repo.resetToDemo("2026-10-20");
    expect((await repo.listTransactions()).length).toBeGreaterThan(0);
    expect((await repo.listWallets()).length).toBeGreaterThan(0);
    expect((await repo.getProfile()).name).toBe("Operator");
  });

  it("writes invoices with lines atomically and records partial, full, and invalid payments", async () => {
    await repo.initialize("2026-10-20");
    const firstLine = item();
    await repo.saveInvoiceWithItems(invoice({ itemIds: [firstLine.id] }), [firstLine]);
    expect(await repo.getInvoice("inv")).toMatchObject({ id: "inv" });
    expect(await repo.listInvoices()).toContainEqual(expect.objectContaining({ id: "inv" }));
    expect(await repo.listInvoiceItems("inv")).toEqual([firstLine]);
    await expect(repo.saveInvoiceWithItems(invoice({ id: "bad", itemIds: ["missing"] }), [])).rejects.toThrow();
    expect(await repo.getInvoice("bad")).toBeUndefined();
    const cashBefore = (await repo.getWallet("wallet-cash"))!.balanceMinor;
    const partial = await repo.recordInvoicePayment("inv", tx({ id: "pay1", amountMinor: 4000, type: "INCOME", invoiceId: "inv", walletId: "wallet-cash" }));
    expect(partial).toMatchObject({ paidMinor: 4000, status: "PARTIAL" });
    expect((await repo.getWallet("wallet-cash"))?.balanceMinor).toBe(cashBefore + 4000);
    await expect(repo.recordInvoicePayment("inv", tx({ id: "too-much", amountMinor: 7000, type: "INCOME", invoiceId: "inv" }))).rejects.toThrow();
    expect(await repo.getTransaction("too-much")).toBeUndefined();
    const paid = await repo.recordInvoicePayment("inv", tx({ id: "pay2", amountMinor: 6000, type: "INCOME", invoiceId: "inv" }));
    expect(paid.status).toBe("PAID");
    expect(await repo.listTransactions()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "pay1" }), expect.objectContaining({ id: "pay2" })]));
    await repo.saveInvoiceItem({ ...firstLine, id: "other-line" });
    await repo.deleteInvoiceItem("other-line");
    await repo.deleteInvoice("inv");
    expect(await repo.getInvoice("inv")).toBeUndefined();
    expect(await repo.listInvoiceItems("inv")).toEqual([]);
    expect(await repo.getTransaction("pay1")).toMatchObject({ amountMinor: 4000, invoiceId: undefined });
  });

  it("serializes concurrent invoice settlements inside one transaction", async () => {
    await repo.initialize("2026-10-20");
    await repo.saveInvoice(invoice());
    const makePayment = (id: string): Transaction => tx({ id, amountMinor: 6000, type: "INCOME", invoiceId: "inv" });
    const outcomes = await Promise.allSettled([
      repo.recordInvoicePayment("inv", makePayment("race-a")),
      repo.recordInvoicePayment("inv", makePayment("race-b")),
    ]);
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await repo.getInvoice("inv")).toMatchObject({ paidMinor: 6000, status: "PARTIAL" });
    expect((await repo.listTransactions()).filter((row) => row.id.startsWith("race-"))).toHaveLength(1);
  });

  it("reconciles subscriptions and overdue invoices in one idempotent write", async () => {
    await repo.initialize("2026-10-20");
    const cashBefore = (await repo.getWallet("wallet-cash"))!.balanceMinor;
    await repo.saveSubscription(sub({ nextBillingDate: "2026-10-19", autoLog: true, walletId: "wallet-cash", amountMinor: 5000 }));
    await repo.saveInvoice(invoice({ dueDate: "2026-10-19" }));
    const first = await repo.reconcile("2026-10-20");
    expect(first.transactions).toHaveLength(1);
    expect(first.invoices[0]?.status).toBe("OVERDUE");
    expect(await repo.getSubscription("sub")).toMatchObject({ nextBillingDate: "2026-11-19" });
    expect(await repo.getInvoice("inv")).toMatchObject({ status: "OVERDUE" });
    expect((await repo.getWallet("wallet-cash"))?.balanceMinor).toBe(cashBefore - 5000);
    expect((await repo.reconcile("2026-10-20")).transactions).toEqual([]);
    expect(await repo.listTransactions()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "sub:sub:2026-10-19" })]));
  });

  it("deletes a wallet and atomically detaches transaction and subscription references", async () => {
    await repo.initialize("2026-10-20");
    await repo.saveWallet({ id: "wallet-temp", name: "Temp", type: "CASH", currency: "PHP", balanceMinor: 0, color: "#fff", isDefault: false });
    await repo.saveSubscription(sub({ id: "sub-wallet", walletId: "wallet-temp" }));
    await repo.saveTransaction(tx({ id: "wallet-expense", walletId: "wallet-temp" }));
    await repo.deleteWallet("wallet-temp");
    expect(await repo.getWallet("wallet-temp")).toBeUndefined();
    expect(await repo.getTransaction("wallet-expense")).toMatchObject({ walletId: undefined });
    expect(await repo.getSubscription("sub-wallet")).toMatchObject({ walletId: undefined });
  });

  it("deletes a subscription while preserving and detaching its historical payment", async () => {
    await repo.initialize("2026-10-20");
    await repo.saveSubscription(sub({ walletId: "wallet-cash" }));
    await repo.confirmSubscriptionPayment(tx({ id: "sub:sub:2026-10-20", date: "2026-10-20", title: "Netflix", amountMinor: -54900, type: "SUBSCRIPTION_PAYMENT", subscriptionId: "sub" }));
    await repo.deleteSubscription("sub");
    expect(await repo.getSubscription("sub")).toBeUndefined();
    expect(await repo.getTransaction("sub:sub:2026-10-20")).toMatchObject({ amountMinor: -54900, subscriptionId: undefined });
    const archive = await exportVault(db, "2026-10-20");
    await expect(restoreVault(db, archive.data)).resolves.toBeUndefined();
  });

  it("confirms manual subscription payments with the transaction and next date committed together", async () => {
    await repo.initialize("2026-10-20");
    const cashBefore = (await repo.getWallet("wallet-cash"))!.balanceMinor;
    await repo.saveSubscription(sub({ walletId: "wallet-cash" }));
    const updated = await repo.confirmSubscriptionPayment(tx({ id: "sub:sub:2026-10-20", date: "2026-10-20", title: "Netflix", amountMinor: -54900, type: "SUBSCRIPTION_PAYMENT", subscriptionId: "sub" }));
    expect(updated.nextBillingDate).toBe("2026-11-20");
    expect(await repo.getTransaction("sub:sub:2026-10-20")).toMatchObject({ subscriptionId: "sub", walletId: "wallet-cash" });
    expect((await repo.getWallet("wallet-cash"))?.balanceMinor).toBe(cashBefore - 54900);
  });

  it("keeps attachment bytes separate and commits metadata with the file", async () => {
    await repo.initialize("2026-10-20");
    const metadata = { id: "receipt", filename: "receipt.webp", mimeType: "image/webp" as const, size: 3, createdAt: "2026-10-20T10:00:00.000Z", entityType: "TRANSACTION" as const, entityId: "tx" };
    const bytes = new Uint8Array([1, 2, 3]);
    await repo.saveTransaction(tx());
    await files.saveAttachment(metadata, bytes);
    expect(await repo.listAttachments("TRANSACTION", "tx")).toEqual([metadata]);
    expect(await files.load("receipt")).toEqual(bytes);
    await files.save("raw", bytes, "application/pdf");
    expect(await files.load("raw")).toEqual(bytes);
    await expect(files.save("unsafe", bytes, "text/html")).rejects.toThrow("Unsupported or disallowed attachment MIME type");
    await expect(files.save("unsafe-svg", bytes, "image/svg+xml")).rejects.toThrow("Unsupported or disallowed attachment MIME type");
    await files.delete("raw");
    expect(await files.load("raw")).toBeUndefined();
    await files.delete("receipt");
    expect(await repo.listAttachments()).toEqual([]);
  });

  it("postpones subscription date and records warning notification in local vault when wallet balance is insufficient", async () => {
    await repo.initialize("2026-10-20");
    await repo.saveWallet({ id: "wallet-broke", name: "Empty", type: "CASH", currency: "PHP", balanceMinor: 100, color: "#fff", isDefault: false });
    await repo.saveSubscription(sub({ id: "sub-broke", nextBillingDate: "2026-10-20", autoLog: true, walletId: "wallet-broke", amountMinor: 50000 }));

    const res = await repo.reconcile("2026-10-20");
    expect(res.transactions.filter((t) => t.subscriptionId === "sub-broke")).toHaveLength(0);
    expect(await repo.getSubscription("sub-broke")).toMatchObject({ nextBillingDate: "2026-10-21" });
    expect((await repo.getWallet("wallet-broke"))?.balanceMinor).toBe(100);

    const notifs = await repo.listNotifications();
    expect(notifs.some((n) => n.type === "WARNING" && n.entityId === "sub-broke")).toBe(true);
  });

  it("supports notification CRUD, marking as read, and clearing in local vault", async () => {
    await repo.initialize("2026-10-20");
    const notif = {
      id: "n-1",
      title: "Reminder",
      message: "Subscription due soon",
      type: "INFO" as const,
      createdAt: "2026-10-20T10:00:00.000Z",
      read: false,
    };
    await repo.saveNotification(notif);
    expect(await repo.listNotifications()).toContainEqual(notif);

    await repo.markNotificationRead("n-1");
    expect((await repo.listNotifications())[0]?.read).toBe(true);

    await repo.deleteNotification("n-1");
    expect(await repo.listNotifications()).toHaveLength(0);
  });

  it("clears notifications when restoring a vault", async () => {
    await repo.initialize("2026-10-20");
    const vault = await exportVault(db, "2026-10-20");

    await repo.saveNotification({
      id: "orphan-notif",
      title: "Old notification",
      message: "Should be wiped on restore",
      type: "ALERT",
      createdAt: "2026-10-20T12:00:00.000Z",
      read: false,
    });
    expect(await repo.listNotifications()).toHaveLength(1);

    await restoreVault(db, vault.data);
    expect(await repo.listNotifications()).toHaveLength(0);
  });

  it("reconciles invoice payment without double-counting paidMinor", async () => {
    await repo.initialize("2026-10-20");
    const inv = invoice({ id: "inv-immediate", totalMinor: 5000, paidMinor: 0, status: "PENDING", itemIds: ["item-1"] });
    await repo.saveInvoiceWithItems(inv, [{ id: "item-1", invoiceId: "inv-immediate", description: "Design", quantity: 1, unitPriceMinor: 5000 }]);

    const payment = tx({
      id: "tx-pay-imm",
      amountMinor: 5000,
      type: "INCOME",
      invoiceId: "inv-immediate",
      currency: "PHP",
    });
    await repo.saveTransaction(payment);

    const stored = await repo.getInvoice("inv-immediate");
    expect(stored?.paidMinor).toBe(5000);
    expect(stored?.status).toBe("PAID");
  });

  it("confirms subscription payments for non-PHP currencies", async () => {
    await repo.initialize("2026-10-20");
    await repo.saveWallet({ id: "w-usd", name: "USD Account", type: "BANK", currency: "USD", balanceMinor: 100000, color: "#fff", isDefault: false });
    await repo.saveSubscription({
      id: "sub-usd",
      title: "AWS Cloud",
      amountMinor: 2000,
      currency: "USD",
      billingCycle: "MONTHLY",
      nextBillingDate: "2026-10-20",
      active: true,
      autoLog: false,
      walletId: "w-usd",
    });

    const confirmed = await repo.confirmSubscriptionPayment({
      id: "sub:sub-usd:2026-10-20",
      date: "2026-10-20",
      title: "AWS Cloud",
      amountMinor: -2000,
      currency: "USD",
      type: "SUBSCRIPTION_PAYMENT",
      subscriptionId: "sub-usd",
      walletId: "w-usd",
    });

    expect(confirmed.nextBillingDate).toBe("2026-11-20");
    const wallet = await repo.getWallet("w-usd");
    expect(wallet?.balanceMinor).toBe(98000);
  });
});

