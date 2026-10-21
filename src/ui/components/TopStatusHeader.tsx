import { useEffect, useState } from "react";
import { BrandLogo } from "../primitives";
import { useStorage } from "../../state/StorageContext";
import { useProfile } from "../../state/queries";
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
  const editProfileOpen = useUIStore((s) => s.editProfileOpen);
  const openEditProfile = useUIStore((s) => s.openEditProfile);

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
          onClick={onBackup}
          aria-label="Storage status and vault backup"
          className="rounded-full border border-white/10 bg-white/[.04] px-3.5 py-1.5 text-xs text-neutral-300 transition hover:border-[#D9F938]/40 hover:text-white"
        >
          <span className={`mr-2 ${persistent ? "text-[#D9F938]" : "text-amber-400"}`}>●</span>
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
