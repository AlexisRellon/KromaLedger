import { dateOnlySchema, invoiceItemSchema, invoiceSchema, subscriptionSchema, transactionSchema, type Invoice, type InvoiceItem, type Subscription, type Transaction, type TransferChannel } from "../core/models";
import { calculateInvoice } from "../core/engine/invoiceCalculator";
import { parseMinorInput } from "../core/engine/moneyInput";
import { convenienceFeeMinor } from "../core/engine/convenienceFee";
export { parseMinorInput } from "../core/engine/moneyInput";

export type EntryMode = "EXPENSE" | "INCOME" | "TRANSFER" | "CASH_IN" | "SUBSCRIPTION" | "INVOICE" | "LOAN" | "INSTALLMENT";
export type EntryKind =
  | "EXPENSE"
  | "INCOMING_CASH"
  | "INCOME"
  | "TRANSFER"
  | "EWALLET_CASH_IN"
  | "CASH_IN"
  | "SUBSCRIPTION"
  | "INVOICE"
  | "LOAN"
  | "INSTALLMENT";

export const ENTRY_FIELD_META: Record<
  EntryKind,
  { titleLabel: string; titlePlaceholder: string; dateLabel: string }
> = {
  EXPENSE: {
    titleLabel: "MERCHANT / NOTE",
    titlePlaceholder: "e.g. GrabCar Commute",
    dateLabel: "DATE",
  },
  INCOMING_CASH: {
    titleLabel: "SOURCE / PAYER",
    titlePlaceholder: "e.g. November Payroll / Client Retainer",
    dateLabel: "DATE RECEIVED",
  },
  INCOME: {
    titleLabel: "SOURCE / PAYER",
    titlePlaceholder: "e.g. November Payroll / Client Retainer",
    dateLabel: "DATE RECEIVED",
  },
  TRANSFER: {
    titleLabel: "TRANSFER NOTE / TITLE",
    titlePlaceholder: "e.g. Debit Card to Cash in Vault",
    dateLabel: "DATE",
  },
  EWALLET_CASH_IN: {
    titleLabel: "CASH-IN PROVIDER",
    titlePlaceholder: "e.g. 7-Eleven CLiQQ / TouchPay",
    dateLabel: "DATE",
  },
  CASH_IN: {
    titleLabel: "CASH-IN PROVIDER",
    titlePlaceholder: "e.g. 7-Eleven CLiQQ / TouchPay",
    dateLabel: "DATE",
  },
  SUBSCRIPTION: {
    titleLabel: "SERVICE NAME",
    titlePlaceholder: "e.g. Netflix / GitHub Copilot",
    dateLabel: "NEXT BILLING DATE",
  },
  INVOICE: {
    titleLabel: "CLIENT / VENDOR",
    titlePlaceholder: "e.g. Acme Corp",
    dateLabel: "DUE DATE",
  },
  LOAN: {
    titleLabel: "LENDER / LOAN NOTE",
    titlePlaceholder: "e.g. SSS Salary Loan / Personal Loan",
    dateLabel: "FIRST PAYMENT DATE",
  },
  INSTALLMENT: {
    titleLabel: "ITEM / PLAN NAME",
    titlePlaceholder: "e.g. Mechanical Keyboard (SPayLater 6m)",
    dateLabel: "FIRST CUTOFF DATE",
  },
};
export type InvoiceLineDraft = { description: string; quantity: number; unitPriceMinor: number };
type Common = { id(prefix: "transaction" | "subscription" | "invoice" | "item"): string; today: string; date: string; title: string; amount: string; currency?: string; categoryId?: string; walletId?: string; customLabels?: string[] };
type ExpenseInput = Common & { mode: "EXPENSE" | "INCOME" };
type TransferInput = Common & { mode: "TRANSFER"; toWalletId?: string; feeMinor?: number; channel?: TransferChannel };
type CashInInput = Common & { mode: "CASH_IN"; toWalletId: string; provider: string; feeMode: "FIXED" | "PERCENT"; feeValue: string };
type ObligationInput = Common & { mode: "LOAN" | "INSTALLMENT"; paymentAmount: string; cycle: "WEEKLY" | "MONTHLY" | "YEARLY" };
type SubscriptionInput = Common & { mode: "SUBSCRIPTION"; cycle: "WEEKLY" | "MONTHLY" | "YEARLY"; autoLog: boolean };
type InvoiceInput = Common & { mode: "INVOICE"; direction: "PAYABLE" | "RECEIVABLE"; dueDate: string; lines: InvoiceLineDraft[]; taxRateBps: number; discountMinor: number };
export type EntryDraftInput = ExpenseInput | TransferInput | CashInInput | ObligationInput | SubscriptionInput | InvoiceInput;
export type EntryDraft =
  | { kind: "EXPENSE" | "INCOME"; transaction: Transaction }
  | { kind: "TRANSFER"; transaction: Transaction }
  | { kind: "SUBSCRIPTION"; subscription: Subscription }
  | { kind: "INVOICE"; invoice: Invoice; items: InvoiceItem[] };


