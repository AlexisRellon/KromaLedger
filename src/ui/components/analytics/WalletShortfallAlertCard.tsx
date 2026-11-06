import type { WalletRunwayStatus } from "../../../core/engine/cashflowAnalytics";
import { formatCurrency } from "../../../core/models";
import { useUIStore } from "../../../state/useUIStore";
import { EmptyStateWatermark } from "../../primitives/EmptyStateWatermark";
import { KabanMascot } from "../../primitives/KabanMascot";

const formatPhp = (php: number) => formatCurrency(Math.round(php * 100));

export function WalletShortfallAlertCard({
  wallets,
  className = "",
  onTopUp,
}: {
  wallets: WalletRunwayStatus[];
  className?: string;
  onTopUp?: (walletId: string, amountPhp: number) => void;
}) {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  const handleTopUp = (walletId: string, shortfallPhp: number) => {
    if (onTopUp) {
      onTopUp(walletId, shortfallPhp);
    } else {
      openQuickAdd("TRANSFER", {
        amountPhp: shortfallPhp,
        toWalletId: walletId,
      });
    }
  };

  const hasShortfalls = wallets.some((w) => w.status === "SHORTFALL_WARNING");

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-5 shadow-[4px_4px_0px_var(--shadow-ink)] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
              Per-Wallet Liquidity &amp; Shortfall Radar
            </h3>
            {hasShortfalls ? (
              <span className="rounded-full border border-[var(--border-ink)] bg-[var(--status-danger-bg)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--status-danger-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                Action Required
              </span>
            ) : (
              <span className="rounded-full border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                All Runways Clear
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
            Cross-checks each wallet's available cash against assigned auto-debits and repayments.
          </p>
        </div>
      </div>

      {/* Shortfall Alert Callout Banner */}
      {hasShortfalls && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
          <KabanMascot pose="spent-stop" size={72} />
          <p className="text-xs font-bold leading-relaxed text-[var(--status-danger-text)]">
            Heads up! One or more wallets need a top-up before scheduled auto-debits.
          </p>
        </div>
      )}

      {/* Wallet List */}
      <div className="mt-4 divide-y-2 divide-[var(--border-divider)]">
        {wallets.length ? (
          wallets.map((wallet) => {
            const isShortfall = wallet.status === "SHORTFALL_WARNING";
            const isTight = wallet.status === "TIGHT";

            return (
              <div
                key={wallet.walletId}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Wallet Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full border border-[var(--border-ink)] ${
                        isShortfall
                          ? "bg-[#EF4444]"
                          : isTight
                          ? "bg-[#F59E0B]"
                          : "bg-[#10B981]"
                      }`}
                    />
                    <h4 className="truncate font-display text-sm font-extrabold text-[var(--text-primary)]">
                      {wallet.walletName}
                    </h4>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-xs font-semibold text-[var(--text-tertiary)]">
                    <span>Available: {formatPhp(wallet.availableBalancePhp)}</span>
                    <span>•</span>
                    <span>Scheduled Outflows: {formatPhp(wallet.scheduledOutflowsPhp)}</span>
                    <span>•</span>
                    <span
                      className={
                        wallet.projectedEndingBalancePhp < 0
                          ? "font-bold text-[var(--status-danger-text)]"
                          : "text-[var(--text-primary)]"
                      }
                    >
                      Ending: {formatPhp(wallet.projectedEndingBalancePhp)}
                    </span>
                  </div>
                </div>

                {/* Status Badges & Quick Action */}
                <div className="flex flex-wrap items-center gap-2">
                  {isShortfall && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[var(--border-ink)] bg-[var(--status-danger-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--status-danger-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                        Shortfall: −{formatPhp(wallet.shortfallPhp)} • Top up wallet
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTopUp(wallet.walletId, wallet.shortfallPhp)}
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--theme-primary)] px-3 py-1 font-mono text-xs font-bold text-[var(--theme-text-on-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] transition hover:bg-[var(--theme-primary-hover)] active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                          />
                        </svg>
                        <span>Top Up</span>
                      </button>
                    </div>
                  )}

                  {isTight && (
                    <span className="rounded-full border border-[var(--border-ink)] bg-[var(--status-warning-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--status-warning-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                      Low Runway (&lt;15%)
                    </span>
                  )}

                  {!isShortfall && !isTight && (
                    <span className="rounded-full border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                      Healthy
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="relative py-8">
            <EmptyStateWatermark />
            <p className="relative text-center text-sm font-semibold text-[var(--text-muted)]">
              No liquid wallets registered in your vault yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
