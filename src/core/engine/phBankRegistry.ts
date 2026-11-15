import type { InterestTier } from "../models";

export const PH_DIGITAL_BANK_ALIASES = {
  MARIBANK: ["maribank", "mari bank", "seamoney"],
  DISKARTECH: ["diskartech"],
  GOTYME: ["gotyme", "gotyme bank"],
  BANKO: ["banko", "bpi direct banko"],
  OFBANK: ["ofbank", "overseas filipino bank"],
  UNIONDIGITAL: ["uniondigital", "union digital"],
  CIMB: ["cimb", "cimb bank"],
  OWNBANK: ["ownbank", "own bank"],
  MAYA_BANK: ["maya bank", "mayabank"],
  SALMON: ["salmon", "salmon bank"],
  NETBANK: ["netbank", "netbank mobile"],
  KOMO: ["komo", "komo by eastwest"],
  UNO: ["uno digital", "uno bank", "unobank"],
  TONIK: ["tonik", "tonik bank"],
} as const;

export interface PhBankInterestPreset {
  readonly presetId: string;
  readonly presetVersion: number;
  readonly name: string;
  readonly pattern: RegExp;
  readonly aliases: readonly string[];
  readonly tiers: readonly InterestTier[];
  readonly tierMode: "MARGINAL" | "WHOLE_BALANCE";
  readonly withholdingTaxBps: number;
  readonly dayCountBasis: 365 | 366 | 360;
  readonly payoutFrequency: "DAILY" | "MONTHLY";
  readonly monthlyPayoutDay?: number;
  readonly rounding: "FLOOR" | "HALF_UP";
  readonly notes?: string;
}

export const PH_BANK_INTEREST_PRESETS: readonly PhBankInterestPreset[] = [
  {
    presetId: "ph-maribank",
    presetVersion: 1,
    name: "MariBank",
    pattern: /\b(maribank|mari\s*bank|seamoney)\b/i,
    aliases: PH_DIGITAL_BANK_ALIASES.MARIBANK,
    tiers: [
      { upToMinor: 10_000_000, rateBps: 325 }, // 3.25% up to ₱100,000
      { upToMinor: null, rateBps: 375 },       // 3.75% above ₱100,000
    ],
    tierMode: "MARGINAL",
    withholdingTaxBps: 2000,
    dayCountBasis: 365,
    payoutFrequency: "DAILY",
    rounding: "FLOOR",
    notes: "3.25% p.a. up to ₱100k, 3.75% p.a. on excess, credited daily net of 20% FWT.",
  },
  {
    presetId: "ph-maya-bank",
    presetVersion: 1,
    name: "Maya Bank",
    pattern: /\b(maya\s*bank|mayabank)\b/i,
    aliases: PH_DIGITAL_BANK_ALIASES.MAYA_BANK,
    tiers: [{ upToMinor: null, rateBps: 350 }],
    tierMode: "WHOLE_BALANCE",
    withholdingTaxBps: 2000,
    dayCountBasis: 365,
    payoutFrequency: "DAILY",
    rounding: "FLOOR",
    notes: "3.50% p.a. base rate credited daily; configure promo boost for mission tiers.",
  },
  {
    presetId: "ph-gotyme",
    presetVersion: 1,
    name: "GoTyme Bank",
    pattern: /\b(gotyme|gotyme\s*bank)\b/i,
    aliases: PH_DIGITAL_BANK_ALIASES.GOTYME,
    tiers: [{ upToMinor: null, rateBps: 350 }],
    tierMode: "WHOLE_BALANCE",
    withholdingTaxBps: 2000,
    dayCountBasis: 365,
    payoutFrequency: "MONTHLY",
    monthlyPayoutDay: 1,
    rounding: "FLOOR",
    notes: "Accrues daily and credits monthly on the 1st, net of 20% FWT.",
  },
  {
    presetId: "ph-cimb",
    presetVersion: 1,
    name: "CIMB Bank",
    pattern: /\b(cimb|cimb\s*bank)\b/i,
    aliases: PH_DIGITAL_BANK_ALIASES.CIMB,
    tiers: [{ upToMinor: null, rateBps: 260 }],
    tierMode: "WHOLE_BALANCE",
    withholdingTaxBps: 2000,
    dayCountBasis: 365,
    payoutFrequency: "MONTHLY",
    monthlyPayoutDay: 1,
    rounding: "FLOOR",
    notes: "Base rate credited monthly; configure promo boost for UpSave/GSave promos.",
  },
  {
    presetId: "ph-ownbank",
    presetVersion: 1,
    name: "OwnBank",
    pattern: /\b(ownbank|own\s*bank)\b/i,
    aliases: PH_DIGITAL_BANK_ALIASES.OWNBANK,
    tiers: [{ upToMinor: null, rateBps: 500 }],
    tierMode: "WHOLE_BALANCE",
    withholdingTaxBps: 2000,
    dayCountBasis: 365,
    payoutFrequency: "DAILY",
    rounding: "FLOOR",
    notes: "Own It savings rate credited daily, net of 20% FWT.",
  },
];

/**
 * Matches a wallet institution string against built-in PH digital bank interest presets.
 */
export function matchBankPreset(institution?: string | null): PhBankInterestPreset | undefined {
  const normalized = institution?.trim();
  if (!normalized) return undefined;
  return PH_BANK_INTEREST_PRESETS.find((preset) => preset.pattern.test(normalized));
}

export function getBankPresetById(presetId?: string | null): PhBankInterestPreset | undefined {
  if (!presetId) return undefined;
  return PH_BANK_INTEREST_PRESETS.find((preset) => preset.presetId === presetId);
}
