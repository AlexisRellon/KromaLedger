import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { UserProfile } from "../../core/models";
import { VoltButton } from "../primitives";

export const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD"];

export const THEME_COLORS = [
  { name: "Electric Volt", hex: "#D9F938" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Rose", hex: "#F43F5E" },
];

export function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (val: UserProfile) => Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [email, setEmail] = useState(profile.email || "");
  const [initials, setInitials] = useState(profile.initials);
  const [themeColor, setThemeColor] = useState(profile.themeColor || "#D9F938");
  const [defaultCurrency, setDefaultCurrency] = useState(profile.defaultCurrency);
  const [bio, setBio] = useState(profile.bio || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
    setEmail(profile.email || "");
    setInitials(profile.initials);
    setThemeColor(profile.themeColor || "#D9F938");
    setDefaultCurrency(profile.defaultCurrency);
    setBio(profile.bio || "");
  }, [profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({
        ...profile,
        name: name.trim(),
        handle: handle.trim() || "operator",
        email: email.trim() || "operator@kroma.local",
        initials: initials.trim().toUpperCase() || "KO",
        themeColor,
        defaultCurrency,
        bio: bio.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Local Profile"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] shadow-2xl animate-entrance"
      >
        {/* Modal Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-6 sm:py-4">
          <h3 className="font-display text-xl font-bold text-white">Edit Local Profile</h3>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-black"
              style={{ backgroundColor: themeColor }}
            >
              {initials || "KO"}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-400">Avatar Initials</label>
              <input
                type="text"
                maxLength={4}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                className="mt-1 w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Theme Color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setThemeColor(c.hex)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    themeColor === c.hex ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-black" : "opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#D9F938] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400">Handle / Tag</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:border-[#D9F938] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#D9F938] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#161714] px-3 py-2 text-sm text-white focus:border-[#D9F938] focus:outline-none"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Bio / Notes</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#D9F938] focus:outline-none"
            />
          </div>

          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-white/5 bg-[#11120f] px-5 py-3.5 sm:px-6 sm:py-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition hover:bg-white/5"
            >
              Cancel
            </button>
            <VoltButton type="submit" disabled={busy} className="px-5 py-2 text-xs">
              {busy ? "Saving…" : "Save Profile"}
            </VoltButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
