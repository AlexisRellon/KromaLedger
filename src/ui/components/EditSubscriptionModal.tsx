import { useEffect, useState } from "react";
import { formatWalletLabel, type Category, type Subscription, type Wallet } from "../../core/models";
import { blockInvalidNumberKeys, parseMinorInput, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import { VoltButton } from "../primitives";

export function EditSubscriptionModal({
  subscription,
  categories,
  wallets,
  onClose,
  onSave,
  onDelete,
}: {
  subscription: Subscription;
  categories: Category[];
  wallets: Wallet[];
  onClose: () => void;
  onSave: (value: Subscription) => Promise<void>;
  onDelete?: (id: string) => void;
}) {
  const [title, setTitle] = useState(subscription.title);
  const [amountStr, setAmountStr] = useState(
    (subscription.amountMinor / 100).toFixed(2)
  );
  const [billingCycle, setBillingCycle] = useState(subscription.billingCycle);
  const [nextBillingDate, setNextBillingDate] = useState(subscription.nextBillingDate);
  const [autoLog, setAutoLog] = useState(subscription.autoLog);
  const [active, setActive] = useState(subscription.active);
  const [categoryId, setCategoryId] = useState(subscription.categoryId ?? "");
  const [walletId, setWalletId] = useState(subscription.walletId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title.");
      return;
    }

    let minor = 0;
    try {
      minor = parseMinorInput(amountStr);
    } catch {
      setError("Please provide a valid amount.");
      return;
    }
    if (minor <= 0) {
      setError("Please provide an amount greater than 0.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const updated: Subscription = {
        ...subscription,
        title: title.trim(),
        amountMinor: minor,
        billingCycle,
        nextBillingDate,
        autoLog,
        active,
        categoryId: categoryId || undefined,
        walletId: walletId || undefined,
      };
      await onSave(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subscription.");
    } finally {
      setBusy(false);
    }
  };

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
        aria-label="Edit subscription"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] shadow-2xl animate-entrance"
      >
        {/* Modal Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6 sm:py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Edit Subscription</h2>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              {subscription.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-white/5 p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
              Subscription Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
            />
          </div>

          {/* Amount & Cycle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                Amount ({subscription.currency || "PHP"})
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-neutral-400">
                  ₱
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amountStr}
                  onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                  onChange={(e) => setAmountStr(sanitizeMoneyInput(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-3.5 py-2.5 font-mono text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#161814] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          {/* Next billing date & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                Next Billing Date
              </label>
              <input
                type="date"
                required
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#161814] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Connected Wallet */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
              Connected Wallet (Auto-charged on payment)
            </label>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setWalletId("")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  walletId === ""
                    ? "border-white/40 bg-white/15 text-white font-semibold"
                    : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
                }`}
              >
                <span>None / Unlinked</span>
              </button>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    walletId === w.id
                      ? "border-[#D9F938] bg-[#D9F938]/15 text-[#D9F938] font-semibold"
                      : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: w.color || "#D9F938" }}
                  />
                  <span>{formatWalletLabel(w)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Log & Active toggles */}
          <div className="grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLog}
                onChange={(e) => setAutoLog(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D9F938]"
              />
              <span className="text-xs text-neutral-300">Auto-log payments</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D9F938]"
              />
              <span className="text-xs text-neutral-300">Active subscription</span>
            </label>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}

          </div>

          {/* Footer Actions (Fixed) */}
          <div className="shrink-0 flex items-center justify-between border-t border-white/[0.08] bg-[#11120f] px-5 py-3.5 sm:px-6 sm:py-4">
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(subscription.id)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                <span>Remove</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <VoltButton type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save Changes"}
              </VoltButton>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
