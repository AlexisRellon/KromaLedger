import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatWalletLabel, type Category, type Transaction, type Wallet, type TransferChannel } from "../../core/models";
import { detectTransferFee } from "../../core/engine/transferFees";
import { convenienceFeeMinor } from "../../core/engine/convenienceFee";
import { blockInvalidNumberKeys, sanitizeMoneyInput, parseMinorInput } from "../../core/engine/moneyInput";
import { Button, FormField, Input, ModalShell, Select } from "../primitives";
import { useSaveCategory } from "../../state/queries";

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
  const [fixedFeeMinor, setFeeMinor] = useState(transaction.feeMinor ?? 0);
  const [cashInFeeMode, setCashInFeeMode] = useState<"FIXED" | "PERCENT">(transaction.cashInFeeBps === undefined ? "FIXED" : "PERCENT");
  const [cashInFeeValue, setCashInFeeValue] = useState(((transaction.cashInFeeBps ?? transaction.feeMinor ?? 0) / 100).toFixed(2));
  const [channel, setChannel] = useState<TransferChannel>(transaction.channel ?? "INSTAPAY");
  const [amountStr, setAmountStr] = useState(
    (Math.abs(transaction.amountMinor) / 100).toFixed(2)
  );
  const [date, setDate] = useState(transaction.date);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [newCategory, setNewCategory] = useState("");
  const saveCategory = useSaveCategory();
  const [walletId, setWalletId] = useState(transaction.walletId ?? "");
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [cashInProvider, setCashInProvider] = useState(transaction.cashInProvider ?? "");
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
  let feeMinor = fixedFeeMinor;
  try { if (transaction.cashIn) feeMinor = convenienceFeeMinor(parsedAmountMinor, cashInFeeMode, cashInFeeValue); } catch { /* Validate on submit. */ }

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
    if (transaction.cashIn) return;
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
    if (transaction.cashIn) return;
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

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name || saveCategory.isPending) return;
    const existing = categories.find((category) => category.name.toLowerCase() === name.toLowerCase());
    const category = existing ?? { id: crypto.randomUUID(), name, type };
    try {
      if (!existing) await saveCategory.mutateAsync(category);
      setCategoryId(category.id);
      setNewCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    }
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
      let effectiveCategoryId = categoryId;
      const categoryName = !isTransfer ? newCategory.trim() : "";
      if (categoryName) {
        const existing = categories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase());
        const category = existing ?? { id: crypto.randomUUID(), name: categoryName, type };
        if (!existing) await saveCategory.mutateAsync(category);
        effectiveCategoryId = category.id;
        setCategoryId(category.id);
        setNewCategory("");
      }
      const validatedFee = transaction.cashIn ? convenienceFeeMinor(parsedAmountMinor, cashInFeeMode, cashInFeeValue) : feeMinor;
      const updated: Transaction = {
        ...transaction,
        title: title.trim(),
        amountMinor: isTransfer ? parsedAmountMinor : signedAmountMinor,
        type: transaction.type === "SUBSCRIPTION_PAYMENT" ? "SUBSCRIPTION_PAYMENT" : isTransfer ? "TRANSFER" : type,
        date,
        categoryId: isTransfer ? undefined : effectiveCategoryId || undefined,
        walletId: walletId || undefined,
        toWalletId: isTransfer ? toWalletId : undefined,
        feeMinor: isTransfer ? validatedFee : undefined,
        channel: transaction.cashIn ? "MANUAL" : isTransfer ? channel : undefined,
        notes: notes.trim() || undefined,
        cashInProvider: transaction.cashIn ? cashInProvider.trim() || undefined : undefined,
        cashInFeeBps: transaction.cashIn && cashInFeeMode === "PERCENT" ? convenienceFeeMinor(10000, "PERCENT", cashInFeeValue) : undefined,
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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Edit Entry"
      subtitle={transaction.id}
      busy={busy}
      footer={
        <div className="flex items-center justify-between">
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDelete(transaction.id)}
              disabled={busy}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              <span>Remove</span>
            </Button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-entry-modal-form"
              variant="primary"
              size="sm"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="edit-entry-modal-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Outflow vs Inflow Segmented Control OR Transfer Header */}
        {isTransfer ? (
          <div className="flex items-center justify-between rounded-2xl border-2 border-neutral-900 bg-[#E0F2FE] p-3.5 shadow-[2px_2px_0px_#18181B]">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
              <svg className="h-4 w-4 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span>{transaction.cashIn ? "E-wallet Cash-in" : "Inter-Account Transfer"}</span>
            </div>
            <span className="font-mono text-xs font-bold text-neutral-800">
              {channel} • Fee: {formatCurrency(feeMinor, transaction.currency)}
            </span>
          </div>
        ) : (
          <div className="flex rounded-2xl border-2 border-neutral-900 bg-[#F4F1EA] p-1 shadow-[2px_2px_0px_#18181B]">
            <button
              type="button"
              disabled={Boolean(transaction.invoiceId) || transaction.type === "SUBSCRIPTION_PAYMENT"}
              onClick={() => setType("EXPENSE")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                type === "EXPENSE"
                  ? "border-2 border-neutral-900 bg-[#FFE4E6] text-[#BE123C] shadow-[1px_1px_0px_#18181B]"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Expense (Outflow −)
            </button>
            <button
              type="button"
              disabled={Boolean(transaction.invoiceId) || transaction.type === "SUBSCRIPTION_PAYMENT"}
              onClick={() => setType("INCOME")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                type === "INCOME"
                  ? "border-2 border-neutral-900 bg-[#D1FAE5] text-[#047857] shadow-[1px_1px_0px_#18181B]"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Income (Inflow +)
            </button>
          </div>
        )}

        {/* Cash in provider */}
        {transaction.cashIn && (
          <FormField label="Cash-in provider">
            {({ id }) => (
              <Input
                id={id}
                value={cashInProvider}
                onChange={(e) => setCashInProvider(e.target.value)}
              />
            )}
          </FormField>
        )}

        {/* Title */}
        <FormField label="Title" required>
          {({ id }) => (
            <Input
              id={id}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GrabCar Commute"
            />
          )}
        </FormField>

        {/* Amount & Date in 2 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={`Amount (${transaction.currency || "PHP"})`} required>
            {({ id }) => (
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-neutral-500">
                  ₱
                </span>
                <Input
                  id={id}
                  type="text"
                  inputMode="decimal"
                  required
                  value={amountStr}
                  onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                  onChange={(e) => setAmountStr(sanitizeMoneyInput(e.target.value))}
                  className="pl-8 font-mono text-sm font-bold"
                />
              </div>
            )}
          </FormField>

          <FormField label="Date" required>
            {({ id }) => (
              <Input
                id={id}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </FormField>
        </div>

        {isTransfer ? (
          <div className="space-y-3.5 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-4 shadow-[3px_3px_0px_var(--shadow-ink)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Transfer From (Source)">
                {({ id }) => (
                  <Select
                    id={id}
                    value={walletId}
                    onChange={(e) => handleOriginChange(e.target.value)}
                  >
                    {wallets.filter((w) => !transaction.cashIn || w.type === "CASH").map((w) => (
                      <option key={w.id} value={w.id}>
                        {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField label="Transfer To (Destination)">
                {({ id }) => (
                  <Select
                    id={id}
                    value={toWalletId}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                  >
                    {wallets.filter((w) => !transaction.cashIn || w.type === "E_WALLET").map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === walletId}>
                        {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t-2 border-neutral-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Channel
                </label>
                {transaction.cashIn ? (
                  <p className="mt-1.5 text-sm font-semibold text-neutral-900">Cash deposit (manual)</p>
                ) : (
                  <div className="mt-1.5 flex rounded-xl border-2 border-neutral-900 bg-[#F4F1EA] p-1 shadow-[2px_2px_0px_#18181B]">
                    {(["INSTAPAY", "PESONET"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleChannelChange(ch)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                          channel === ch
                            ? "border-2 border-neutral-900 bg-[#EDE9FE] text-neutral-900 shadow-[1px_1px_0px_#18181B]"
                            : "text-neutral-600 hover:text-neutral-900"
                        }`}
                      >
                        {ch === "INSTAPAY" ? "InstaPay" : "PESONet"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Transfer Fee (₱)
                  </label>
                  {feeDetection && !transaction.cashIn && (
                    <span className="text-[10px] font-mono font-bold text-[#4A154B]">
                      {feeDetection.reason}
                    </span>
                  )}
                </div>
                {transaction.cashIn ? (
                  <div className="mt-1.5 space-y-2">
                    <Select
                      aria-label="Convenience fee type"
                      value={cashInFeeMode}
                      onChange={(e) => setCashInFeeMode(e.target.value as typeof cashInFeeMode)}
                    >
                      <option value="FIXED">Fixed (₱)</option>
                      <option value="PERCENT">Percentage (%)</option>
                    </Select>
                    <Input
                      aria-label="Convenience fee value"
                      inputMode="decimal"
                      value={cashInFeeValue}
                      onChange={(e) => setCashInFeeValue(e.target.value)}
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(feeMinor / 100).toString()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFeeMinor(Number.isFinite(val) && val >= 0 ? Math.round(val * 100) : 0);
                    }}
                    className="mt-1.5 font-mono"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                Category
              </label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <div className="mt-2 flex gap-2">
                <Input
                  aria-label="New category"
                  value={newCategory}
                  maxLength={80}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add a custom category"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  disabled={!newCategory.trim() || saveCategory.isPending}
                  onClick={handleAddCategory}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Connected Wallet Selector */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Connected Wallet
                </label>
                <span className="text-xs font-mono font-bold text-[var(--theme-accent-text)]">
                  {selectedWallet ? `Bal: ${formatCurrency(selectedWallet.balanceMinor, selectedWallet.currency)}` : "Unlinked"}
                </span>
              </div>

              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setWalletId("")}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    walletId === ""
                      ? "border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                      : "border-[var(--border-divider)] bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:border-[var(--border-ink)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <span>None / Unlinked</span>
                </button>
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      walletId === w.id
                        ? "border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                        : "border-[var(--border-divider)] bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:border-[var(--border-ink)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-[var(--border-ink)]"
                      style={{ backgroundColor: w.color || "#FBBF24" }}
                    />
                    <span>{formatWalletLabel(w)}</span>
                    <span className="font-mono text-[var(--text-muted)] text-[10px]">
                      ({formatCurrency(w.balanceMinor, w.currency)})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Wallet Sync Feedback Card */}
            {walletImpact && (
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg,#FEF3C7)] p-3.5 text-xs text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5 font-black text-[var(--status-warning-text,#92400E)]">
                  <svg className="h-4 w-4 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>Automatic Wallet Sync Preview</span>
                </div>

                {walletImpact.type === "SAME_WALLET" ? (
                  <p className="mt-1 text-neutral-800">
                    {walletImpact.delta === 0 ? (
                      <span>No net change to <strong className="text-neutral-950">{walletImpact.walletName}</strong>.</span>
                    ) : (
                      <span>
                        <strong className="text-neutral-950">{walletImpact.walletName}</strong> balance will adjust by{" "}
                        <span className={`font-mono font-bold ${walletImpact.delta > 0 ? "text-[#047857]" : "text-[#BE123C]"}`}>
                          {walletImpact.delta > 0 ? "+" : "−"}
                          {formatCurrency(Math.abs(walletImpact.delta))}
                        </span>
                        {" "}→ Projected balance:{" "}
                        <span className="font-mono font-bold text-neutral-950">
                          {formatCurrency(walletImpact.projected)}
                        </span>
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="mt-1 space-y-1 text-neutral-800">
                    {walletImpact.origWalletName && (
                      <p>
                        Revert <strong className="text-neutral-950">{walletImpact.origWalletName}</strong> by{" "}
                        <span className="font-mono font-bold text-[#047857]">
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
                        Apply to <strong className="text-neutral-950">{walletImpact.newWalletName}</strong>:{" "}
                        <span className={`font-mono font-bold ${walletImpact.newAddition >= 0 ? "text-[#047857]" : "text-[#BE123C]"}`}>
                          {walletImpact.newAddition >= 0 ? "+" : "−"}
                          {formatCurrency(Math.abs(walletImpact.newAddition))}
                        </span>
                        {walletImpact.newProjected !== null && (
                          <span> → {formatCurrency(walletImpact.newProjected)}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-neutral-500 italic">No wallet will be linked to this entry.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Notes */}
        <FormField label="Notes (Optional)">
          {({ id }) => (
            <Input
              id={id}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Reimbursement pending"
            />
          )}
        </FormField>

        {error && (
          <p role="alert" className="text-xs font-bold text-[#BE123C]">
            {error}
          </p>
        )}
      </form>
    </ModalShell>
  );
}
