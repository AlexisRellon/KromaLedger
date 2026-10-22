import { useEffect, useState } from "react";
import { formatCurrency } from "../../core/models";

export function ConfirmDeleteModal({
  title,
  amountMinor,
  currency = "PHP",
  walletName,
  isSubscription = false,
  isInvoice = false,
  onConfirm,
  onClose,
}: {
  title: string;
  amountMinor?: number;
  currency?: string;
  walletName?: string;
  isSubscription?: boolean;
  isInvoice?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const entityType = isSubscription ? "subscription" : isInvoice ? "invoice" : "entry";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Confirm deletion"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] shadow-2xl animate-entrance"
      >
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>

          <h3 className="mt-4 font-display text-xl font-bold text-white">
            Remove {entityType}?
          </h3>

          <p className="mt-2 text-sm text-neutral-300">
            Are you sure you want to permanently remove <strong className="text-white">“{title}”</strong>?
          </p>

          {amountMinor !== undefined && walletName && (
            <div className="mt-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-neutral-300">
              <span className="font-semibold text-[#D9F938]">Wallet sync notice:</span> The connected wallet{" "}
              <strong className="text-white">{walletName}</strong> balance will be automatically restored by{" "}
              <span className="font-mono font-semibold text-white">
                {amountMinor < 0 ? "+" : "−"}
                {formatCurrency(Math.abs(amountMinor), currency)}
              </span>
              .
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 flex gap-2.5 border-t border-white/[0.08] bg-[#11120f] px-5 py-3.5 sm:px-6 sm:py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConfirm()}
            className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/15 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/25 active:scale-95 disabled:opacity-50"
          >
            {busy ? "Removing…" : "Remove"}
          </button>
        </div>
      </section>
    </div>
  );
}
