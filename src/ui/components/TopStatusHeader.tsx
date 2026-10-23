import { useEffect, useState } from "react";
import { BrandLogo } from "../primitives";
import { useStorage } from "../../state/StorageContext";
import { useNotifications, useProfile } from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { useAIStore } from "../../state/useAIStore";

export function TopStatusHeader({
  onBackup,
  onEditProfile,
}: {
  onBackup: () => void;
  onEditProfile?: () => void;
}) {
  const { storageStatus } = useStorage();
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const profileQuery = useProfile();
  const notificationsQuery = useNotifications();
  const editProfileOpen = useUIStore((s) => s.editProfileOpen);
  const openEditProfile = useUIStore((s) => s.openEditProfile);
  const notificationsOpen = useUIStore((s) => s.notificationsOpen);
  const openNotifications = useUIStore((s) => s.openNotifications);

  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.read).length;

  useEffect(() => {
    let live = true;
    void storageStatus().then((status) => {
      if (live) setPersistent(status.persistent);
    });
    return () => {
      live = false;
    };
  }, [storageStatus]);

  const status =
    persistent === null
      ? "Checking local storage"
      : persistent
        ? "Local Storage Protected"
        : "Stored on this device";

  const profile = profileQuery.data;

  const openAI = useAIStore((s) => s.openModal);
  const aiOpen = useAIStore((s) => s.isOpen);

  return (
    <header className="flex items-center justify-between gap-3 py-2">
      <BrandLogo />
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={openAI}
          aria-label="Kroma Prism"
          title="Kroma Prism // Intelligence"
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition ${
            aiOpen
              ? "border-[#D9F938]/60 bg-[#D9F938]/10 text-[#D9F938]"
              : "border-white/10 bg-white/[.04] text-neutral-300 hover:border-[#D9F938]/40 hover:text-[#D9F938]"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
            />
          </svg>
        </button>
        <button
          onClick={openNotifications}
          aria-label="Notifications"
          title="Notifications & Reminders"
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border transition ${
            notificationsOpen
              ? "border-[#D9F938]/60 bg-[#D9F938]/10 text-[#D9F938]"
              : "border-white/10 bg-white/[.04] text-neutral-300 hover:border-[#D9F938]/40 hover:text-white"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9F938] px-1 text-[10px] font-black text-black ring-2 ring-[#070806]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onBackup}
          aria-label="Storage status and vault backup"
          title={`${status} • Tap to Backup`}
          className="relative flex h-8 w-8 sm:w-auto items-center justify-center rounded-full border border-white/10 bg-white/[.04] sm:px-3 sm:py-1.5 text-xs text-neutral-300 transition hover:border-[#D9F938]/40 hover:text-white"
        >
          <span
            className={`hidden sm:inline-block h-1.5 w-1.5 rounded-full mr-2 shrink-0 ${
              persistent ? "bg-[#D9F938]" : "bg-amber-400"
            }`}
          />
          <svg className="h-4 w-4 shrink-0 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <span
            className={`sm:hidden absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#070806] ${
              persistent ? "bg-[#D9F938]" : "bg-amber-400"
            }`}
          />
          <span className="hidden sm:inline font-medium">
            {persistent ? "Protected" : "Local Vault"}
          </span>
          <span className="hidden sm:inline mx-1 text-neutral-600">•</span>
          <span className="hidden sm:inline">Backup</span>
        </button>

        <button
          onClick={() => (onEditProfile ? onEditProfile() : openEditProfile())}
          aria-label="Edit local profile"
          className={`group gap-2 flex h-8 items-center justify-center rounded-full border p-1 sm:px-3 sm:py-1.5 text-xs transition ${
            editProfileOpen
              ? "border-[#D9F938]/60 bg-[#D9F938]/10 text-white"
              : "border-white/10 bg-white/[.04] text-neutral-300 hover:border-[#D9F938]/40 hover:text-white"
          }`}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-black shrink-0"
            style={{ backgroundColor: profile?.themeColor || "#D9F938" }}
          >
            {profile?.initials || "KO"}
          </span>
          <span className="hidden sm:inline text-xs font-semibold">{profile?.name || "Profile"}</span>
        </button>
      </div>
    </header>
  );
}
