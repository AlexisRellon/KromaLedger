import { useMemo, useState } from "react";
import { formatWalletLabel, type Category, type Invoice } from "../../core/models";
import { format } from "date-fns";
import { useWallets } from "../../state/queries";
import { obligationDueDate } from "../../core/engine/obligationSchedule";
import { blockInvalidNumberKeys, parseMinorInput, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import { Button, FormField, Input, ModalShell, Select } from "../primitives";

export function EditInvoiceModal({
  invoice,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  invoice: Invoice;
  categories: Category[];
  onClose: () => void;
  onSave: (value: Invoice) => Promise<void>;
  onDelete?: (id: string) => void;
}) {
  const [title, setTitle] = useState(invoice.title);
  const [dueDate, setDueDate] = useState(invoice.obligation?.firstDueDate ?? invoice.dueDate);
  const [direction, setDirection] = useState(invoice.direction);
  const [totalStr, setTotalStr] = useState((invoice.totalMinor / 100).toFixed(2));
  const [categoryId, setCategoryId] = useState(invoice.categoryId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wallets = useWallets().data ?? [];
  const [paymentAmount, setPaymentAmount] = useState(((invoice.obligation?.paymentMinor ?? 0) / 100).toFixed(2));
  const [cycle, setCycle] = useState(invoice.obligation?.cycle ?? "MONTHLY");
  const [walletId, setWalletId] = useState(invoice.obligation?.walletId ?? "");

  const modalTitle = useMemo(() => {
    if (invoice.obligation) {
      return invoice.obligation.kind === "LOAN" ? "Edit Loan" : "Edit Installment";
    }
    return "Edit Invoice";
  }, [invoice.obligation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title.");
      return;
    }

    let minor = 0;
    try {
      minor = parseMinorInput(totalStr);
    } catch {
      setError("Please provide a valid amount.");
      return;
    }
    if (minor <= 0) {
      setError("Please provide an amount greater than 0.");
      return;
    }
    if (minor < invoice.paidMinor) {
      setError(`Total cannot be less than already paid amount (₱${(invoice.paidMinor / 100).toFixed(2)}).`);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const updated: Invoice = {
        ...invoice,
        title: title.trim(),
        totalMinor: minor,
        subtotalMinor: minor,
        discountMinor: 0,
        taxMinor: 0,
        dueDate,
        direction,
        categoryId: categoryId || undefined,
        status: minor === invoice.paidMinor ? "PAID" : invoice.status,
      };
      if (invoice.obligation) {
        const paymentMinor = parseMinorInput(paymentAmount);
        if (paymentMinor > minor) throw new Error("Scheduled payment cannot exceed the total obligation.");
        updated.direction = "PAYABLE";
        updated.obligation = { ...invoice.obligation, paymentMinor, cycle, firstDueDate: dueDate, walletId: walletId || undefined };
        updated.dueDate = obligationDueDate(updated, updated.paidMinor);
        updated.status = minor === updated.paidMinor ? "PAID" : updated.dueDate < format(new Date(), "yyyy-MM-dd") ? "OVERDUE" : updated.paidMinor > 0 ? "PARTIAL" : "PENDING";
      }
      await onSave(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      subtitle={`${invoice.id} · Status: ${invoice.status}`}
      busy={busy}
      footer={
        <div className="flex items-center justify-between">
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => onDelete(invoice.id)}
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
              form="edit-invoice-modal-form"
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
      <form id="edit-invoice-modal-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Direction toggle */}
        <div className="flex rounded-2xl border-2 border-neutral-900 bg-[#F4F1EA] p-1 shadow-[2px_2px_0px_#18181B]">
          <button
            type="button"
            disabled={Boolean(invoice.obligation)}
            onClick={() => setDirection("RECEIVABLE")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              direction === "RECEIVABLE"
                ? "border-2 border-neutral-900 bg-[#D1FAE5] text-[#047857] shadow-[1px_1px_0px_#18181B]"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Receivable (Incoming)
          </button>
          <button
            type="button"
            onClick={() => setDirection("PAYABLE")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              direction === "PAYABLE"
                ? "border-2 border-neutral-900 bg-[#FFE4E6] text-[#BE123C] shadow-[1px_1px_0px_#18181B]"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Payable (Outgoing)
          </button>
        </div>

        {/* Title */}
        <FormField label="Invoice Title" required>
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

        {/* Total Amount & Due Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={`Total Amount (${invoice.currency || "PHP"})`} required>
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
                  value={totalStr}
                  onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                  onChange={(e) => setTotalStr(sanitizeMoneyInput(e.target.value))}
                  className="pl-8 font-mono text-sm font-bold"
                />
              </div>
            )}
          </FormField>

          <FormField label={invoice.obligation ? "First Payment Date" : "Due Date"} required>
            {({ id }) => (
              <Input
                id={id}
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            )}
          </FormField>
        </div>

        {/* Obligation fields if present */}
        {invoice.obligation && (
          <div className="space-y-3.5 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-4 shadow-[3px_3px_0px_var(--shadow-ink)]">
            <FormField label="Scheduled payment (₱)">
              {({ id }) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(sanitizeMoneyInput(e.target.value))}
                  className="font-mono font-bold"
                />
              )}
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Payment frequency">
                {({ id }) => (
                  <Select
                    id={id}
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value as typeof cycle)}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </Select>
                )}
              </FormField>

              <FormField label="Repayment wallet">
                {({ id }) => (
                  <Select
                    id={id}
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  >
                    <option value="">Choose wallet</option>
                    {wallets
                      .filter((wallet) => wallet.currency === invoice.currency)
                      .map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {formatWalletLabel(wallet)}
                        </option>
                      ))}
                  </Select>
                )}
              </FormField>
            </div>
          </div>
        )}

        {/* Category */}
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

        {error && (
          <p role="alert" className="text-xs font-bold text-[#BE123C]">
            {error}
          </p>
        )}
      </form>
    </ModalShell>
  );
}
