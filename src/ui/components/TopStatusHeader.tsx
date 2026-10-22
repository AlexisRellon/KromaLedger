import { useEffect, useState } from "react";
import { BrandLogo } from "../primitives";
import { useStorage } from "../../state/StorageContext";
import { useNotifications, useProfile } from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";

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

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-2">
      <BrandLogo />
      <div className="flex items-center gap-2.5">
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
          className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-1.5 text-xs text-neutral-300 transition hover:border-[#D9F938]/40 hover:text-white"
        >
          <span
            className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
              persistent ? "bg-[#D9F938]" : "bg-amber-400"
            }`}
          />
          {status}
          <span className="mx-1.5 text-neutral-600">•</span>
          Tap to Backup
        </button>

        <button
          onClick={() => (onEditProfile ? onEditProfile() : openEditProfile())}
          aria-label="Edit local profile"
          className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
            editProfileOpen
              ? "border-[#D9F938]/60 bg-[#D9F938]/10 text-white"
              : "border-white/10 bg-white/[.04] text-neutral-300 hover:border-[#D9F938]/40 hover:text-white"
          }`}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-black"
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
