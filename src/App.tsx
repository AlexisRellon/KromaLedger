import { lazy, Suspense, useState } from "react";
import { useUIStore } from "./state/useUIStore";
import { useProfile, useSaveProfile } from "./state/queries";
import { TopStatusHeader } from "./ui/components/TopStatusHeader";
import { FilipinoWeaveDefs } from "./ui/primitives/FilipinoWeaveDefs";
import { FloatingNavPill } from "./ui/components/FloatingNavPill";
import { HomeDashboard } from "./ui/screens/HomeDashboard";
import { BaulitoTour } from "./ui/components/BaulitoTour";
import { restartOnboarding } from "./state/onboarding";

const WalletsScreen = lazy(() => import("./ui/screens/WalletsScreen").then((m) => ({ default: m.WalletsScreen })));
const PendingAndSubsHub = lazy(() => import("./ui/screens/PendingAndSubsHub").then((m) => ({ default: m.PendingAndSubsHub })));
const SettingsScreen = lazy(() => import("./ui/screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const VaultBackupModal = lazy(() => import("./ui/screens/VaultBackupModal").then((m) => ({ default: m.VaultBackupModal })));
const EditProfileModal = lazy(() => import("./ui/components/EditProfileModal").then((m) => ({ default: m.EditProfileModal })));
const QuickAddDrawer = lazy(() => import("./ui/components/QuickAddDrawer").then((m) => ({ default: m.QuickAddDrawer })));
const NotificationCenterModal = lazy(() => import("./ui/components/NotificationCenterModal").then((m) => ({ default: m.NotificationCenterModal })));
const AIAssistantModal = lazy(() => import("./ui/components/AIAssistantModal").then((m) => ({ default: m.AIAssistantModal })));
import { ScreenSkeleton } from "./ui/components/skeletons";
import { useAIStore } from "./state/useAIStore";

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
  const aiOpen = useAIStore((s) => s.isOpen);
  const closeAI = useAIStore((s) => s.closeModal);
  const [backupOpen, setBackupOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => {
    try {
      const status =
        localStorage.getItem("kaban_onboarding") ??
        localStorage.getItem("kromaledger_onboarding");
      return status === "pending";
    } catch {
      return false;
    }
  });
  const finishTour = () => {
    try {
      localStorage.setItem("kaban_onboarding", "done");
      localStorage.setItem("kromaledger_onboarding", "done");
    } catch {}
    setTourOpen(false);
  };
  const startTour = () => {
    try { restartOnboarding(localStorage); } catch {}
    setTourOpen(true);
    useUIStore.getState().setTab("HOME");
  };

  const profileQuery = useProfile();
  const saveProfileMutation = useSaveProfile();

  if (tourOpen) return <BaulitoTour onClose={finishTour} />;

  return (
    <main className="mx-auto min-h-screen max-w-6xl overflow-x-clip px-4 pb-[max(9rem,calc(env(safe-area-inset-bottom)+7.5rem))] sm:pb-36 pt-5 sm:px-7 lg:px-10">
      <FilipinoWeaveDefs />
      <TopStatusHeader onBackup={() => setBackupOpen(true)} />

      <div className="mb-6 mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
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
          <label className="inline-flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs font-bold uppercase tracking-wider text-neutral-700">
            <span>MONTH</span>
            <input
              aria-label="Selected month"
              type="month"
              value={month}
              onChange={(e) => useUIStore.getState().setMonth(e.target.value)}
              className="rounded-xl border-2 border-neutral-900 bg-white px-3 py-1.5 font-sans text-sm font-bold text-neutral-900 shadow-[2px_2px_0px_#18181B] transition hover:bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            />
          </label>
        )}
      </div>

      <div key={tab} className="animate-entrance">
        {tab === "HOME" ? (
          <HomeDashboard showAnalytics onQuickAdd={() => openQuickAdd("EXPENSE")} />
        ) : (
          <Suspense fallback={<ScreenSkeleton tab={tab} />}>
            {tab === "WALLETS" ? (
              <WalletsScreen onQuickAdd={() => openQuickAdd("EXPENSE")} />
            ) : tab === "PENDING" ? (
              <PendingAndSubsHub onQuickAdd={() => openQuickAdd("SUBSCRIPTION")} />
            ) : (
              <SettingsScreen onOpenBackup={() => setBackupOpen(true)} onReplayTour={startTour} onDataReset={startTour} />
            )}
          </Suspense>
        )}
      </div>

      <FloatingNavPill />

      <Suspense fallback={null}>
        {quickOpen && <QuickAddDrawer onClose={closeQuickAdd} />}
        {backupOpen && <VaultBackupModal onClose={() => setBackupOpen(false)} />}
        {editProfileOpen && (
          <EditProfileModal
            profile={
              profileQuery.data ?? {
                id: "profile",
                name: "Kaban Operator",
                handle: "operator",
                email: "operator@kaban.local",
                initials: "KO",
                themeColor: "#4A154B",
                defaultCurrency: "PHP",
                bio: "100% on-device local financial vault",
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
        {aiOpen && <AIAssistantModal onClose={closeAI} />}
      </Suspense>
    </main>
  );
}
