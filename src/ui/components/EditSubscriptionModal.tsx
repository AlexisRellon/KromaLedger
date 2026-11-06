import { useRef, useState } from "react";
import { formatCurrency, formatWalletLabel, type Category, type Subscription, type Wallet } from "../../core/models";
import { useConfirmSubscriptionPayment } from "../../state/queries";
import { blockInvalidNumberKeys, parseMinorInput, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import { Button, FormField, Input, ModalShell, Select } from "../primitives";

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
  const charge = useConfirmSubscriptionPayment();
  const charging = useRef(false);
  const hasChanges =
    title.trim() !== subscription.title ||
    amountStr !== (subscription.amountMinor / 100).toFixed(2) ||
    billingCycle !== subscription.billingCycle ||
    nextBillingDate !== subscription.nextBillingDate ||
    autoLog !== subscription.autoLog ||
    active !== subscription.active ||
    categoryId !== (subscription.categoryId ?? "") ||
    walletId !== (subscription.walletId ?? "");

  const chargeWallet = async () => {
    if (charging.current || busy) return;
    if (hasChanges) {
      setError("Save your changes before charging the wallet.");
      return;
    }
    charging.current = true;
    setBusy(true);
    setError("");
    try {
      await charge.mutateAsync({
        id: `sub:${subscription.id}:${subscription.nextBillingDate}`,
        date: subscription.nextBillingDate,
        title: subscription.title,
        amountMinor: -subscription.amountMinor,
        currency: subscription.currency,
        type: "SUBSCRIPTION_PAYMENT",
        subscriptionId: subscription.id,
        categoryId: subscription.categoryId,
        walletId: subscription.walletId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not charge wallet.");
    } finally {
      charging.current = false;
      setBusy(false);
    }
  };

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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Edit Subscription"
      subtitle={subscription.id}
      busy={busy}
      footer={
        <div className="flex items-center justify-between">
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => onDelete(subscription.id)}
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
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-sub-modal-form"
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
      <form id="edit-sub-modal-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <FormField label="Subscription Name" required>
          {({ id }) => (
            <Input
              id={id}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
        </FormField>

        {/* Amount & Cycle */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={`Amount (${subscription.currency || "PHP"})`} required>
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

          <FormField label="Billing Cycle">
            {({ id }) => (
              <Select
                id={id}
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </Select>
            )}
          </FormField>
        </div>

        {/* Next billing date & Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Next Billing Date" required>
            {({ id }) => (
              <Input
                id={id}
                type="date"
                required
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Category">
            {({ id }) => (
              <Select
                id={id}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        {/* Connected Wallet */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Connected Wallet (Auto-charged on payment)
          </label>
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
              </button>
            ))}
          </div>
        </div>

        {/* Charge Wallet Card */}
        <div className="space-y-2.5 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg,#FEF3C7)] p-4 text-xs font-medium text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <p>
            Charge {formatCurrency(subscription.amountMinor, subscription.currency)} for the cycle dated {subscription.nextBillingDate}. The next billing date advances by one cycle.
          </p>
          {hasChanges && <p className="font-bold text-[var(--status-warning-text,#B45309)]">Save changes before charging.</p>}
          <Button
            type="button"
            variant="subtle"
            size="sm"
            disabled={busy || hasChanges || !subscription.active || !subscription.walletId}
            onClick={() => void chargeWallet()}
          >
            {charge.isPending ? "Charging…" : "Charge wallet now"}
          </Button>
        </div>

        {/* Auto Log & Active toggles */}
        <div className="grid grid-cols-2 gap-4 border-t-2 border-neutral-200 pt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoLog}
              onChange={(e) => setAutoLog(e.target.checked)}
              className="h-4 w-4 rounded accent-[#4A154B]"
            />
            <span className="text-xs font-bold text-neutral-800">Auto-log payments</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded accent-[#4A154B]"
            />
            <span className="text-xs font-bold text-neutral-800">Active subscription</span>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-xs font-bold text-[#BE123C]">
            {error}
          </p>
        )}
      </form>
    </ModalShell>
  );
}
