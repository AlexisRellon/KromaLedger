import type { Invoice } from "../models";
import { parseUtcDate } from "./manilaDate";
import { cycleDate } from "./reconciler";

export function scheduledPaymentMinor(invoice: Invoice): number {
  const remaining = invoice.totalMinor - invoice.paidMinor;
  if (!invoice.obligation || remaining <= 0) return Math.max(0, remaining);
  const scheduled = invoice.obligation.paymentMinor;
  return Math.min(remaining, scheduled - invoice.paidMinor % scheduled);
}

export function obligationDueDate(invoice: Invoice, paidMinor: number): string {
  if (!invoice.obligation) return invoice.dueDate;
  const schedule = invoice.obligation;
  return cycleDate(parseUtcDate(schedule.firstDueDate), schedule.cycle,
    Math.floor(paidMinor / schedule.paymentMinor));
}
