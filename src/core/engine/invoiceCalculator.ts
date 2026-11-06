import { dateOnlySchema, type Invoice } from "../models";

export interface InvoiceCalculationInput {
  items: Array<{ description: string; quantity: number; unitPriceMinor: number }>;
  taxRateBps: number;
  discountMinor: number;
  paidMinor: number;
  dueDate: string;
  currentDate: string;
  draft: boolean;
}

export interface InvoiceCalculation {
  subtotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  paidMinor: number;
  remainingMinor: number;
  status: Invoice["status"];
}

function safeMinor(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("Money must be a non-negative safe integer in minor units");
  return value;
}

export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculation {
  if (!dateOnlySchema.safeParse(input.dueDate).success || !dateOnlySchema.safeParse(input.currentDate).success) throw new RangeError("Invoice dates must be real ISO calendar dates");
  if (!Number.isSafeInteger(input.taxRateBps) || input.taxRateBps < 0) throw new RangeError("Tax rate must be non-negative basis points");
  const subtotalMinor = input.items.reduce((sum, item) => {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || Math.abs(item.quantity * 1000 - Math.round(item.quantity * 1000)) > 1e-7) throw new RangeError("Quantity must be positive with at most three decimal places");
    const quantityMilli = Math.round(item.quantity * 1000);
    if (!Number.isSafeInteger(quantityMilli)) throw new RangeError("Quantity is outside the supported range");
    const lineMinor = (BigInt(safeMinor(item.unitPriceMinor)) * BigInt(quantityMilli) + 500n) / 1000n;
    if (lineMinor > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Line total exceeds safe integer range");
    return safeMinor(sum + Number(lineMinor));
  }, 0);
  const discountMinor = safeMinor(input.discountMinor);
  if (discountMinor > subtotalMinor) throw new RangeError("Discount cannot exceed subtotal");
  const taxableMinor = subtotalMinor - discountMinor;
  const taxMinorBig = (BigInt(taxableMinor) * BigInt(input.taxRateBps) + 5000n) / 10000n;
  if (taxMinorBig > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Tax exceeds safe integer range");
  const taxMinor = Number(taxMinorBig);
  const totalMinor = safeMinor(taxableMinor + taxMinor);
  const paidMinor = safeMinor(input.paidMinor);
  if (paidMinor > totalMinor) throw new RangeError("Payment cannot exceed invoice total");
  const remainingMinor = totalMinor - paidMinor;
  const status: Invoice["status"] = input.draft ? "DRAFT" : remainingMinor === 0 ? "PAID" : input.currentDate > input.dueDate ? "OVERDUE" : paidMinor > 0 ? "PARTIAL" : "PENDING";
  return { subtotalMinor, taxMinor, discountMinor, totalMinor, paidMinor, remainingMinor, status };
}

export function computeInvoiceTotals(
  lines: Array<{ qty: number; unitPrice: number }>,
  taxPercent: number,
  discountPhp: number
) {
  const subtotal = lines.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const taxAmount = subtotal * (Math.max(0, taxPercent) / 100);
  const grandTotal = Math.max(0, subtotal + taxAmount - Math.max(0, discountPhp));
  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

