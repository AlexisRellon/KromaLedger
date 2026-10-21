import { dateOnlySchema, invoiceItemSchema, invoiceSchema, subscriptionSchema, transactionSchema, type Invoice, type InvoiceItem, type Subscription, type Transaction } from "../core/models";
import { calculateInvoice } from "../core/engine/invoiceCalculator";
import { parseMinorInput } from "../core/engine/moneyInput";
export { parseMinorInput } from "../core/engine/moneyInput";

export type EntryMode = "EXPENSE" | "SUBSCRIPTION" | "INVOICE";
export type InvoiceLineDraft = { description: string; quantity: number; unitPriceMinor: number };
type Common = { id(prefix: "transaction" | "subscription" | "invoice" | "item"): string; today: string; date: string; title: string; amount: string; currency?: string; categoryId?: string; walletId?: string };
type ExpenseInput = Common & { mode: "EXPENSE" };
type SubscriptionInput = Common & { mode: "SUBSCRIPTION"; cycle: "WEEKLY" | "MONTHLY" | "YEARLY"; autoLog: boolean };
type InvoiceInput = Common & { mode: "INVOICE"; direction: "PAYABLE" | "RECEIVABLE"; dueDate: string; lines: InvoiceLineDraft[]; taxRateBps: number; discountMinor: number };
export type EntryDraftInput = ExpenseInput | SubscriptionInput | InvoiceInput;
export type EntryDraft =
  | { kind: "EXPENSE"; transaction: Transaction }
  | { kind: "SUBSCRIPTION"; subscription: Subscription }
  | { kind: "INVOICE"; invoice: Invoice; items: InvoiceItem[] };


export function buildEntryDraft(input: EntryDraftInput): EntryDraft {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  dateOnlySchema.parse(input.date);
  dateOnlySchema.parse(input.today);
  const currency = input.currency ?? "PHP";
  if (input.mode === "EXPENSE") {
    const amountMinor = parseMinorInput(input.amount);
    return { kind: "EXPENSE", transaction: transactionSchema.parse({ id: input.id("transaction"), date: input.date, title, amountMinor: -amountMinor, currency, type: "EXPENSE", categoryId: input.categoryId, walletId: input.walletId }) };
  }
  if (input.mode === "SUBSCRIPTION") {
    const amountMinor = parseMinorInput(input.amount);
    return { kind: "SUBSCRIPTION", subscription: subscriptionSchema.parse({ id: input.id("subscription"), title, amountMinor, currency, billingCycle: input.cycle, nextBillingDate: input.date, billingAnchorDate: input.date, active: true, autoLog: input.autoLog, categoryId: input.categoryId, walletId: input.walletId }) };
  }
  dateOnlySchema.parse(input.dueDate);
  const amountMinor = input.lines.length ? 0 : parseMinorInput(input.amount);
  const lines = input.lines.length ? input.lines : [{ description: title, quantity: 1, unitPriceMinor: amountMinor }];
  const calculated = calculateInvoice({ items: lines, taxRateBps: input.taxRateBps, discountMinor: input.discountMinor, paidMinor: 0, dueDate: input.dueDate, currentDate: input.today, draft: false });
  const invoiceId = input.id("invoice");
  const items = lines.map((line) => invoiceItemSchema.parse({ ...line, id: input.id("item"), invoiceId }));
  const invoice = invoiceSchema.parse({ id: invoiceId, title, direction: input.direction, dueDate: input.dueDate, status: calculated.status, subtotalMinor: calculated.subtotalMinor, taxMinor: calculated.taxMinor, discountMinor: calculated.discountMinor, totalMinor: calculated.totalMinor, paidMinor: 0, currency, itemIds: items.map((item) => item.id), categoryId: input.categoryId });
  return { kind: "INVOICE", invoice, items };
}
