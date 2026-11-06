import { useEffect, useMemo, useState } from "react";
import { AnimatedMoney } from "../../primitives";
import type { CashflowWaterfall } from "../../../core/engine/cashflowAnalytics";
import { formatCurrency } from "../../../core/models";

const formatPhp = (php: number) => formatCurrency(Math.round(php * 100));

export function CommittedWaterfallCard({
  waterfall,
  className = "",
}: {
  waterfall: CashflowWaterfall;
  className?: string;
}) {
  const {
    totalLiquidPhp,
    lockedSubscriptionsPhp,
    lockedDebtAndInstallmentsPhp,
    lockedPayableInvoicesPhp,
    totalCommittedPhp,
    trueSafeToSpendPhp,
    dailySafeAllowancePhp,
    commitmentRatioPercent,
  } = waterfall;

  const [isLoaded, setIsLoaded] = useState(() => typeof window === "undefined");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const basis = useMemo(() => {
    return Math.max(totalLiquidPhp, totalCommittedPhp, 1);
  }, [totalLiquidPhp, totalCommittedPhp]);

  const subsPct = (lockedSubscriptionsPhp / basis) * 100;
  const debtPct = (lockedDebtAndInstallmentsPhp / basis) * 100;
  const payablesPct = (lockedPayableInvoicesPhp / basis) * 100;
  const safePct = Math.max(0, (trueSafeToSpendPhp / basis) * 100);

  const hasAnySegment = subsPct > 0 || debtPct > 0 || payablesPct > 0 || safePct > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-5 shadow-[4px_4px_0px_var(--shadow-ink)] ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
              Committed Cashflow Waterfall
            </h3>
            <span className="rounded-full border-2 border-[var(--border-ink)] bg-[var(--badge-brand-bg)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--badge-brand-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
              {commitmentRatioPercent}% committed
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
            Real-time liquidity partitioned across upcoming obligations this cycle.
          </p>
        </div>

        {/* Live Daily Safe Allowance Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--border-ink)] bg-[var(--status-success-bg)] px-3.5 py-1.5 font-mono text-xs font-black text-[var(--status-success-text)] shadow-[2px_2px_0px_var(--shadow-ink)]">
          <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[var(--status-success-text)]" />
          <span><AnimatedMoney minor={Math.round(dailySafeAllowancePhp * 100)} /> / day safe allowance</span>
        </div>
      </div>

      {/* Hero Numbers */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="min-w-0 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-2.5 sm:p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
          <span className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Liquid Cash
          </span>
          <p
            className="mt-1 font-mono text-sm sm:text-base font-bold text-[var(--text-primary)] tabular-nums tracking-tight whitespace-nowrap"
            title={formatPhp(totalLiquidPhp)}
          >
            <AnimatedMoney minor={Math.round(totalLiquidPhp * 100)} />
          </p>
        </div>

        <div className="min-w-0 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg)] p-2.5 sm:p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
          <span className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--status-warning-text)]">
            Committed
          </span>
          <p
            className="mt-1 font-mono text-sm sm:text-base font-bold text-[var(--status-warning-text)] tabular-nums tracking-tight whitespace-nowrap"
            title={formatPhp(totalCommittedPhp)}
          >
            <AnimatedMoney minor={Math.round(totalCommittedPhp * 100)} />
          </p>
        </div>

        <div
          className={`min-w-0 rounded-xl border-2 border-[var(--border-ink)] p-2.5 sm:p-3 shadow-[2px_2px_0px_var(--shadow-ink)] ${
            trueSafeToSpendPhp >= 0 ? "bg-[var(--status-success-bg)]" : "bg-[var(--status-danger-bg)]"
          }`}
        >
          <span
            className={`block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              trueSafeToSpendPhp >= 0 ? "text-[var(--status-success-text)]" : "text-[var(--status-danger-text)]"
            }`}
          >
            {trueSafeToSpendPhp >= 0 ? "Safe-to-Spend" : "Liquidity Shortfall"}
          </span>
          <p
            className={`mt-1 font-mono text-sm sm:text-base font-bold tabular-nums tracking-tight whitespace-nowrap ${
              trueSafeToSpendPhp >= 0 ? "text-[var(--status-success-text)]" : "text-[var(--status-danger-text)]"
            }`}
            title={formatPhp(trueSafeToSpendPhp)}
          >
            <AnimatedMoney
              minor={Math.round(Math.abs(trueSafeToSpendPhp) * 100)}
              prefix={trueSafeToSpendPhp < 0 ? "−" : ""}
            />
          </p>
        </div>
      </div>

      {/* Horizontal Segmented Neobrutalist Bar with Width Grow-Fill Animation */}
      <div className="mt-5">
        <div
          role="progressbar"
          aria-label="Committed Cashflow Waterfall breakdown"
          aria-valuenow={commitmentRatioPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative flex h-7 w-full overflow-hidden rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] shadow-[2px_2px_0px_var(--shadow-ink)]"
        >
          {hasAnySegment ? (
            <>
              {subsPct > 0 && (
                <div
                  style={{ width: isLoaded ? `${subsPct}%` : "0%", backgroundColor: "#F4C95D" }}
                  className="h-full min-w-0 overflow-hidden border-r-2 border-[var(--border-ink)] transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none last:border-r-0"
                  title={`Subscriptions: ${formatPhp(lockedSubscriptionsPhp)} (${subsPct.toFixed(1)}%)`}
                />
              )}
              {debtPct > 0 && (
                <div
                  style={{ width: isLoaded ? `${debtPct}%` : "0%", backgroundColor: "#B85028" }}
                  className="h-full min-w-0 overflow-hidden border-r-2 border-[var(--border-ink)] transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none last:border-r-0"
                  title={`Loans/Installments: ${formatPhp(lockedDebtAndInstallmentsPhp)} (${debtPct.toFixed(1)}%)`}
                />
              )}
              {payablesPct > 0 && (
                <div
                  style={{ width: isLoaded ? `${payablesPct}%` : "0%", backgroundColor: "#4A154B" }}
                  className="h-full min-w-0 overflow-hidden border-r-2 border-[var(--border-ink)] transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none last:border-r-0"
                  title={`Payable Invoices: ${formatPhp(lockedPayableInvoicesPhp)} (${payablesPct.toFixed(1)}%)`}
                />
              )}
              {safePct > 0 && (
                <div
                  style={{ width: isLoaded ? `${safePct}%` : "0%", backgroundColor: "#86EFAC" }}
                  className="h-full min-w-0 overflow-hidden transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none last:border-r-0"
                  title={`Safe-to-Spend: ${formatPhp(trueSafeToSpendPhp)} (${safePct.toFixed(1)}%)`}
                />
              )}
            </>
          ) : (
            <div
              style={{ width: isLoaded ? "100%" : "0%", backgroundColor: "#86EFAC" }}
              className="h-full min-w-0 overflow-hidden flex items-center justify-center font-mono text-xs font-bold text-[var(--text-primary)] transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            >
              100% Uncommitted Liquid Vault
            </div>
          )}
        </div>
      </div>

      {/* Bottom 2x2 Bento Grid (Replaces cramped 4-column row) */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 pt-1">
        {[
          {
            label: "Subscriptions",
            amountMinor: Math.round(lockedSubscriptionsPhp * 100),
            dotBg: "bg-[#F4C95D]",
          },
          {
            label: "Loans & Installments",
            amountMinor: Math.round(lockedDebtAndInstallmentsPhp * 100),
            dotBg: "bg-[#B85028]",
          },
          {
            label: "Payable Invoices",
            amountMinor: Math.round(lockedPayableInvoicesPhp * 100),
            dotBg: "bg-[#4A154B]",
          },
          {
            label: trueSafeToSpendPhp >= 0 ? "Safe-to-Spend" : "Liquidity Shortfall",
            amountMinor: Math.round(Math.abs(trueSafeToSpendPhp) * 100),
            isNegative: trueSafeToSpendPhp < 0,
            dotBg: trueSafeToSpendPhp >= 0 ? "bg-[#86EFAC]" : "bg-[#EF4444]",
            tint: trueSafeToSpendPhp >= 0 ? "bg-[var(--status-success-bg)]" : "bg-[var(--status-danger-bg)]",
            textTone: trueSafeToSpendPhp >= 0 ? "text-[var(--status-success-text)]" : "text-[var(--status-danger-text)]",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between rounded-xl border-2 border-[var(--border-ink)] px-3 py-2 shadow-[1px_1px_0px_var(--shadow-ink)] ${
              item.tint ?? "bg-[var(--bg-subtle)]"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--border-ink)] ${item.dotBg}`}
              />
              <span
                className={`font-mono text-[11px] font-semibold whitespace-nowrap ${
                  item.textTone ?? "text-[var(--text-secondary)]"
                }`}
              >
                {item.label}
              </span>
            </div>
            <span
              className={`font-mono text-xs font-bold whitespace-nowrap ml-2 tabular-nums ${
                item.textTone ?? "text-[var(--text-primary)]"
              }`}
            >
              <AnimatedMoney minor={item.amountMinor} prefix={item.isNegative ? "−" : ""} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
