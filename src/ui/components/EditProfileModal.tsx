import { useEffect, useState } from "react";
import type { UserProfile } from "../../core/models";
import { Button, FormField, Input, ModalShell, Select, getAvatarColors } from "../primitives";

export const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD"];

export const THEME_COLORS = [
  { name: "Kaban Plum", hex: "#4A154B" },
  { name: "Treasure Amber", hex: "#F59E0B" },
  { name: "Mint Sage", hex: "#10B981" },
  { name: "Coral Rose", hex: "#F43F5E" },
  { name: "Sky Azure", hex: "#0284C7" },
  { name: "Obsidian", hex: "#18181B" },
  { name: "Electric Volt", hex: "#D9F938" },
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
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [email, setEmail] = useState(profile.email || "");
  const [initials, setInitials] = useState(profile.initials);
  const [themeColor, setThemeColor] = useState(profile.themeColor || "#4A154B");
  const [defaultCurrency, setDefaultCurrency] = useState(profile.defaultCurrency);
  const [bio, setBio] = useState(profile.bio || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
    setEmail(profile.email || "");
    setInitials(profile.initials);
    setThemeColor(profile.themeColor || "#4A154B");
    setDefaultCurrency(profile.defaultCurrency);
    setBio(profile.bio || "");
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({
        ...profile,
        name: name.trim(),
        handle: handle.trim() || "operator",
        email: email.trim() || "operator@kaban.local",
        initials: initials.trim().toUpperCase() || "KO",
        themeColor,
        defaultCurrency,
        bio: bio.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Edit Local Profile"
      subtitle="Vault Operator"
      busy={busy}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-modal-form"
            variant="primary"
            size="sm"
            disabled={busy}
          >
            {busy ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      }
    >
      <form id="edit-profile-modal-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar & Initials */}
        <div className="flex items-center gap-4 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)]">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--border-ink)] text-lg font-black shadow-[2px_2px_0px_var(--shadow-ink)]"
            style={getAvatarColors(themeColor)}
          >
            {initials || "KO"}
          </div>
          <div className="flex-1">
            <FormField label="Avatar Initials">
              {({ id }) => (
                <Input
                  id={id}
                  type="text"
                  maxLength={4}
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  className="w-24 font-mono font-bold"
                />
              )}
            </FormField>
          </div>
        </div>

        {/* Avatar background color */}
        <div>
          <p id="avatar-background-label" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Background Color
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5" role="group" aria-labelledby="avatar-background-label">
            {THEME_COLORS.map((c) => (
              <button
                type="button"
                key={c.hex}
                onClick={() => setThemeColor(c.hex)}
                className={`h-8 w-8 rounded-full border-2 border-[var(--border-ink)] transition-all cursor-pointer ${
                  themeColor.toLowerCase() === c.hex.toLowerCase()
                    ? "scale-110 shadow-[2px_2px_0px_var(--shadow-ink)] ring-2 ring-[var(--border-ink)] ring-offset-2"
                    : "opacity-80 hover:opacity-100 hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                aria-label={`${c.name} background`}
                aria-pressed={themeColor.toLowerCase() === c.hex.toLowerCase()}
              />
            ))}
            <label className="ml-1 flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
              Custom
              <input
                type="color"
                aria-label="Custom avatar background color"
                value={getAvatarColors(themeColor).backgroundColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-9 w-10 cursor-pointer rounded-lg border-2 border-[var(--border-ink)] p-0.5"
              />
            </label>
          </div>
        </div>

        {/* Display Name & Handle */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Display Name" required>
            {({ id }) => (
              <Input
                id={id}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Handle / Tag">
            {({ id }) => (
              <Input
                id={id}
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="font-mono"
              />
            )}
          </FormField>
        </div>

        {/* Email & Currency */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email (Optional)">
            {({ id }) => (
              <Input
                id={id}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </FormField>

          <FormField label="Default Currency">
            {({ id }) => (
              <Select
                id={id}
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        {/* Bio */}
        <FormField label="Bio / Vault Notes">
          {({ id }) => (
            <Input
              id={id}
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., Personal financial fortress"
            />
          )}
        </FormField>
      </form>
    </ModalShell>
  );
}
