import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { calculateCashflow } from "../../core/engine/cashflowAnalytics";
import {
  formatCurrency,
  type AttachmentMeta,
  type Category,
  type Subscription,
  type Transaction,
} from "../../core/models";
import { useStorage } from "../../state/StorageContext";
import { useDeleteTransaction, useSaveTransaction, useWallets } from "../../state/queries";
import { CashflowBreakdownGraph } from "../components/CashflowBreakdownGraph";
import { StackedWalletDeck } from "../components/StackedWalletDeck";
import { AnimatedMoney, AnimatedProgressBar, DonutChartSVG, SmokedCard, VoltButton } from "../primitives";
import { EditEntryModal } from "../components/EditEntryModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";

const money = (minor: number) => formatCurrency(minor);

export function HomeDashboard({
  month,
  analytics,
  transactions,
  subscriptions,
  attachments,
  categories,
  onQuickAdd,
}: {
  month: string;
  analytics: ReturnType<typeof calculateCashflow>;
  transactions: Transaction[];
  subscriptions: Subscription[];
  attachments: AttachmentMeta[];
  categories: Category[];
  onQuickAdd: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    meta: AttachmentMeta;
    url: string;
  } | null>(null);

  const [activityFilter, setActivityFilter] = useState<"ALL" | "EXPENSE" | "SUBSCRIPTION" | "INVOICE">("ALL");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const walletsQuery = useWallets();
  const saveTxMutation = useSaveTransaction();
  const deleteTxMutation = useDeleteTransaction();
  const wallets = walletsQuery.data ?? [];

  const inflowsMinor = transactions
    .filter((t) => t.amountMinor > 0)
    .reduce((s, t) => s + t.amountMinor, 0);
  const outflowsMinor = transactions
    .filter((t) => t.amountMinor < 0)
    .reduce((s, t) => s - t.amountMinor, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (activityFilter === "ALL") return true;
    if (activityFilter === "SUBSCRIPTION") return t.type === "SUBSCRIPTION_PAYMENT";
    if (activityFilter === "INVOICE") return Boolean(t.invoiceId);
    if (activityFilter === "EXPENSE") return t.type !== "SUBSCRIPTION_PAYMENT" && !t.invoiceId;
    return true;
  });

  const displayedTransactions = showAll ? filteredTransactions : filteredTransactions.slice(0, 7);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-6">
        {/* Net Outflow Hero Card */}
        <SmokedCard className="relative overflow-hidden">
          <div className="relative">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-white">
                Net Outflow
                <span className="ml-2.5 text-xs font-normal text-neutral-400">
                  {format(parseISO(`${month}-01`), "MMMM yyyy")}
                </span>
              </h2>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-neutral-400">
                PHP · Local Vault
              </span>
            </div>

            <div className="font-mono mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              <AnimatedMoney minor={analytics.netOutflowMinor} />
            </div>

            {/* Split Inflow vs Outflow metrics */}
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>IN · {format(parseISO(`${month}-01`), "MMM").toUpperCase()}</span>
                </div>
                <p className="mt-1 font-mono text-base font-bold text-white tabular-nums">
                  +<AnimatedMoney minor={inflowsMinor} />
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9F938]" />
                  <span>OUT · {format(parseISO(`${month}-01`), "MMM").toUpperCase()}</span>
                </div>
                <p className="mt-1 font-mono text-base font-bold text-neutral-200 tabular-nums">
                  −<AnimatedMoney minor={outflowsMinor} />
                </p>
              </div>
            </div>

            <VoltButton onClick={onQuickAdd} className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Quick Add Entry</span>
            </VoltButton>
          </div>
        </SmokedCard>

        {/* Cashflow Breakdown Graph (Day / Week / Month / Quarter / Year) */}
        <CashflowBreakdownGraph transactions={transactions} />

        {/* Recent Activity Feed */}
        <SmokedCard>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-bold text-white">Recent activity</h2>
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(["ALL", "EXPENSE", "SUBSCRIPTION", "INVOICE"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    activityFilter === filter
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter === "EXPENSE" ? "Expenses" : filter === "SUBSCRIPTION" ? "Subs" : "Invoices"}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {displayedTransactions.map((row) => (
              <ActivityRow
                key={row.id}
                row={row}
                category={categories.find((c) => c.id === row.categoryId)}
                subscription={subscriptions.find((item) => item.id === row.subscriptionId)}
                attachment={attachments.find(
                  (file) => file.entityId === row.id || file.entityId === row.invoiceId
                )}
                onPreview={(meta, url) => setPreviewAttachment({ meta, url })}
                onEdit={(tx) => setEditingTransaction(tx)}
                onDelete={(tx) => setDeletingTransaction(tx)}
              />
            ))}

            {!filteredTransactions.length && (
              <p className="py-6 text-center text-sm text-neutral-400">
                No entries match this filter.
              </p>
            )}
          </div>

          {filteredTransactions.length > 7 && (
            <div className="mt-4 border-t border-white/[0.06] pt-3 text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-[#D9F938] transition-all duration-200 hover:border-[#D9F938]/40 hover:bg-[#D9F938]/10 active:scale-95"
              >
                <span>{showAll ? "Show fewer" : `Show all ${filteredTransactions.length} entries`}</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    showAll ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          )}
        </SmokedCard>
      </div>

      <div className="space-y-6">
        {/* Dedicated Stacked Wallet Section */}
        <StackedWalletDeck wallets={walletsQuery.data ?? []} />

        {/* Monthly Burn / Fixed Commitments Donut */}
        <SmokedCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Monthly burn</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
                {analytics.fixedBurnPercent}% fixed subscriptions vs. variable spend.
              </p>
            </div>
            <div className="shrink-0">
              <DonutChartSVG percent={analytics.fixedBurnPercent} size={92} />
            </div>
          </div>
        </SmokedCard>

        {/* Top Spending Categories */}
        <SmokedCard>
          <h2 className="font-display mb-4 text-xl font-bold text-white">Top categories</h2>

          {analytics.categories.length ? (
            analytics.categories.slice(0, 5).map((row) => {
              const category = categories.find((candidate) => candidate.id === row.categoryId);
              const max = analytics.categories[0]?.amountMinor ?? 1;
              const percent = Math.round((row.amountMinor / max) * 100);

              return (
                <div key={row.categoryId} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-neutral-200">{category?.name ?? "Other"}</span>
                    <span className="font-mono text-neutral-400 tabular-nums text-right">{money(row.amountMinor)}</span>
                  </div>
                  <AnimatedProgressBar percent={percent} />
                </div>
              );
            })
          ) : (
            <p className="py-4 text-sm text-neutral-400">No outflow categories recorded yet.</p>
          )}
        </SmokedCard>
      </div>

      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}

      {editingTransaction && (
        <EditEntryModal
          transaction={editingTransaction}
          categories={categories}
          wallets={wallets}
          onClose={() => setEditingTransaction(null)}
          onSave={async (updated) => {
            await saveTxMutation.mutateAsync(updated);
            setEditingTransaction(null);
          }}
          onDelete={(id) => {
            const tx = transactions.find((t) => t.id === id) ?? editingTransaction;
            setEditingTransaction(null);
            setDeletingTransaction(tx);
          }}
        />
      )}

      {deletingTransaction && (
        <ConfirmDeleteModal
          title={deletingTransaction.title}
          amountMinor={deletingTransaction.amountMinor}
          currency={deletingTransaction.currency}
          walletName={wallets.find((w) => w.id === deletingTransaction.walletId)?.name}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={async () => {
            await deleteTxMutation.mutateAsync(deletingTransaction.id);
            setDeletingTransaction(null);
          }}
        />
      )}
    </div>
  );
}

