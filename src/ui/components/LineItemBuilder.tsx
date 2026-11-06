import { useMemo, useRef, useState } from "react";
import {
  addLineItem,
  lineTotalMinor,
  previewLineItems,
  removeLineItem,
  type LineItemDraft,
} from "../../core/engine/lineItemWorkflow";
import {
  blockInvalidNumberKeys,
  parseMinorInput,
  sanitizeMoneyInput,
  sanitizeQuantityInput,
} from "../../core/engine/moneyInput";
import { formatCurrency } from "../../core/models";
import { Button, Input } from "../primitives";

export type LineDraft = LineItemDraft;

export function LineItemBuilder({
  lines,
  onChange,
  taxRateBps,
  discountMinor,
  onTaxChange,
  onDiscountChange,
  dueDate,
  draft: externalDraft,
  onDraftChange,
  onAddDraft,
  descriptionInputRef,
}: {
  lines: LineDraft[];
  onChange(value: LineDraft[]): void;
  taxRateBps: number;
  discountMinor: number;
  onTaxChange(value: number): void;
  onDiscountChange(value: number): void;
  dueDate: string;
  draft?: { description: string; quantity: string; unitPrice: string };
  onDraftChange?: (draft: { description: string; quantity: string; unitPrice: string }) => void;
  onAddDraft?: () => void;
  descriptionInputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const internalDescRef = useRef<HTMLInputElement>(null);
  const descRef = descriptionInputRef ?? internalDescRef;
  const [internalDraft, setInternalDraft] = useState({ description: "", quantity: "1", unitPrice: "" });
  const [lineError, setLineError] = useState("");

  const draft = externalDraft ?? internalDraft;
  const updateDraft = (next: { description: string; quantity: string; unitPrice: string }) => {
    if (onDraftChange) onDraftChange(next);
    else setInternalDraft(next);
    if (lineError) setLineError("");
  };

  const total = useMemo(() => {
    try {
      return previewLineItems(lines, { taxRateBps, discountMinor, dueDate, currentDate: dueDate });
    } catch {
      return null;
    }
  }, [lines, taxRateBps, discountMinor, dueDate]);

  const addLine = () => {
    setLineError("");
    const trimmedDesc = draft.description.trim();
    if (!trimmedDesc) {
      setLineError("Description is required");
      descRef.current?.focus();
      return;
    }
    const quantity = Number(draft.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setLineError("Quantity must be above zero");
      return;
    }
    let unitPriceMinor = 0;
    try {
      unitPriceMinor = parseMinorInput(draft.unitPrice);
    } catch {
      setLineError("Enter a valid price above zero");
      return;
    }

    try {
      onChange(
        addLineItem(
          lines,
          {
            description: trimmedDesc,
            quantity,
            unitPriceMinor,
          },
          () => crypto.randomUUID()
        )
      );
      updateDraft({ description: "", quantity: "1", unitPrice: "" });
      descRef.current?.focus();
      if (onAddDraft) onAddDraft();
    } catch (err) {
      setLineError(err instanceof Error ? err.message : "Could not add item");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLine();
    }
  };

  return (
    <div className="mt-4 rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-4 shadow-[3px_3px_0px_#18181B]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-neutral-900">Invoice line items</h3>
        <span className="font-mono text-xs font-bold text-neutral-600">{lines.length} lines</span>
      </div>

      <div className="space-y-2 mb-3">
        {lines.map((line) => (
          <div
            key={line.id}
            className="flex items-center justify-between gap-3 text-xs py-1.5 px-2 rounded-xl border border-neutral-300 bg-white shadow-[1px_1px_0px_#18181B] transition"
          >
            <span className="min-w-0 flex-1 truncate font-semibold text-neutral-900">
              {line.description}{" "}
              <span className="font-mono text-neutral-500">× {line.quantity}</span>
            </span>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-mono text-xs font-black text-neutral-900 tabular-nums text-right min-w-[5.5rem]">
                {formatCurrency(lineTotalMinor(line))}
              </span>
              <button
                type="button"
                aria-label={`Remove ${line.description}`}
                onClick={() => onChange(removeLineItem(lines, line.id))}
                className="grid h-5 w-5 place-items-center rounded-md text-neutral-500 hover:bg-rose-100 hover:text-[#BE123C] transition cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_4.5rem_6rem_auto] gap-2">
        <Input
          ref={descRef}
          aria-label="Line description"
          value={draft.description}
          onChange={(e) => updateDraft({ ...draft, description: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Description"
          className="text-xs py-2"
        />
        <Input
          aria-label="Quantity"
          type="text"
          inputMode="decimal"
          value={draft.quantity}
          onKeyDown={(e) => {
            blockInvalidNumberKeys(e, true);
            handleKeyDown(e);
          }}
          onChange={(e) => updateDraft({ ...draft, quantity: sanitizeQuantityInput(e.target.value) })}
          placeholder="Qty"
          className="font-mono text-xs text-right py-2"
        />
        <Input
          aria-label="Unit price"
          type="text"
          inputMode="decimal"
          value={draft.unitPrice}
          onKeyDown={(e) => {
            blockInvalidNumberKeys(e, true);
            handleKeyDown(e);
          }}
          onChange={(e) => updateDraft({ ...draft, unitPrice: sanitizeMoneyInput(e.target.value) })}
          placeholder="₱ unit"
          className="font-mono text-xs text-right py-2"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={addLine}
          aria-label="Add line item"
          title="Add line item"
          className="!p-2 h-9 w-9 rounded-xl"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Button>
      </div>

      {lineError && (
        <p className="mt-1.5 text-xs text-[#BE123C] font-bold">{lineError}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          TAX %
          <Input
            type="text"
            inputMode="decimal"
            value={taxRateBps === 0 ? "" : String(taxRateBps / 100)}
            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
            onChange={(e) => {
              const sanitized = sanitizeMoneyInput(e.target.value);
              onTaxChange(Math.round(Number(sanitized || 0) * 100));
            }}
            placeholder="0.00"
            className="mt-1 font-mono text-xs text-right py-1.5"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          DISCOUNT ₱
          <Input
            type="text"
            inputMode="decimal"
            value={discountMinor === 0 ? "" : String(discountMinor / 100)}
            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
            onChange={(e) => {
              const sanitized = sanitizeMoneyInput(e.target.value);
              onDiscountChange(Math.round(Number(sanitized || 0) * 100));
            }}
            placeholder="0.00"
            className="mt-1 font-mono text-xs text-right py-1.5"
          />
        </label>
      </div>

      {total && (
        <div className="mt-3.5 flex items-baseline justify-between border-t-2 border-neutral-200 pt-3 text-sm">
          <span className="text-xs font-semibold text-neutral-600">
            Subtotal {formatCurrency(total.subtotalMinor)} · tax {formatCurrency(total.taxMinor)}
          </span>
          <strong className="font-mono text-sm font-black text-neutral-900 tabular-nums text-right">
            {formatCurrency(total.totalMinor)}
          </strong>
        </div>
      )}
    </div>
  );
}
