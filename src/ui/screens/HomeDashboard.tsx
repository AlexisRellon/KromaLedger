import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { calculateCashflow, calculateCashForecast } from "../../core/engine/cashflowAnalytics";
import { buildDailyInsight } from "../../core/engine/dailyInsight";
import { EMPTY_ACTIVITY_FILTERS, filterWalletActivity, type WalletActivityFilters } from "../../core/engine/walletActivity";
import { ActivityFilters } from "../components/ActivityFilters";
import { useActivityCollapse } from "../components/useActivityCollapse";
import { Button } from "../primitives/controls";
import {
  formatCurrency,
  type AttachmentMeta,
  type Category,
  type Subscription,
  type Transaction,
} from "../../core/models";
import { useStorage } from "../../state/StorageContext";
import {
  useAllTransactions,
  useAttachments,
  useCategories,
  useDeleteTransaction,
  useInvoices,
  useProfile,
  useSaveTransaction,
  useSubscriptions,
  useTransactions,
  useWallets,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { useAIStore } from "../../state/useAIStore";
import { attachmentCache } from "../../adapters/web-dexie/attachmentCache";
import { CashflowBreakdownGraph } from "../components/CashflowBreakdownGraph";
import { StackedWalletDeck } from "../components/StackedWalletDeck";
import { FrontPageHero } from "../components/FrontPageHero";
import {
  AnimatedMoney,
  AnimatedProgressBar,
  DonutChartSVG,
  SmokedCard,
  TactileEmptyState,
  VoltButton,
  KabanMascot,
} from "../primitives";
import { EditEntryModal } from "../components/EditEntryModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { DashboardSkeleton } from "../components/skeletons";
import {
  useAnalyticsInsightsData,
  CommittedWaterfallCard,
  FeeLeakageAndPayoffRow,
  WalletShortfallAlertCard,
  InvoiceAgingAndTaxCard,
} from "./AnalyticsInsightsSection";

const money = (minor: number) => formatCurrency(minor);

export type DashboardViewMode = "ALL" | "CORE" | "ANALYTICS";

export function HomeDashboard({
  month: propMonth,
  analytics: propAnalytics,
  transactions: propTx,
  subscriptions: propSubs,
  attachments: propAttachments,
  categories: propCategories,
  onQuickAdd,
  isLoading: propIsLoading,
  showAnalytics = false,
  defaultViewMode,
}: {
  month?: string;
  analytics?: ReturnType<typeof calculateCashflow>;
  transactions?: Transaction[];
  subscriptions?: Subscription[];
  attachments?: AttachmentMeta[];
  categories?: Category[];
  onQuickAdd: () => void;
  isLoading?: boolean;
  showAnalytics?: boolean;
  defaultViewMode?: DashboardViewMode;
}) {
  const storeMonth = useUIStore((s) => s.selectedMonth);
  const month = propMonth ?? storeMonth;

  const txQuery = useTransactions(month);
  const allTxQuery = useAllTransactions();
  const subsQuery = useSubscriptions();
  const attachmentsQuery = useAttachments();
  const categoriesQuery = useCategories();
  const invoicesQuery = useInvoices();
  const walletsQuery = useWallets();
  const profileQuery = useProfile();
  const openAI = useAIStore((s) => s.openWithQuestion);
  const [today, setToday] = useState(() => format(new Date(), "yyyy-MM-dd"));
  useEffect(() => {
    const nextDay = new Date();
    nextDay.setHours(24, 0, 0, 0);
    const timer = window.setTimeout(() => setToday(format(new Date(), "yyyy-MM-dd")), nextDay.getTime() - Date.now());
    return () => window.clearTimeout(timer);
  }, [today]);
  const saveTxMutation = useSaveTransaction();
  const deleteTxMutation = useDeleteTransaction();

  const [activityVisibleCount, setActivityVisibleCount] = useState(8);
  const { collapsing: activityCollapsing, collapse: collapseActivity, cancelCollapse: cancelActivityCollapse, onCollapseAnimationEnd } = useActivityCollapse();
  const [showSubDeductions, setShowSubDeductions] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    meta: AttachmentMeta;
    url: string;
  } | null>(null);

  const [activityFilters, setActivityFilters] = useState(EMPTY_ACTIVITY_FILTERS);
  const updateActivityFilters = (patch: Partial<WalletActivityFilters>) => {
    cancelActivityCollapse();
    setActivityFilters({ ...activityFilters, ...patch });
    setActivityVisibleCount(8);
  };
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<DashboardViewMode>(() => {
    if (defaultViewMode) return defaultViewMode;
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return "CORE";
    }
    return "ALL";
  });

  const viewModeSwitcherRef = useRef<HTMLDivElement>(null);
  const [viewModeIndicatorStyle, setViewModeIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const updateViewModeIndicator = () => {
    const container = viewModeSwitcherRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn) {
      setViewModeIndicatorStyle({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    updateViewModeIndicator();
  }, [viewMode]);

  useEffect(() => {
    updateViewModeIndicator();
    const frame = requestAnimationFrame(updateViewModeIndicator);
    document.fonts?.ready?.then(updateViewModeIndicator);

    const container = viewModeSwitcherRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      observer = new ResizeObserver(() => {
        updateViewModeIndicator();
      });
      observer.observe(container);
    }
    window.addEventListener("resize", updateViewModeIndicator);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", updateViewModeIndicator);
    };
  }, [viewMode]);

  const transactions = propTx ?? txQuery.data ?? [];
  const chartTransactions = propTx ?? allTxQuery.data ?? transactions;
  const subscriptions = propSubs ?? subsQuery.data ?? [];
  const attachments = propAttachments ?? attachmentsQuery.data ?? [];
  const categories = propCategories ?? categoriesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];

  const isLoading =
    propIsLoading ??
    (!propTx && !txQuery.data && (txQuery.isLoading || subsQuery.isLoading));

  const calculatedAnalytics = useMemo(
    () =>
      calculateCashflow({
        month,
        transactions,
        subscriptions,
        invoices,
      }),
    [month, transactions, subscriptions, invoices]
  );
  const analytics = propAnalytics ?? calculatedAnalytics;

  const forecast = useMemo(
    () =>
      calculateCashForecast({
        totalCashMinor: wallets.reduce((sum, w) => sum + w.balanceMinor, 0),
        month,
        transactions,
        subscriptions,
      }),
    [wallets, month, transactions, subscriptions]
  );

  const analyticsInsights = useAnalyticsInsightsData({
    month,
    wallets,
    transactions,
    subscriptions,
    invoices,
  });

  const dailyReady = walletsQuery.isSuccess && invoicesQuery.isSuccess && subsQuery.isSuccess && allTxQuery.isSuccess && profileQuery.isSuccess;
  const dailyInsight = dailyReady ? buildDailyInsight({
    today,
    currency: profileQuery.data?.defaultCurrency ?? "PHP",
    name: profileQuery.data?.name,
    wallets,
    invoices,
    subscriptions: subsQuery.data ?? [],
    transactions: allTxQuery.data ?? [],
  }) : null;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasActivityDates = Boolean(activityFilters.startDate || activityFilters.endDate);
  const invalidActivityRange = Boolean(activityFilters.startDate && activityFilters.endDate && activityFilters.startDate > activityFilters.endDate);
  const filteredTransactions = filterWalletActivity(hasActivityDates ? chartTransactions : transactions, activityFilters);
  const displayedTransactions = filteredTransactions.slice(0, activityVisibleCount);

  const shouldRenderCore = viewMode === "ALL" || viewMode === "CORE";
  const shouldRenderAnalytics =
    viewMode === "ANALYTICS" || (viewMode === "ALL" && showAnalytics);

  return (
    <div className="space-y-6">
      <FrontPageHero
        userName={profileQuery.data?.name}
        safeToSpendPhp={analyticsInsights.waterfall.trueSafeToSpendPhp}
        dailyAllowancePhp={analyticsInsights.waterfall.dailySafeAllowancePhp}
        onQuickAdd={onQuickAdd}
      />
      {dailyInsight && (
        <button type="button" onClick={() => openAI(dailyInsight.question)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3 text-left shadow-[4px_4px_0px_var(--shadow-ink)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-primary)] sm:gap-5 sm:p-4">
          <span className="shrink-0" aria-hidden="true"><KabanMascot pose="standalone" size={88} decorative /></span>
          <span className="min-w-0 flex-1 rounded-2xl bg-[var(--bg-muted)] p-3 sm:p-4">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Baulito · Daily insight</span>
            <span className="mt-1 block text-sm font-semibold leading-relaxed text-[var(--text-primary)]">{dailyInsight.message}</span>
            <span className="mt-2 block text-xs font-bold text-[var(--text-secondary)]">Ask Baulito more →</span>
          </span>
        </button>
      )}
      {/* Dashboard Header Bar: Month Display & 3-Way View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          <span className="text-[var(--text-muted)]">MONTH:</span>
          <span className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-3 py-1 text-sm font-bold text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
            {format(parseISO(`${month}-01`), "MMMM yyyy")}
          </span>
        </div>

        <div
          ref={viewModeSwitcherRef}
          role="tablist"
          aria-label="Dashboard view mode switcher"
          className="relative inline-flex rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-1 shadow-[2px_2px_0px_var(--shadow-ink)]"
        >
          {viewModeIndicatorStyle.ready && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border-2 border-[var(--border-ink)] bg-[var(--theme-primary)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[1px_1px_0px_var(--shadow-ink)] motion-reduce:transition-none"
              style={{
                left: `${viewModeIndicatorStyle.left}px`,
                top: `${viewModeIndicatorStyle.top}px`,
                width: `${viewModeIndicatorStyle.width}px`,
                height: `${viewModeIndicatorStyle.height}px`,
              }}
            />
          )}
          {(
            [
              { mode: "ALL", label: "All Cards" },
              { mode: "CORE", label: "Core Ledger" },
              { mode: "ANALYTICS", label: "Deep Analytics" },
            ] as const
          ).map(({ mode, label }) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                data-active={active}
                aria-selected={active}
                onClick={() => setViewMode(mode)}
                className={`relative z-10 rounded-full px-3 py-1 font-mono text-xs font-bold transition-colors duration-200 cursor-pointer ${
                  active
                    ? "text-[var(--theme-text-on-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          {shouldRenderCore && (
            <>
              {/* 3-Tier Financial Hero Card: Total Cash + Net Flow + Subscription-Predicted Cash */}
              <SmokedCard className="relative overflow-hidden">
          <div className="relative">
            {/* Header: Label & Multi-Wallet Status */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-extrabold text-[var(--text-primary)]">
                Total Liquid Cash
                <span className="ml-2.5 text-xs font-semibold text-[var(--text-tertiary)]">
                  {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
                </span>
              </h2>
              <span className="shrink-0 rounded-full border-2 border-[var(--border-ink)] bg-[var(--badge-brand-bg)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--badge-brand-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                PHP · Local Vault
              </span>
            </div>

            {/* Tier 1: Total Liquid Cash Anchor */}
            <div className="font-mono mt-3 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
              <AnimatedMoney minor={forecast.totalCashMinor} />
            </div>

            {/* Tier 2: Monthly Net Gain or Loss Velocity Pill */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--border-ink)] px-3 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--shadow-ink)] ${
                  forecast.isNetGain
                    ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
                    : "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full border border-[var(--border-ink)] ${
                    forecast.isNetGain ? "bg-[var(--status-success-text)]" : "bg-[var(--status-danger-text)]"
                  }`}
                />
                <span>
                  <AnimatedMoney
                    minor={Math.abs(forecast.netGainLossMinor)}
                    prefix={forecast.isNetGain ? "+" : "−"}
                  />{" "}
                  {forecast.isNetGain ? "Net Gain" : "Net Loss"}
                </span>
              </span>
              <span className="text-xs font-medium text-[var(--text-tertiary)]">
                in {format(parseISO(`${month}-01`), "MMMM yyyy")}
              </span>
            </div>

            {/* Inflows vs Outflows Breakdown */}
            <div className="mt-5 grid grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-success-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--status-success-text)]">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-success-text)]" />
                  <span>IN · {format(parseISO(`${month}-01`), "MMM").toUpperCase()}</span>
                </div>
                <p className="mt-1 font-mono text-base font-black text-[var(--status-success-text)] tabular-nums">
                  <AnimatedMoney minor={forecast.inflowsMinor} prefix="+" />
                </p>
              </div>
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--status-danger-text)]">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-danger-text)]" />
                  <span>OUT · {format(parseISO(`${month}-01`), "MMM").toUpperCase()}</span>
                </div>
                <p className="mt-1 font-mono text-base font-black text-[var(--status-danger-text)] tabular-nums">
                  <AnimatedMoney minor={forecast.outflowsMinor} prefix="−" />
                </p>
              </div>
            </div>

            {/* Tier 3: Subscription-Predicted Cash Runway */}
            <div className="mt-4 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)]">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-warning-text)]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--status-warning-text)]">
                    Predicted Cash · Month-End
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[var(--text-tertiary)]">
                  {forecast.upcomingSubsCount > 0 ? (
                    <>
                      <AnimatedMoney minor={forecast.upcomingSubsMinor} prefix="−" /> upcoming subs
                    </>
                  ) : (
                    "All subs cleared"
                  )}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-mono text-2xl font-black tracking-tight text-[var(--status-warning-text)]">
                    <AnimatedMoney minor={forecast.projectedCashMinor} />
                  </span>
                  <span className="ml-2 text-xs font-semibold text-[var(--text-tertiary)]">safe to spend</span>
                </div>

                {forecast.upcomingSubsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSubDeductions((v) => !v)}
                    className="text-xs font-bold text-[var(--theme-accent-text)] underline underline-offset-2 transition hover:opacity-80"
                  >
                    {showSubDeductions ? "Hide details" : `View ${forecast.upcomingSubsCount} pending`}
                  </button>
                )}
              </div>

              {/* Collapsible detail list for pending subscriptions contributing to the prediction */}
              {showSubDeductions && forecast.pendingSubscriptions.length > 0 && (
                <div className="mt-3 divide-y divide-[var(--border-divider)] border-t border-[var(--border-divider)] pt-2 text-xs">
                  {forecast.pendingSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--text-tertiary)]">
                          {format(parseISO(sub.nextBillingDate), "MMM d")}
                        </span>
                        <span className="font-semibold text-[var(--text-primary)]">{sub.title}</span>
                      </div>
                      <span className="font-mono font-bold text-[#BE123C] tabular-nums">
                        −{money(sub.amountMinor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <VoltButton
              onClick={onQuickAdd}
              className="relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden text-sm font-semibold"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Quick Add Entry</span>
            </VoltButton>
          </div>
        </SmokedCard>

        {/* Recent Activity Feed - on top of the list below Total Liquid Cash */}
        <SmokedCard>
          <div className="mb-4">
            <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)]">Recent activity</h2>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              {hasActivityDates ? "Searching all history" : "Selected month · use dates to search all history"}
            </p>
          </div>

          <ActivityFilters filters={activityFilters} onChange={updateActivityFilters}
            shownCount={displayedTransactions.length} totalCount={filteredTransactions.length} />

          <div className="divide-y divide-[var(--border-divider)]" onAnimationEnd={onCollapseAnimationEnd}>
            {displayedTransactions.map((row, index) => (
              <div key={row.id} className={index >= 8 ? (activityCollapsing ? "activity-entry-collapse" : "activity-entry-reveal") : undefined}>
                <div className="min-h-0 overflow-hidden">
              <ActivityRow
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
                </div>
              </div>
            ))}

            {!filteredTransactions.length && !invalidActivityRange && (
              <TactileEmptyState
                message="No entries match this filter."
                actionLabel="+ Log Expense"
                onAction={() => useUIStore.getState().openQuickAdd("EXPENSE")}
              />
            )}
          </div>

          {filteredTransactions.length > activityVisibleCount ? (
            <Button variant="secondary" className="mt-4 w-full" onClick={() => setActivityVisibleCount((count) => count + 8)}>
              Show more entries
            </Button>
          ) : activityVisibleCount > 8 && filteredTransactions.length > 8 ? (
            <Button variant="secondary" className="mt-4 w-full" disabled={activityCollapsing} onClick={() => collapseActivity(() => setActivityVisibleCount(8))}>
              Show less
            </Button>
          ) : null}
        </SmokedCard>

        {/* Cashflow Breakdown Graph (Day / Week / Month / Quarter / Year) */}
        <CashflowBreakdownGraph transactions={chartTransactions} selectedMonth={month} />
      </>
    )}

    {shouldRenderAnalytics && (
      <>
        {/* Module 2: Committed Waterfall Card */}
        <CommittedWaterfallCard waterfall={analyticsInsights.waterfall} />

        {/* Modules 1 & 3: Fee Leakage & Payoff Horizon Split Row */}
        <FeeLeakageAndPayoffRow
          feeReport={analyticsInsights.feeReport}
          payoffPlans={analyticsInsights.payoffPlans}
        />
      </>
    )}
  </div>

        <div className="min-w-0 space-y-6">
          {shouldRenderCore && (
            <>
              {/* Dedicated Stacked Wallet Section */}
              <StackedWalletDeck wallets={walletsQuery.data ?? []} />

              {/* Monthly Burn / Fixed Commitments Donut */}
              <SmokedCard>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)]">Monthly burn</h2>
                    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[var(--text-tertiary)]">
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
                <h2 className="font-display mb-4 text-xl font-extrabold text-[var(--text-primary)]">Top categories</h2>

                {analytics.categories.length ? (
                  analytics.categories.slice(0, 5).map((row) => {
                    const category = categories.find((candidate) => candidate.id === row.categoryId);
                    const max = analytics.categories[0]?.amountMinor ?? 1;
                    const percent = Math.round((row.amountMinor / max) * 100);

                    return (
                      <div key={row.categoryId} className="mb-4 last:mb-0">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="font-bold text-[var(--text-primary)]">{category?.name ?? "Other"}</span>
                          <span className="font-mono font-bold text-[var(--text-secondary)] tabular-nums text-right">
                            <AnimatedMoney minor={row.amountMinor} />
                          </span>
                        </div>
                        <AnimatedProgressBar percent={percent} />
                      </div>
                    );
                  })
                ) : (
                  <TactileEmptyState
                    message="No outflow categories recorded yet."
                    actionLabel="+ Log Expense"
                    onAction={() => useUIStore.getState().openQuickAdd("EXPENSE")}
                  />
                )}
              </SmokedCard>
            </>
          )}

          {/* Financial Analytics & Insights Engine - right column modules */}
          {shouldRenderAnalytics && (
            <>
              {/* Module 4: Per-Wallet Liquidity & Shortfall Radar */}
              <WalletShortfallAlertCard wallets={analyticsInsights.walletLiquidity} />

              {/* Module 5: Invoice Aging, Tax & Discount Card */}
              <InvoiceAgingAndTaxCard
                report={analyticsInsights.agingReport}
                totalInvoiceCount={invoices.length}
              />
            </>
          )}
        </div>
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
    const url = await attachmentCache.getOrLoad(
      attachment.id,
      attachment.mimeType,
      () => files.load(attachment.id)
    );
    if (!url) return;
    onPreview(attachment, url);
  };

  const getMicroBadge = () => {
    if (row.type === "TRANSFER") {
      const channelLabel = row.channel ?? "Transfer";
      const feeLabel = row.feeMinor && row.feeMinor > 0 ? ` (+${money(row.feeMinor)} fee)` : "";
      return (
        <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[var(--status-info-bg)] px-2 py-0.2 font-mono text-[11px] font-bold text-[var(--status-info-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
          Transfer • {channelLabel}{feeLabel}
        </span>
      );
    }
    if (row.type === "SUBSCRIPTION_PAYMENT") {
      const cycle = subscription?.billingCycle?.toLowerCase() ?? "monthly";
      return (
        <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[var(--badge-brand-bg)] px-2 py-0.2 font-mono text-[11px] font-bold text-[var(--badge-brand-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
          Sub • {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
        </span>
      );
    }
    if (row.invoiceId) {
      return (
        <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[var(--status-warning-bg)] px-2 py-0.2 font-mono text-[11px] font-bold text-[var(--status-warning-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
          {row.invoiceId.length > 12 ? `Inv #${row.invoiceId.slice(-4)}` : row.invoiceId} • Due
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[var(--bg-subtle)] px-2 py-0.2 font-mono text-[11px] font-bold text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
        {category?.name ?? "Expense"}
      </span>
    );
  };

  const getEntityIcon = () => {
    if (row.type === "TRANSFER") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-1.5 border-[var(--border-ink)] bg-[var(--status-info-bg)] text-[var(--status-info-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
      );
    }
    if (row.invoiceId) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-1.5 border-[var(--border-ink)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
      );
    }
    if (row.type === "SUBSCRIPTION_PAYMENT") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-1.5 border-[var(--border-ink)] bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
      );
    }
    const cat = (category?.name || row.title || "").toLowerCase();
    if (cat.includes("dining") || cat.includes("food") || cat.includes("coffee")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-1.5 border-[var(--border-ink)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
      );
    }
    if (cat.includes("transport") || cat.includes("commute") || cat.includes("car")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-1.5 border-[var(--border-ink)] bg-[var(--status-success-bg)] text-[var(--status-success-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25H6.75a2.25 2.25 0 0 0-2.25 2.25v4.5m12-6.75v6.75" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-1.5 border-[var(--border-ink)] bg-[var(--bg-muted)] text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      </div>
    );
  };

  return (
    <div
      onClick={() => onEdit(row)}
      className="group flex cursor-pointer items-center justify-between gap-3.5 py-3.5 transition-colors hover:bg-[var(--bg-subtle)] rounded-xl px-2 -mx-2"
    >
      <div className="flex items-center gap-3 min-w-0">
        {getEntityIcon()}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--theme-primary)] transition-colors">
            {row.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-tertiary)]">
              {format(parseISO(row.date), "MMM d")}
            </span>
            <span aria-hidden="true" className="text-[var(--text-muted)]">•</span>
            {getMicroBadge()}
            {attachment && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleOpenReceipt();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--theme-accent-text)] hover:underline"
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
          className={`font-mono text-sm font-extrabold tabular-nums text-right ${
            row.type === "TRANSFER"
              ? "text-[var(--status-info-text)]"
              : incoming
                ? "text-[var(--status-success-text)]"
                : "text-[var(--text-primary)]"
          }`}
        >
          {row.type === "TRANSFER" ? "⇄ " : incoming ? "+" : "−"}
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
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition"
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
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition cursor-pointer"
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
    };
  }, [onClose]);

  const isImage = attachment.meta.mimeType.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-3 sm:p-4 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Attachment preview"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] shadow-[6px_6px_0px_var(--shadow-ink)] animate-entrance"
      >
        <div className="shrink-0 flex items-center justify-between border-b-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-3">
            <h3 className="truncate text-sm font-extrabold text-[var(--text-primary)]">{attachment.meta.filename}</h3>
            <p className="font-mono text-xs font-semibold text-[var(--text-muted)]">
              {Math.round(attachment.meta.size / 1024)} KB · {attachment.meta.mimeType}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] transition hover:bg-[var(--bg-muted)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--shadow-ink)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="flex min-h-[240px] items-center justify-center overflow-auto rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-2 shadow-[2px_2px_0px_var(--shadow-ink)]">
            {isImage ? (
              <img
                src={attachment.url}
                alt={attachment.meta.filename}
                className="max-h-[55vh] max-w-full rounded-xl object-contain border border-[var(--border-ink)]"
              />
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-[var(--text-secondary)]">Document preview ({attachment.meta.mimeType})</p>
                <a
                  href={attachment.url}
                  download={attachment.meta.filename}
                  className="mt-3 inline-flex h-9 w-fit items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--theme-primary)] px-3.5 text-sm font-bold leading-none text-[var(--theme-text-on-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:bg-[var(--theme-primary-hover)] cursor-pointer"
                >
                  Download Document
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] px-5 py-3.5 sm:px-6 sm:py-4">
          <a
            href={attachment.url}
            download={attachment.meta.filename}
            className="inline-flex h-9 w-fit items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-3.5 text-sm font-bold leading-none text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:bg-[var(--bg-muted)] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--shadow-ink)] cursor-pointer"
          >
            Download File
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-fit items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-3.5 text-sm font-bold leading-none text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:bg-[var(--bg-muted)] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_var(--shadow-ink)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
