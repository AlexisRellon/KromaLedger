import { useMemo, useState } from "react";
import { calculateCashflow } from "./core/engine/cashflowAnalytics";
import { QuickAddDrawer } from "./ui/components/QuickAddDrawer";
import { useUIStore } from "./state/useUIStore";
import {
  useAllTransactions,
  useAttachments,
  useCategories,
  useInvoices,
  useProfile,
  useSaveProfile,
  useSubscriptions,
  useTransactions,
} from "./state/queries";
import { TopStatusHeader } from "./ui/components/TopStatusHeader";
import { FloatingNavPill } from "./ui/components/FloatingNavPill";
import { PendingAndSubsHub } from "./ui/screens/PendingAndSubsHub";
import { HomeDashboard } from "./ui/screens/HomeDashboard";
import { WalletsScreen } from "./ui/screens/WalletsScreen";
import { VaultBackupModal } from "./ui/screens/VaultBackupModal";
import { SettingsScreen } from "./ui/screens/SettingsScreen";
import { EditProfileModal } from "./ui/components/EditProfileModal";

export function App() {
  const month = useUIStore((s) => s.selectedMonth);
  const tab = useUIStore((s) => s.activeNavTab);
  const quickOpen = useUIStore((s) => s.quickAddOpen);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const closeQuickAdd = useUIStore((s) => s.closeQuickAdd);
  const editProfileOpen = useUIStore((s) => s.editProfileOpen);
  const closeEditProfile = useUIStore((s) => s.closeEditProfile);
  const [backupOpen, setBackupOpen] = useState(false);

  const tx = useTransactions();
  const allTx = useAllTransactions();
  const attachments = useAttachments();
  const subs = useSubscriptions();
  const invoices = useInvoices();
  const categories = useCategories();
  const profileQuery = useProfile();
  const saveProfileMutation = useSaveProfile();

  const analytics = useMemo(
    () =>
      calculateCashflow({
        month,
        transactions: allTx.data ?? [],
        subscriptions: subs.data ?? [],
        invoices: invoices.data ?? [],
      }),
    [month, allTx.data, subs.data, invoices.data]
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 sm:pb-36 pt-5 sm:px-7 lg:px-10">
      <TopStatusHeader onBackup={() => setBackupOpen(true)} />

      <div className="mb-6 mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {tab === "HOME"
              ? "Ledger Overview"
              : tab === "WALLETS"
                ? "Liquid Wallets"
                : tab === "PENDING"
                  ? "Commitments & Pending"
                  : "Profile & Settings"}
          </h1>
        </div>
        {tab !== "SETTINGS" && tab !== "WALLETS" && (
          <label className="text-xs text-neutral-500">
            MONTH{" "}
            <input
              aria-label="Selected month"
              type="month"
              value={month}
              onChange={(e) => useUIStore.getState().setMonth(e.target.value)}
              className="ml-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-white"
            />
          </label>
        )}
      </div>

      <div key={tab} className="animate-entrance">
        {tab === "HOME" ? (
          <HomeDashboard
            month={month}
            analytics={analytics}
            transactions={tx.data ?? []}
            subscriptions={subs.data ?? []}
            attachments={attachments.data ?? []}
            categories={categories.data ?? []}
            onQuickAdd={() => openQuickAdd("EXPENSE")}
          />
        ) : tab === "WALLETS" ? (
          <WalletsScreen onQuickAdd={() => openQuickAdd("EXPENSE")} />
        ) : tab === "PENDING" ? (
          <PendingAndSubsHub
            subscriptions={subs.data ?? []}
            invoices={invoices.data ?? []}
            analytics={analytics}
            onQuickAdd={() => openQuickAdd("SUBSCRIPTION")}
          />
        ) : (
          <SettingsScreen onOpenBackup={() => setBackupOpen(true)} />
        )}
      </div>

      <FloatingNavPill />

      {quickOpen && (
        <QuickAddDrawer
          onClose={closeQuickAdd}
          categories={categories.data ?? []}
        />
      )}
      {backupOpen && <VaultBackupModal onClose={() => setBackupOpen(false)} />}
      {editProfileOpen && (
        <EditProfileModal
          profile={
            profileQuery.data ?? {
              id: "profile",
              name: "Kroma Operator",
              handle: "operator",
              email: "operator@kroma.local",
              initials: "KO",
              themeColor: "#D9F938",
              defaultCurrency: "PHP",
              bio: "100% on-device local ledger",
            }
          }
          onClose={closeEditProfile}
          onSave={async (updated) => {
            await saveProfileMutation.mutateAsync(updated);
            closeEditProfile();
          }}
        />
      )}
    </main>
  );
}




