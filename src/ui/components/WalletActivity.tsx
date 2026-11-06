import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { formatCurrency, type Transaction, type Wallet } from "../../core/models";
import { EMPTY_ACTIVITY_FILTERS, filterWalletActivity, type WalletActivityFilters } from "../../core/engine/walletActivity";
import { SmokedCard } from "../primitives";
import { Button } from "../primitives/controls";
import { ActivityFilters } from "./ActivityFilters";
import { useActivityCollapse } from "./useActivityCollapse";

const PAGE_SIZE = 8;

export function WalletActivity({ activeWallet, walletTransactions, onQuickAdd, onEdit, onDelete }: {
  activeWallet: Wallet | null;
  walletTransactions: Transaction[];
  onQuickAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  const [filters, setFilters] = useState(EMPTY_ACTIVITY_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { collapsing, collapse, cancelCollapse, onCollapseAnimationEnd } = useActivityCollapse();
  const invalidRange = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);
  const filteredTransactions = useMemo(
    () => filterWalletActivity(walletTransactions, filters),
    [walletTransactions, filters]
  );
  const hasFilters = Boolean(filters.search || filters.type || filters.startDate || filters.endDate);
  const updateFilters = (patch: Partial<WalletActivityFilters>) => {
    cancelCollapse();
    setFilters({ ...filters, ...patch });
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <SmokedCard>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-extrabold text-neutral-900">Card Activity</h3>
          <p className="text-xs font-semibold text-neutral-600">
            {activeWallet ? `Transactions linked to ${activeWallet.name}` : "Recent transactions"}
          </p>
        </div>

        <button
          onClick={onQuickAdd}
          className="text-xs font-bold text-[#4A154B] hover:underline"
        >
          + New Entry
        </button>
      </div>

      <ActivityFilters filters={filters} onChange={updateFilters}
        shownCount={Math.min(visibleCount, filteredTransactions.length)} totalCount={filteredTransactions.length} />

      <div className="divide-y divide-neutral-200" onAnimationEnd={onCollapseAnimationEnd}>
        {filteredTransactions.slice(0, visibleCount).map((tx, index) => {
          const isIncomingTransfer = tx.type === "TRANSFER" && tx.toWalletId === activeWallet?.id;
          const isOutgoingTransfer = tx.type === "TRANSFER" && tx.walletId === activeWallet?.id;
          const incoming = tx.type === "TRANSFER" ? isIncomingTransfer : tx.amountMinor > 0;
          const displayAmount = tx.type === "TRANSFER"
            ? (isOutgoingTransfer ? Math.abs(tx.amountMinor) + (tx.feeMinor ?? 0) : Math.abs(tx.amountMinor))
            : Math.abs(tx.amountMinor);
          return (
            <div key={tx.id} className={index >= PAGE_SIZE ? (collapsing ? "activity-entry-collapse" : "activity-entry-reveal") : undefined}>
              <div className="min-h-0 overflow-hidden">
                {(index === 0 || tx.date.slice(0, 7) !== filteredTransactions[index - 1]?.date.slice(0, 7)) && (
                  <div className="flex items-center gap-3 pt-4 text-xs font-bold text-neutral-500">
                    <span className="h-px flex-1 bg-neutral-300" />
                    <span>{format(parseISO(tx.date), "MMM yyyy")}</span>
                  </div>
                )}
                <div
                  onClick={() => onEdit(tx)}
                  className="group flex cursor-pointer items-center justify-between py-3 px-2 -mx-2 rounded-xl hover:bg-[#FAF8F5] transition"
                >
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-[#4A154B] transition-colors">
                      {tx.title}
                      {tx.type === "TRANSFER" && tx.feeMinor && tx.feeMinor > 0 && isOutgoingTransfer && (
                        <span className="ml-1.5 font-mono text-xs text-[#0369A1] font-semibold">
                          (incl. {formatCurrency(tx.feeMinor, tx.currency)} fee)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs font-semibold text-neutral-600 font-mono">{tx.date}</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span
                        className={`font-mono text-sm font-extrabold tabular-nums ${
                          incoming ? "text-[#047857]" : "text-neutral-900"
                        }`}
                      >
                        {incoming ? "+" : "−"}
                        {formatCurrency(displayAmount, tx.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(tx);
                        }}
                        aria-label="Edit entry"
                        title="Edit entry"
                        className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-[#FAF8F5] transition"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(tx);
                        }}
                        aria-label="Delete entry"
                        title="Delete entry"
                        className="rounded-lg p-1.5 text-neutral-500 hover:text-[#BE123C] hover:bg-rose-50 transition"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!filteredTransactions.length && !invalidRange && (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-neutral-600">
              {hasFilters ? "No entries match your filters." : "No transactions recorded for this wallet yet."}
            </p>
            {!hasFilters && (
              <button
                onClick={onQuickAdd}
                className="mt-2 text-xs font-bold text-[#4A154B] underline"
              >
                Record a transaction
              </button>
            )}
          </div>
        )}
      </div>
      {filteredTransactions.length > visibleCount ? (
        <Button variant="secondary" className="mt-4 w-full" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
          Show more entries
        </Button>
      ) : visibleCount > PAGE_SIZE && filteredTransactions.length > PAGE_SIZE ? (
        <Button variant="secondary" className="mt-4 w-full" disabled={collapsing} onClick={() => collapse(() => setVisibleCount(PAGE_SIZE))}>
          Show less
        </Button>
      ) : null}
    </SmokedCard>
  );
}