function ActivityRow({
  row,
  category,
  subscription,
  attachment,
  onPreview,
  onEdit,
  onDelete,
}: {
  row: Transaction;
  category?: Category;
  subscription?: Subscription;
  attachment?: AttachmentMeta;
  onPreview(meta: AttachmentMeta, url: string): void;
  onEdit(row: Transaction): void;
  onDelete(row: Transaction): void;
}) {
  const incoming = row.amountMinor > 0;
  const { files } = useStorage();

  const handleOpenReceipt = async () => {
    if (!attachment) return;
    const bytes = await files.load(attachment.id);
    if (!bytes) return;
    const isImage = attachment.mimeType.startsWith("image/");
    const blob = new Blob([new Uint8Array(bytes).buffer], {
      type: isImage ? attachment.mimeType : "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    onPreview(attachment, url);
  };

  const getMicroBadge = () => {
    if (row.type === "SUBSCRIPTION_PAYMENT") {
      const cycle = subscription?.billingCycle?.toLowerCase() ?? "monthly";
      return (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-neutral-400">
          Subscription • {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
        </span>
      );
    }
    if (row.invoiceId) {
      return (
        <span className="inline-flex items-center rounded-full border border-[#D9F938]/30 bg-[#D9F938]/10 px-2 py-0.5 font-mono text-xs text-[#D9F938]">
          {row.invoiceId.length > 12 ? `Inv #${row.invoiceId.slice(-4)}` : row.invoiceId} • Receivable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-neutral-400">
        {category?.name ?? "Expense"}
      </span>
    );
  };

  const getEntityIcon = () => {
    if (row.invoiceId) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D9F938]/30 bg-[#D9F938]/10 text-[#D9F938]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
      );
    }
    if (row.type === "SUBSCRIPTION_PAYMENT") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-neutral-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
      );
    }
    const cat = (category?.name || row.title || "").toLowerCase();
    if (cat.includes("dining") || cat.includes("food") || cat.includes("coffee")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#FBBF24]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      );
    }
    if (cat.includes("transport") || cat.includes("commute") || cat.includes("car")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-neutral-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25H6.75a2.25 2.25 0 0 0-2.25 2.25v4.5m12-6.75v6.75" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-neutral-300">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      </div>
    );
  };

  return (
    <div
      onClick={() => onEdit(row)}
      className="group flex cursor-pointer items-center justify-between gap-3.5 py-3.5 transition-colors hover:bg-white/[0.02] rounded-xl px-1.5 -mx-1.5"
    >
      <div className="flex items-center gap-3 min-w-0">
        {getEntityIcon()}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white group-hover:text-[#D9F938] transition-colors">
            {row.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">
              {format(parseISO(row.date), "MMM d")}
            </span>
            <span className="text-neutral-700">•</span>
            {getMicroBadge()}
            {attachment && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleOpenReceipt();
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#D9F938] hover:underline"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.373L8.557 18.315a1.5 1.5 0 1 1-2.121-2.121l9.879-9.879" />
                </svg>
                <span>{attachment.filename}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span
          className={`font-mono text-sm font-semibold tabular-nums text-right ${
            incoming ? "text-[#D9F938]" : "text-neutral-200"
          }`}
        >
          {incoming ? "+" : "−"}
          {money(Math.abs(row.amountMinor))}
        </span>

        <div className="flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            aria-label="Edit entry"
            title="Edit entry"
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
            aria-label="Delete entry"
            title="Delete entry"
            className="rounded-lg p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentPreviewModal({
  attachment,
  onClose,
}: {
  attachment: { meta: AttachmentMeta; url: string };
  onClose(): void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      URL.revokeObjectURL(attachment.url);
    };
  }, [attachment.url, onClose]);

  const isImage = attachment.meta.mimeType.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Attachment preview"
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="min-w-0 pr-3">
            <h3 className="truncate text-sm font-semibold text-white">{attachment.meta.filename}</h3>
            <p className="font-mono text-xs text-neutral-400">
              {Math.round(attachment.meta.size / 1024)} KB · {attachment.meta.mimeType}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-white/5 p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-2 flex max-h-[60vh] items-center justify-center overflow-auto rounded-2xl bg-black/50 p-2">
          {isImage ? (
            <img
              src={attachment.url}
              alt={attachment.meta.filename}
              className="max-h-[55vh] max-w-full rounded-xl object-contain"
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-300">Document preview ({attachment.meta.mimeType})</p>
              <a
                href={attachment.url}
                download={attachment.meta.filename}
                className="mt-3 inline-block rounded-xl bg-[#D9F938] px-4 py-2 text-xs font-semibold text-[#070806]"
              >
                Download Document
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <a
            href={attachment.url}
            download={attachment.meta.filename}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-neutral-200 transition hover:bg-white/5"
          >
            Download File
          </a>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
