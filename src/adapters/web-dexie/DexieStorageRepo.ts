import { format } from "date-fns";
import type { Table } from "dexie";
import type { AppMeta, AppNotification, AttachmentMeta, Category, Invoice, InvoiceItem, Subscription, Transaction, UserProfile, Wallet } from "../../core/models";
import { appMetaSchema, appNotificationSchema, categorySchema, dateOnlySchema, invoiceItemSchema, invoiceSchema, subscriptionSchema, transactionSchema, userProfileSchema, walletSchema } from "../../core/models";
import type { IStorageRepo } from "../../core/ports/IStorageRepo";
import { createDemoSeed } from "../../core/engine/demoSeed";
import { reconcile, type ReconcileResult } from "../../core/engine/reconciler";
import { commitInvoice, confirmSubscriptionCycle, detachSubscriptionHistory, detachWalletReferences, settleInvoice, type LedgerCommandGateway, type LedgerCommandUnit, type LedgerTable } from "../../core/engine/ledgerCommands";
import { KromaLedgerDB } from "./db";

const appDefaults = (): AppMeta => appMetaSchema.parse({ id: "app", currency: "PHP" });

export class DexieStorageRepo implements IStorageRepo {
  private readonly commands: LedgerCommandGateway = {
    atomic: (tables, work) => this.commandTransaction(tables, work),
  };
  constructor(readonly db = new KromaLedgerDB()) {}

  private commandTransaction<T>(tables: readonly LedgerTable[], work: (unit: LedgerCommandUnit) => Promise<T>): Promise<T> {
    const tableList: Array<Table<any, any>> = tables.map((name) => this.db[name]);
    if (tables.includes("transactions") && !tableList.includes(this.db.wallets)) {
      tableList.push(this.db.wallets);
    }
    return this.db.transaction("rw", tableList, async () => work({
      getInvoice: (id) => this.db.invoices.get(id),
      getSubscription: (id) => this.db.subscriptions.get(id),
      getWallet: (id) => this.db.wallets.get(id),
      putSubscription: async (value) => { await this.db.subscriptions.put(value); },
      putInvoice: async (value) => { await this.db.invoices.put(value); },
      replaceInvoiceItems: async (id, values) => { await this.db.invoiceItems.where("invoiceId").equals(id).delete(); await this.db.invoiceItems.bulkPut(values); },
      addTransaction: async (value) => {
        const parsed = transactionSchema.parse(value);
        if (parsed.type === "TRANSFER") {
          const fee = parsed.feeMinor ?? 0;
          const principal = Math.abs(parsed.amountMinor);
          if (parsed.walletId) {
            const src = await this.db.wallets.get(parsed.walletId);
            if (src) {
              await this.db.wallets.put({ ...src, balanceMinor: src.balanceMinor - (principal + fee) });
            }
          }
          if (parsed.toWalletId) {
            const dst = await this.db.wallets.get(parsed.toWalletId);
            if (dst) {
              await this.db.wallets.put({ ...dst, balanceMinor: dst.balanceMinor + principal });
            }
          }
        } else if (parsed.walletId) {
          const wallet = await this.db.wallets.get(parsed.walletId);
          if (wallet) {
            await this.db.wallets.put({
              ...wallet,
              balanceMinor: wallet.balanceMinor + parsed.amountMinor,
            });
          }
        }
        await this.db.transactions.add(parsed);
      },
    }));
  }

  async initialize(today = format(new Date(), "yyyy-MM-dd")): Promise<void> {
    if (!dateOnlySchema.safeParse(today).success) throw new RangeError("Initialization needs a real ISO date");
    await this.db.transaction("rw", [this.db.transactions, this.db.subscriptions, this.db.invoices, this.db.invoiceItems, this.db.categories, this.db.attachments, this.db.attachmentFiles, this.db.appMeta, this.db.wallets, this.db.profiles], async () => {
      if (await this.db.appMeta.get("app")) return;
      const seed = createDemoSeed(today);
      await this.db.categories.bulkAdd(seed.categories);
      await this.db.transactions.bulkAdd(seed.transactions);
      await this.db.subscriptions.bulkAdd(seed.subscriptions);
      await this.db.invoiceItems.bulkAdd(seed.invoiceItems);
      await this.db.invoices.bulkAdd(seed.invoices);
      if (seed.wallets && seed.wallets.length > 0) {
        await this.db.wallets.bulkAdd(seed.wallets);
      }
      if (seed.profile) {
        await this.db.profiles.add(seed.profile);
      }
      await this.db.appMeta.add(seed.appMeta);
    });
  }

