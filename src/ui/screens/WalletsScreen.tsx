import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { WalletActivity } from "../components/WalletActivity";
import { WalletsSkeleton } from "../components/skeletons";

export function WalletsScreen({
  onQuickAdd,
  isLoading = false,
}: {
  onQuickAdd: () => void;
  isLoading?: boolean;
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
  const [noticeClosing, setNoticeClosing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const categoriesQuery = useCategories();
  const saveTxMutation = useSaveTransaction();
  const deleteTxMutation = useDeleteTransaction();

  const wallets = walletsQuery.data ?? [];
  const allTx = txQuery.data ?? [];
  const defaultCurrency = profileQuery.data?.defaultCurrency ?? "PHP";

  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      if (noticeExitTimeoutRef.current) clearTimeout(noticeExitTimeoutRef.current);
    };
  }, []);

  const showNotice = (msg: string) => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    if (noticeExitTimeoutRef.current) clearTimeout(noticeExitTimeoutRef.current);
    setNoticeClosing(false);
    setStatusNotice(msg);
    noticeTimeoutRef.current = setTimeout(() => {
      setNoticeClosing(true);
      noticeExitTimeoutRef.current = setTimeout(() => {
        setStatusNotice(null);
        setNoticeClosing(false);
        noticeTimeoutRef.current = null;
        noticeExitTimeoutRef.current = null;
      }, 200);
    }, 2800);
  };

  const renderNoticeToast = () => {
    if (!statusNotice) return null;
    const toastElement = (
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-6 left-1/2 z-[9999] pointer-events-auto rounded-full border-2 border-neutral-900 bg-[#FBBF24] px-6 py-2.5 text-xs font-extrabold text-neutral-950 shadow-[3px_3px_0px_#18181B] ${
          noticeClosing ? "animate-grow-out" : "animate-grow-in"
        }`}
      >
        {statusNotice}
      </div>
    );

    if (typeof document !== "undefined") {
      return createPortal(toastElement, document.body);
    }
    return toastElement;
  };

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
    return allTx.filter((t) => t.walletId === activeWallet.id || t.toWalletId === activeWallet.id);
  }, [allTx, activeWallet]);

  if (isLoading || (walletsQuery.isLoading && !walletsQuery.data)) {
    return <WalletsSkeleton />;
  }

  const fallbackType = WALLET_TYPES[0] ?? { type: "CASH" as const, label: "Physical Cash", Icon: CashIcon };
  const activeTypeInfo = WALLET_TYPES.find((t) => t.type === activeWallet?.type) ?? fallbackType;

  return (
    <div className="space-y-8 pb-16">
      {renderNoticeToast()}

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
              <h3 className="font-display text-lg font-extrabold text-neutral-900">All Accounts</h3>
              <span className="text-xs font-semibold text-neutral-500">{wallets.length} accounts configured</span>
            </div>

            <div className="divide-y divide-neutral-200">
              {wallets.map((w) => {
                const isSelected = w.id === activeWallet?.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`flex items-center justify-between py-3 px-2.5 -mx-2 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? "border-2 border-neutral-900 bg-[#EDE9FE] shadow-[2px_2px_0px_#18181B]"
                        : "hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl grid place-items-center border-1.5 border-neutral-900 bg-white text-neutral-900 shadow-[1px_1px_0px_#18181B]"
                      >
                        <WalletTypeIcon type={w.type} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-bold text-neutral-900">{w.name}</h4>
                          {w.isDefault && (
                            <span className="rounded-full border border-neutral-900 bg-[#F59E0B] px-2 py-0.2 text-xs font-mono font-black text-neutral-950 shadow-[1px_1px_0px_#18181B]">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-neutral-600">
                          {w.institution || w.type} {w.accountNumber ? `• ${w.accountNumber}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-sm font-extrabold text-neutral-900 tabular-nums">
                        {formatCurrency(w.balanceMinor, w.currency)}
                      </p>
                      <span className="text-xs text-neutral-600 font-mono font-bold">{w.currency}</span>
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
              <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Selected Card
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-neutral-900">{activeWallet.name}</h3>
                  <p className="text-xs font-semibold text-neutral-600">
                    {activeWallet.institution || activeTypeInfo.label} • {activeWallet.accountNumber ? `•••• ${activeWallet.accountNumber}` : "No account number"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingWallet(activeWallet);
                      setWalletModalOpen(true);
                    }}
                    className="rounded-xl border-2 border-neutral-900 bg-white px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_#18181B] hover:bg-[#FEF3C7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] transition"
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
                    className="rounded-xl border-2 border-neutral-900 bg-[#FFE4E6] px-3 py-1.5 text-xs font-bold text-[#BE123C] shadow-[2px_2px_0px_#18181B] hover:bg-[#FECDD3] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] transition cursor-pointer"
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
              <div className="mt-4 grid grid-cols-2 gap-4 border-b-2 border-neutral-900 pb-4 sm:grid-cols-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Balance</span>
                  <p className="mt-1 font-mono text-lg font-black text-neutral-900">
                    {formatCurrency(activeWallet.balanceMinor, activeWallet.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Currency</span>
                  <p className="mt-1 font-mono text-sm font-bold text-neutral-800">
                    {activeWallet.currency}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Type</span>
                  <p className="mt-1 text-sm font-bold text-neutral-800">
                    {activeTypeInfo.label}
                  </p>
                </div>
              </div>

              {/* Set Primary Button */}
              {!activeWallet.isDefault && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600">Make this your primary default wallet</span>
                  <button
                    onClick={async () => {
                      await saveWalletMutation.mutateAsync({ ...activeWallet, isDefault: true });
                      showNotice(`Set ${activeWallet.name} as primary default wallet.`);
                    }}
                    className="rounded-xl border-2 border-neutral-900 bg-[#FEF3C7] px-3.5 py-1.5 text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_#18181B] hover:bg-[#FDE68A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] transition"
                  >
                    Set as Primary
                  </button>
                </div>
              )}
            </SmokedCard>
          ) : null}

          {/* Card Ledger Activity */}
          <WalletActivity
            key={activeWallet?.id ?? "no-wallet"}
            activeWallet={activeWallet}
            walletTransactions={walletTransactions}
            onQuickAdd={onQuickAdd}
            onEdit={setEditingTransaction}
            onDelete={setDeletingTransaction}
          />
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
