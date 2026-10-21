import { useState, useMemo } from "react";
import { formatCurrency, type Transaction, type Wallet } from "../../core/models";
import {
  useWallets,
  useAllTransactions,
  useSaveWallet,
  useDeleteWallet,
  useProfile,
  useCategories,
  useSaveTransaction,
  useDeleteTransaction,
} from "../../state/queries";
import { StackedWalletDeck } from "../components/StackedWalletDeck";
import { PhysicalWalletCard } from "../components/PhysicalWalletCard";
import { WalletFormModal, WALLET_TYPES } from "../components/WalletFormModal";
import { WalletTypeIcon, CashIcon } from "../components/WalletTypeIcon";
import { SmokedCard } from "../primitives";
import { EditEntryModal } from "../components/EditEntryModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { WalletOverviewPanel } from "../../state/presentation/WalletOverviewPanel";

export function WalletsScreen({
  onQuickAdd,
}: {
  onQuickAdd: () => void;
}) {
  const walletsQuery = useWallets();
  const txQuery = useAllTransactions();
  const profileQuery = useProfile();
  const saveWalletMutation = useSaveWallet();
  const deleteWalletMutation = useDeleteWallet();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const categoriesQuery = useCategories();
  const saveTxMutation = useSaveTransaction();
  const deleteTxMutation = useDeleteTransaction();

  const wallets = walletsQuery.data ?? [];
  const allTx = txQuery.data ?? [];
  const defaultCurrency = profileQuery.data?.defaultCurrency ?? "PHP";

  const totalBalanceMinor = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balanceMinor, 0),
    [wallets]
  );

  const primaryWallet = useMemo(
    () => wallets.find((w) => w.isDefault) ?? wallets[0] ?? null,
    [wallets]
  );

  const activeWallet = useMemo(() => {
    if (selectedWalletId) {
      return wallets.find((w) => w.id === selectedWalletId) ?? primaryWallet;
    }
    return primaryWallet;
  }, [wallets, selectedWalletId, primaryWallet]);

  const walletTransactions = useMemo(() => {
    if (!activeWallet) return [];
    return allTx.filter((t) => t.walletId === activeWallet.id);
  }, [allTx, activeWallet]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const fallbackType = WALLET_TYPES[0] ?? { type: "CASH" as const, label: "Physical Cash", Icon: CashIcon };
  const activeTypeInfo = WALLET_TYPES.find((t) => t.type === activeWallet?.type) ?? fallbackType;

  return (
    <div className="space-y-8 pb-16">
      {statusNotice && (
        <div
          role="status"
          className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#D9F938]/40 bg-[#11120f]/95 px-5 py-2.5 text-xs font-semibold text-[#D9F938] shadow-2xl backdrop-blur-xl animate-entrance"
        >
          {statusNotice}
        </div>
      )}

      <WalletOverviewPanel
        walletCount={wallets.length}
        primaryWalletName={primaryWallet?.name ?? ""}
        totalBalanceMinor={totalBalanceMinor}
        currency={defaultCurrency}
        onAddWallet={() => {
          setEditingWallet(null);
          setWalletModalOpen(true);
        }}
      />

      {/* Main 2-Column Section: Stacked Deck & Active Card Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: 3D Stacked Cards Deck */}
        <div className="space-y-6">
          <StackedWalletDeck wallets={wallets} defaultCurrency={defaultCurrency} />

          {/* All Accounts Quick Grid */}
          <SmokedCard>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">All Accounts</h3>
              <span className="text-xs text-neutral-400">{wallets.length} accounts configured</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {wallets.map((w) => {
                const isSelected = w.id === activeWallet?.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`flex items-center justify-between py-3 px-2 -mx-2 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.06]"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl grid place-items-center bg-white/[0.06] text-neutral-200"
                      >
                        <WalletTypeIcon type={w.type} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-semibold text-white">{w.name}</h4>
                          {w.isDefault && (
                            <span className="rounded-full bg-[#D9F938]/15 px-2 py-0.5 text-xs font-mono font-semibold text-[#D9F938]">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400">
                          {w.institution || w.type} {w.accountNumber ? `• ${w.accountNumber}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatCurrency(w.balanceMinor, w.currency)}
                      </p>
                      <span className="text-xs text-neutral-500 font-mono">{w.currency}</span>
                    </div>
                  </div>
                );
              })}

              {!wallets.length && (
                <p className="py-6 text-center text-sm text-neutral-400">
                  No custom wallets created yet.
                </p>
              )}
            </div>
          </SmokedCard>
        </div>

        {/* Right Column: Card Inspector & Recent Activity */}
        <div className="space-y-6">
          {activeWallet ? (
            <SmokedCard>
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Selected Card
                  </span>
                  <h3 className="font-display text-xl font-bold text-white">{activeWallet.name}</h3>
                  <p className="text-xs text-neutral-400">
                    {activeWallet.institution || activeTypeInfo.label} • {activeWallet.accountNumber ? `•••• ${activeWallet.accountNumber}` : "No account number"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingWallet(activeWallet);
                      setWalletModalOpen(true);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-[#D9F938]/50 hover:text-white transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete wallet "${activeWallet.name}"? Transactions linked to this wallet will be unlinked.`)) {
                        await deleteWalletMutation.mutateAsync(activeWallet.id);
                        showNotice(`Deleted wallet ${activeWallet.name}.`);
                        setSelectedWalletId(null);
                      }
                    }}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Physical Card Preview in Inspector */}
              <div className="mx-auto my-5 w-full max-w-[360px]">
                <PhysicalWalletCard wallet={activeWallet} />
              </div>

              {/* Card Specs */}
              <div className="mt-4 grid grid-cols-2 gap-4 border-b border-white/[0.08] pb-4 sm:grid-cols-3">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Balance</span>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    {formatCurrency(activeWallet.balanceMinor, activeWallet.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Currency</span>
                  <p className="mt-1 font-mono text-sm font-semibold text-neutral-200">
                    {activeWallet.currency}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Type</span>
                  <p className="mt-1 text-sm font-semibold text-neutral-200">
                    {activeTypeInfo.label}
                  </p>
                </div>
              </div>

              {/* Set Primary Button */}
              {!activeWallet.isDefault && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Make this your primary default wallet</span>
                  <button
                    onClick={async () => {
                      await saveWalletMutation.mutateAsync({ ...activeWallet, isDefault: true });
                      showNotice(`Set ${activeWallet.name} as primary default wallet.`);
                    }}
                    className="rounded-xl border border-[#D9F938]/30 bg-[#D9F938]/10 px-3.5 py-1.5 text-xs font-semibold text-[#D9F938] hover:bg-[#D9F938]/20 transition"
                  >
                    Set as Primary
                  </button>
                </div>
              )}
            </SmokedCard>
          ) : null}

          {/* Card Ledger Activity */}
          <SmokedCard>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Card Activity</h3>
                <p className="text-xs text-neutral-400">
                  {activeWallet ? `Transactions linked to ${activeWallet.name}` : "Recent transactions"}
                </p>
              </div>

              <button
                onClick={onQuickAdd}
                className="text-xs font-semibold text-[#D9F938] hover:underline"
              >
                + New Entry
              </button>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {walletTransactions.slice(0, 8).map((tx) => {
                const incoming = tx.amountMinor > 0;
                return (
                  <div
                    key={tx.id}
                    onClick={() => setEditingTransaction(tx)}
                    className="group flex cursor-pointer items-center justify-between py-3 px-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.02] transition"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-white group-hover:text-[#D9F938] transition-colors">{tx.title}</h4>
                      <p className="text-xs text-neutral-400 font-mono">{tx.date}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            incoming ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {incoming ? "+" : "−"}
                          {formatCurrency(Math.abs(tx.amountMinor), tx.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTransaction(tx);
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
                            setDeletingTransaction(tx);
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
              })}

              {!walletTransactions.length && (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-400">No transactions recorded for this wallet yet.</p>
                  <button
                    onClick={onQuickAdd}
                    className="mt-2 text-xs font-semibold text-[#D9F938] underline"
                  >
                    Record a transaction
                  </button>
                </div>
              )}
            </div>
          </SmokedCard>
        </div>
      </div>

      {/* Edit Entry Modal */}
      {editingTransaction && (
        <EditEntryModal
          transaction={editingTransaction}
          categories={categoriesQuery.data ?? []}
          wallets={wallets}
          onClose={() => setEditingTransaction(null)}
          onSave={async (updated) => {
            await saveTxMutation.mutateAsync(updated);
            setEditingTransaction(null);
            showNotice(`Entry "${updated.title}" updated · Synced to wallet.`);
          }}
          onDelete={(id) => {
            const tx = allTx.find((t) => t.id === id) ?? editingTransaction;
            setEditingTransaction(null);
            setDeletingTransaction(tx);
          }}
        />
      )}

      {/* Confirm Delete Entry Modal */}
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
            showNotice(`Entry "${deletingTransaction.title}" removed · Balance restored.`);
          }}
        />
      )}

      {/* Add / Edit Wallet Modal (matching QuickAddDrawer architecture) */}
      {walletModalOpen && (
        <WalletFormModal
          wallet={editingWallet}
          defaultCurrency={defaultCurrency}
          onClose={() => {
            setWalletModalOpen(false);
            setEditingWallet(null);
          }}
          onSave={async (saved) => {
            await saveWalletMutation.mutateAsync(saved);
            setWalletModalOpen(false);
            setEditingWallet(null);
            showNotice(`Wallet "${saved.name}" saved.`);
          }}
        />
      )}
    </div>
  );
}
