import { useMemo } from "react";
import type { Wallet, WalletType } from "../../core/models";
import { formatCurrency } from "../../core/models";
import { getWalletPalette } from "./WalletFormModal";

export function formatCardNumber(accountNumber?: string): string {
  if (!accountNumber) return "••••  ••••  ••••  4019";
  const cleaned = accountNumber.replace(/\s+/g, "");
  if (cleaned.length === 16) {
    return `${cleaned.slice(0, 4)}  ${cleaned.slice(4, 8)}  ${cleaned.slice(8, 12)}  ${cleaned.slice(12, 16)}`;
  }
  if (cleaned.length === 4) {
    return `••••  ••••  ••••  ${cleaned}`;
  }
  if (cleaned.length < 4) {
    return `••••  ••••  ••••  ${cleaned.padStart(4, "•")}`;
  }
  const last4 = cleaned.slice(-4);
  return `••••  ••••  ••••  ${last4}`;
}

export function getCardExpiry(createdAt?: string): string {
  if (!createdAt) return "08/30";
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return "08/30";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String((date.getFullYear() % 100) + 4).padStart(2, "0");
  return `${month}/${year}`;
}

export function getNetworkBadge(type: WalletType): { label: string; sublabel: string } {
  switch (type) {
    case "BANK":
      return { label: "DEBIT", sublabel: "ELECTRONIC USE ONLY" };
    case "CREDIT":
      return { label: "WORLD ELITE", sublabel: "CREDIT" };
    case "E_WALLET":
      return { label: "DIGITAL PAY", sublabel: "FAST SETTLE" };
    case "CRYPTO":
      return { label: "HARDWARE", sublabel: "COLD KEY" };
    case "OTHER":
      return { label: "RESERVE", sublabel: "TREASURY" };
    case "CASH":
    default:
      return { label: "VAULT CASH", sublabel: "LIQUID" };
  }
}

export interface PhysicalWalletCardProps {
  wallet: Wallet;
  className?: string;
  style?: React.CSSProperties;
  showBalance?: boolean;
  interactive?: boolean;
  isStacked?: boolean;
  onClick?: () => void;
  index?: number;
}

