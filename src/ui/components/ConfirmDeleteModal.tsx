import { useState } from "react";
import { formatCurrency } from "../../core/models";
import { Button, ModalShell } from "../primitives";

export function ConfirmDeleteModal({
  title,
  amountMinor,
  currency = "PHP",
  walletName,
  isSubscription = false,
  isInvoice = false,
  entityLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  amountMinor?: number;
  currency?: string;
  walletName?: string;
  isSubscription?: boolean;
  isInvoice?: boolean;
  entityLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const entityType = entityLabel || (isSubscription ? "subscription" : isInvoice ? "invoice" : "entry");

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={`Remove ${entityType}?`}
      busy={busy}
      maxWidth="sm"
      footer={
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={handleConfirm}
            className="flex-1"
          >
            {busy ? "Removing…" : "Confirm Delete"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg,#FFE4E6)] text-[var(--status-danger-text,#BE123C)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </div>

        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Are you sure you want to permanently remove <strong className="font-bold text-[var(--text-primary)]">“{title}”</strong>?
        </p>

        {amountMinor !== undefined && walletName && (
          <div className="w-full rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg,#FEF3C7)] p-3.5 text-xs leading-relaxed text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
            <span className="font-bold text-[var(--status-warning-text,#92400E)]">Wallet sync notice:</span> The connected wallet{" "}
            <strong className="font-bold text-[var(--text-primary)]">{walletName}</strong> balance will be automatically restored by{" "}
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {amountMinor < 0 ? "+" : "−"}
              {formatCurrency(Math.abs(amountMinor), currency)}
            </span>
            .
          </div>
        )}
      </div>
    </ModalShell>
  );
}
