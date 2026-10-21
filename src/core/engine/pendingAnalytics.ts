import { dateOnlySchema, transactionSchema, type Invoice, type Subscription, type Transaction } from "../models";
import { parseMinorInput } from "./moneyInput";

export function selectPendingOverview(today: string, throughDate: string, data: { subscriptions: Subscription[]; invoices: Invoice[] }) {
  dateOnlySchema.parse(today);
  dateOnlySchema.parse(throughDate);
  const subscriptions = data.subscriptions.filter((row) => row.active && (row.autoLog ? row.nextBillingDate >= today : true) && row.nextBillingDate <= throughDate).sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
  const invoices = data.invoices.filter((row) => row.status !== "PAID" && row.dueDate >= today && row.dueDate <= throughDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const partials = data.invoices.filter((row) => row.paidMinor > 0 && row.paidMinor < row.totalMinor);
  return { subscriptions, invoices, partials };
}


export function buildInvoicePayment(invoice: Invoice, amount: string, date: string, id: string, walletId?: string): Transaction {
  dateOnlySchema.parse(date);
  const minor = parseMinorInput(amount);
  const remaining = invoice.totalMinor - invoice.paidMinor;
  if (invoice.status === "PAID" || remaining <= 0 || minor > remaining) throw new Error("Payment exceeds the invoice balance.");
  return transactionSchema.parse({
    id,
    date,
    title: `${invoice.title} payment`,
    amountMinor: invoice.direction === "RECEIVABLE" ? minor : -minor,
    currency: invoice.currency,
    type: invoice.direction === "RECEIVABLE" ? "INCOME" : "EXPENSE",
    invoiceId: invoice.id,
    walletId: walletId || undefined,
  });
}
