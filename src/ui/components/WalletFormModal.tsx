import { useState, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Wallet, WalletType } from "../../core/models";
import { blockInvalidNumberKeys, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import { VoltButton } from "../primitives";
import { WALLET_TYPES, WalletTypeIcon } from "./WalletTypeIcon";
import { PhysicalWalletCard } from "./PhysicalWalletCard";

export { WALLET_TYPES };

export const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD"];

export interface WalletPalette {
  name: string;
  hex: string;
  gradient: string;
  border: string;
  glow: string;
  style?: React.CSSProperties;
}

export const WALLET_PALETTES: WalletPalette[] = [
  { name: "Electric Volt", hex: "#D9F938", gradient: "from-[#181d09] via-[#0f1205] to-[#20270a]", border: "border-[#D9F938]/30", glow: "rgba(217,249,56,0.12)" },
  { name: "Smoked Titanium", hex: "#94A3B8", gradient: "from-[#171a1f] via-[#0e1014] to-[#23272e]", border: "border-slate-500/30", glow: "rgba(148,163,184,0.12)" },
  { name: "Olive Bronze", hex: "#A3B840", gradient: "from-[#1c200c] via-[#121406] to-[#272b11]", border: "border-[#a3b840]/30", glow: "rgba(163,184,64,0.12)" },
  { name: "Dark Carbon", hex: "#525252", gradient: "from-[#161616] via-[#0c0c0c] to-[#222222]", border: "border-white/15", glow: "rgba(255,255,255,0.08)" },
  { name: "Muted Brass", hex: "#D99B38", gradient: "from-[#211608] via-[#130d04] to-[#2c1d0b]", border: "border-[#d99b38]/30", glow: "rgba(217,155,56,0.12)" },
  { name: "Slate Graphite", hex: "#64748B", gradient: "from-[#141b22] via-[#0b0f14] to-[#1c242c]", border: "border-slate-600/30", glow: "rgba(100,116,139,0.12)" },
  { name: "Platinum Silver", hex: "#E2E8F0", gradient: "from-[#1f2328] via-[#13161a] to-[#2a2f35]", border: "border-white/25", glow: "rgba(255,255,255,0.1)" },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0]! + cleaned[0]!, 16);
    const g = parseInt(cleaned[1]! + cleaned[1]!, 16);
    const b = parseInt(cleaned[2]! + cleaned[2]!, 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return { r, g, b };
  }
  return null;
}

export function getWalletPalette(color?: string, fallbackIndex = 0): WalletPalette {
  if (color) {
    const match = WALLET_PALETTES.find(
      (p) => p.hex.toLowerCase() === color.toLowerCase()
    );
    if (match) return match;

    const rgb = hexToRgb(color);
    if (rgb) {
      const { r, g, b } = rgb;
      const startR = Math.round(r * 0.32 + 13 * 0.68);
      const startG = Math.round(g * 0.32 + 15 * 0.68);
      const startB = Math.round(b * 0.32 + 18 * 0.68);
      const midR = Math.round(r * 0.08 + 12 * 0.92);
      const midG = Math.round(g * 0.08 + 14 * 0.92);
      const midB = Math.round(b * 0.08 + 16 * 0.92);
      const endR = Math.round(r * 0.28 + 13 * 0.72);
      const endG = Math.round(g * 0.28 + 15 * 0.72);
      const endB = Math.round(b * 0.28 + 18 * 0.72);

      const opaqueGradient = `linear-gradient(135deg, rgb(${startR}, ${startG}, ${startB}) 0%, rgb(${midR}, ${midG}, ${midB}) 50%, rgb(${endR}, ${endG}, ${endB}) 100%)`;

      return {
        name: "Custom Color",
        hex: color,
        gradient: "",
        border: "",
        glow: `rgba(${r}, ${g}, ${b}, 0.16)`,
        style: {
          backgroundImage: opaqueGradient,
          backgroundColor: "#0d0f12",
          borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
        },
      };
    }
  }
  const fallback = WALLET_PALETTES[fallbackIndex % WALLET_PALETTES.length];
  return fallback ?? WALLET_PALETTES[0]!;
}

