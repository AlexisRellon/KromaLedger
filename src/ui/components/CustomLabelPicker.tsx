import { useState } from "react";

export interface CustomLabelPickerProps {
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
  draft: string;
  onDraftChange: (draft: string) => void;
  disabled?: boolean;
}

const PRESET_LABELS = ["#TaxDeductible", "#ClientWork", "#FixedCost"];

function normalizeLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function mergeCustomLabel(selectedLabels: string[], draft: string): string[] {
  const incoming = normalizeLabel(draft);
  if (!incoming || selectedLabels.some((label) => label.toLowerCase() === incoming.toLowerCase())) return selectedLabels;
  return [...selectedLabels, incoming];
}

export function CustomLabelPicker({ selectedLabels, onChange, draft, onDraftChange, disabled }: CustomLabelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const addLabels = () => {
    if (!draft.trim()) return;
    onChange(mergeCustomLabel(selectedLabels, draft));
    onDraftChange("");
    setIsOpen(false);
  };

  const removeLabel = (label: string) => {
    onChange(selectedLabels.filter((l) => l !== label));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedLabels.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full border-2 border-[#18181B] bg-white px-3 py-1 text-xs font-bold text-[#18181B] shadow-[2px_2px_0px_#18181B]"
        >
          {label}
          <button
            type="button"
            aria-label={`Remove label ${label}`}
            disabled={disabled}
            onClick={() => removeLabel(label)}
            className="font-mono text-xs leading-none text-[#18181B] transition hover:bg-[#FEF3C7] rounded-full disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            ×
          </button>
        </span>
      ))}

      {isOpen ? (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border-2 border-[#18181B] bg-[#FAF8F5] px-3 py-2 shadow-[2px_2px_0px_#18181B]">
          <input
            type="text"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLabels();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onDraftChange("");
                setIsOpen(false);
              }
            }}
            placeholder="e.g. TaxDeductible"
            aria-label="New custom label"
            autoFocus
            disabled={disabled}
            className="w-36 rounded-lg border-2 border-[#18181B] bg-white px-2 py-1 text-xs font-mono text-[#18181B] placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
          />
          {PRESET_LABELS.filter((preset) => !selectedLabels.some((l) => l.toLowerCase() === preset.toLowerCase())).map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => {
                const existing = new Set(selectedLabels.map((l) => l.toLowerCase()));
                if (!existing.has(preset.toLowerCase())) onChange([...selectedLabels, preset]);
                onDraftChange("");
                setIsOpen(false);
              }}
              className="rounded-full border-2 border-[#18181B] bg-white px-2.5 py-0.5 text-xs font-bold text-[#18181B] shadow-[1px_1px_0px_#18181B] transition hover:bg-[var(--theme-subtle)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {preset}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={addLabels}
            className="rounded-full border-2 border-[#18181B] bg-[var(--theme-primary)] px-3 py-0.5 text-xs font-bold text-[var(--theme-text-on-primary)] shadow-[1px_1px_0px_#18181B] transition hover:bg-[var(--theme-primary-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="rounded-full border-2 border-[#18181B] bg-[var(--theme-subtle)] px-3.5 py-1.5 text-xs font-bold text-[var(--theme-subtle-text)] shadow-[2px_2px_0px_#18181B] transition hover:brightness-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          + Custom Label
        </button>
      )}
    </div>
  );
}
