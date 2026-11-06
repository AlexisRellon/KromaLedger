import { useState, useId } from "react";
import type { CardNetwork, Wallet, WalletPattern, WalletType } from "../../core/models";
import { blockInvalidNumberKeys, sanitizeMoneyInput } from "../../core/engine/moneyInput";
import { Button, FormField, Input, ModalShell, Select } from "../primitives";
import { WALLET_TYPES, WalletTypeIcon } from "./WalletTypeIcon";
import { PhysicalWalletCard, WALLET_PATTERNS, WalletPatternDefs, resolveWalletPattern } from "./PhysicalWalletCard";
import { InstitutionBrandmark, PH_INSTITUTIONS, resolveCardNetwork } from "./phInstitutionLogos";

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
  { name: "Kaban Plum", hex: "#4A154B", gradient: "from-[#C4B5FD] to-[#C4B5FD]", border: "border-neutral-900", glow: "rgba(74,21,75,0.15)", style: { backgroundColor: "#C4B5FD", color: "#18181B" } },
  { name: "Treasure Amber", hex: "#F59E0B", gradient: "from-[#FDE68A] to-[#FDE68A]", border: "border-neutral-900", glow: "rgba(245,158,11,0.15)", style: { backgroundColor: "#FDE68A", color: "#18181B" } },
  { name: "Mint Sage", hex: "#10B981", gradient: "from-[#A7F3D0] to-[#A7F3D0]", border: "border-neutral-900", glow: "rgba(16,185,129,0.15)", style: { backgroundColor: "#A7F3D0", color: "#18181B" } },
  { name: "Soft Coral", hex: "#F43F5E", gradient: "from-[#FDA4AF] to-[#FDA4AF]", border: "border-neutral-900", glow: "rgba(244,63,94,0.15)", style: { backgroundColor: "#FDA4AF", color: "#18181B" } },
  { name: "Sky Azure", hex: "#0EA5E9", gradient: "from-[#BAE6FD] to-[#BAE6FD]", border: "border-neutral-900", glow: "rgba(14,165,233,0.15)", style: { backgroundColor: "#BAE6FD", color: "#18181B" } },
  { name: "Classic Paper", hex: "#FAF8F5", gradient: "from-[#FFFFFF] to-[#FFFFFF]", border: "border-neutral-900", glow: "rgba(24,24,27,0.1)", style: { backgroundColor: "#FFFFFF", color: "#18181B" } },
  { name: "Electric Volt", hex: "#D9F938", gradient: "from-[#FEF08A] to-[#FEF08A]", border: "border-neutral-900", glow: "rgba(217,249,56,0.15)", style: { backgroundColor: "#FEF08A", color: "#18181B" } },
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
      return {
        name: "Custom Color",
        hex: color,
        gradient: "",
        border: "border-neutral-900",
        glow: `rgba(${r}, ${g}, ${b}, 0.16)`,
        style: {
          backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color} 100%)`,
          backgroundColor: color,
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
  const [accountNumber, setAccountNumber] = useState(
    (wallet?.accountNumber ?? "").replace(/\D/g, "").slice(-4)
  );
  const [amountStr, setAmountStr] = useState(
    wallet ? (wallet.balanceMinor / 100).toFixed(2) : "0.00"
  );
  const [currency, setCurrency] = useState(wallet?.currency ?? defaultCurrency);
  const [color, setColor] = useState(wallet?.color ?? "#4A154B");
  const [pattern, setPattern] = useState<WalletPattern>(
    wallet ? resolveWalletPattern(wallet) : "LEDGER"
  );
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>(
    wallet ? resolveCardNetwork(wallet) : "MASTERCARD"
  );
  const [isDefault, setIsDefault] = useState(wallet?.isDefault ?? false);
  const [busy, setBusy] = useState(false);
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
    return "#4A154B";
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    const balanceMinor = Math.round((parseFloat(amountStr || "0") || 0) * 100);

    const record: Wallet = {
      id: wallet?.id ?? `wallet-${crypto.randomUUID()}`,
      name: name.trim(),
      type,
      currency,
      balanceMinor,
      color,
      pattern,
      cardNetwork,
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

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      busy={busy}
      maxWidth="lg"
      title={isEdit ? "Edit Wallet Card" : "Add Wallet Card"}
      subtitle={
        isEdit
          ? "Update account balance, institution, or card styling."
          : "Connect a cash vault, digital bank, or card account."
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="wallet-form" variant="primary" busy={busy}>
            {isEdit ? "Update Wallet" : "Add Wallet"}
          </Button>
        </div>
      }
    >
      <form id="wallet-form" onSubmit={handleSubmit} className="space-y-4">
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
              pattern,
              cardNetwork,
              institution: institution.trim() || undefined,
              accountNumber: accountNumber.trim() || undefined,
              isDefault,
              createdAt: wallet?.createdAt ?? new Date().toISOString().slice(0, 10),
            }}
          />
        </div>

        {/* Wallet Name */}
        <FormField label="Wallet Name" required>
          {({ id }) => (
            <Input
              id={id}
              type="text"
              required
              placeholder="e.g. BDO Checking, GCash Main, Cash Vault"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>

        {/* Wallet Type & Institution */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Wallet Type">
            {({ id }) => (
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3.5 flex items-center text-neutral-600">
                  <WalletTypeIcon type={type} className="h-4 w-4" />
                </div>
                <Select
                  id={id}
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value as WalletType;
                    setType(nextType);
                    if (nextType === "CASH") {
                      setCardNetwork("NONE");
                    }
                  }}
                  className="pl-10"
                >
                  {WALLET_TYPES.map((t) => (
                    <option key={t.type} value={t.type} className="bg-white text-neutral-900">
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </FormField>

          <FormField label="Institution / Bank">
            {({ id }) => (
              <Input
                id={id}
                type="text"
                placeholder="e.g. GCash, Maya, GoTyme, MariBank, BDO"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            )}
          </FormField>
        </div>

        {/* Quick-Pick Popular Philippine Banks & E-Wallets */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            PH Banks & E-Wallets (Tap to apply brandmark)
          </span>
          <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {PH_INSTITUTIONS.map((inst) => {
              const isSelected = institution.trim().toLowerCase() === inst.label.toLowerCase();
              return (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => {
                    setInstitution(inst.label);
                    setType(inst.defaultType);
                    setCardNetwork(inst.defaultNetwork);
                    if (inst.cardColor && !isEdit) {
                      setColor(inst.cardColor);
                    }
                    if (!name.trim()) {
                      setName(inst.label);
                    }
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border-1.5 border-[var(--border-ink)] px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? "bg-[var(--theme-subtle)] text-[var(--theme-accent-text)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <InstitutionBrandmark institution={inst.label} size="sm" />
                  <span>{inst.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Payment Network (Visa / Mastercard / None) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">
            Card Payment Network
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                { id: "VISA" as const, label: "Visa", sub: "Shows card number" },
                { id: "MASTERCARD" as const, label: "Mastercard", sub: "Shows card number" },
                { id: "NONE" as const, label: "None", sub: "Hides account number" },
              ]
            ).map((net) => {
              const active = cardNetwork === net.id;
              return (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setCardNetwork(net.id)}
                  className={`flex flex-col items-start justify-between rounded-xl border-2 border-[var(--border-ink)] px-3 py-2 text-left transition cursor-pointer ${
                    active
                      ? "bg-[var(--theme-subtle)] text-[var(--theme-accent-text)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="font-display text-xs font-black tracking-tight">{net.label}</span>
                    {net.id === "MASTERCARD" && (
                      <span className="inline-flex items-center" aria-hidden="true">
                        <span className="h-3.5 w-3.5 rounded-full border border-neutral-900 bg-[#EF4444]" />
                        <span className="-ml-1.5 h-3.5 w-3.5 rounded-full border border-neutral-900 bg-[#F59E0B]" />
                      </span>
                    )}
                    {net.id === "VISA" && (
                      <span className="font-sans text-[11px] font-black italic tracking-tighter text-[#1E3A8A]" aria-hidden="true">
                        VISA
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 text-[10px] font-medium text-neutral-600">{net.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Balance & Account Number */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={`Initial Balance (${currency})`} required>
            {({ id }) => (
              <Input
                id={id}
                type="text"
                inputMode="decimal"
                required
                value={amountStr}
                onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                onChange={(e) => setAmountStr(sanitizeMoneyInput(e.target.value))}
                className="font-mono tabular-nums"
              />
            )}
          </FormField>

          <FormField label="Account / Last 4 Digits">
            {({ id }) => (
              <Input
                id={id}
                type="text"
                inputMode="numeric"
                maxLength={4}
                disabled={cardNetwork === "NONE"}
                placeholder={
                  cardNetwork === "NONE"
                    ? "Hidden when network is None"
                    : "e.g. 4019"
                }
                value={cardNetwork === "NONE" ? "" : accountNumber}
                onKeyDown={(e) => blockInvalidNumberKeys(e, false)}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className={`font-mono ${cardNetwork === "NONE" ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : ""}`}
              />
            )}
          </FormField>
        </div>

        {/* Currency & Card Theme */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Currency">
            {({ id }) => (
              <Select
                id={id}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-white text-neutral-900">
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">
                Card Theme Color
              </label>
              {isCustomColor && (
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#4A154B]">
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
                  className={`h-7 w-7 rounded-full border-2 border-neutral-900 transition-transform cursor-pointer ${
                    color.toLowerCase() === p.hex.toLowerCase()
                      ? "scale-110 shadow-[2px_2px_0px_#18181B] ring-2 ring-[#4A154B] ring-offset-1"
                      : "opacity-80 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                />
              ))}

              {/* Custom Color Picker */}
              <label
                title={
                  isCustomColor
                    ? `Custom color: ${color} (click to adjust)`
                    : "Custom color (color picker)"
                }
                className={`group relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-neutral-900 transition-transform ${
                  isCustomColor
                    ? "scale-110 shadow-[2px_2px_0px_#18181B] ring-2 ring-[#4A154B] ring-offset-1"
                    : "opacity-80 hover:opacity-100 hover:scale-105"
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
                <svg
                  className={`h-3.5 w-3.5 pointer-events-none drop-shadow-sm ${
                    isCustomColor ? "text-white" : "text-neutral-900"
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

        {/* Card Grid Pattern Selector */}
        <div>
          <WalletPatternDefs />
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">
            Card Grid Pattern
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WALLET_PATTERNS.map((p) => {
              const active = pattern === p.id;
              const previewPatternId = `pattern-card-${p.id.toLowerCase()}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPattern(p.id)}
                  title={p.description}
                  aria-pressed={active}
                  data-pattern={p.id}
                  className={`flex min-w-0 flex-col items-start justify-between overflow-hidden rounded-xl border-2 border-[var(--border-ink)] px-3 py-2 text-left transition cursor-pointer ${
                    active
                      ? "bg-[var(--theme-subtle)] text-[var(--theme-accent-text)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-[1px_1px_0px_var(--shadow-ink)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <div className="flex w-full min-w-0 items-center justify-between gap-1.5">
                    <span className="truncate font-display text-xs font-black tracking-tight">{p.label}</span>
                    <span
                      className="relative h-3.5 w-6 shrink-0 overflow-hidden rounded border border-neutral-700/30 opacity-70"
                      aria-hidden="true"
                    >
                      <svg className="h-full w-full text-current" fill="none">
                        <rect width="100%" height="100%" fill={`url(#${previewPatternId})`} />
                      </svg>
                    </span>
                  </div>
                  <span className="mt-0.5 line-clamp-1 w-full text-[10px] font-medium text-[var(--text-muted)]">
                    {p.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary / Default Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={defaultWalletCheckboxId}
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-2 border-[var(--border-ink)] accent-[var(--theme-primary)] cursor-pointer"
          />
          <label htmlFor={defaultWalletCheckboxId} className="text-xs font-bold text-[var(--text-secondary)] cursor-pointer">
            Set as primary / default wallet
          </label>
        </div>
      </form>
    </ModalShell>
  );
}
