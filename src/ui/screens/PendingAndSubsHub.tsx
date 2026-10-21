import { useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { calculateCashflow } from "../../core/engine/cashflowAnalytics";
import { buildInvoicePayment, selectPendingOverview } from "../../core/engine/pendingAnalytics";
import { blockInvalidNumberKeys, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import type { Invoice, Subscription } from "../../core/models";
import { formatCurrency, formatWalletLabel } from "../../core/models";
import {
  useCategories,
  useConfirmSubscriptionPayment,
  useDeleteInvoice,
  useDeleteSubscription,
  useRecordInvoicePayment,
  useSaveInvoice,
  useSaveSubscription,
  useWallets,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { DonutChartSVG, HatchedProgressBar, SmokedCard, StatusDot, VoltButton } from "../primitives";
import { EditSubscriptionModal } from "../components/EditSubscriptionModal";
import { EditInvoiceModal } from "../components/EditInvoiceModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";

const today = () => format(new Date(), "yyyy-MM-dd");
const money = (minor: number) => formatCurrency(minor);

type SubscriptionRow = Subscription;
type InvoiceRow = Invoice;

export function PendingAndSubsHub({
  subscriptions,
  invoices,
  analytics,
  onQuickAdd,
}: {
  subscriptions: SubscriptionRow[];
  invoices: InvoiceRow[];
  analytics: ReturnType<typeof calculateCashflow>;
  onQuickAdd: () => void;
}) {
  const confirmSub = useConfirmSubscriptionPayment();
  const categoriesQuery = useCategories();
  const walletsQuery = useWallets();
  const saveSubMutation = useSaveSubscription();
  const deleteSubMutation = useDeleteSubscription();
  const saveInvMutation = useSaveInvoice();
  const deleteInvMutation = useDeleteInvoice();

  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<Subscription | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const [actionError, setActionError] = useState("");
  const [settling, setSettling] = useState<InvoiceRow | null>(null);

  const { subscriptions: upcomingSubs, invoices: upcomingInvoices } = selectPendingOverview(
    today(),
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
    { subscriptions, invoices }
  );

  const unpaidInvoices = invoices.filter((invoice) => invoice.status !== "PAID");

  const confirmPayment = async (s: SubscriptionRow) => {
    setActionError("");
    try {
      await confirmSub.mutateAsync({
        id: `sub:${s.id}:${s.nextBillingDate}`,
        date: s.nextBillingDate,
        title: s.title,
        amountMinor: -s.amountMinor,
        currency: "PHP",
        type: "SUBSCRIPTION_PAYMENT",
        subscriptionId: s.id,
        categoryId: s.categoryId,
        walletId: s.walletId,
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not confirm payment.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming 7-day Alert Card */}
      <SmokedCard>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Due in next 7 days</h2>
          </div>
          <button
            onClick={onQuickAdd}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-[#D9F938] transition hover:border-[#D9F938]/40 hover:bg-[#D9F938]/10"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add entry</span>
          </button>
        </div>

        <div className="mt-4 divide-y divide-white/[0.06]">
          {upcomingSubs.map((s) => (
            <UpcomingRow
              key={s.id}
              title={s.title}
              date={s.nextBillingDate}
              amount={s.amountMinor}
              badge={`${s.billingCycle.toLowerCase()}`}
              type="sub"
              onEdit={() => setEditingSubscription(s)}
              onDelete={() => setDeletingSubscription(s)}
              onConfirm={
                !s.autoLog && s.nextBillingDate <= today()
                  ? () => void confirmPayment(s)
                  : undefined
              }
            />
          ))}

          {upcomingInvoices.map((i) => (
            <UpcomingRow
              key={i.id}
              title={i.title}
              date={i.dueDate}
              amount={i.totalMinor - i.paidMinor}
              badge={i.direction === "RECEIVABLE" ? "Receivable" : "Payable"}
              type="invoice"
              isOverdue={i.status === "OVERDUE" || i.dueDate < today()}
              onEdit={() => setEditingInvoice(i)}
              onDelete={() => setDeletingInvoice(i)}
            />
          ))}

          {!upcomingSubs.length && !upcomingInvoices.length && (
            <p className="py-4 text-sm text-neutral-400">
              No payments due in the next 7 days.
            </p>
          )}
        </div>

        {actionError && (
          <p role="alert" className="mt-3 text-sm text-rose-400">
            {actionError}
          </p>
        )}
      </SmokedCard>

      {/* Split Bento Row: Fixed Subs Donut on Left + Hatched Partial Invoices on Right */}
      <div className="grid gap-6 md:grid-cols-2">
        <SmokedCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                {analytics.fixedBurnPercent}% fixed commitments
              </h3>
              <p className="mt-1 text-xs text-neutral-400">
                Recurring monthly burn relative to variable outflows.
              </p>
            </div>
            <div className="shrink-0">
              <DonutChartSVG percent={analytics.fixedBurnPercent} size={108} />
            </div>
          </div>
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">
                Active Subscriptions ({subscriptions.filter((s) => s.active).length})
              </span>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-56 overflow-y-auto pr-1">
              {subscriptions.map((s) => (
                <div key={s.id} className="group flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium text-white">{s.title}</p>
                    <p className="text-neutral-500 font-mono text-[11px]">
                      {s.billingCycle.toLowerCase()} · next {s.nextBillingDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-neutral-200">{money(s.amountMinor)}</span>
                    <button
                      type="button"
                      onClick={() => setEditingSubscription(s)}
                      aria-label="Edit subscription"
                      title="Edit subscription"
                      className="rounded p-1 text-neutral-400 hover:text-white hover:bg-white/10 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSubscription(s)}
                      aria-label="Delete subscription"
                      title="Delete subscription"
                      className="rounded p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SmokedCard>

        <SmokedCard>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-white">Open invoices</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-neutral-400">
                {unpaidInvoices.length} open
              </span>
              <button
                type="button"
                onClick={() => useUIStore.getState().openQuickAdd("INVOICE")}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-[#D9F938] transition hover:border-[#D9F938]/40 hover:bg-[#D9F938]/10"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add invoice</span>
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-white/[0.06]">
            {unpaidInvoices.length ? (
              unpaidInvoices.map((inv) => (
                <div key={inv.id} className="py-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-white">{inv.title}</span>
                    <span className="font-mono text-xs text-neutral-400 tabular-nums text-right">
                      {money(inv.paidMinor)} / {money(inv.totalMinor)}
                    </span>
                  </div>

                  {inv.paidMinor > 0 ? (
                    <HatchedProgressBar paid={inv.paidMinor} total={inv.totalMinor} />
                  ) : (
                    <p className="text-xs text-neutral-500">
                      No payment recorded · <span className="uppercase">{inv.status}</span>
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      Due {format(parseISO(inv.dueDate), "MMM d, yyyy")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(inv)}
                        aria-label="Edit invoice"
                        title="Edit invoice"
                        className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingInvoice(inv)}
                        aria-label="Delete invoice"
                        title="Delete invoice"
                        className="rounded-lg p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                      <button
                        className="rounded-full border border-[#D9F938]/30 bg-[#D9F938]/10 px-3 py-1 text-xs font-semibold text-[#D9F938] transition hover:bg-[#D9F938]/20"
                        onClick={() => setSettling(inv)}
                      >
                        Record payment
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-neutral-400">All invoices are settled.</p>
            )}
          </div>
        </SmokedCard>
      </div>

      {settling && <InvoicePaymentModal invoice={settling} onClose={() => setSettling(null)} />}

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <EditSubscriptionModal
          subscription={editingSubscription}
          categories={categoriesQuery.data ?? []}
          wallets={walletsQuery.data ?? []}
          onClose={() => setEditingSubscription(null)}
          onSave={async (saved) => {
            await saveSubMutation.mutateAsync(saved);
            setEditingSubscription(null);
          }}
          onDelete={(id) => {
            const sub = subscriptions.find((s) => s.id === id) ?? editingSubscription;
            setEditingSubscription(null);
            setDeletingSubscription(sub);
          }}
        />
      )}

      {/* Delete Subscription Modal */}
      {deletingSubscription && (
        <ConfirmDeleteModal
          title={deletingSubscription.title}
          amountMinor={deletingSubscription.amountMinor}
          currency={deletingSubscription.currency}
          isSubscription
          onClose={() => setDeletingSubscription(null)}
          onConfirm={async () => {
            await deleteSubMutation.mutateAsync(deletingSubscription.id);
            setDeletingSubscription(null);
          }}
        />
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          categories={categoriesQuery.data ?? []}
          onClose={() => setEditingInvoice(null)}
          onSave={async (saved) => {
            await saveInvMutation.mutateAsync({ invoice: saved, items: [] });
            setEditingInvoice(null);
          }}
          onDelete={(id) => {
            const inv = invoices.find((i) => i.id === id) ?? editingInvoice;
            setEditingInvoice(null);
            setDeletingInvoice(inv);
          }}
        />
      )}

      {/* Delete Invoice Modal */}
      {deletingInvoice && (
        <ConfirmDeleteModal
          title={deletingInvoice.title}
          amountMinor={deletingInvoice.totalMinor - deletingInvoice.paidMinor}
          currency={deletingInvoice.currency}
          isInvoice
          onClose={() => setDeletingInvoice(null)}
          onConfirm={async () => {
            await deleteInvMutation.mutateAsync(deletingInvoice.id);
            setDeletingInvoice(null);
          }}
        />
      )}
    </div>
  );
}

function InvoicePaymentModal({
  invoice,
  onClose,
}: {
  invoice: InvoiceRow;
  onClose(): void;
}) {
  const payment = useRecordInvoicePayment();
  const walletsQuery = useWallets();
  const wallets = walletsQuery.data ?? [];
  const remainingMinor = invoice.totalMinor - invoice.paidMinor;
  const [amount, setAmount] = useState((remainingMinor / 100).toFixed(2));
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      const def = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (def) setWalletId(def.id);
    }
  }, [wallets, walletId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    setError("");
    try {
      const record = buildInvoicePayment(invoice, amount, today(), crypto.randomUUID(), walletId || undefined);
      await payment.mutateAsync({ invoiceId: invoice.id, payment: record });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment.");
    }
  };

  const applyFraction = (factor: number) => {
    const fractionMinor = Math.round(remainingMinor * factor);
    setAmount((fractionMinor / 100).toFixed(2));
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Record invoice payment"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#11120f] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-bold text-white">{invoice.title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-sm text-neutral-400">
          Remaining balance: <span className="font-mono font-medium text-white">{money(remainingMinor)}</span>
        </p>

        {/* 1-Tap Quick Settlement Options */}
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wider text-neutral-400">Quick settlement</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyFraction(1)}
              className="rounded-xl border border-[#D9F938]/30 bg-[#D9F938]/10 py-2 text-xs font-semibold text-[#D9F938] transition hover:bg-[#D9F938]/20"
            >
              100% Full
            </button>
            <button
              type="button"
              onClick={() => applyFraction(0.5)}
              className="rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/10"
            >
              50% Half
            </button>
            <button
              type="button"
              onClick={() => applyFraction(0.25)}
              className="rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/10"
            >
              25%
            </button>
          </div>
        </div>

        {/* Wallet Selection */}
        {wallets.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wider text-neutral-400">
              {invoice.direction === "RECEIVABLE" ? "Deposit to wallet" : "Paid with wallet"}
            </p>
            <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition ${
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
        )}

        <label className="mt-4 block text-xs text-neutral-400">
          CUSTOM PAYMENT AMOUNT (₱)
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={amount}
            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
            onChange={(e) => setAmount(sanitizeMoneyInput(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 font-mono text-base text-white outline-none focus:border-[#D9F938]/60"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <VoltButton
            onClick={() => void submit()}
            disabled={payment.isPending}
            className="flex-1"
          >
            {payment.isPending ? "Saving…" : "Save Payment"}
          </VoltButton>
        </div>
      </section>
    </div>
  );
}

function UpcomingRow({
  title,
  date,
  amount,
  badge,
  type = "sub",
  isOverdue = false,
  onConfirm,
  onEdit,
  onDelete,
}: {
  title: string;
  date: string;
  amount: number;
  badge?: string;
  type?: "sub" | "invoice";
  isOverdue?: boolean;
  onConfirm?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const days = Math.round((parseISO(date).getTime() - parseISO(today()).getTime()) / 86400000);
  const tone = isOverdue ? "rose" : days <= 1 ? "amber" : "green";

  const getEntityIcon = () => {
    const tLower = title.toLowerCase();
    if (type === "invoice") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-neutral-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
      );
    }
    if (tLower.includes("netflix")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 font-bold text-red-500">
          <span className="text-base font-black tracking-tight">N</span>
        </div>
      );
    }
    if (tLower.includes("github") || tLower.includes("copilot")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-neutral-200">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#D9F938]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
    );
  };

  return (
    <div className="group flex items-center justify-between gap-3 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        {getEntityIcon()}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{title}</p>
            <StatusDot tone={tone} />
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs text-neutral-400">
              {isOverdue ? "Overdue" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : format(parseISO(date), "MMM d")}
            </span>
            {badge && (
              <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-neutral-400">
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-mono text-sm font-semibold text-white tabular-nums text-right">{money(amount)}</span>
        
        <div className="flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit item"
              title="Edit item"
              className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-white/10 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete item"
              title="Delete item"
              className="rounded-lg p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>

        {onConfirm && (
          <button
            onClick={onConfirm}
            className="rounded-full border border-[#D9F938]/40 bg-[#D9F938]/10 px-3 py-1 text-xs font-semibold text-[#D9F938] transition hover:bg-[#D9F938]/20"
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );
}