export function PhysicalWalletCard({
  wallet,
  className = "",
  style,
  showBalance = true,
  interactive = false,
  isStacked = false,
  onClick,
  index = 0,
}: PhysicalWalletCardProps) {
  const palette = useMemo(
    () => getWalletPalette(wallet.color, index),
    [wallet.color, index]
  );

  const network = getNetworkBadge(wallet.type);
  const cardNumber = formatCardNumber(wallet.accountNumber);
  // const expiry = getCardExpiry(wallet.createdAt);
  const institutionName = (wallet.institution || "KROMA LEDGER").toUpperCase();
  const holderName = (wallet.name || "Wallet Name").toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#0d0f12",
        backgroundImage: palette.style?.backgroundImage,
        borderColor: palette.style?.borderColor,
        ...palette.style,
        ...style,
        boxShadow:
          style?.boxShadow ??
          "0 16px 32px -10px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.18)",
      }}
      className={`group relative aspect-[85.6/53.98] w-full select-none overflow-hidden rounded-[18px] sm:rounded-[22px] border bg-[#0d0f12] ${
        palette.border || ""
      } ${palette.gradient ? `bg-gradient-to-br ${palette.gradient}` : ""} p-4 sm:p-5 text-white transition-all duration-300 ${
        interactive ? "cursor-pointer hover:brightness-105 active:scale-[0.99]" : ""
      } ${className}`}
    >
      {/* 0. Solid opaque backing layer to guarantee zero translucency in stacked deck */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[#0d0f12]"
        aria-hidden="true"
      />

      {/* 1. Subtle card surface micro-sheen */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.08)_0%,transparent_35%,rgba(255,255,255,0.02)_60%,transparent_80%)]"
        aria-hidden="true"
      />

      {/* Card Content Layout: ISO Standard Structure - pointer-events-none ensures card content is not targeted by pointer events/hover inspection */}
      <div className="pointer-events-none relative flex h-full flex-col justify-between select-none">
        {/* ROW 1: Issuer Brand / Crest (Left) + Available Balance & Primary Badge (Right) */}
        <div className="flex items-start justify-between gap-2">
          {/* Issuing Institution Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/10 backdrop-blur-md">
              <svg className="h-3.5 w-3.5" style={{ color: palette.hex }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xs font-bold tracking-wide text-white/95 line-clamp-1">
                {institutionName}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-normal text-neutral-400">
                {wallet.institution ? "Official Account" : "Personal Vault"}
              </span>
            </div>
          </div>

          {/* Balance & Primary Status */}
          {showBalance && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {wallet.isDefault && (
                  <span className="rounded-full bg-[#D9F938]/15 px-2 py-0.5 font-mono text-[11px] font-bold text-[#D9F938] border border-[#D9F938]/30">
                    PRIMARY
                  </span>
                )}
                <span className="font-mono text-[11px] uppercase tracking-normal text-neutral-400">
                  AVAILABLE
                </span>
              </div>
              <p className="mt-0.5 font-mono text-sm sm:text-base font-bold text-white tabular-nums">
                {formatCurrency(wallet.balanceMinor, wallet.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Rows 2-4: Only rendered when card is the active top card to avoid occlusion */}
        {!isStacked && (
          <>
            {/* ROW 2: Authentic EMV Smart Chip (ISO 7816) + Contactless NFC Waves */}
            <div className="my-auto flex items-center justify-between pt-1 sm:pt-2">
              <div className="flex items-center gap-3">
                {/* Gold EMV Chip */}
                <div className="relative h-8 w-11 sm:h-9 sm:w-12 rounded-[6px] border border-[#f5d77f]/50 bg-gradient-to-br from-[#caa238] to-[#f5d77f] p-[2.5px] shadow-sm">
                  <div className="relative h-full w-full rounded-[4px] border border-black/30 overflow-hidden bg-gradient-to-tr from-[#caa238] to-[#f5d77f]">
                    <div className="absolute inset-x-0 top-[35%] h-[0.5px] bg-black/40" />
                    <div className="absolute inset-x-0 bottom-[35%] h-[0.5px] bg-black/40" />
                    <div className="absolute inset-y-0 left-[34%] right-[34%] border-x border-black/40 bg-[#edd077]/40" />
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 bg-black/10" />
                  </div>
                </div>

                {/* Contactless Tap-to-Pay Waves */}
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  aria-label="Contactless payment symbol"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75a6 6 0 0 1 7.5 0" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7a9.5 9.5 0 0 1 12 0" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.25a13.5 13.5 0 0 1 16.5 0" />
                </svg>
              </div>

              {/* Sub-label for Card Tier */}
              <span className="font-mono text-xs font-semibold tracking-wide text-neutral-300 uppercase">
                {network.sublabel}
              </span>
            </div>

            {/* ROW 3: Embossed 16-Digit Card Number */}
            <div className="pointer-events-none select-none py-1">
              <p className="font-mono text-sm sm:text-base md:text-lg font-bold tracking-wider text-neutral-100 select-none">
                {cardNumber}
              </p>
            </div>

            {/* ROW 4: Wallet Name Name, Valid Thru Expiry, and Payment Network Emblem */}
            <div className="flex items-end justify-between border-t border-white/10 pt-2 sm:pt-2.5">
              {/* Wallet Name */}
              <div className="min-w-0 pr-2">
                <span className="block font-mono text-[11px] uppercase tracking-normal text-neutral-400">
                  Wallet Name
                </span>
                <p className="font-mono text-xs sm:text-sm font-semibold text-white line-clamp-1 truncate uppercase">
                  {holderName}
                </p>
              </div>

              {/* Expiry Date */}
              {/* <div className="shrink-0 px-2 text-center">
                <span className="block font-mono text-[11px] uppercase tracking-normal text-neutral-400">
                  Valid Thru
                </span>
                <p className="font-mono text-xs font-bold text-white tabular-nums">
                  {expiry}
                </p>
              </div> */}

              {/* Metallic Emblem (Replacing generic AI-palette Mastercard) */}
              <div className="flex shrink-0 flex-col items-end">
                <div className="relative flex items-center">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-white/30 bg-white/[0.08] backdrop-blur-sm" />
                  <div className="-ml-2.5 sm:-ml-3 h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-white/30 bg-white/[0.15] backdrop-blur-sm" />
                </div>
                <span className="mt-0.5 font-display text-xs font-bold tracking-wide text-white/90 uppercase">
                  {network.label}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
