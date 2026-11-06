import { memo, useMemo } from "react";
import type { Wallet, WalletPattern, WalletType } from "../../core/models";
import { formatCurrency } from "../../core/models";
import { getWalletPalette, hexToRgb, WALLET_PALETTES } from "./WalletFormModal";
import {
  InstitutionBrandmark,
  matchPhInstitution,
  resolveCardNetwork,
} from "./phInstitutionLogos";

export const WALLET_PATTERNS: { id: WalletPattern; label: string; description: string }[] = [
  { id: "LEDGER", label: "Ledger Grid", description: "Accounting graph paper & margin rules" },
  { id: "SOLIHIYA", label: "Kalinga Weave", description: "Snake skin & rattan fruit skin tattoo motif" },
  { id: "BAUHAUS", label: "Ilokano Crab", description: "Northern Luzon kappi crab tattoo motif" },
  { id: "ISOMETRIC", label: "Visayan Waves", description: "Austronesian ocean wave & wind tattoo motif" },
  { id: "YAKAN", label: "Yakan Weave", description: "Traditional Basilan geometric diamond weave" },
  { id: "IBALOI", label: "Ibaloi Weave", description: "Benguet Cordillera chevron & zigzag weave" },
];

export function resolveWalletPattern(wallet: Pick<Wallet, "id" | "type" | "pattern">, index = 0): WalletPattern {
  if (wallet.pattern) return wallet.pattern;
  const order: WalletPattern[] = ["LEDGER", "SOLIHIYA", "BAUHAUS", "ISOMETRIC", "YAKAN", "IBALOI"];
  if (index > 0) {
    return order[index % order.length]!;
  }
  let hash = 0;
  const seed = `${wallet.id}:${wallet.type}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return order[hash % order.length]!;
}

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

export function YakanWeavePatternPaths() {
  return (
    <>
      {/* Center Coffee Bean with S-curve crease */}
      <path d="M 32 26 C 35.5 26 36 29 36 32 C 36 35 35.5 38 32 38 C 28.5 38 28 35 28 32 C 28 29 28.5 26 32 26 Z" />
      <path d="M 32 26 C 30.5 29 33.5 35 32 38" />

      {/* 4 Cardinal Stepped Petals with Centered Dots */}
      <circle cx="32" cy="19.25" r="1.3" />
      <path d="M 32 15 L 34 17 H 36 V 19 H 38 V 19.5 H 36 V 21.5 H 34 L 32 23.5 L 30 21.5 H 28 V 19.5 H 26 V 19 H 28 V 17 H 30 Z" />

      <circle cx="32" cy="44.75" r="1.3" />
      <path d="M 32 40.5 L 34 42.5 H 36 V 44.5 H 38 V 45 H 36 V 47 H 34 L 32 49 L 30 47 H 28 V 45 H 26 V 44.5 H 28 V 42.5 H 30 Z" />

      <circle cx="19.25" cy="32" r="1.3" />
      <path d="M 15 32 L 17 30 V 28 H 19 V 26 H 19.5 V 28 H 21.5 V 30 L 23.5 32 L 21.5 34 V 36 H 19.5 V 38 H 19 V 36 H 17 V 34 Z" />

      <circle cx="44.75" cy="32" r="1.3" />
      <path d="M 40.5 32 L 42.5 30 V 28 H 44.5 V 26 H 45 V 28 H 47 V 30 L 49 32 L 47 34 V 36 H 45 V 38 H 44.5 V 36 H 42.5 V 34 Z" />

      {/* Diagonal Stepped Corner Chevrons & Accents inside Center Diamond */}
      <circle cx="23.5" cy="23.5" r="1.2" />
      <path d="M 19 21 H 23 V 25 M 21 19 V 23 H 25" />

      <circle cx="40.5" cy="23.5" r="1.2" />
      <path d="M 45 21 H 41 V 25 M 43 19 V 23 H 39" />

      <circle cx="23.5" cy="40.5" r="1.2" />
      <path d="M 19 43 H 23 V 39 M 21 45 V 41 H 25" />

      <circle cx="40.5" cy="40.5" r="1.2" />
      <path d="M 45 43 H 41 V 39 M 43 45 V 41 H 39" />

      {/* Stepped Inner Diamond Frame */}
      <path d="M 32 11 H 35 V 14 H 38 V 17 H 41 V 20 H 44 V 23 H 47 V 26 H 50 V 29 H 53 V 32 V 35 H 50 V 38 H 47 V 41 H 44 V 44 H 41 V 47 H 38 V 50 H 35 V 53 H 32 H 29 V 50 H 26 V 47 H 23 V 44 H 20 V 41 H 17 V 38 H 14 V 35 H 11 V 32 V 29 H 14 V 26 H 17 V 23 H 20 V 20 H 23 V 17 H 26 V 14 H 29 V 11 Z" />

      {/* Stepped Outer Diamond Sawtooth Frame */}
      <path d="M 32 4 H 36 V 8 H 40 V 12 H 44 V 16 H 48 V 20 H 52 V 24 H 56 V 28 H 60 V 32 V 36 H 56 V 40 H 52 V 44 H 48 V 48 H 44 V 52 H 40 V 56 H 36 V 60 H 32 H 28 V 56 H 24 V 52 H 20 V 48 H 16 V 44 H 12 V 40 H 8 V 36 H 4 V 32 V 28 H 8 V 24 H 12 V 20 H 16 V 16 H 20 V 12 H 24 V 8 H 28 V 4 Z" />

      {/* Border Junction Diamonds & Dots */}
      <path d="M 32 0 L 34 2 L 32 4 L 30 2 Z M 32 64 L 34 62 L 32 60 L 30 62 Z M 0 32 L 2 34 L 4 32 L 2 30 Z M 64 32 L 62 34 L 60 32 L 62 30 Z" />
      <circle cx="32" cy="7" r="1" />
      <circle cx="32" cy="57" r="1" />
      <circle cx="7" cy="32" r="1" />
      <circle cx="57" cy="32" r="1" />

      {/* Corner Quarter-Beans for seamless 2D tiling */}
      <path d="M 0 6 C 3.5 6 4 3 4 0 M 0 6 C 1.5 3 0.5 1 0 0" />
      <path d="M 64 6 C 60.5 6 60 3 60 0 M 64 6 C 62.5 3 63.5 1 64 0" />
      <path d="M 0 58 C 3.5 58 4 61 4 64 M 0 58 C 1.5 61 0.5 63 0 64" />
      <path d="M 64 58 C 60.5 58 60 61 60 64 M 64 58 C 62.5 61 63.5 63 64 64" />

      {/* Corner Stepped Outer Boundaries */}
      <path d="M 28 0 V 4 H 24 V 8 H 20 V 12 H 16 V 16 H 12 V 20 H 8 V 24 H 4 V 28 H 0" />
      <path d="M 21 0 V 3 H 18 V 6 H 15 V 9 H 12 V 12 H 9 V 15 H 6 V 18 H 3 V 21 H 0" />
      <path d="M 36 0 V 4 H 40 V 8 H 44 V 12 H 48 V 16 H 52 V 20 H 56 V 24 H 60 V 28 H 64" />
      <path d="M 43 0 V 3 H 46 V 6 H 49 V 9 H 52 V 12 H 55 V 15 H 58 V 18 H 61 V 21 H 64" />
      <path d="M 28 64 V 60 H 24 V 56 H 20 V 52 H 16 V 48 H 12 V 44 H 8 V 40 H 4 V 36 H 0" />
      <path d="M 21 64 V 61 H 18 V 58 H 15 V 55 H 12 V 52 H 9 V 49 H 6 V 46 H 3 V 43 H 0" />
      <path d="M 36 64 V 60 H 40 V 56 H 44 V 52 H 48 V 48 H 52 V 44 H 56 V 40 H 60 V 36 H 64" />
      <path d="M 43 64 V 61 H 46 V 58 H 49 V 55 H 52 V 52 H 55 V 49 H 58 V 46 H 61 V 43 H 64" />

      {/* Corner Dots */}
      <circle cx="10" cy="10" r="1.2" />
      <circle cx="54" cy="10" r="1.2" />
      <circle cx="10" cy="54" r="1.2" />
      <circle cx="54" cy="54" r="1.2" />
    </>
  );
}

export function IbaloiWeavePatternPaths() {
  return (
    <>
      {/* Left Border: Cross Stitches (x=2), Sawtooth Triangles (x=4-7), Margin Rule (x=8) */}
      <path d="M 0.5 2 L 3.5 6 M 3.5 2 L 0.5 6 M 0.5 10 L 3.5 14 M 3.5 10 L 0.5 14 M 0.5 18 L 3.5 22 M 3.5 18 L 0.5 22 M 0.5 26 L 3.5 30 M 3.5 26 L 0.5 30 M 0.5 34 L 3.5 38 M 3.5 34 L 0.5 38 M 0.5 42 L 3.5 46 M 3.5 42 L 0.5 46 M 0.5 50 L 3.5 54 M 3.5 50 L 0.5 54 M 0.5 58 L 3.5 62 M 3.5 58 L 0.5 62" />
      <path d="M 4 0 L 7 2 L 4 4 L 7 6 L 4 8 L 7 10 L 4 12 L 7 14 L 4 16 L 7 18 L 4 20 L 7 22 L 4 24 L 7 26 L 4 28 L 7 30 L 4 32 L 7 34 L 4 36 L 7 38 L 4 40 L 7 42 L 4 44 L 7 46 L 4 48 L 7 50 L 4 52 L 7 54 L 4 56 L 7 58 L 4 60 L 7 62 L 4 64" />
      <path d="M 8 0 V 64" />

      {/* Left Chevron Zigzag Column (x=11-14) */}
      <path d="M 11 0 L 14 4 L 11 8 L 14 12 L 11 16 L 14 20 L 11 24 L 14 28 L 11 32 L 14 36 L 11 40 L 14 44 L 11 48 L 14 52 L 11 56 L 14 60 L 11 64" />

      {/* Left Motif Column (x=21) - Coffee Beans, Stepped Wings & Medallions */}
      <path d="M 21 11 C 23.5 11 24.2 13.5 24.2 16 C 24.2 18.5 23.5 21 21 21 C 18.5 21 17.8 18.5 17.8 16 C 17.8 13.5 18.5 11 21 11 Z" />
      <path d="M 21 11 C 19.8 13.5 22.2 18.5 21 21" />
      <path d="M 16 9 H 26 M 17.5 7 H 24.5 M 19 5 H 23" />
      <path d="M 16 23 H 26 M 17.5 25 H 24.5 M 19 27 H 23" />

      <path d="M 21 43 C 23.5 43 24.2 45.5 24.2 48 C 24.2 50.5 23.5 53 21 53 C 18.5 53 17.8 50.5 17.8 48 C 17.8 45.5 18.5 43 21 43 Z" />
      <path d="M 21 43 C 19.8 45.5 22.2 50.5 21 53" />
      <path d="M 16 41 H 26 M 17.5 39 H 24.5 M 19 37 H 23" />
      <path d="M 16 55 H 26 M 17.5 57 H 24.5 M 19 59 H 23" />

      <circle cx="21" cy="32" r="2.2" />
      <path d="M 16.5 32 L 18.5 30.5 V 33.5 Z M 25.5 32 L 23.5 30.5 V 33.5 Z" />
      <circle cx="21" cy="0" r="2.2" />
      <path d="M 16.5 0 L 18.5 -1.5 V 1.5 Z M 25.5 0 L 23.5 -1.5 V 1.5 Z" />
      <circle cx="21" cy="64" r="2.2" />
      <path d="M 16.5 64 L 18.5 62.5 V 65.5 Z M 25.5 64 L 23.5 62.5 V 65.5 Z" />

      {/* Center Double Zigzag with Dots (x=28-36) */}
      <path d="M 29 0 L 32 4 L 29 8 L 32 12 L 29 16 L 32 20 L 29 24 L 32 28 L 29 32 L 32 36 L 29 40 L 32 44 L 29 48 L 32 52 L 29 56 L 32 60 L 29 64" />
      <path d="M 35 0 L 32 4 L 35 8 L 32 12 L 35 16 L 32 20 L 35 24 L 32 28 L 35 32 L 32 36 L 35 40 L 32 44 L 35 48 L 32 52 L 35 56 L 32 60 L 35 64" />
      <circle cx="32" cy="2" r="0.8" />
      <circle cx="32" cy="6" r="0.8" />
      <circle cx="32" cy="10" r="0.8" />
      <circle cx="32" cy="14" r="0.8" />
      <circle cx="32" cy="18" r="0.8" />
      <circle cx="32" cy="22" r="0.8" />
      <circle cx="32" cy="26" r="0.8" />
      <circle cx="32" cy="30" r="0.8" />
      <circle cx="32" cy="34" r="0.8" />
      <circle cx="32" cy="38" r="0.8" />
      <circle cx="32" cy="42" r="0.8" />
      <circle cx="32" cy="46" r="0.8" />
      <circle cx="32" cy="50" r="0.8" />
      <circle cx="32" cy="54" r="0.8" />
      <circle cx="32" cy="58" r="0.8" />
      <circle cx="32" cy="62" r="0.8" />

      {/* Right Motif Column (x=43) */}
      <path d="M 43 11 C 45.5 11 46.2 13.5 46.2 16 C 46.2 18.5 45.5 21 43 21 C 40.5 21 39.8 18.5 39.8 16 C 39.8 13.5 40.5 11 43 11 Z" />
      <path d="M 43 11 C 41.8 13.5 44.2 18.5 43 21" />
      <path d="M 38 9 H 48 M 39.5 7 H 46.5 M 41 5 H 45" />
      <path d="M 38 23 H 48 M 39.5 25 H 46.5 M 41 27 H 45" />

      <path d="M 43 43 C 45.5 43 46.2 45.5 46.2 48 C 46.2 50.5 45.5 53 43 53 C 40.5 53 39.8 50.5 39.8 48 C 39.8 45.5 40.5 43 43 43 Z" />
      <path d="M 43 43 C 41.8 45.5 44.2 50.5 43 53" />
      <path d="M 38 41 H 48 M 39.5 39 H 46.5 M 41 37 H 45" />
      <path d="M 38 55 H 48 M 39.5 57 H 46.5 M 41 59 H 45" />

      <circle cx="43" cy="32" r="2.2" />
      <path d="M 38.5 32 L 40.5 30.5 V 33.5 Z M 47.5 32 L 45.5 30.5 V 33.5 Z" />
      <circle cx="43" cy="0" r="2.2" />
      <path d="M 38.5 0 L 40.5 -1.5 V 1.5 Z M 47.5 0 L 45.5 -1.5 V 1.5 Z" />
      <circle cx="43" cy="64" r="2.2" />
      <path d="M 38.5 64 L 40.5 62.5 V 65.5 Z M 47.5 64 L 45.5 62.5 V 65.5 Z" />

      {/* Right Chevron Zigzag Column (x=50-53) */}
      <path d="M 50 0 L 53 4 L 50 8 L 53 12 L 50 16 L 53 20 L 50 24 L 53 28 L 50 32 L 53 36 L 50 40 L 53 44 L 50 48 L 53 52 L 50 56 L 53 60 L 50 64" />

      {/* Right Border: Margin Rule (x=56), Sawtooth Triangles (x=57-60), Cross Stitches (x=62) */}
      <path d="M 56 0 V 64" />
      <path d="M 60 0 L 57 2 L 60 4 L 57 6 L 60 8 L 57 10 L 60 12 L 57 14 L 60 16 L 57 18 L 60 20 L 57 22 L 60 24 L 57 26 L 60 28 L 57 30 L 60 32 L 57 34 L 60 36 L 57 38 L 60 40 L 57 42 L 60 44 L 57 46 L 60 48 L 57 50 L 60 52 L 57 54 L 60 56 L 57 58 L 60 60 L 57 62 L 60 64" />
      <path d="M 61.5 2 L 64.5 6 M 64.5 2 L 61.5 6 M 61.5 10 L 64.5 14 M 64.5 10 L 61.5 14 M 61.5 18 L 64.5 22 M 64.5 18 L 61.5 22 M 61.5 26 L 64.5 30 M 64.5 26 L 61.5 30 M 61.5 34 L 64.5 38 M 64.5 34 L 61.5 38 M 61.5 42 L 64.5 46 M 64.5 42 L 61.5 46 M 61.5 50 L 64.5 54 M 64.5 50 L 61.5 54 M 61.5 58 L 64.5 62 M 64.5 58 L 61.5 62" />
    </>
  );
}

export function IlokanoCrabPatternPaths() {
  return (
    <>
      {/* Center Crab Diamond Core */}
      <path d="M 24 16 L 32 24 L 24 32 L 16 24 Z" />
      <path d="M 24 19 L 29 24 L 24 29 L 19 24 Z" />
      <circle cx="24" cy="24" r="1.3" />

      {/* Vertical Stems & Dots */}
      <path d="M 24 16 V 11 M 24 32 V 37" />
      <circle cx="24" cy="9.5" r="1.4" />
      <circle cx="24" cy="38.5" r="1.4" />

      {/* 4 Claws (Angalo Crab Claws) */}
      {/* Top-Right Claw */}
      <path d="M 29 20 L 34 15 H 40 V 12 M 40 15 L 42 13" />
      <path d="M 31 18 L 35 14 H 39" />
      {/* Top-Left Claw */}
      <path d="M 19 20 L 14 15 H 8 V 12 M 8 15 L 6 13" />
      <path d="M 17 18 L 13 14 H 9" />
      {/* Bottom-Right Claw */}
      <path d="M 29 28 L 34 33 H 40 V 36 M 40 33 L 42 35" />
      <path d="M 31 30 L 35 34 H 39" />
      {/* Bottom-Left Claw */}
      <path d="M 19 28 L 14 33 H 8 V 36 M 8 33 L 6 35" />
      <path d="M 17 30 L 13 34 H 9" />

      {/* Horizontal Inter-Crab Connecting Diamond & Dots */}
      <path d="M 0 20 L 4 24 L 0 28 M 48 20 L 44 24 L 48 28" />
      <circle cx="0" cy="24" r="1.2" />
      <circle cx="48" cy="24" r="1.2" />
      <path d="M 0 20 V 16 M 0 28 V 32 M 48 20 V 16 M 48 28 V 32" />
      <circle cx="0" cy="14.5" r="1" />
      <circle cx="0" cy="33.5" r="1" />
      <circle cx="48" cy="14.5" r="1" />
      <circle cx="48" cy="33.5" r="1" />

      {/* Corner Crab Fractions for Seamless 2D Tiling */}
      <path d="M 0 40 L 8 48 M 0 8 L 8 0 M 48 40 L 40 48 M 48 8 L 40 0" />
      <path d="M 24 0 V 3 M 24 48 V 45" />
    </>
  );
}

export function KalingaWeavePatternPaths() {
  return (
    <>
      {/* Continuous Hexagonal Mesh / Snake Skin & Fruit Skin */}
      <path d="M 0 0 H 16 L 24 8 L 16 16 H 32" />
      <path d="M 0 16 L 8 24 L 0 32" />
      <path d="M 32 16 L 24 24 L 32 32" />
      <path d="M 8 24 L 16 16" />
      <path d="M 24 24 L 16 32" />
      <path d="M 16 0 L 24 8" />
      <path d="M 0 32 H 16" />
    </>
  );
}

export function VisayanWavesPatternPaths() {
  return (
    <>
      {/* 4-Layer Synchronous Chevron Waves (Austronesian Sea & Wind) */}
      <path d="M 0 4 L 8 0 L 16 4 L 24 0 L 32 4" />
      <path d="M 0 10 L 8 6 L 16 10 L 24 6 L 32 10" />
      <path d="M 0 16 L 8 12 L 16 16 L 24 12 L 32 16" />
      <path d="M 0 22 L 8 18 L 16 22 L 24 18 L 32 22" />

      {/* Austronesian Inter-Band Diamond-Dot Accent */}
      <path d="M 8 28 L 9.5 29.5 L 8 31 L 6.5 29.5 Z M 24 28 L 25.5 29.5 L 24 31 L 22.5 29.5 Z" />
      <circle cx="0" cy="29.5" r="0.75" />
      <circle cx="16" cy="29.5" r="0.75" />
      <circle cx="32" cy="29.5" r="0.75" />
    </>
  );
}

export function WalletPatternDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden text-[var(--text-primary)]"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", color: "var(--text-primary)" }}
    >
      <defs>
        <pattern
          id="pattern-card-ledger"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          <path d="M 20 0 H 0 V 20 M 0 0 H 20 M 0 0 V 20 M 19 0 V 20" />
        </pattern>
        <pattern
          id="pattern-card-solihiya"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <KalingaWeavePatternPaths />
        </pattern>
        <pattern
          id="pattern-card-kalinga"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <KalingaWeavePatternPaths />
        </pattern>
        <pattern
          id="pattern-card-bauhaus"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <IlokanoCrabPatternPaths />
        </pattern>
        <pattern
          id="pattern-card-ilokano"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <IlokanoCrabPatternPaths />
        </pattern>
        <pattern
          id="pattern-card-isometric"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <VisayanWavesPatternPaths />
        </pattern>
        <pattern
          id="pattern-card-visayan"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <VisayanWavesPatternPaths />
        </pattern>
        <pattern
          id="pattern-card-yakan"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <YakanWeavePatternPaths />
        </pattern>
        <pattern
          id="pattern-card-ibaloi"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <IbaloiWeavePatternPaths />
        </pattern>
      </defs>
    </svg>
  );
}

export type WeaveVariant = "yakan" | "tnalak" | "none";

export interface PhysicalWalletCardProps {
  wallet: Wallet;
  className?: string;
  style?: React.CSSProperties;
  showBalance?: boolean;
  interactive?: boolean;
  isStacked?: boolean;
  onClick?: () => void;
  index?: number;
  weaveVariant?: WeaveVariant;
}

export const PhysicalWalletCard = memo(function PhysicalWalletCard({
  wallet,
  className = "",
  style,
  showBalance = true,
  interactive = false,
  isStacked = false,
  onClick,
  index = 0,
  weaveVariant,
}: PhysicalWalletCardProps) {
  const palette = useMemo(
    () => getWalletPalette(wallet.color, index),
    [wallet.color, index]
  );

  const { effectiveBg, isDark } = useMemo(() => {
    const rawBg = palette.style?.backgroundColor || palette.hex || "#FAF8F5";
    const isBuiltinPalette = WALLET_PALETTES.some(
      (p) => p.hex.toLowerCase() === palette.hex.toLowerCase()
    );
    if (isBuiltinPalette) {
      return { effectiveBg: rawBg, isDark: false };
    }

    const rgb = hexToRgb(rawBg);
    if (!rgb) return { effectiveBg: "#FAF8F5", isDark: false };

    const srgb = (c: number) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const getLum = (r: number, g: number, b: number) =>
      0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);

    const lum = getLum(rgb.r, rgb.g, rgb.b);
    const contrastWithWhite = 1.05 / (lum + 0.05);
    const contrastWithInk = (lum + 0.05) / 0.0699;

    // Pass WCAG AA (>= 4.5:1) directly if possible
    if (contrastWithInk >= 4.5) {
      return { effectiveBg: rawBg, isDark: false };
    }
    if (contrastWithWhite >= 4.5) {
      return { effectiveBg: rawBg, isDark: true };
    }

    // Mid-luminance dead-zone (e.g., #007DFE): deepen slightly so white text passes >= 4.8:1 WCAG AA
    let { r, g, b } = rgb;
    for (let step = 0; step < 10; step++) {
      r = Math.max(0, Math.round(r * 0.9));
      g = Math.max(0, Math.round(g * 0.9));
      b = Math.max(0, Math.round(b * 0.9));
      if (1.05 / (getLum(r, g, b) + 0.05) >= 4.8) break;
    }
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return {
      effectiveBg: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
      isDark: true,
    };
  }, [palette]);

  const network = getNetworkBadge(wallet.type);
  const activeNetwork = resolveCardNetwork(wallet);
  const matchedInst = matchPhInstitution(wallet.institution, wallet.name);
  const cardNumber = formatCardNumber(wallet.accountNumber);
  const cardExpiry = getCardExpiry(wallet.createdAt);
  const institutionName = (
    wallet.institution ||
    matchedInst?.label ||
    "KABAN"
  ).toUpperCase();
  const holderName = (wallet.name || "Wallet Name").toUpperCase();
  const cardTypeBadge =
    wallet.type === "CREDIT"
      ? "credit"
      : wallet.type === "E_WALLET"
        ? "e-wallet"
        : wallet.type === "CASH"
          ? "vault cash"
          : wallet.type === "CRYPTO"
            ? "cold key"
            : "debit";

  const textClass = isDark ? "text-white" : "text-[#18181B]";
  const mutedClass = isDark ? "text-white" : "text-[#18181B]";
  const activePattern = resolveWalletPattern(wallet, index);

  const sharedPatternId =
    weaveVariant === "yakan"
      ? "pattern-yakan-diamond"
      : weaveVariant === "tnalak"
        ? "pattern-tnalak-circuit"
        : null;

  const overlayPatternId =
    weaveVariant !== undefined
      ? sharedPatternId
      : activePattern === "YAKAN"
        ? "pattern-yakan-diamond"
        : `pattern-card-${activePattern.toLowerCase()}`;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: effectiveBg,
        boxShadow: style?.boxShadow ?? "0px 5px 0px #18181B, 3px 5px 0px #18181B",
        ...style,
      }}
      className={`group relative aspect-[85.6/53.98] w-full select-none overflow-hidden rounded-[18px] sm:rounded-[22px] border-2 border-neutral-900 p-4 sm:p-5 ${textClass} transition-all duration-200 ${
        interactive ? "cursor-pointer hover:-translate-y-0.5 active:translate-y-0" : ""
      } ${className}`}
      data-card-pattern={activePattern}
      data-card-weave={weaveVariant ?? "none"}
      data-card-network={activeNetwork}
    >
      {/* Tactile Baul Weave / Card Grid Pattern Overlay */}
      {overlayPatternId && (
        <svg
          className={`pointer-events-none absolute inset-0 h-full w-full ${isDark ? "opacity-25" : "opacity-15"} z-0 ${textClass}`}
          style={{
            color: isDark ? "#FFFFFF" : "#18181B",
            filter: isDark ? "brightness(0) invert(1)" : undefined,
          }}
          aria-hidden="true"
          fill="none"
        >
          <defs>
            <pattern
              id="pattern-card-ledger"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <path d="M 20 0 H 0 V 20 M 0 0 H 20 M 0 0 V 20 M 19 0 V 20" />
            </pattern>
            <pattern
              id="pattern-card-solihiya"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <KalingaWeavePatternPaths />
            </pattern>
            <pattern
              id="pattern-card-kalinga"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <KalingaWeavePatternPaths />
            </pattern>
            <pattern
              id="pattern-card-bauhaus"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <IlokanoCrabPatternPaths />
            </pattern>
            <pattern
              id="pattern-card-ilokano"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <IlokanoCrabPatternPaths />
            </pattern>
            <pattern
              id="pattern-card-isometric"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <VisayanWavesPatternPaths />
            </pattern>
            <pattern
              id="pattern-card-visayan"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <VisayanWavesPatternPaths />
            </pattern>
            <pattern
              id="pattern-card-yakan"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <YakanWeavePatternPaths />
            </pattern>
            <pattern
              id="pattern-yakan-diamond"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <YakanWeavePatternPaths />
            </pattern>
            <pattern
              id="pattern-card-ibaloi"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <IbaloiWeavePatternPaths />
            </pattern>
            <pattern
              id="pattern-ibaloi-zigzag"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <IbaloiWeavePatternPaths />
            </pattern>
            <pattern
              id="pattern-tnalak-circuit"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <path d="M 12 0 V 8 L 6 14 V 22 L 12 28 V 34 L 18 40 L 12 46 V 48 M 36 0 V 8 L 42 14 V 22 L 36 28 V 34 L 30 40 L 36 46 V 48 M 24 0 V 10 L 30 16 L 24 22 L 18 16 L 24 10 M 24 22 V 30 L 20 34 V 42 L 24 46 V 48 M 24 13 L 27 16 L 24 19 L 21 16 Z M 0 0 V 6 L 4 10 V 18 L 0 22 V 30 L 6 36 L 0 42 V 48 M 48 0 V 6 L 44 10 V 18 L 48 22 V 30 L 42 36 L 48 42 V 48 M 6 18 H 18 M 30 18 H 42 M 12 34 H 20 M 28 34 H 36 M 18 40 H 30 M 4 14 H 0 M 44 14 H 48" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${overlayPatternId})`} />
        </svg>
      )}

      {/* Card Content Layout */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between select-none">
        {/* ROW 1: Card Type + Contactless Symbol + PH Institution Brandmark */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Card type & Primary pill */}
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-sans text-xs sm:text-sm font-extrabold tracking-tight lowercase ${textClass}`}>
              {cardTypeBadge}
            </span>
            {wallet.isDefault && (
              <span className="rounded-md bg-[#F59E0B] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-neutral-950 border-1.5 border-neutral-900 shadow-[1.5px_1.5px_0px_#18181B]">
                PRIMARY
              </span>
            )}
          </div>

          {/* Center: Contactless Tap Waves (oriented horizontally like physical cards) */}
          <div className="flex items-center justify-center">
            <svg
              className={`h-5 w-5 sm:h-5.5 sm:w-5.5 rotate-90 ${textClass}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              aria-label="Contactless payment symbol"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25a6 6 0 0 1 7.5 0" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 11a9.5 9.5 0 0 1 12 0" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.75a13.5 13.5 0 0 1 16.5 0" />
            </svg>
          </div>

          {/* Right: Issuing Institution Brandmark & Lockup */}
          <div className="flex items-center gap-1.5 min-w-0">
            <InstitutionBrandmark
              institution={wallet.institution}
              walletName={wallet.name}
            />
            <span className={`font-display text-xs sm:text-sm font-black tracking-tight ${textClass} truncate max-w-[110px] sm:max-w-[140px]`}>
              {institutionName}
            </span>
          </div>
        </div>

        {/* Rows 2-4: When top card in stack */}
        {!isStacked && (
          <>
            {/* ROW 2: Simplified Neobrutalist EMV Chip + Direct WCAG-Compliant Available Balance */}
            <div className="my-auto flex items-center justify-between gap-2 pt-1">
              {/* Simplified Flat Vector EMV Chip (matching reference image 2) */}
              <svg
                className="h-8 w-11 sm:h-8.5 sm:w-12 shrink-0"
                viewBox="0 0 46 34"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="44"
                  height="32"
                  rx="6"
                  fill="#FFE5B4"
                  stroke="#18181B"
                  strokeWidth="1.8"
                />
                {/* Left contacts */}
                <path
                  d="M1 13H15.5C18 13 19.5 11.3 19.5 9C19.5 6.7 18 5 15.5 5H12.5"
                  stroke="#18181B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 21H15.5C18 21 19.5 22.7 19.5 25C19.5 27.3 18 29 15.5 29H12.5"
                  stroke="#18181B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 13V21" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
                {/* Right contacts */}
                <path
                  d="M45 13H30.5C28 13 26.5 11.3 26.5 9C26.5 6.7 28 5 30.5 5H33.5"
                  stroke="#18181B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M45 21H30.5C28 21 26.5 22.7 26.5 25C26.5 27.3 28 29 30.5 29H33.5"
                  stroke="#18181B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M36 13V21" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

              {/* Direct Balance Readout (no background pill, WCAG AA contrast guaranteed) */}
              {showBalance && (
                <div className="text-right">
                  <span className={`block font-mono text-[10px] font-black uppercase tracking-wider leading-none ${mutedClass}`}>
                    AVAILABLE
                  </span>
                  <p className={`mt-1 font-mono text-sm sm:text-base font-black tabular-nums leading-tight ${textClass}`}>
                    {formatCurrency(wallet.balanceMinor, wallet.currency)}
                  </p>
                </div>
              )}
            </div>

            {/* ROW 3: Left Arrow Indicator + 16-Digit Card Number (Hidden when cardNetwork is NONE) */}
            {activeNetwork !== "NONE" && (
              <div className="pointer-events-none select-none flex items-center gap-2 py-0.5">
                <svg
                  className={`h-2.5 w-2.5 shrink-0 ${textClass}`}
                  viewBox="0 0 10 10"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="8,1 2,5 8,9" />
                </svg>
                <p className={`font-mono text-sm sm:text-base md:text-[17px] font-black tracking-[0.14em] ${textClass} select-none truncate`}>
                  {cardNumber}
                </p>
              </div>
            )}

            {/* ROW 4: Card Holder Name, Valid Thru Expiry, and Payment Network Emblem */}
            <div className="flex items-end justify-between gap-2 pt-1">
              <div className="min-w-0 flex-1 pr-1">
                <p className={`font-display text-xs sm:text-sm font-black tracking-wide ${textClass} truncate uppercase`}>
                  {holderName}
                </p>
                <span className={`block font-mono text-[9px] uppercase font-bold tracking-wider ${mutedClass}`}>
                  {network.sublabel}
                </span>
              </div>

              {/* Valid Thru Expiry (shown when Visa or Mastercard) */}
              {activeNetwork !== "NONE" && (
                <div className="flex items-center gap-1 shrink-0 mr-1 sm:mr-2">
                  <span className={`font-mono text-[7px] font-black uppercase leading-[1.05] text-right ${mutedClass}`}>
                    VALID
                    <br />
                    THRU
                  </span>
                  <span className={`font-mono text-xs sm:text-sm font-black tabular-nums ${textClass}`}>
                    {cardExpiry}
                  </span>
                </div>
              )}

              {/* Payment Network Logo (Mastercard / Visa / None) */}
              {activeNetwork === "MASTERCARD" ? (
                <div className="flex shrink-0 flex-col items-end" aria-label="Mastercard network">
                  <div className="relative flex items-center">
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-1.5 border-neutral-900 bg-[#EF4444]" />
                    <div className="-ml-2.5 sm:-ml-3 h-5 w-5 sm:h-6 sm:w-6 rounded-full border-1.5 border-neutral-900 bg-[#F59E0B]/95" />
                  </div>
                  <span className={`mt-0.5 font-mono text-[9px] font-black tracking-wider ${textClass} uppercase leading-none`}>
                    {network.label}
                  </span>
                </div>
              ) : activeNetwork === "VISA" ? (
                <div className="flex shrink-0 flex-col items-end" aria-label="Visa network">
                  <svg
                    className="h-5 sm:h-6 w-auto"
                    viewBox="0 0 68 22"
                    fill="none"
                    aria-hidden="true"
                  >
                    <text
                      x="1"
                      y="19"
                      fill={isDark ? "#FFFFFF" : "#1E3A8A"}
                      stroke={isDark ? "#18181B" : "none"}
                      strokeWidth={isDark ? "0.6" : "0"}
                      fontSize="21"
                      fontWeight="900"
                      fontStyle="italic"
                      fontFamily="Satoshi, Arial Black, sans-serif"
                      letterSpacing="-0.04em"
                    >
                      VISA
                    </text>
                    <path
                      d="M2 4.5H10.5L12.5 9.5L7.5 6.2L2 4.5Z"
                      fill="#F59E0B"
                    />
                  </svg>
                  <span className={`mt-0.5 font-mono text-[9px] font-black tracking-wider ${textClass} uppercase leading-none`}>
                    {network.label}
                  </span>
                </div>
              ) : (
                <div className="flex shrink-0 flex-col items-end">
                  <span className={`font-mono text-[10px] font-black tracking-wider ${textClass} uppercase leading-none`}>
                    {network.label}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