export function WalletFormModal({
  wallet,
  defaultCurrency = "PHP",
  onClose,
  onSave,
}: {
  wallet: Wallet | null;
  defaultCurrency?: string;
  onClose: () => void;
  onSave: (val: Wallet) => Promise<void>;
}) {
  const isEdit = Boolean(wallet);
  const [name, setName] = useState(wallet?.name ?? "");
  const [type, setType] = useState<WalletType>(wallet?.type ?? "BANK");
  const [institution, setInstitution] = useState(wallet?.institution ?? "");
  const [accountNumber, setAccountNumber] = useState(wallet?.accountNumber ?? "");
  const [amountStr, setAmountStr] = useState(
    wallet ? (wallet.balanceMinor / 100).toFixed(2) : "0.00"
  );
  const [currency, setCurrency] = useState(wallet?.currency ?? defaultCurrency);
  const [color, setColor] = useState(wallet?.color ?? "#D9F938");
  const [isDefault, setIsDefault] = useState(wallet?.isDefault ?? false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const defaultWalletCheckboxId = useId();

  const isCustomColor = !WALLET_PALETTES.some(
    (p) => p.hex.toLowerCase() === color.toLowerCase()
  );

  const safeHexValue = (() => {
    const c = color.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(c)) return c;
    if (/^#[0-9a-f]{3}$/.test(c)) {
      return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
    }
    return "#d9f938";
  })();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key (matching QuickAddDrawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, busy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);

    const parsedAmount = parseFloat(amountStr) || 0;
    const balanceMinor = Math.round(parsedAmount * 100);

    const record: Wallet = {
      id: wallet?.id ?? `wallet-${crypto.randomUUID()}`,
      name: name.trim(),
      type,
      currency,
      balanceMinor,
      color,
      institution: institution.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      isDefault,
      createdAt: wallet?.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    try {
      await onSave(record);
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit Wallet" : "Add Wallet"}
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl sm:rounded-[2rem] border border-white/10 bg-[#10110e] shadow-2xl animate-entrance"
      >
        {/* Modal Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-white">
              {isEdit ? "Edit Wallet Card" : "Add Wallet Card"}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-400">
              {isEdit ? "Update account balance, institution, or card gradient." : "Connect a cash vault, digital bank, or card account."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
            {/* Live Preview Physical Card */}
            <div className="mx-auto mb-6 w-full max-w-[380px]">
              <PhysicalWalletCard
                wallet={{
                  id: wallet?.id ?? "preview",
                  name: name.trim() || "YOUR NAME HERE",
                  type,
                  currency,
                  balanceMinor: Math.round((parseFloat(amountStr || "0") || 0) * 100),
                  color,
                  institution: institution.trim() || undefined,
                  accountNumber: accountNumber.trim() || undefined,
                  isDefault,
                  createdAt: wallet?.createdAt ?? new Date().toISOString().slice(0, 10),
                }}
              />
            </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400">Wallet Name</label>
            <input
              type="text"
              required
              placeholder="e.g. BDO Checking, GCash Main, Cash in Vault"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#D9F938] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400">Wallet Type</label>
              <div className="relative mt-1.5 flex items-center">
                <div className="pointer-events-none absolute left-3.5 flex items-center text-neutral-400">
                  <WalletTypeIcon type={type} className="h-4 w-4" />
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WalletType)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-[#D9F938] focus:outline-none"
                >
                  {WALLET_TYPES.map((t) => (
                    <option key={t.type} value={t.type} className="bg-[#10110e] text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400">Institution / Bank</label>
              <input
                type="text"
                placeholder="e.g. BDO, BPI, GCash, Maya, Cash"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#D9F938] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400">
                Initial Balance ({currency})
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amountStr}
                onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                onChange={(e) => setAmountStr(sanitizeMoneyInput(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-sm text-white focus:border-[#D9F938] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400">Account / Last 4 Digits</label>
              <input
                type="text"
                placeholder="e.g. •• 4019"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-sm text-white focus:border-[#D9F938] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#D9F938] focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-[#10110e] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-neutral-400">Card Gradient Theme</label>
                {isCustomColor && (
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#D9F938]">
                    Custom {color}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {WALLET_PALETTES.map((p) => (
                  <button
                    type="button"
                    key={p.hex}
                    onClick={() => setColor(p.hex)}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      color.toLowerCase() === p.hex.toLowerCase()
                        ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-black"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.name}
                  />
                ))}

                {/* Last Option: Custom Color Picker (User Selected) */}
                <label
                  title={
                    isCustomColor
                      ? `Custom color: ${color} (click to adjust)`
                      : "Custom color (color picker)"
                  }
                  className={`group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-transform ${
                    isCustomColor
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-black shadow-lg"
                      : "opacity-80 hover:opacity-100 hover:scale-105 border border-white/20"
                  }`}
                  style={{
                    background: isCustomColor
                      ? color
                      : "conic-gradient(from 180deg at 50% 50%, #ff0055 0deg, #ff9900 60deg, #ffee00 120deg, #00dd77 180deg, #00bfff 240deg, #8833ff 300deg, #ff0055 360deg)",
                  }}
                >
                  <input
                    type="color"
                    value={safeHexValue}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Custom color picker"
                  />
                  {/* Color Palette icon */}
                  <svg
                    className={`h-3.5 w-3.5 pointer-events-none drop-shadow-md ${
                      isCustomColor ? "text-white/95" : "text-white"
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
                  </svg>
                </label>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id={defaultWalletCheckboxId}
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#D9F938] focus:ring-0"
            />
            <label htmlFor={defaultWalletCheckboxId} className="text-xs text-neutral-300">
              Set as primary / default wallet
            </label>
          </div>

          </div>

          {/* Card Footer (Fixed) */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-white/10 bg-[#10110e] px-5 py-3.5 sm:px-7 sm:py-4">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition hover:bg-white/5"
            >
              Cancel
            </button>
            <VoltButton type="submit" disabled={busy} className="px-6 py-2.5 text-xs">
              {busy ? "Saving…" : isEdit ? "Update Wallet" : "Add Wallet"}
            </VoltButton>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
