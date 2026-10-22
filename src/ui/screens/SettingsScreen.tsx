import { useState } from "react";
import { SmokedCard } from "../primitives";
import { WalletFormModal } from "../components/WalletFormModal";
import { WALLET_TYPES, WalletTypeIcon, CashIcon } from "../components/WalletTypeIcon";
import {
  useClearAllData,
  useDeleteWallet,
  useProfile,
  useResetToDemo,
  useSaveWallet,
  useWallets,
  useAllTransactions,
  useSubscriptions,
  useInvoices,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { formatCurrency, type Wallet } from "../../core/models";
import { SettingsSkeleton } from "../components/skeletons";

export function SettingsScreen({
  onOpenBackup,
  isLoading = false,
}: {
  onOpenBackup: () => void;
  isLoading?: boolean;
}) {
  const profileQuery = useProfile();
  const walletsQuery = useWallets();

  if (isLoading || (profileQuery.isLoading && !profileQuery.data)) {
    return <SettingsSkeleton />;
  }
  const txQuery = useAllTransactions();
  const subsQuery = useSubscriptions();
  const invoicesQuery = useInvoices();

  const openEditProfile = useUIStore((s) => s.openEditProfile);
  const saveWalletMutation = useSaveWallet();
  const deleteWalletMutation = useDeleteWallet();
  const clearAllMutation = useClearAllData();
  const resetDemoMutation = useResetToDemo();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerMode, setDangerMode] = useState<"CLEAR" | "RESET_DEMO">("CLEAR");
  const [confirmInput, setConfirmInput] = useState("");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const profile = profileQuery.data ?? {
    id: "profile" as const,
    name: "Operator",
    handle: "operator",
    email: "operator@kroma.local",
    initials: "KO",
    themeColor: "#D9F938",
    defaultCurrency: "PHP",
    bio: "100% on-device local ledger",
  };

  const wallets = walletsQuery.data ?? [];
  const totalBalanceMinor = wallets.reduce((sum, w) => sum + w.balanceMinor, 0);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

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

      {/* 1. Local Profile Section */}
      <SmokedCard className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D9F938]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-black shadow-lg"
              style={{ backgroundColor: profile.themeColor || "#D9F938" }}
            >
              {profile.initials || "KO"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-white">{profile.name}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-neutral-400">
                  @{profile.handle}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-300">{profile.bio || "Local-first operator"}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                <span>Default Currency: <strong className="text-white font-semibold">{profile.defaultCurrency}</strong></span>
                <span className="text-neutral-500">•</span>
                <span>100% Local Encrypted</span>
              </div>
            </div>
          </div>

          <button
            onClick={openEditProfile}
            className="self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-[#D9F938]/50 hover:bg-white/10 sm:self-center"
          >
            Edit Profile
          </button>
        </div>

        {/* Ledger Summary Stats - Flat row without nested card boxes */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Wallets</span>
            <p className="mt-1 text-xl font-extrabold text-white font-mono">{wallets.length}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Entries</span>
            <p className="mt-1 text-xl font-extrabold text-white font-mono">{txQuery.data?.length ?? 0}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Subscriptions</span>
            <p className="mt-1 text-xl font-extrabold text-white font-mono">{subsQuery.data?.length ?? 0}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Invoices</span>
            <p className="mt-1 text-xl font-extrabold text-white font-mono">{invoicesQuery.data?.length ?? 0}</p>
          </div>
        </div>
      </SmokedCard>

      {/* 2. Wallets Management Section */}
      <SmokedCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-white">Wallets & Accounts</h3>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-neutral-300">
                {wallets.length} active
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Manage cash, digital banks, e-wallets, and payment accounts on this device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingWallet(null);
                setWalletModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#D9F938] px-3.5 py-2 text-xs font-semibold text-black transition hover:brightness-110 active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Wallet</span>
            </button>
          </div>
        </div>

        {/* Total Wallet Balance */}
        {wallets.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
            <span className="text-xs font-medium text-neutral-400">Total Liquid Balance Across Wallets</span>
            <span className="font-mono text-base font-bold text-[#D9F938]">
              {formatCurrency(totalBalanceMinor, profile.defaultCurrency)}
            </span>
          </div>
        )}

        {/* Wallets Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => {
            const fallbackType = WALLET_TYPES[0] ?? { type: "CASH" as const, label: "Physical Cash", Icon: CashIcon };
            const typeInfo = WALLET_TYPES.find((t) => t.type === wallet.type) ?? fallbackType;
            return (
              <div
                key={wallet.id}
                className="group relative flex flex-col justify-between rounded-xl p-3 transition hover:bg-white/[.03]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-neutral-200"
                      aria-label={typeInfo.label}
                    >
                      <WalletTypeIcon type={wallet.type} className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {wallet.isDefault && (
                        <span className="rounded-full bg-[#D9F938]/15 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#D9F938]">
                          DEFAULT
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="mt-2 font-display text-sm font-semibold text-white group-hover:text-[#D9F938] transition">
                    {wallet.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>{wallet.institution || typeInfo.label}</span>
                    {wallet.accountNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-neutral-400">{wallet.accountNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-white/5 pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 font-mono">Balance</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {formatCurrency(wallet.balanceMinor, wallet.currency)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
                    {!wallet.isDefault && (
                      <button
                        onClick={async () => {
                          await saveWalletMutation.mutateAsync({ ...wallet, isDefault: true });
                          showNotice(`Set ${wallet.name} as default wallet.`);
                        }}
                        className="text-xs text-neutral-400 hover:text-white transition"
                      >
                        Make Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingWallet(wallet);
                        setWalletModalOpen(true);
                      }}
                      className="text-xs text-neutral-300 hover:text-[#D9F938] transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete wallet "${wallet.name}"? Transactions linked to this wallet will be unlinked.`)) {
                          await deleteWalletMutation.mutateAsync(wallet.id);
                          showNotice(`Deleted wallet ${wallet.name}.`);
                        }
                      }}
                      className="text-xs text-rose-400/80 hover:text-rose-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {wallets.length === 0 && (
            <div className="col-span-full border-t border-white/[0.08] pt-6 pb-2 text-center">
              <p className="text-sm text-neutral-400">No custom wallets created yet.</p>
              <button
                onClick={() => {
                  setEditingWallet(null);
                  setWalletModalOpen(true);
                }}
                className="mt-2 text-xs font-semibold text-[#D9F938] underline hover:brightness-110"
              >
                + Create your first wallet
              </button>
            </div>
          )}
        </div>
      </SmokedCard>

      {/* 3. Storage & Backup Card */}
      <SmokedCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Local Vault & Backups</h3>
            <p className="text-xs text-neutral-400">
              Your ledger operates with 100% on-device IndexedDB storage. Exports are unencrypted ZIP archives.
            </p>
          </div>
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:border-[#D9F938]/50 hover:text-white transition"
          >
            <svg className="h-4 w-4 text-[#D9F938]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span>Open Vault Backup Modal</span>
          </button>
        </div>
      </SmokedCard>

      {/* 4. Danger Zone */}
      <section
        aria-label="Danger Zone"
        className="rounded-3xl border border-rose-500/25 bg-rose-950/[.08] p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-rose-400">Danger Zone</h3>
            <p className="text-xs text-rose-300/70">
              Irreversible actions that affect your on-device ledger data.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-rose-500/15 border-t border-rose-500/15">
          {/* Action 1: Reset to demo */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Reset to Demonstration Seed</h4>
              <p className="text-xs text-neutral-400">
                Replace current data with fresh demo entries, sample subscriptions, and demo wallets.
              </p>
            </div>
            <button
              onClick={() => {
                setDangerMode("RESET_DEMO");
                setConfirmInput("");
                setDangerModalOpen(true);
              }}
              className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              Reset to Demo Data
            </button>
          </div>

          {/* Action 2: Wipe all data */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Delete All Data (Factory Wipe)</h4>
              <p className="text-xs text-neutral-400">
                Permanently erase all local transactions, subscriptions, invoices, attachments, and wallets.
              </p>
            </div>
            <button
              onClick={() => {
                setDangerMode("CLEAR");
                setConfirmInput("");
                setDangerModalOpen(true);
              }}
              className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 active:scale-95"
            >
              Delete All Data
            </button>
          </div>
        </div>
      </section>

      {/* Add / Edit Wallet Modal */}
      {walletModalOpen && (
        <WalletFormModal
          wallet={editingWallet}
          defaultCurrency={profile.defaultCurrency}
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

      {/* Danger Zone Confirmation Modal */}
      {dangerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDangerModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Destructive Action"
            className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-rose-500/30 bg-[#11120f] shadow-2xl animate-entrance"
          >
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {dangerMode === "CLEAR" ? "Erase All Ledger Data?" : "Reset to Demo Seed?"}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                    {dangerMode === "CLEAR"
                      ? "This action will permanently purge all transactions, commitments, invoices, uploaded receipts, and custom wallets stored locally on this browser. You cannot undo this without a previous vault backup."
                      : "This will discard current custom entries and restore the default sample dataset with sample transactions and subscriptions."}
                  </p>
                </div>
              </div>

              {dangerMode === "CLEAR" && (
                <div className="mt-4 rounded-xl border border-white/5 bg-black/40 p-3">
                  <label className="block text-xs font-medium text-neutral-300">
                    Type <strong className="text-rose-400 font-mono">DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-white/10 bg-[#11120f] px-5 py-3.5 sm:px-6 sm:py-4">
              <button
                onClick={() => setDangerModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                disabled={dangerMode === "CLEAR" && confirmInput !== "DELETE"}
                onClick={async () => {
                  if (dangerMode === "CLEAR") {
                    await clearAllMutation.mutateAsync();
                    showNotice("All local data has been erased.");
                  } else {
                    await resetDemoMutation.mutateAsync();
                    showNotice("Ledger reset to demonstration seed.");
                  }
                  setDangerModalOpen(false);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  dangerMode === "CLEAR" ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-amber-500 text-black hover:bg-amber-400"
                }`}
              >
                {dangerMode === "CLEAR" ? "Permanently Erase" : "Reset Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