export function buildEntryDraft(input: EntryDraftInput): EntryDraft {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  dateOnlySchema.parse(input.date);
  dateOnlySchema.parse(input.today);
  const currency = input.currency ?? "PHP";
  if (input.mode === "EXPENSE" || input.mode === "INCOME") {
    const amountMinor = parseMinorInput(input.amount);
    if (input.mode === "INCOME" && !input.walletId) throw new Error("Choose a wallet to receive incoming cash.");
    return { kind: input.mode, transaction: transactionSchema.parse({ id: input.id("transaction"), date: input.date, title, amountMinor: input.mode === "INCOME" ? amountMinor : -amountMinor, currency, type: input.mode, categoryId: input.categoryId, walletId: input.walletId, customLabels: input.customLabels }) };
  }
  if (input.mode === "TRANSFER" || input.mode === "CASH_IN") {
    const amountMinor = parseMinorInput(input.amount);
    if (!input.walletId || !input.toWalletId || input.walletId === input.toWalletId) throw new Error("Choose different source and destination wallets.");
    const feeMinor = input.mode === "CASH_IN" ? convenienceFeeMinor(amountMinor, input.feeMode, input.feeValue) : input.feeMinor ?? 0;
    return {
      kind: "TRANSFER",
      transaction: transactionSchema.parse({
        id: input.id("transaction"),
        date: input.date,
        title,
        amountMinor,
        currency,
        type: "TRANSFER",
        categoryId: input.categoryId,
        walletId: input.walletId,
        toWalletId: input.toWalletId,
        feeMinor,
        channel: input.mode === "CASH_IN" ? "MANUAL" : input.channel,
        cashIn: input.mode === "CASH_IN" ? true : undefined,
        cashInProvider: input.mode === "CASH_IN" ? input.provider.trim() || undefined : undefined,
        cashInFeeBps: input.mode === "CASH_IN" && input.feeMode === "PERCENT" ? convenienceFeeMinor(10000, "PERCENT", input.feeValue) : undefined,
        customLabels: input.customLabels,
      }),
    };
  }
  if (input.mode === "SUBSCRIPTION") {
    const amountMinor = parseMinorInput(input.amount);
    return { kind: "SUBSCRIPTION", subscription: subscriptionSchema.parse({ id: input.id("subscription"), title, amountMinor, currency, billingCycle: input.cycle, nextBillingDate: input.date, billingAnchorDate: input.date, active: true, autoLog: input.autoLog, categoryId: input.categoryId, walletId: input.walletId, customLabels: input.customLabels }) };
  }
  if (input.mode === "LOAN" || input.mode === "INSTALLMENT") {
    const totalMinor = parseMinorInput(input.amount);
    const paymentMinor = parseMinorInput(input.paymentAmount);
    if (!input.walletId) throw new Error("Choose a repayment wallet.");
    if (paymentMinor > totalMinor) throw new Error("Scheduled payment cannot exceed the total obligation.");
    return { kind: "INVOICE", items: [], invoice: invoiceSchema.parse({
      id: input.id("invoice"), title, direction: "PAYABLE", dueDate: input.date,
      status: input.date < input.today ? "OVERDUE" : "PENDING", subtotalMinor: totalMinor,
      taxMinor: 0, discountMinor: 0, totalMinor, paidMinor: 0, currency, itemIds: [], categoryId: input.categoryId,
      obligation: { kind: input.mode, paymentMinor, cycle: input.cycle, firstDueDate: input.date, walletId: input.walletId },
      customLabels: input.customLabels,
    }) };
  }
  if (input.mode !== "INVOICE") throw new Error("Unsupported entry mode");
  dateOnlySchema.parse(input.dueDate);
  const amountMinor = input.lines.length ? 0 : parseMinorInput(input.amount);
  const lines = input.lines.length ? input.lines : [{ description: title, quantity: 1, unitPriceMinor: amountMinor }];
  const calculated = calculateInvoice({ items: lines, taxRateBps: input.taxRateBps, discountMinor: input.discountMinor, paidMinor: 0, dueDate: input.dueDate, currentDate: input.today, draft: false });
  const invoiceId = input.id("invoice");
  const items = lines.map((line) => invoiceItemSchema.parse({ ...line, id: input.id("item"), invoiceId }));
  const invoice = invoiceSchema.parse({ id: invoiceId, title, direction: input.direction, dueDate: input.dueDate, status: calculated.status, subtotalMinor: calculated.subtotalMinor, taxMinor: calculated.taxMinor, discountMinor: calculated.discountMinor, totalMinor: calculated.totalMinor, paidMinor: 0, currency, itemIds: items.map((item) => item.id), categoryId: input.categoryId, customLabels: input.customLabels });
  return { kind: "INVOICE", invoice, items };
}
