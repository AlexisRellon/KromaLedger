import type {
  FeeLeakageReport,
  PayoffPlanSummary,
} from "../../../core/engine/cashflowAnalytics";
import { formatCurrency } from "../../../core/models";
import { useUIStore } from "../../../state/useUIStore";
import { TactileEmptyState } from "../../primitives/TactileEmptyState";
import { KabanMascot } from "../../primitives/KabanMascot";

const formatPhp = (php: number) => formatCurrency(Math.round(php * 100));

export function FeeLeakageAndPayoffRow({
  feeReport,
  payoffPlans,
  onLogTransfer,
  onAddInstallment,
  className = "",
}: {
  feeReport: FeeLeakageReport;
  payoffPlans: PayoffPlanSummary[];
  onLogTransfer?: () => void;
  onAddInstallment?: () => void;
  className?: string;
}) {
  const isFeeEmpty =
    feeReport.totalFeesLostPhp === 0 && feeReport.freeTransferCount === 0;

  return (
    <div className={`grid grid-cols-1 gap-5 ${className}`}>
      {/* Top Card: Friction & Fee Leakage Tracker */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-5 shadow-[4px_4px_0px_var(--shadow-ink)]">
        <div>
          {/* Header */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-extrabold text-[var(--text-primary)]">
                Transfer &amp; Cash-In Friction
              </h3>
              {feeReport.estimatedSavingsPhp > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                  Saved {formatPhp(feeReport.estimatedSavingsPhp)} via Free Transfers
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
              Convenience fees lost vs. savings from zero-fee routes.
            </p>
          </div>

          {/* Horizontal 3-Pill Summary Bar (Always visible) */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] px-3 py-2 shadow-[1px_1px_0px_var(--shadow-ink)]">
              <span className="font-mono text-[11px] font-bold text-[var(--text-tertiary)]">
                InstaPay Fees
              </span>
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                {formatPhp(feeReport.byChannel.INSTAPAY)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] px-3 py-2 shadow-[1px_1px_0px_var(--shadow-ink)]">
              <span className="font-mono text-[11px] font-bold text-[var(--text-tertiary)]">
                OTC Cash-In
              </span>
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                {formatPhp(feeReport.byChannel.OTC_CASH_IN)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-success-bg)] px-3 py-2 shadow-[1px_1px_0px_var(--shadow-ink)]">
              <span className="font-mono text-[11px] font-bold text-[var(--status-success-text)]">
                Free Transfers Saved
              </span>
              <span className="font-mono text-xs font-bold text-[var(--status-success-text)] tabular-nums">
                {formatPhp(feeReport.estimatedSavingsPhp)}
              </span>
            </div>
          </div>

          {/* Body */}
          {!isFeeEmpty ? (
            <div className="mt-4 space-y-4">
              {/* Total Fees & Free Transfers Banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--status-danger-text)]">
                    Total Fees Paid
                  </span>
                  <p className="mt-1 font-mono text-xl font-black text-[var(--status-danger-text)] tabular-nums">
                    {formatPhp(feeReport.totalFeesLostPhp)}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-success-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--status-success-text)]">
                    Zero-Fee Routes
                  </span>
                  <p className="mt-1 font-mono text-xl font-black text-[var(--status-success-text)] tabular-nums">
                    {feeReport.freeTransferCount}{" "}
                    {feeReport.freeTransferCount === 1 ? "transfer" : "transfers"}
                  </p>
                </div>
              </div>

              {/* Channel Breakdown */}
              <div className="space-y-2 pt-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Channel Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--border-ink)] bg-[var(--bg-subtle)] p-2 text-center shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="block font-mono text-[10px] font-bold text-[var(--text-tertiary)]">
                      InstaPay
                    </span>
                    <span className="font-mono text-xs font-black text-[var(--text-primary)] tabular-nums">
                      {formatPhp(feeReport.byChannel.INSTAPAY)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-[var(--border-ink)] bg-[var(--bg-subtle)] p-2 text-center shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="block font-mono text-[10px] font-bold text-[var(--text-tertiary)]">
                      PESONet
                    </span>
                    <span className="font-mono text-xs font-black text-[var(--text-primary)] tabular-nums">
                      {formatPhp(feeReport.byChannel.PESONET)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-[var(--border-ink)] bg-[var(--bg-subtle)] p-2 text-center shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="block font-mono text-[10px] font-bold text-[var(--text-tertiary)]">
                      OTC Cash-In
                    </span>
                    <span className="font-mono text-xs font-black text-[var(--text-primary)] tabular-nums">
                      {formatPhp(feeReport.byChannel.OTC_CASH_IN)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <TactileEmptyState
                message="No transfer or cash-in fees recorded for this period."
                actionLabel="+ Log Transfer / Cash-in"
                onAction={
                  onLogTransfer ??
                  (() => useUIStore.getState().openQuickAdd("TRANSFER"))
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Card: Installment & Loan Horizon */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-5 shadow-[4px_4px_0px_var(--shadow-ink)]">
        <div>
          {/* Header */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-extrabold text-[var(--text-primary)]">
                Installment &amp; Loan Horizon
              </h3>
              <span className="shrink-0 rounded-full border border-[var(--border-ink)] bg-[var(--badge-brand-bg)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--badge-brand-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                {payoffPlans.length}{" "}
                {payoffPlans.length === 1 ? "obligation" : "obligations"}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
              Active debt payoffs, remaining cutoffs, and capped final payments.
            </p>
          </div>

          {/* Body */}
          {payoffPlans.length > 0 ? (
            <div className="mt-4 divide-y-2 divide-[var(--border-divider)]">
              {payoffPlans.map((plan) => {
                const isFinalCutoff =
                  plan.remainingInstallmentsCount <= 1 ||
                  plan.nextInstallmentChargePhp >= plan.remainingBalancePhp;

                return (
                  <div key={plan.id} className="py-3.5 first:pt-1 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-extrabold text-[var(--text-primary)]">
                          {plan.title}
                        </span>
                        <span className="rounded-full border border-[var(--border-ink)] bg-[var(--bg-subtle)] px-2 py-0.2 font-mono text-[10px] font-bold uppercase text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                          {plan.kind === "LOAN" ? "Loan" : "Installment"}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--text-tertiary)]">
                        {plan.remainingInstallmentsCount}{" "}
                        {plan.remainingInstallmentsCount === 1 ? "cutoff" : "cutoffs"} left
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-4 flex-1 overflow-hidden rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                        <div
                          style={{ width: `${plan.progressPercent}%` }}
                          className="h-full border-r-2 border-[var(--border-ink)] bg-[#B85028] transition-all last:border-r-0"
                          title={`${plan.progressPercent}% paid`}
                        />
                      </div>
                      <span className="w-10 font-mono text-xs font-black text-[var(--text-primary)] tabular-nums text-right">
                        {plan.progressPercent}%
                      </span>
                    </div>

                    {/* Balance & Capped Badge Footer */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--text-tertiary)]">
                        Remaining:{" "}
                        <strong className="text-[var(--text-primary)]">{formatPhp(plan.remainingBalancePhp)}</strong> of{" "}
                        {formatPhp(plan.totalObligationPhp)}
                      </span>
                      {plan.remainingBalancePhp === 0 ? (
                        <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2.5 py-0.5 shadow-[1px_1px_0px_var(--shadow-ink)]">
                          <KabanMascot pose="celebrate-peso" size={48} />
                          <span className="font-mono text-[11px] font-bold text-[var(--status-success-text)]">
                            Fully Paid Off!
                          </span>
                        </div>
                      ) : isFinalCutoff && plan.remainingBalancePhp > 0 ? (
                        <span className="rounded-full border border-[var(--border-ink)] bg-[var(--status-warning-bg)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--status-warning-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                          Final cutoff: {formatPhp(plan.nextInstallmentChargePhp)} (capped)
                        </span>
                      ) : (
                        <span className="rounded-full border border-[var(--border-ink)] bg-[var(--bg-subtle)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                          Next cutoff: {formatPhp(plan.nextInstallmentChargePhp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <TactileEmptyState
                message="No active loans or installments found."
                actionLabel="+ Add Loan or Installment"
                onAction={
                  onAddInstallment ??
                  (() => useUIStore.getState().openQuickAdd("INSTALLMENT"))
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
