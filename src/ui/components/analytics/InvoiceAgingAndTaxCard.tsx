import type { InvoiceAgingReport } from "../../../core/engine/cashflowAnalytics";
import { formatCurrency } from "../../../core/models";
import { EmptyStateWatermark } from "../../primitives/EmptyStateWatermark";
import { KabanMascot } from "../../primitives/KabanMascot";

const formatPhp = (php: number) => formatCurrency(Math.round(php * 100));

export function InvoiceAgingAndTaxCard({
  report,
  totalInvoiceCount = 0,
  overdueCount: propOverdueCount,
  openReceivablesCount: propOpenReceivablesCount,
  className = "",
}: {
  report: InvoiceAgingReport;
  totalInvoiceCount?: number;
  overdueCount?: number;
  openReceivablesCount?: number;
  className?: string;
}) {
  const { receivablesByAging } = report;

  const totalOverduePhp =
    (receivablesByAging?.OVERDUE_1_15 ?? 0) +
    (receivablesByAging?.OVERDUE_16_30 ?? 0) +
    (receivablesByAging?.OVERDUE_30_PLUS ?? 0);

  const overdueBucketsCount = [
    receivablesByAging?.OVERDUE_1_15,
    receivablesByAging?.OVERDUE_16_30,
    receivablesByAging?.OVERDUE_30_PLUS,
  ].filter((v) => (v ?? 0) > 0).length;

  const overdueCount =
    propOverdueCount !== undefined
      ? propOverdueCount
      : totalOverduePhp > 0
        ? Math.max(overdueBucketsCount, 1)
        : 0;

  const hasAnyOpen =
    report.uncollectedReceivablesPhp > 0 ||
    (receivablesByAging?.CURRENT ?? 0) > 0 ||
    totalOverduePhp > 0 ||
    totalInvoiceCount > 0;

  const openReceivablesCount =
    propOpenReceivablesCount !== undefined
      ? propOpenReceivablesCount
      : hasAnyOpen
        ? Math.max(totalInvoiceCount, overdueCount > 0 ? overdueCount : 1)
        : 0;

  const isEmpty =
    totalInvoiceCount === 0 &&
    report.totalReceivablesPhp === 0 &&
    report.totalPayablesPhp === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-5 shadow-[4px_4px_0px_var(--shadow-ink)] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
              Invoice Aging &amp; Tax Ledger
            </h3>
            {overdueCount > 0 && <KabanMascot pose="alert-peek" size={64} />}
            {overdueCount > 0 ? (
              <span className="rounded-full border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--status-danger-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                {overdueCount} Overdue
              </span>
            ) : openReceivablesCount > 0 ? (
              <span className="rounded-full border-2 border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                100% Current
              </span>
            ) : (
              <span className="rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                0 Open
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
            Uncollected receivables categorized by payment aging horizon plus cumulative tax and discount tracking.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] px-3 py-1 font-mono text-xs font-bold text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <span>Uncollected: {formatPhp(report.uncollectedReceivablesPhp)}</span>
        </div>
      </div>

      {!isEmpty ? (
        <div className="mt-5 space-y-5">
          {/* 4 Aging Buckets */}
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Uncollected Receivables by Aging Horizon
            </span>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Current (Not Yet Due) */}
              <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-success-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-success-text)]" />
                  <span className="font-mono text-[11px] font-bold uppercase text-[var(--status-success-text)]">
                    Current
                  </span>
                </div>
                <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-tertiary)]">
                  Not yet due
                </span>
                <p className="mt-2 font-mono text-base font-black text-[var(--text-primary)] tabular-nums">
                  {formatPhp(receivablesByAging.CURRENT)}
                </p>
              </div>

              {/* 1–15 Days Overdue */}
              <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-warning-text)]" />
                  <span className="font-mono text-[11px] font-bold uppercase text-[var(--status-warning-text)]">
                    1–15 Days
                  </span>
                </div>
                <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-tertiary)]">
                  Overdue
                </span>
                <p className="mt-2 font-mono text-base font-black text-[var(--text-primary)] tabular-nums">
                  {formatPhp(receivablesByAging.OVERDUE_1_15)}
                </p>
              </div>

              {/* 16–30 Days Overdue */}
              <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-warning-text)]" />
                  <span className="font-mono text-[11px] font-bold uppercase text-[var(--status-warning-text)]">
                    16–30 Days
                  </span>
                </div>
                <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-tertiary)]">
                  Overdue
                </span>
                <p className="mt-2 font-mono text-base font-black text-[var(--text-primary)] tabular-nums">
                  {formatPhp(receivablesByAging.OVERDUE_16_30)}
                </p>
              </div>

              {/* 30+ Days Overdue */}
              <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-danger-text)]" />
                  <span className="font-mono text-[11px] font-bold uppercase text-[var(--status-danger-text)]">
                    30+ Days
                  </span>
                </div>
                <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-tertiary)]">
                  Critical overdue
                </span>
                <p className="mt-2 font-mono text-base font-black text-[var(--status-danger-text)] tabular-nums">
                  {formatPhp(receivablesByAging.OVERDUE_30_PLUS)}
                </p>
              </div>
            </div>
          </div>

          {/* Tax & Discount Summary + Net Position Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Tax */}
            <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Cumulative Tax / VAT
              </span>
              <p className="mt-1 font-mono text-xl font-black text-[var(--text-primary)] tabular-nums">
                {formatPhp(report.taxPhp)}
              </p>
            </div>

            {/* Discount */}
            <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Discounts Granted
              </span>
              <p className="mt-1 font-mono text-xl font-black text-[var(--text-primary)] tabular-nums">
                {formatPhp(report.discountPhp)}
              </p>
            </div>

            {/* Net Uncollected (Receivables minus Payables) */}
            <div className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Net Uncollected Position
              </span>
              <p
                className={`mt-1 font-mono text-xl font-black tabular-nums ${
                  report.netUncollectedPhp >= 0
                    ? "text-[var(--status-success-text)]"
                    : "text-[var(--status-danger-text)]"
                }`}
              >
                {report.netUncollectedPhp >= 0 ? "+" : "−"}
                {formatPhp(Math.abs(report.netUncollectedPhp))}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative py-8">
          <EmptyStateWatermark />
          <p className="relative text-center text-sm font-semibold text-[var(--text-muted)]">
            No invoices recorded in your ledger yet.
          </p>
        </div>
      )}
    </div>
  );
}
