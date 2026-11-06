import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { calculateCashflow } from "../../core/engine/cashflowAnalytics";
import { buildInvoicePayment, selectPendingOverview } from "../../core/engine/pendingAnalytics";
import { scheduledPaymentMinor } from "../../core/engine/obligationSchedule";
import { blockInvalidNumberKeys, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import type { Invoice, Subscription } from "../../core/models";
import { formatCurrency, formatWalletLabel } from "../../core/models";
import {
  useCategories,
  useConfirmSubscriptionPayment,
  useDeleteInvoice,
  useDeleteSubscription,
  useInvoices,
  useRecordInvoicePayment,
  useSaveInvoice,
  useSaveSubscription,
  useSubscriptions,
  useTransactions,
  useWallets,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { Button, DonutChartSVG, FormField, HatchedProgressBar, Input, ModalShell, SmokedCard, StatusDot, TactileEmptyState } from "../primitives";
import { EditSubscriptionModal } from "../components/EditSubscriptionModal";
import { EditInvoiceModal } from "../components/EditInvoiceModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { PendingSkeleton } from "../components/skeletons";
import { AnalyticsInsightsSection } from "./AnalyticsInsightsSection";

const today = () => format(new Date(), "yyyy-MM-dd");
const money = (minor: number) => formatCurrency(minor);

type SubscriptionRow = Subscription;
type InvoiceRow = Invoice;

export function PendingAndSubsHub({
  subscriptions: propSubs,
  invoices: propInvoices,
  analytics: propAnalytics,
  onQuickAdd,
  isLoading: propIsLoading,
}: {
  subscriptions?: SubscriptionRow[];
  invoices?: InvoiceRow[];
  analytics?: ReturnType<typeof calculateCashflow>;
  onQuickAdd: () => void;
  isLoading?: boolean;
}) {
  const storeMonth = useUIStore((s) => s.selectedMonth);
  const subsQuery = useSubscriptions();
  const invoicesQuery = useInvoices();
  const txQuery = useTransactions(storeMonth);

  const subscriptions = propSubs ?? subsQuery.data ?? [];
  const invoices = propInvoices ?? invoicesQuery.data ?? [];

  const isLoading =
    propIsLoading ??
    (!propSubs && !subsQuery.data && (subsQuery.isLoading || invoicesQuery.isLoading));

  const analytics =
    propAnalytics ??
    calculateCashflow({
      month: storeMonth,
      transactions: txQuery.data ?? [],
      subscriptions,
      invoices,
    });

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
  const tradeInvoices = useMemo(
    () => unpaidInvoices.filter((invoice) => !invoice.obligation),
    [unpaidInvoices]
  );
  const obligationInvoices = useMemo(
    () => unpaidInvoices.filter((invoice) => Boolean(invoice.obligation)),
    [unpaidInvoices]
  );
  const [tabOverride, setTabOverride] = useState<"obligations" | "invoices" | null>(null);
  const activeTab =
    tabOverride ??
    (obligationInvoices.length > 0 || tradeInvoices.length === 0 ? "obligations" : "invoices");
  const wallets = walletsQuery.data ?? [];

  const confirmPayment = async (s: SubscriptionRow) => {
    setActionError("");
    const wallet = s.walletId ? wallets.find((w) => w.id === s.walletId) : undefined;
    if (!wallet) {
      setActionError("Cannot confirm payment: No wallet linked to this subscription.");
      return;
    }
    if (wallet.balanceMinor < s.amountMinor) {
      setActionError(
        `Insufficient balance in ${formatWalletLabel(wallet)} (${formatCurrency(wallet.balanceMinor, wallet.currency)}) for ${s.title} (${money(s.amountMinor)}).`
      );
      return;
    }

    try {
      await confirmSub.mutateAsync({
        id: `sub:${s.id}:${s.nextBillingDate}`,
        subscriptionId: s.id,
        amountMinor: -s.amountMinor,
        currency: s.currency,
        title: s.title,
        date: s.nextBillingDate,
        type: "SUBSCRIPTION_PAYMENT",
        categoryId: s.categoryId,
        walletId: s.walletId,
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to record payment.");
    }
  };

  if (isLoading) return <PendingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Upcoming 7-day Alert Card */}
      <SmokedCard>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-black text-neutral-900">Due in next 7 days</h2>
            <p className="text-xs font-medium text-neutral-600 mt-0.5">Upcoming recurring obligations and scheduled commitments.</p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onQuickAdd}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add entry</span>
          </Button>
        </div>

        <div className="mt-4 divide-y-2 divide-neutral-200">
          {upcomingSubs.map((s) => {
            const wallet = s.walletId ? wallets.find((w) => w.id === s.walletId) : undefined;
            const isInsufficient = !wallet || wallet.balanceMinor < s.amountMinor;
            const isDue = s.nextBillingDate <= today();

            return (
              <UpcomingRow
                key={s.id}
                title={s.title}
                date={s.nextBillingDate}
                amount={s.amountMinor}
                badge={`${s.billingCycle.toLowerCase()}`}
                type="sub"
                isInsufficient={isDue && isInsufficient}
                insufficientReason={
                  !wallet
                    ? "No wallet linked"
                    : `Low balance (${formatCurrency(wallet.balanceMinor, wallet.currency)})`
                }
                onEdit={() => setEditingSubscription(s)}
                onDelete={() => setDeletingSubscription(s)}
                onPostpone={
                  isDue && isInsufficient
                    ? async () => {
                        const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
                        await saveSubMutation.mutateAsync({
                          ...s,
                          billingAnchorDate: s.billingAnchorDate ?? s.nextBillingDate,
                          nextBillingDate: tomorrow,
                        });
                      }
                    : undefined
                }
                onConfirm={
                  !s.autoLog && isDue && !isInsufficient
                    ? () => void confirmPayment(s)
                    : undefined
                }
              />
            );
          })}

          {upcomingInvoices.map((i) => (
            <UpcomingRow
              key={i.id}
              title={i.title}
              date={i.dueDate}
              amount={scheduledPaymentMinor(i)}
              badge={i.obligation ? i.obligation.kind === "LOAN" ? "Loan" : "Installment" : i.direction === "RECEIVABLE" ? "Receivable" : "Payable"}
              type="invoice"
              isOverdue={i.status === "OVERDUE" || i.dueDate < today()}
              onEdit={() => setEditingInvoice(i)}
              onDelete={() => setDeletingInvoice(i)}
            />
          ))}

          {!upcomingSubs.length && !upcomingInvoices.length && (
            <p className="py-5 text-sm font-medium text-neutral-500">
              No payments due in the next 7 days.
            </p>
          )}
        </div>

        {actionError && (
          <p role="alert" className="mt-3 text-sm font-bold text-[#BE123C]">
            {actionError}
          </p>
        )}
      </SmokedCard>

      {/* Split Bento Row: Fixed Subs Donut on Left + Hatched Partial Invoices on Right */}
      <div className="grid gap-6 md:grid-cols-2">
        <SmokedCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-black text-neutral-900">
                {analytics.fixedBurnPercent}% fixed commitments
              </h3>
              <p className="mt-1 text-xs font-medium text-neutral-600">
                Recurring monthly burn relative to variable outflows.
              </p>
            </div>
            <div className="shrink-0">
              <DonutChartSVG percent={analytics.fixedBurnPercent} size={108} />
            </div>
          </div>
          <div className="mt-5 border-t-2 border-neutral-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600 tracking-wider uppercase">
                Active Subscriptions ({subscriptions.filter((s) => s.active).length})
              </span>
            </div>
            <div className="divide-y-2 divide-neutral-200 max-h-56 overflow-y-auto pr-1">
              {subscriptions.map((s) => (
                <div key={s.id} className="group flex items-center justify-between py-2.5 text-xs gap-3">
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="truncate font-bold text-neutral-900">{s.title}</p>
                    <p className="text-neutral-500 font-mono text-[11px] truncate mt-0.5">
                      {s.billingCycle.toLowerCase()} · next {s.nextBillingDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-neutral-900 tabular-nums whitespace-nowrap">{money(s.amountMinor)}</span>
                    <button
                      type="button"
                      onClick={() => setEditingSubscription(s)}
                      aria-label="Edit subscription"
                      title="Edit subscription"
                      className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition cursor-pointer"
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
                      className="rounded-lg p-1 text-neutral-500 hover:text-[#BE123C] hover:bg-rose-100 transition cursor-pointer"
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

        <SmokedCard className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Segmented Pill Switcher */}
              <div className="flex items-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] p-1 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <button
                  type="button"
                  onClick={() => setTabOverride("obligations")}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "obligations"
                      ? "bg-[var(--theme-primary)] text-white shadow-[1px_1px_0px_var(--shadow-ink)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Installments &amp; Loans ({obligationInvoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTabOverride("invoices")}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "invoices"
                      ? "bg-[var(--theme-primary)] text-white shadow-[1px_1px_0px_var(--shadow-ink)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Invoices ({tradeInvoices.length})
                </button>
              </div>

              {/* Dynamic Add Action */}
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={() =>
                  useUIStore
                    .getState()
                    .openQuickAdd(activeTab === "obligations" ? "INSTALLMENT" : "INVOICE")
                }
                className="!py-1 !px-2.5 text-xs font-bold"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>{activeTab === "obligations" ? "Add installment" : "Add invoice"}</span>
              </Button>
            </div>

            {/* List Section */}
            <div className="mt-4 divide-y-2 divide-neutral-200">
              {activeTab === "obligations" ? (
                obligationInvoices.length ? (
                  obligationInvoices.map((inv) => (
                    <div key={inv.id} className="py-3">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate font-bold text-neutral-900">{inv.title}</span>
                          <span className="shrink-0 rounded-full border border-[var(--border-ink)] bg-[var(--bg-subtle)] px-2 py-0.2 font-mono text-[10px] font-bold uppercase text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                            {inv.obligation?.kind === "LOAN" ? "Loan" : "Installment"}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-600 tabular-nums text-right">
                          {money(inv.paidMinor)} / {money(inv.totalMinor)}
                        </span>
                      </div>
                      {inv.obligation && (
                        <p className="mb-2 text-xs font-semibold text-neutral-700">
                          {money(scheduledPaymentMinor(inv))} due · {money(inv.obligation.paymentMinor)} {inv.obligation.cycle.toLowerCase()} · Remaining {money(inv.totalMinor - inv.paidMinor)}
                          {` · ${wallets.find((wallet) => wallet.id === inv.obligation?.walletId)?.name ?? "Choose wallet when paying"}`}
                        </p>
                      )}

                      {inv.paidMinor > 0 ? (
                        <HatchedProgressBar paid={inv.paidMinor} total={inv.totalMinor} />
                      ) : (
                        <p className="text-xs font-medium text-neutral-500">
                          No payment recorded · <span className="uppercase font-bold">{inv.status}</span>
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-600">
                          Next due {format(parseISO(inv.dueDate), "MMM d, yyyy")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingInvoice(inv)}
                            aria-label={`Edit ${inv.obligation?.kind === "LOAN" ? "loan" : "installment"}`}
                            title={`Edit ${inv.obligation?.kind === "LOAN" ? "loan" : "installment"}`}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingInvoice(inv)}
                            aria-label={`Delete ${inv.obligation?.kind === "LOAN" ? "loan" : "installment"}`}
                            title={`Delete ${inv.obligation?.kind === "LOAN" ? "loan" : "installment"}`}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                          <Button
                            variant="subtle"
                            size="sm"
                            className="!py-1 !px-2.5 text-xs font-bold"
                            onClick={() => setSettling(inv)}
                          >
                            Record payment
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2">
                    <TactileEmptyState
                      message="No active installments or loan commitments."
                      actionLabel="+ Add installment"
                      onAction={() => useUIStore.getState().openQuickAdd("INSTALLMENT")}
                    />
                  </div>
                )
              ) : tradeInvoices.length ? (
                tradeInvoices.map((inv) => (
                  <div key={inv.id} className="py-3">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-bold text-neutral-900">{inv.title}</span>
                        <span className="shrink-0 rounded-full border border-[var(--border-ink)] bg-[var(--bg-subtle)] px-2 py-0.2 font-mono text-[10px] font-bold uppercase text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                          {inv.direction === "RECEIVABLE" ? "Receivable" : "Payable"}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-neutral-600 tabular-nums text-right">
                        {money(inv.paidMinor)} / {money(inv.totalMinor)}
                      </span>
                    </div>

                    {inv.paidMinor > 0 ? (
                      <HatchedProgressBar paid={inv.paidMinor} total={inv.totalMinor} />
                    ) : (
                      <p className="text-xs font-medium text-neutral-500">
                        No payment recorded · <span className="uppercase font-bold">{inv.status}</span>
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-600">
                        Due {format(parseISO(inv.dueDate), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingInvoice(inv)}
                          aria-label="Edit invoice"
                          title="Edit invoice"
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition cursor-pointer"
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
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                        <Button
                          variant="subtle"
                          size="sm"
                          className="!py-1 !px-2.5 text-xs font-bold"
                          onClick={() => setSettling(inv)}
                        >
                          Record payment
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-2">
                  <TactileEmptyState
                    message="All vendor and client invoices are settled."
                    actionLabel="+ Add invoice"
                    onAction={() => useUIStore.getState().openQuickAdd("INVOICE")}
                  />
                </div>
              )}
            </div>
          </div>
        </SmokedCard>
      </div>

      {/* Financial Intelligence & Analytics Bento Grid */}
      <AnalyticsInsightsSection
        month={storeMonth}
        subscriptions={subscriptions}
        invoices={invoices}
        wallets={wallets}
        transactions={txQuery.data ?? []}
      />

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
          isInvoice={!deletingInvoice.obligation}
          entityLabel={
            deletingInvoice.obligation
              ? deletingInvoice.obligation.kind === "LOAN"
                ? "loan"
                : "installment"
              : "invoice"
          }
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
  const [amount, setAmount] = useState((scheduledPaymentMinor(invoice) / 100).toFixed(2));
  const [walletId, setWalletId] = useState(invoice.obligation?.walletId ?? "");
  const [error, setError] = useState("");
  const saving = useRef(false);
  const paymentId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      const def = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (def) setWalletId(def.id);
    }
  }, [wallets, walletId]);

  const submit = async () => {
    if (saving.current) return;
    saving.current = true;
    setError("");
    try {
      const record = buildInvoicePayment(invoice, amount, today(), paymentId.current, walletId || undefined);
      await payment.mutateAsync({ invoiceId: invoice.id, payment: record });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment.");
    } finally {
      saving.current = false;
    }
  };

  const applyFraction = (factor: number) => {
    const fractionMinor = Math.round(remainingMinor * factor);
    setAmount((fractionMinor / 100).toFixed(2));
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={invoice.title}
      subtitle={`Remaining balance: ${money(remainingMinor)}`}
      maxWidth="sm"
      footer={
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void submit()}
            disabled={payment.isPending}
            className="flex-1"
          >
            {payment.isPending ? "Saving…" : "Save Payment"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {invoice.obligation && (
          <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 text-xs font-semibold text-[var(--text-secondary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
            Scheduled: <span className="font-mono font-bold text-[var(--text-primary)]">{money(scheduledPaymentMinor(invoice))}</span> due {invoice.dueDate} · {invoice.obligation.cycle.toLowerCase()}
          </div>
        )}

        {/* 1-Tap Quick Settlement Options */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">Quick settlement</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyFraction(1)}
              className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--badge-brand-bg)] py-2 text-xs font-bold text-[var(--badge-brand-text)] shadow-[2px_2px_0px_var(--shadow-ink)] transition hover:opacity-90 cursor-pointer"
            >
              100% Full
            </button>
            <button
              type="button"
              onClick={() => applyFraction(0.5)}
              className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] py-2 text-xs font-bold text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] transition hover:bg-[var(--bg-muted)] cursor-pointer"
            >
              50% Half
            </button>
            <button
              type="button"
              onClick={() => applyFraction(0.25)}
              className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] py-2 text-xs font-bold text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] transition hover:bg-[var(--bg-muted)] cursor-pointer"
            >
              25%
            </button>
          </div>
        </div>

        {/* Wallet Selection */}
        {wallets.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
              {invoice.direction === "RECEIVABLE" ? "Deposit to wallet" : "Paid with wallet"}
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    walletId === w.id
                      ? "border-[var(--border-ink)] bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-ink)] hover:text-[var(--text-primary)]"
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
        )}

        <FormField label="Custom Payment Amount (₱)">
          {({ id }) => (
            <Input
              id={id}
              autoFocus
              type="text"
              inputMode="decimal"
              value={amount}
              onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
              onChange={(e) => setAmount(sanitizeMoneyInput(e.target.value))}
              className="font-mono text-base font-bold"
            />
          )}
        </FormField>

        {error && (
          <p role="alert" className="text-xs font-bold text-[#BE123C]">
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  );
}

function UpcomingRow({
  title,
  date,
  amount,
  badge,
  type = "sub",
  isOverdue = false,
  isInsufficient = false,
  insufficientReason,
  onPostpone,
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
  isInsufficient?: boolean;
  insufficientReason?: string;
  onPostpone?: () => void;
  onConfirm?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const days = Math.round((parseISO(date).getTime() - parseISO(today()).getTime()) / 86400000);
  const tone = isInsufficient || isOverdue ? "rose" : days <= 1 ? "amber" : "green";

  const getEntityIcon = () => {
    if (type === "invoice") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-info-bg)] text-[var(--status-info-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
    );
  };

  return (
    <div className="group py-3.5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {getEntityIcon()}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-[var(--text-primary)]">{title}</p>
              <StatusDot tone={tone} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--text-tertiary)] whitespace-nowrap">
                {isOverdue ? "Overdue" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : format(parseISO(date), "MMM d")}
              </span>
              {badge && (
                <span className="rounded-md border border-[var(--border-ink)] bg-[var(--badge-brand-bg)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--badge-brand-text)] shadow-[1px_1px_0px_var(--shadow-ink)] whitespace-nowrap">
                  {badge}
                </span>
              )}
              {isInsufficient && insufficientReason && (
                <span className="rounded-md border border-[var(--border-ink)] bg-[var(--status-danger-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--status-danger-text)] shadow-[1px_1px_0px_var(--shadow-ink)] whitespace-nowrap">
                  {insufficientReason}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-mono text-sm font-black text-[var(--text-primary)] tabular-nums text-right whitespace-nowrap">{money(amount)}</span>
          
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit item"
                title="Edit item"
                className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition cursor-pointer"
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
                className="rounded-lg p-1.5 text-neutral-600 hover:text-[#BE123C] hover:bg-rose-100 transition cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>

          {onPostpone && (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={onPostpone}
              className="hidden sm:inline-flex !py-1 !px-2.5 text-xs font-bold whitespace-nowrap"
            >
              Move to tomorrow
            </Button>
          )}

          {onConfirm && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onConfirm}
              className="hidden sm:inline-flex !py-1 !px-3 text-xs font-bold whitespace-nowrap"
            >
              Confirm
            </Button>
          )}
        </div>
      </div>

      {(onPostpone || onConfirm) && (
        <div className="flex sm:hidden items-center justify-end pt-1 gap-2">
          {onPostpone && (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={onPostpone}
              className="flex-1 text-center text-xs"
            >
              Move to tomorrow
            </Button>
          )}

          {onConfirm && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onConfirm}
              className="flex-1 text-center text-xs"
            >
              Confirm
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