  getTransaction(id: string): Promise<Transaction | undefined> { return this.db.transactions.get(id); }
  async listTransactions(fromDate?: string, throughDate?: string): Promise<Transaction[]> {
    const rows = fromDate && throughDate
      ? await this.db.transactions.where("date").between(fromDate, throughDate, true, true).toArray()
      : fromDate ? await this.db.transactions.where("date").aboveOrEqual(fromDate).toArray()
        : throughDate ? await this.db.transactions.where("date").belowOrEqual(throughDate).toArray()
          : await this.db.transactions.toArray();
    return rows.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }
  async saveTransaction(value: Transaction): Promise<void> {
    const parsed = transactionSchema.parse(value);
    await this.db.transaction("rw", this.db.transactions, this.db.wallets, this.db.invoices, async () => {
      const existing = await this.db.transactions.get(parsed.id);

      const deltas = new Map<string, number>();
      const addDelta = (wid: string | undefined, delta: number) => {
        if (!wid) return;
        deltas.set(wid, (deltas.get(wid) ?? 0) + delta);
      };

      if (existing) {
        if (existing.type === "TRANSFER") {
          const fee = existing.feeMinor ?? 0;
          const principal = Math.abs(existing.amountMinor);
          addDelta(existing.walletId, +(principal + fee));
          addDelta(existing.toWalletId, -principal);
        } else {
          addDelta(existing.walletId, -existing.amountMinor);
        }
      }

      if (parsed.type === "TRANSFER") {
        const fee = parsed.feeMinor ?? 0;
        const principal = Math.abs(parsed.amountMinor);
        addDelta(parsed.walletId, -(principal + fee));
        addDelta(parsed.toWalletId, +principal);
      } else {
        addDelta(parsed.walletId, +parsed.amountMinor);
      }

      for (const [wid, delta] of deltas.entries()) {
        if (delta !== 0) {
          const wallet = await this.db.wallets.get(wid);
          if (wallet) {
            await this.db.wallets.put({
              ...wallet,
              balanceMinor: wallet.balanceMinor + delta,
            });
          }
        }
      }

      if (existing?.invoiceId || parsed.invoiceId) {
        if (existing?.invoiceId && parsed.invoiceId && existing.invoiceId === parsed.invoiceId) {
          const delta = Math.abs(parsed.amountMinor) - Math.abs(existing.amountMinor);
          if (delta !== 0) {
            const invoice = await this.db.invoices.get(parsed.invoiceId);
            if (invoice) {
              const newPaid = Math.max(0, invoice.paidMinor + delta);
              const isOverdue = invoice.dueDate < format(new Date(), "yyyy-MM-dd");
              const newStatus = newPaid >= invoice.totalMinor
                ? "PAID"
                : newPaid === 0
                  ? (isOverdue ? "OVERDUE" : "PENDING")
                  : (isOverdue ? "OVERDUE" : "PARTIAL");
              await this.db.invoices.put({ ...invoice, paidMinor: newPaid, status: newStatus });
            }
          }
        } else {
          if (existing?.invoiceId) {
            const oldInv = await this.db.invoices.get(existing.invoiceId);
            if (oldInv) {
              const newPaid = Math.max(0, oldInv.paidMinor - Math.abs(existing.amountMinor));
              const isOverdue = oldInv.dueDate < format(new Date(), "yyyy-MM-dd");
              const newStatus = newPaid === 0 ? (isOverdue ? "OVERDUE" : "PENDING") : (newPaid >= oldInv.totalMinor ? "PAID" : (isOverdue ? "OVERDUE" : "PARTIAL"));
              await this.db.invoices.put({ ...oldInv, paidMinor: newPaid, status: newStatus });
            }
          }
          if (parsed.invoiceId) {
            const newInv = await this.db.invoices.get(parsed.invoiceId);
            if (newInv) {
              const newPaid = Math.max(0, newInv.paidMinor + Math.abs(parsed.amountMinor));
              const isOverdue = newInv.dueDate < format(new Date(), "yyyy-MM-dd");
              const newStatus = newPaid >= newInv.totalMinor ? "PAID" : (newPaid === 0 ? (isOverdue ? "OVERDUE" : "PENDING") : (isOverdue ? "OVERDUE" : "PARTIAL"));
              await this.db.invoices.put({ ...newInv, paidMinor: newPaid, status: newStatus });
            }
          }
        }
      }

      await this.db.transactions.put(parsed);
    });
  }
  async deleteTransaction(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.transactions, this.db.attachments, this.db.attachmentFiles, this.db.wallets, this.db.invoices, async () => {
      const existing = await this.db.transactions.get(id);
      if (existing) {
        const deltas = new Map<string, number>();
        const addDelta = (wid: string | undefined, delta: number) => {
          if (!wid) return;
          deltas.set(wid, (deltas.get(wid) ?? 0) + delta);
        };

        if (existing.type === "TRANSFER") {
          const fee = existing.feeMinor ?? 0;
          const principal = Math.abs(existing.amountMinor);
          addDelta(existing.walletId, +(principal + fee));
          addDelta(existing.toWalletId, -principal);
        } else {
          addDelta(existing.walletId, -existing.amountMinor);
        }

        for (const [wid, delta] of deltas.entries()) {
          if (delta !== 0) {
            const wallet = await this.db.wallets.get(wid);
            if (wallet) {
              await this.db.wallets.put({
                ...wallet,
                balanceMinor: wallet.balanceMinor + delta,
              });
            }
          }
        }
      }
      if (existing?.invoiceId) {
        const invoice = await this.db.invoices.get(existing.invoiceId);
        if (invoice) {
          const paymentAmount = Math.abs(existing.amountMinor);
          const newPaid = Math.max(0, invoice.paidMinor - paymentAmount);
          const isOverdue = invoice.dueDate < format(new Date(), "yyyy-MM-dd");
          const newStatus = newPaid === 0
            ? (isOverdue ? "OVERDUE" : "PENDING")
            : (newPaid >= invoice.totalMinor ? "PAID" : (isOverdue ? "OVERDUE" : "PARTIAL"));
          await this.db.invoices.put({
            ...invoice,
            paidMinor: newPaid,
            status: newStatus,
          });
        }
      }
      await this.db.transactions.delete(id);
      const attachmentIds = await this.db.attachments.where("[entityType+entityId]").equals(["TRANSACTION", id]).primaryKeys();
      await this.db.attachments.bulkDelete(attachmentIds);
      await this.db.attachmentFiles.bulkDelete(attachmentIds);
    });
  }

  getSubscription(id: string): Promise<Subscription | undefined> { return this.db.subscriptions.get(id); }
  listSubscriptions(): Promise<Subscription[]> { return this.db.subscriptions.orderBy("title").toArray(); }
  async saveSubscription(value: Subscription): Promise<void> { await this.db.subscriptions.put(subscriptionSchema.parse(value)); }
  confirmSubscriptionPayment(payment: Transaction): Promise<Subscription> {
    return confirmSubscriptionCycle(this.commands, payment);
  }
  async deleteSubscription(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.subscriptions, this.db.transactions, async () => {
      const payments = await this.db.transactions.where("subscriptionId").equals(id).toArray();
      await this.db.transactions.bulkPut(detachSubscriptionHistory(payments, id));
      await this.db.subscriptions.delete(id);
    });
  }

  getInvoice(id: string): Promise<Invoice | undefined> { return this.db.invoices.get(id); }
  listInvoices(): Promise<Invoice[]> { return this.db.invoices.orderBy("dueDate").toArray(); }
  async saveInvoice(value: Invoice): Promise<void> { await this.db.invoices.put(invoiceSchema.parse(value)); }
  saveInvoiceWithItems(value: Invoice, values: InvoiceItem[]): Promise<void> {
    return commitInvoice(this.commands, value, values);
  }
  recordInvoicePayment(invoiceId: string, value: Transaction): Promise<Invoice> {
    return settleInvoice(this.commands, invoiceId, value);
  }
  async deleteInvoice(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.invoices, this.db.invoiceItems, this.db.transactions, this.db.attachments, this.db.attachmentFiles, async () => {
      await this.db.invoices.delete(id);
      await this.db.invoiceItems.where("invoiceId").equals(id).delete();
      const payments = await this.db.transactions.where("invoiceId").equals(id).toArray();
      await this.db.transactions.bulkPut(payments.map((payment) => ({ ...payment, invoiceId: undefined })));
      const attachmentIds = await this.db.attachments.where("[entityType+entityId]").equals(["INVOICE", id]).primaryKeys();
      await this.db.attachments.bulkDelete(attachmentIds);
      await this.db.attachmentFiles.bulkDelete(attachmentIds);
    });
  }
  listInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> { return this.db.invoiceItems.where("invoiceId").equals(invoiceId).toArray(); }
  async saveInvoiceItem(value: InvoiceItem): Promise<void> { await this.db.invoiceItems.put(invoiceItemSchema.parse(value)); }
  async deleteInvoiceItem(id: string): Promise<void> { await this.db.invoiceItems.delete(id); }

  listCategories(): Promise<Category[]> { return this.db.categories.orderBy("name").toArray(); }
  async saveCategory(value: Category): Promise<void> { await this.db.categories.put(categorySchema.parse(value)); }
  async deleteCategory(id: string): Promise<void> { await this.db.categories.delete(id); }
  listAttachments(entityType?: AttachmentMeta["entityType"], entityId?: string): Promise<AttachmentMeta[]> {
    if (entityType && entityId) {
      return this.db.attachments.where("[entityType+entityId]").equals([entityType, entityId]).toArray();
    }
    return this.db.attachments.toCollection().filter((row) => (!entityType || row.entityType === entityType) && (!entityId || row.entityId === entityId)).toArray();
  }

  async getAppMeta(): Promise<AppMeta> { return await this.db.appMeta.get("app") ?? appDefaults(); }
  async saveAppMeta(value: AppMeta): Promise<void> { await this.db.appMeta.put(appMetaSchema.parse(value)); }

  async getProfile(): Promise<UserProfile> {
    const row = await this.db.profiles.get("profile");
    if (row) return userProfileSchema.parse(row);
    const fallback = userProfileSchema.parse({ id: "profile" });
    await this.db.profiles.put(fallback);
    return fallback;
  }
  async saveProfile(value: UserProfile): Promise<void> {
    await this.db.profiles.put(userProfileSchema.parse(value));
  }

  async listWallets(): Promise<Wallet[]> {
    const rows = await this.db.wallets.toArray();
    return rows.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || a.name.localeCompare(b.name));
  }
  getWallet(id: string): Promise<Wallet | undefined> {
    return this.db.wallets.get(id);
  }
  async saveWallet(value: Wallet): Promise<void> {
    const parsed = walletSchema.parse(value);
    await this.db.transaction("rw", this.db.wallets, async () => {
      if (parsed.isDefault) {
        const all = await this.db.wallets.toArray();
        for (const w of all) {
          if (w.id !== parsed.id && w.isDefault) {
            await this.db.wallets.put({ ...w, isDefault: false });
          }
        }
      }
      await this.db.wallets.put(parsed);
    });
  }
  async deleteWallet(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.wallets, this.db.transactions, this.db.subscriptions, async () => {
      await this.db.wallets.delete(id);
      const affectedTransactions = await this.db.transactions
        .filter((tx) => tx.walletId === id || tx.toWalletId === id)
        .toArray();
      const affectedSubscriptions = await this.db.subscriptions.toCollection().filter((subscription) => subscription.walletId === id).toArray();
      const detached = detachWalletReferences(affectedTransactions, affectedSubscriptions, id);
      if (detached.transactions.length) await this.db.transactions.bulkPut(detached.transactions);
      if (detached.subscriptions.length) await this.db.subscriptions.bulkPut(detached.subscriptions);
    });
  }

  async clearAllData(): Promise<void> {
    await this.db.transaction("rw", [
      this.db.transactions,
      this.db.subscriptions,
      this.db.invoices,
      this.db.invoiceItems,
      this.db.categories,
      this.db.attachments,
      this.db.attachmentFiles,
      this.db.wallets,
      this.db.profiles,
      this.db.appMeta,
      this.db.notifications,
    ], async () => {
      await Promise.all([
        this.db.transactions.clear(),
        this.db.subscriptions.clear(),
        this.db.invoices.clear(),
        this.db.invoiceItems.clear(),
        this.db.categories.clear(),
        this.db.attachments.clear(),
        this.db.attachmentFiles.clear(),
        this.db.wallets.clear(),
        this.db.profiles.clear(),
        this.db.appMeta.clear(),
        this.db.notifications.clear(),
      ]);
      await this.db.appMeta.put({ id: "app", currency: "PHP", seedVersion: 999 });
      await this.db.profiles.put({
        id: "profile",
        name: "Anonymous Operator",
        handle: "operator",
        email: "operator@kroma.local",
        initials: "KO",
        themeColor: "#D9F938",
        defaultCurrency: "PHP",
        bio: "Clean on-device ledger",
      });
    });
  }

  async resetToDemo(today = format(new Date(), "yyyy-MM-dd")): Promise<void> {
    await this.db.transaction("rw", [
      this.db.transactions,
      this.db.subscriptions,
      this.db.invoices,
      this.db.invoiceItems,
      this.db.categories,
      this.db.attachments,
      this.db.attachmentFiles,
      this.db.wallets,
      this.db.profiles,
      this.db.appMeta,
      this.db.notifications,
    ], async () => {
      await Promise.all([
        this.db.transactions.clear(),
        this.db.subscriptions.clear(),
        this.db.invoices.clear(),
        this.db.invoiceItems.clear(),
        this.db.categories.clear(),
        this.db.attachments.clear(),
        this.db.attachmentFiles.clear(),
        this.db.wallets.clear(),
        this.db.profiles.clear(),
        this.db.appMeta.clear(),
        this.db.notifications.clear(),
      ]);
      const seed = createDemoSeed(today);
      await this.db.categories.bulkAdd(seed.categories);
      await this.db.transactions.bulkAdd(seed.transactions);
      await this.db.subscriptions.bulkAdd(seed.subscriptions);
      await this.db.invoiceItems.bulkAdd(seed.invoiceItems);
      await this.db.invoices.bulkAdd(seed.invoices);
      if (seed.wallets && seed.wallets.length > 0) {
        await this.db.wallets.bulkAdd(seed.wallets);
      }
      if (seed.profile) {
        await this.db.profiles.add(seed.profile);
      }
      await this.db.appMeta.add(seed.appMeta);
    });
  }

  async reconcile(currentDate: string): Promise<ReconcileResult> {
    return this.db.transaction("rw", [
      this.db.transactions,
      this.db.subscriptions,
      this.db.invoices,
      this.db.appMeta,
      this.db.wallets,
      this.db.notifications,
    ], async () => {
      const meta = await this.getAppMeta();
      const wallets = await this.db.wallets.toArray();
      const result = reconcile({
        subscriptions: await this.db.subscriptions.toArray(),
        invoices: await this.db.invoices.toArray(),
        lastReconciledDate: meta.lastReconciledDate,
        currentDate,
        wallets,
      });
      for (const t of result.transactions) {
        if (t.walletId) {
          const wallet = await this.db.wallets.get(t.walletId);
          if (wallet) {
            await this.db.wallets.put({
              ...wallet,
              balanceMinor: wallet.balanceMinor + t.amountMinor,
            });
          }
        }
      }
      for (const n of result.notifications) {
        const existing = await this.db.notifications.get(n.id);
        if (!existing) {
          await this.db.notifications.add(n);
        }
      }
      await this.db.transactions.bulkPut(result.transactions);
      await this.db.subscriptions.bulkPut(result.subscriptions);
      await this.db.invoices.bulkPut(result.invoices);
      await this.db.appMeta.put({ ...meta, lastReconciledDate: result.lastReconciledDate });
      return result;
    });
  }

  async listNotifications(): Promise<AppNotification[]> {
    const all = await this.db.notifications.toArray();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveNotification(value: AppNotification): Promise<void> {
    await this.db.notifications.put(appNotificationSchema.parse(value));
  }

  async markNotificationRead(id: string): Promise<void> {
    const item = await this.db.notifications.get(id);
    if (item) {
      await this.db.notifications.put({ ...item, read: true });
    }
  }

  async deleteNotification(id: string): Promise<void> {
    await this.db.notifications.delete(id);
  }

  async clearNotifications(): Promise<void> {
    await this.db.notifications.clear();
  }
}
