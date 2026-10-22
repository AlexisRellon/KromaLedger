import { invoiceItemSchema, invoiceSchema, subscriptionSchema, transactionSchema, type Invoice, type InvoiceItem, type Subscription, type Transaction, type Wallet } from "../models";
import { reconcile } from "./reconciler";

export type LedgerTable = "invoices" | "invoiceItems" | "transactions" | "subscriptions" | "appMeta" | "categories" | "attachments" | "wallets";
export interface LedgerCommandUnit {
  getInvoice(id: string): Promise<Invoice | undefined>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  putSubscription(value: Subscription): Promise<void>;
  putInvoice(value: Invoice): Promise<void>;
  replaceInvoiceItems(invoiceId: string, values: InvoiceItem[]): Promise<void>;
  addTransaction(value: Transaction): Promise<void>;
  getWallet?(id: string): Promise<Wallet | undefined>;
}
export function detachSubscriptionHistory(rows: Transaction[], subscriptionId: string): Transaction[] {
  if (!subscriptionId) throw new RangeError("Subscription id is required");
  return rows.map((row) => row.subscriptionId === subscriptionId
    ? transactionSchema.parse({ ...row, subscriptionId: undefined })
    : row);
}


export function detachWalletReferences(
  transactions: Transaction[],
  subscriptions: Subscription[],
  walletId: string,
): { transactions: Transaction[]; subscriptions: Subscription[] } {
  if (!walletId) throw new RangeError("Wallet id is required");
  return {
    transactions: transactions.map((row) =>
      row.walletId === walletId || row.toWalletId === walletId
        ? transactionSchema.parse({
            ...row,
            walletId: row.walletId === walletId ? undefined : row.walletId,
            toWalletId: row.toWalletId === walletId ? undefined : row.toWalletId,
          })
        : row
    ),
    subscriptions: subscriptions.map((row) => row.walletId === walletId
      ? subscriptionSchema.parse({ ...row, walletId: undefined })
      : row),
  };
}

export interface LedgerCommandGateway {
  atomic<T>(tables: readonly LedgerTable[], work: (unit: LedgerCommandUnit) => Promise<T>): Promise<T>;
}

export async function confirmSubscriptionCycle(gateway: LedgerCommandGateway, input: Transaction): Promise<Subscription> {
  const payment = transactionSchema.parse(input);
  const id = payment.subscriptionId;
  if (payment.type !== "SUBSCRIPTION_PAYMENT" || !id || payment.amountMinor >= 0) {
    throw new RangeError("Invalid subscription payment");
  }
  return gateway.atomic(["subscriptions", "transactions"], async (unit) => {
    const subscription = await unit.getSubscription(id);
    if (!subscription || !subscription.active || subscription.autoLog ||
        payment.date !== subscription.nextBillingDate ||
        payment.id !== `sub:${subscription.id}:${payment.date}` ||
        payment.amountMinor !== -subscription.amountMinor ||
        payment.currency !== subscription.currency) {
      throw new RangeError("Payment does not match a pending subscription cycle");
    }
    const effectiveWalletId = payment.walletId || subscription.walletId;
    if (unit.getWallet) {
      if (!effectiveWalletId) {
        throw new RangeError("Subscription payment requires a linked wallet");
      }
      const wallet = await unit.getWallet(effectiveWalletId);
      if (!wallet || wallet.balanceMinor < subscription.amountMinor) {
        throw new RangeError("Insufficient balance in the selected wallet");
      }
    }
    const result = reconcile({ subscriptions: [{ ...subscription, autoLog: true }], invoices: [], currentDate: payment.date });
    const nextCycle = result.subscriptions[0];
    if (!nextCycle || !result.transactions.some((row) => row.date === payment.date)) {
      throw new RangeError("Subscription cycle is not due");
    }
    const next = subscriptionSchema.parse({ ...nextCycle, autoLog: false });
    const ledgerPayment = payment.walletId || !subscription.walletId
      ? payment
      : transactionSchema.parse({ ...payment, walletId: subscription.walletId });
    await unit.addTransaction(ledgerPayment);
    await unit.putSubscription(next);
    return next;
  });
}

export async function commitInvoice(gateway: LedgerCommandGateway, value: Invoice, values: InvoiceItem[]): Promise<void> {
  const invoice = invoiceSchema.parse(value);
  const items = values.map((item) => invoiceItemSchema.parse(item));
  const ids = items.map((item) => item.id);
  if (items.some((item) => item.invoiceId !== invoice.id) || new Set(ids).size !== ids.length ||
      ids.length !== invoice.itemIds.length || ids.some((id) => !invoice.itemIds.includes(id)) ||
      invoice.itemIds.some((id) => !ids.includes(id))) {
    throw new RangeError("Invoice item references do not match invoice");
  }
  await gateway.atomic(["invoices", "invoiceItems"], async (unit) => {
    await unit.replaceInvoiceItems(invoice.id, items);
    await unit.putInvoice(invoice);
  });
}

export async function settleInvoice(gateway: LedgerCommandGateway, invoiceId: string, input: Transaction): Promise<Invoice> {
  const payment = transactionSchema.parse(input);
  return gateway.atomic(["invoices", "transactions"], async (unit) => {
    const invoice = await unit.getInvoice(invoiceId);
    if (!invoice || invoice.status === "DRAFT" || invoice.status === "PAID" || payment.invoiceId !== invoiceId || payment.currency !== invoice.currency) {
      throw new RangeError("Invoice cannot accept this payment");
    }
    const incoming = invoice.direction === "RECEIVABLE";
    if ((incoming && (payment.type !== "INCOME" || payment.amountMinor <= 0)) ||
        (!incoming && (payment.type !== "EXPENSE" || payment.amountMinor >= 0))) {
      throw new RangeError("Payment sign does not match invoice direction");
    }
    const amount = Math.abs(payment.amountMinor);
    const remaining = invoice.totalMinor - invoice.paidMinor;
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > remaining) {
      throw new RangeError("Payment must be positive and cannot exceed remaining balance");
    }
    const paidMinor = invoice.paidMinor + amount;
    const status = paidMinor === invoice.totalMinor ? "PAID" :
      invoice.status === "OVERDUE" || payment.date > invoice.dueDate ? "OVERDUE" : "PARTIAL";
    const updated = invoiceSchema.parse({ ...invoice, paidMinor, status });
    await unit.addTransaction(payment);
    await unit.putInvoice(updated);
    return updated;
  });
}
