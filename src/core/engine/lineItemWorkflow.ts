import { invoiceItemSchema } from "../models";
import { calculateInvoice, type InvoiceCalculationInput, type InvoiceCalculation } from "./invoiceCalculator";

export type LineItemDraft = { id: string; description: string; quantity: number; unitPriceMinor: number };
type NewLine = Omit<LineItemDraft, "id">;

export function lineTotalMinor(line: Pick<LineItemDraft, "quantity" | "unitPriceMinor">): number {
  if (!Number.isFinite(line.quantity) || line.quantity <= 0 || Math.abs(line.quantity * 1000 - Math.round(line.quantity * 1000)) > 1e-7) throw new RangeError("Quantity must be positive with at most three decimal places");
  const quantityMilli = Math.round(line.quantity * 1000);
  if (!Number.isSafeInteger(quantityMilli) || !Number.isSafeInteger(line.unitPriceMinor) || line.unitPriceMinor < 0) throw new RangeError("Line values are outside the supported range");
  const total = (BigInt(line.unitPriceMinor) * BigInt(quantityMilli) + 500n) / 1000n;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Line total exceeds safe integer range");
  return Number(total);
}

function validateLine(line: LineItemDraft): LineItemDraft {
  return invoiceItemSchema.omit({ invoiceId: true }).parse({ ...line, description: line.description.trim() });
}

export function addLineItem(lines: LineItemDraft[], draft: NewLine, nextId: () => string): LineItemDraft[] {
  const line = validateLine({ ...draft, id: nextId() });
  return [...lines, line];
}

export function updateLineItem(lines: LineItemDraft[], id: string, changes: Partial<NewLine>): LineItemDraft[] {
  let found = false;
  const updated = lines.map((line) => {
    if (line.id !== id) return line;
    found = true;
    return validateLine({ ...line, ...changes });
  });
  if (!found) throw new RangeError(`Unknown invoice line: ${id}`);
  return updated;
}

export function removeLineItem(lines: LineItemDraft[], id: string): LineItemDraft[] {
  if (!lines.some((line) => line.id === id)) throw new RangeError(`Unknown invoice line: ${id}`);
  return lines.filter((line) => line.id !== id);
}

export function previewLineItems(lines: LineItemDraft[], options: Omit<InvoiceCalculationInput, "items" | "paidMinor" | "draft">): InvoiceCalculation {
  if (!lines.length) throw new RangeError("An invoice preview needs at least one line.");
  return calculateInvoice({ ...options, items: lines, paidMinor: 0, draft: true });
}
