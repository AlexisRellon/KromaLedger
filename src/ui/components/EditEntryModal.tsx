import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatWalletLabel, type Category, type Transaction, type Wallet, type TransferChannel } from "../../core/models";
import { detectTransferFee } from "../../core/engine/transferFees";
import { blockInvalidNumberKeys, sanitizeMoneyInput, parseMinorInput } from "../../core/engine/moneyInput";
import { VoltButton } from "../primitives";

export function EditEntryModal({
  transaction,
  categories,
  wallets,
  onClose,
  onSave,
  onDelete,
}: {
  transaction: Transaction;
  categories: Category[];
  wallets: Wallet[];
  onClose: () => void;
  onSave: (value: Transaction) => Promise<void>;
  onDelete?: (id: string) => void;
}) {
  const isTransfer = transaction.type === "TRANSFER";
  const [title, setTitle] = useState(transaction.title);
  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    transaction.amountMinor < 0 || transaction.type === "EXPENSE" || transaction.type === "SUBSCRIPTION_PAYMENT"
      ? "EXPENSE"
      : "INCOME"
  );
  const [toWalletId, setToWalletId] = useState(transaction.toWalletId ?? "");
  const [feeMinor, setFeeMinor] = useState(transaction.feeMinor ?? 0);
  const [channel, setChannel] = useState<TransferChannel>(transaction.channel ?? "INSTAPAY");
  const [amountStr, setAmountStr] = useState(
    (Math.abs(transaction.amountMinor) / 100).toFixed(2)
  );
  const [date, setDate] = useState(transaction.date);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [walletId, setWalletId] = useState(transaction.walletId ?? "");
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const parsedAmountMinor = useMemo(() => {
    try {
      return parseMinorInput(amountStr);
    } catch {
      return 0;
    }
  }, [amountStr]);

  const signedAmountMinor = type === "EXPENSE" ? -parsedAmountMinor : parsedAmountMinor;

  const originalWallet = useMemo(
    () => wallets.find((w) => w.id === transaction.walletId),
    [wallets, transaction.walletId]
  );

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.id === walletId),
    [wallets, walletId]
  );

  const fromWallet = selectedWallet;
  const targetWallet = useMemo(
    () => wallets.find((w) => w.id === toWalletId),
    [wallets, toWalletId]
  );

  const feeDetection = useMemo(() => {
    if (!isTransfer) return null;
    return detectTransferFee({
      origin: fromWallet?.institution || fromWallet?.name,
      destination: targetWallet?.institution || targetWallet?.name,
      channel,
    });
  }, [isTransfer, fromWallet, targetWallet, channel]);

  const handleOriginChange = (newOriginId: string) => {
    setWalletId(newOriginId);
    const originW = wallets.find((w) => w.id === newOriginId);
    const autoFee = detectTransferFee({
      origin: originW?.institution || originW?.name,
      destination: targetWallet?.institution || targetWallet?.name,
      channel,
    }).feeMinor;
    setFeeMinor(autoFee);
  };

  const handleDestinationChange = (newDestId: string) => {
    setToWalletId(newDestId);
    const destW = wallets.find((w) => w.id === newDestId);
    const autoFee = detectTransferFee({
      origin: fromWallet?.institution || fromWallet?.name,
      destination: destW?.institution || destW?.name,
      channel,
    }).feeMinor;
    setFeeMinor(autoFee);
  };

  const handleChannelChange = (newChannel: TransferChannel) => {
    setChannel(newChannel);
    const autoFee = detectTransferFee({
      origin: fromWallet?.institution || fromWallet?.name,
      destination: targetWallet?.institution || targetWallet?.name,
      channel: newChannel,
    }).feeMinor;
    setFeeMinor(autoFee);
  };

  // Real-time calculation of wallet balance change
  const walletImpact = useMemo(() => {
    const origWId = transaction.walletId;
    const newWId = walletId || undefined;

    if (origWId === newWId) {
      if (!newWId || !selectedWallet) return null;
      const delta = signedAmountMinor - transaction.amountMinor;
      const projected = selectedWallet.balanceMinor + delta;
      return {
        type: "SAME_WALLET" as const,
        walletName: formatWalletLabel(selectedWallet),
        delta,
        projected,
      };
    }

    return {
      type: "DIFFERENT_WALLETS" as const,
      origWalletName: originalWallet ? formatWalletLabel(originalWallet) : null,
      origRefund: -transaction.amountMinor,
      origProjected: originalWallet ? originalWallet.balanceMinor - transaction.amountMinor : null,
      newWalletName: selectedWallet ? formatWalletLabel(selectedWallet) : null,
      newAddition: signedAmountMinor,
      newProjected: selectedWallet ? selectedWallet.balanceMinor + signedAmountMinor : null,
    };
  }, [transaction, walletId, selectedWallet, originalWallet, signedAmountMinor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title.");
      return;
    }
    if (parsedAmountMinor <= 0) {
      setError("Please provide an amount greater than 0.");
      return;
    }
    if (isTransfer) {
      if (!walletId || !toWalletId) {
        setError("Both source and destination accounts are required.");
        return;
      }
      if (walletId === toWalletId) {
        setError("Source and destination accounts must be different.");
        return;
      }
    }

    setBusy(true);
    setError("");

    try {
      const updated: Transaction = {
        ...transaction,
        title: title.trim(),
        amountMinor: isTransfer ? parsedAmountMinor : signedAmountMinor,
        type: transaction.type === "SUBSCRIPTION_PAYMENT" ? "SUBSCRIPTION_PAYMENT" : isTransfer ? "TRANSFER" : type,
        date,
        categoryId: isTransfer ? undefined : categoryId || undefined,
        walletId: walletId || undefined,
        toWalletId: isTransfer ? toWalletId : undefined,
        feeMinor: isTransfer ? feeMinor : undefined,
        channel: isTransfer ? channel : undefined,
        notes: notes.trim() || undefined,
      };
      await onSave(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
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
        aria-label="Edit entry"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] shadow-2xl animate-entrance"
      >
        {/* Modal Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6 sm:py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Edit Entry</h2>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              {transaction.id}
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
          {/* Outflow vs Inflow Segmented Control OR Transfer Header */}
          {isTransfer ? (
            <div className="flex items-center justify-between rounded-xl bg-cyan-500/10 p-3 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <span>Inter-Account Transfer</span>
              </div>
              <span className="font-mono text-xs text-neutral-300">
                {channel} • Fee: {formatCurrency(feeMinor, transaction.currency)}
              </span>
            </div>
          ) : (
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  type === "EXPENSE"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Expense (Outflow −)
              </button>
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  type === "INCOME"
                    ? "bg-[#D9F938]/20 text-[#D9F938] border border-[#D9F938]/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Income (Inflow +)
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GrabCar Commute"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
            />
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                Amount ({transaction.currency || "PHP"})
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
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
              />
            </div>
          </div>

          {isTransfer ? (
            <div className="space-y-3.5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Transfer From (Source)
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#161814] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Transfer To (Destination)
                  </label>
                  <select
                    value={toWalletId}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#161814] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === walletId}>
                        {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/[0.06]">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Channel
                  </label>
                  <div className="mt-1.5 flex rounded-lg border border-white/10 bg-black/30 p-0.5">
                    {(["INSTAPAY", "PESONET"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleChannelChange(ch)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                          channel === ch
                            ? "bg-white text-black shadow-sm"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {ch === "INSTAPAY" ? "InstaPay" : "PESONet"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Transfer Fee (₱)
                    </label>
                    {feeDetection && (
                      <span className="text-[10px] font-mono text-[#D9F938]">
                        {feeDetection.reason}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(feeMinor / 100).toString()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFeeMinor(Number.isFinite(val) && val >= 0 ? Math.round(val * 100) : 0);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#161814] px-3.5 py-2 font-mono text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Category */}
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

              {/* Connected Wallet Selector */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Connected Wallet
                  </label>
                  <span className="text-xs text-[#D9F938]/80 font-mono">
                    {selectedWallet ? `Bal: ${formatCurrency(selectedWallet.balanceMinor, selectedWallet.currency)}` : "Unlinked"}
                  </span>
                </div>

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
                          ? "border-[#D9F938] bg-[#D9F938]/15 text-[#D9F938] font-semibold shadow-sm"
                          : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: w.color || "#D9F938" }}
                      />
                      <span>{formatWalletLabel(w)}</span>
                      <span className="font-mono text-neutral-400 text-[10px]">
                        ({formatCurrency(w.balanceMinor, w.currency)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Wallet Sync Feedback Card */}
              {walletImpact && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-xs text-neutral-300">
                  <div className="flex items-center gap-1.5 text-[#D9F938] font-semibold">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Automatic Wallet Sync Preview</span>
                  </div>

                  {walletImpact.type === "SAME_WALLET" ? (
                    <p className="mt-1 text-neutral-300">
                      {walletImpact.delta === 0 ? (
                        <span>No net change to <strong className="text-white">{walletImpact.walletName}</strong>.</span>
                      ) : (
                        <span>
                          <strong className="text-white">{walletImpact.walletName}</strong> balance will adjust by{" "}
                          <span className={`font-mono font-bold ${walletImpact.delta > 0 ? "text-[#D9F938]" : "text-rose-400"}`}>
                            {walletImpact.delta > 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(walletImpact.delta))}
                          </span>
                          {" "}→ Projected balance:{" "}
                          <span className="font-mono font-semibold text-white">
                            {formatCurrency(walletImpact.projected)}
                          </span>
                        </span>
                      )}
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {walletImpact.origWalletName && (
                        <p>
                          Revert <strong className="text-white">{walletImpact.origWalletName}</strong> by{" "}
                          <span className="font-mono text-[#D9F938]">
                            {walletImpact.origRefund >= 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(walletImpact.origRefund))}
                          </span>
                          {walletImpact.origProjected !== null && (
                            <span> → {formatCurrency(walletImpact.origProjected)}</span>
                          )}
                        </p>
                      )}
                      {walletImpact.newWalletName ? (
                        <p>
                          Apply to <strong className="text-white">{walletImpact.newWalletName}</strong>:{" "}
                          <span className={`font-mono ${walletImpact.newAddition >= 0 ? "text-[#D9F938]" : "text-rose-400"}`}>
                            {walletImpact.newAddition >= 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(walletImpact.newAddition))}
                          </span>
                          {walletImpact.newProjected !== null && (
                            <span> → {formatCurrency(walletImpact.newProjected)}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-neutral-400 italic">No wallet will be linked to this entry.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Reimbursement pending"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#D9F938]/60 transition"
            />
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
                onClick={() => onDelete(transaction.id)}
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
