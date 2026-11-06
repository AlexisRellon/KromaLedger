import { formatCurrency, type Invoice, type Subscription, type Transaction, type Wallet } from "../models";
import { calculateFeeLeakage } from "./cashflowAnalytics";

export function buildDailyInsight({ today, currency, name, wallets, invoices, subscriptions, transactions }: {
  today: string;
  currency: string;
  name?: string;
  wallets: Wallet[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  transactions: Transaction[];
}) {
  const greeting = name?.trim() ? `${name.trim()}, ` : "";
  const month = today.slice(0, 7);
  const monthEnd = `${month}-31`;
  const unpaid = invoices.filter((i) => !i.obligation && i.currency === currency && i.direction === "PAYABLE" && i.status !== "PAID" && i.status !== "DRAFT" && i.dueDate <= monthEnd);
  const due = unpaid.reduce((sum, i) => sum + Math.max(0, i.totalMinor - i.paidMinor), 0);
  const subs = subscriptions.filter((s) => s.currency === currency && s.active && s.nextBillingDate <= monthEnd);
  const commitments = due + subs.reduce((sum, s) => sum + s.amountMinor, 0);
  const matchingWallets = wallets.filter((w) => w.currency === currency);
  const balance = matchingWallets.reduce((sum, w) => sum + w.balanceMinor, 0);
  const amount = (minor: number) => formatCurrency(minor, currency);
  const overdue = unpaid.filter((i) => i.dueDate < today).reduce((sum, i) => sum + Math.max(0, i.totalMinor - i.paidMinor), 0);
  const fees = calculateFeeLeakage(transactions.filter((t) => t.currency === currency && t.date.startsWith(month) && t.date <= today && (t.type === "TRANSFER" || t.cashIn)).map((t) => ({ kind: t.cashIn ? "EWALLET_CASH_IN" as const : "TRANSFER" as const, feeMinor: t.feeMinor })));

  let message: string;
  if (matchingWallets.length && commitments > balance) {
    message = `${greeting}your recorded balance is ${amount(commitments - balance)} short of regular bills and subscriptions due by month-end. Let's make a plan.`;
  } else if (overdue > 0) {
    message = `${greeting}you have ${amount(overdue)} in overdue payments. Let's take a look together.`;
  } else if (commitments > 0) {
    message = `${greeting}${amount(commitments)} in regular bills and subscriptions is due by month-end. You've got this!`;
  } else if (fees.totalFeesLostPhp > 0) {
    message = `${greeting}you've paid ${amount(Math.round(fees.totalFeesLostPhp * 100))} in transfer and cash-in fees this month. Small savings can add up!`;
  } else if (matchingWallets.length) {
    message = `${greeting}your ${currency} wallets hold ${amount(balance)}. Nice work keeping an eye on your money!`;
  } else {
    message = `${greeting}welcome! Add a wallet or record an entry, and I'll help you keep track of your money.`;
  }
  return { message, question: `Please explain this daily insight and suggest a useful next step: ${message}` };
}
