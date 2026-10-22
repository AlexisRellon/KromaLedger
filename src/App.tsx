import { lazy, Suspense, useMemo, useState } from "react";
import { calculateCashflow } from "./core/engine/cashflowAnalytics";
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
import { HomeDashboard } from "./ui/screens/HomeDashboard";

const WalletsScreen = lazy(() => import("./ui/screens/WalletsScreen").then((m) => ({ default: m.WalletsScreen })));
const PendingAndSubsHub = lazy(() => import("./ui/screens/PendingAndSubsHub").then((m) => ({ default: m.PendingAndSubsHub })));
const SettingsScreen = lazy(() => import("./ui/screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const VaultBackupModal = lazy(() => import("./ui/screens/VaultBackupModal").then((m) => ({ default: m.VaultBackupModal })));
const EditProfileModal = lazy(() => import("./ui/components/EditProfileModal").then((m) => ({ default: m.EditProfileModal })));
const QuickAddDrawer = lazy(() => import("./ui/components/QuickAddDrawer").then((m) => ({ default: m.QuickAddDrawer })));
const NotificationCenterModal = lazy(() => import("./ui/components/NotificationCenterModal").then((m) => ({ default: m.NotificationCenterModal })));
import { ScreenSkeleton } from "./ui/components/skeletons";

export function App() {
  const month = useUIStore((s) => s.selectedMonth);
  const tab = useUIStore((s) => s.activeNavTab);
  const quickOpen = useUIStore((s) => s.quickAddOpen);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const closeQuickAdd = useUIStore((s) => s.closeQuickAdd);
  const editProfileOpen = useUIStore((s) => s.editProfileOpen);
  const closeEditProfile = useUIStore((s) => s.closeEditProfile);
  const notificationsOpen = useUIStore((s) => s.notificationsOpen);
  const closeNotifications = useUIStore((s) => s.closeNotifications);
  const [backupOpen, setBackupOpen] = useState(false);

  const tx = useTransactions();
  const allTx = useAllTransactions();
  const attachments = useAttachments();
  const subs = useSubscriptions();
  const invoices = useInvoices();
  const categories = useCategories();
  const profileQuery = useProfile();
  const saveProfileMutation = useSaveProfile();

  const isHomeLoading =
    tab === "HOME" &&
    !tx.data &&
    (tx.isLoading || allTx.isLoading || subs.isLoading || categories.isLoading);

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
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-[max(9rem,calc(env(safe-area-inset-bottom)+7.5rem))] sm:pb-36 pt-5 sm:px-7 lg:px-10">
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
            isLoading={isHomeLoading}
          />
        ) : (
          <Suspense fallback={<ScreenSkeleton tab={tab} />}>
            {tab === "WALLETS" ? (
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
          </Suspense>
        )}
      </div>

      <FloatingNavPill />

      <Suspense fallback={null}>
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
        {notificationsOpen && <NotificationCenterModal onClose={closeNotifications} />}
      </Suspense>
    </main>
  );
}




