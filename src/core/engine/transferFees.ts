export type TransferChannel = "INSTAPAY" | "PESONET" | "DIRECT" | "MANUAL";

export interface TransferFeeRule {
  readonly name: string;
  readonly pattern: RegExp;
  readonly aliases: readonly string[];
  readonly instapayFeeMinor: number | null; // null if not supported
  readonly pesonetFeeMinor: number | null;  // null if not supported
  readonly notes?: string;
}

export const BANK_TRANSFER_FEE_RULES: readonly TransferFeeRule[] = [
  // Traditional Banks
  { name: "BPI", pattern: /\b(bpi|bank of the philippine islands)\b/i, aliases: ["bpi", "bank of the philippine islands"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "BDO", pattern: /\b(bdo|bdo unibank)\b/i, aliases: ["bdo", "bdo unibank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "LANDBANK", pattern: /\b(landbank|land\s*bank)\b/i, aliases: ["landbank", "land bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "Metrobank", pattern: /\b(metrobank|metropolitan\s*bank)\b/i, aliases: ["metrobank", "metropolitan bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "RCBC", pattern: /\b(rcbc|rizal\s*commercial)\b/i, aliases: ["rcbc", "rizal commercial banking"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "Chinabank", pattern: /\b(chinabank|china\s*bank(?:ing)?)\b/i, aliases: ["chinabank", "china banking corporation"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "UnionBank", pattern: /\b(unionbank|ubp|union\s*bank)\b/i, aliases: ["unionbank", "ubp", "union bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "Security Bank", pattern: /\b(security\s*bank|secbank)\b/i, aliases: ["security bank", "secbank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "PNB", pattern: /\b(pnb|philippine\s*national\s*bank)\b/i, aliases: ["pnb", "philippine national bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "PSBank", pattern: /\b(psbank|philippine\s*savings\s*bank)\b/i, aliases: ["psbank", "philippine savings bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "EastWest", pattern: /\b(eastwest|east\s*west(?:\s*bank)?)\b/i, aliases: ["eastwest", "eastwest bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "Bank of Commerce", pattern: /\b(bank\s*of\s*commerce|bancom)\b/i, aliases: ["bank of commerce", "bancom"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "AUB", pattern: /\b(aub|asia\s*united\s*bank)\b/i, aliases: ["aub", "asia united bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "DBP", pattern: /\b(dbp|development\s*bank\s*of\s*the\s*philippines)\b/i, aliases: ["dbp", "development bank of the philippines"], instapayFeeMinor: 0, pesonetFeeMinor: 1000 },

  // Digital-First Banks
  { name: "MariBank", pattern: /\b(maribank|mari\s*bank|seamoney)\b/i, aliases: ["maribank", "mari bank", "seamoney"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "DiskarTech", pattern: /\b(diskartech)\b/i, aliases: ["diskartech"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "GoTyme Bank", pattern: /\b(gotyme|gotyme\s*bank)\b/i, aliases: ["gotyme", "gotyme bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0, notes: "Free for first 20 monthly" },
  { name: "BanKo", pattern: /\b(banko|bpi\s*direct\s*banko)\b/i, aliases: ["banko", "bpi direct banko"], instapayFeeMinor: 0, pesonetFeeMinor: null },
  { name: "Overseas Filipino Bank", pattern: /\b(ofbank|overseas\s*filipino\s*bank)\b/i, aliases: ["ofbank", "overseas filipino bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "UnionDigital Bank", pattern: /\b(uniondigital|union\s*digital(?:\s*bank)?)\b/i, aliases: ["uniondigital", "union digital"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "CIMB Bank", pattern: /\b(cimb|cimb\s*bank)\b/i, aliases: ["cimb", "cimb bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0, notes: "Free for first 2 daily" },
  { name: "OwnBank", pattern: /\b(ownbank|own\s*bank)\b/i, aliases: ["ownbank", "own bank"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "Maya Bank", pattern: /\b(maya\s*bank|mayabank)\b/i, aliases: ["maya bank", "mayabank"], instapayFeeMinor: 1000, pesonetFeeMinor: 0 },
  { name: "Salmon Bank", pattern: /\b(salmon|salmon\s*bank)\b/i, aliases: ["salmon", "salmon bank"], instapayFeeMinor: null, pesonetFeeMinor: 0 },
  { name: "Netbank Mobile", pattern: /\b(netbank|netbank\s*mobile)\b/i, aliases: ["netbank", "netbank mobile"], instapayFeeMinor: 500, pesonetFeeMinor: 0 },
  { name: "Komo", pattern: /\b(komo|komo\s*by\s*eastwest)\b/i, aliases: ["komo", "komo by eastwest"], instapayFeeMinor: 0, pesonetFeeMinor: 0 },
  { name: "UNO Digital Bank", pattern: /\b(uno\s*digital(?:\s*bank)?|uno\s*bank|unobank)\b/i, aliases: ["uno digital", "uno bank", "unobank"], instapayFeeMinor: 500, pesonetFeeMinor: null },
  { name: "Tonik", pattern: /\b(tonik|tonik\s*bank)\b/i, aliases: ["tonik", "tonik bank"], instapayFeeMinor: 800, pesonetFeeMinor: null },

  // E-Wallets
  { name: "VYBE by BPI", pattern: /\b(vybe|vybe\s*by\s*bpi)\b/i, aliases: ["vybe", "vybe by bpi"], instapayFeeMinor: 0, pesonetFeeMinor: null },
  { name: "ShopeePay", pattern: /\b(shopeepay|shopee\s*pay)\b/i, aliases: ["shopeepay", "shopee pay"], instapayFeeMinor: 0, pesonetFeeMinor: null },
  { name: "PalawanPay", pattern: /\b(palawanpay|palawan\s*pay)\b/i, aliases: ["palawanpay", "palawan pay"], instapayFeeMinor: 500, pesonetFeeMinor: null },
  { name: "Maya", pattern: /\b(maya|paymaya)\b/i, aliases: ["maya", "paymaya"], instapayFeeMinor: 1000, pesonetFeeMinor: null },
  { name: "GCash", pattern: /\b(gcash|mynt)\b/i, aliases: ["gcash", "mynt"], instapayFeeMinor: 1000, pesonetFeeMinor: null },
  { name: "GrabPay", pattern: /\b(grabpay|grab\s*pay)\b/i, aliases: ["grabpay", "grab pay"], instapayFeeMinor: 1000, pesonetFeeMinor: null },
];

export function findFeeRule(institutionOrName?: string | null): TransferFeeRule | undefined {
  if (!institutionOrName) return undefined;
  const trimmed = institutionOrName.trim();
  if (!trimmed) return undefined;

  // Regex check disregarding capitalization
  return BANK_TRANSFER_FEE_RULES.find((rule) => rule.pattern.test(trimmed));
}

export interface TransferFeeDetectionResult {
  readonly feeMinor: number;
  readonly originName?: string;
  readonly destinationName?: string;
  readonly originRule?: TransferFeeRule;
  readonly destinationRule?: TransferFeeRule;
  readonly isSameInstitution: boolean;
  readonly channel: TransferChannel;
  readonly reason: string;
}

export function parseTransferRouteFromText(text: string): { origin?: string; destination?: string } | null {
  if (!text) return null;
  const trimmed = text.trim();

  // Pattern 1: Cash-in "Cash-in GCash from MariBank" or "Cash in to GCash via MariBank"
  const cashInMatch = trimmed.match(/cash[- ]?in\s+(?:to\s+)?([a-z0-9\s.]+?)\s+(?:from|via)\s+([a-z0-9\s.]+)/i);
  if (cashInMatch && cashInMatch[1] && cashInMatch[2]) {
    return {
      destination: cashInMatch[1].trim(),
      origin: cashInMatch[2].trim(),
    };
  }

  // Pattern 2: "Transfer [from] MariBank to GCash" or "MariBank -> GCash" or "MariBank to GCash"
  const transferMatch = trimmed.match(/(?:transfer(?:\s+funds)?(?:\s+from)?\s+|from\s+)?([a-z0-9\s.]+?)\s*(?:to|->|—|–)\s*([a-z0-9\s.]+)/i);
  if (transferMatch && transferMatch[1] && transferMatch[2]) {
    return {
      origin: transferMatch[1].trim(),
      destination: transferMatch[2].trim(),
    };
  }

  return null;
}

export function detectTransferFee(options: {
  origin?: string | null;
  destination?: string | null;
  channel?: TransferChannel;
}): TransferFeeDetectionResult {
  const channel = options.channel ?? "INSTAPAY";
  const originRule = findFeeRule(options.origin);
  const destinationRule = findFeeRule(options.destination);

  // If both origin and destination match the same institution (e.g. GCash to GCash, Maya to Maya, BDO to BDO)
  if (originRule && destinationRule && originRule.name === destinationRule.name) {
    return {
      feeMinor: 0,
      originName: originRule.name,
      destinationName: destinationRule.name,
      originRule,
      destinationRule,
      isSameInstitution: true,
      channel,
      reason: `${originRule.name} to ${destinationRule.name} is free (same platform)`,
    };
  }

  let feeMinor = 0;
  let reason = "Free transfer";

  if (channel === "DIRECT" || channel === "MANUAL") {
    feeMinor = 0;
    reason = `${channel} transfer (no fee)`;
  } else if (channel === "PESONET") {
    feeMinor = originRule?.pesonetFeeMinor ?? 0;
    reason = originRule
      ? `${originRule.name} PESONet fee: ${feeMinor === 0 ? "FREE" : `₱${(feeMinor / 100).toFixed(2)}`}`
      : "PESONet transfer";
  } else {
    // INSTAPAY default
    feeMinor = originRule?.instapayFeeMinor ?? 0;
    reason = originRule
      ? `${originRule.name} InstaPay fee: ${feeMinor === 0 ? "FREE" : `₱${(feeMinor / 100).toFixed(2)}`}`
      : "InstaPay transfer";
  }

  return {
    feeMinor,
    originName: originRule?.name ?? options.origin ?? undefined,
    destinationName: destinationRule?.name ?? options.destination ?? undefined,
    originRule,
    destinationRule,
    isSameInstitution: false,
    channel,
    reason,
  };
}

export function lookupTransferFee(
  originOrText?: string | null,
  destinationOrChannel?: string | TransferChannel | null,
  maybeChannel?: TransferChannel
): number {
  let origin = originOrText;
  let destination: string | undefined = undefined;
  let channel: TransferChannel = "INSTAPAY";

  if (typeof destinationOrChannel === "string") {
    if (destinationOrChannel === "INSTAPAY" || destinationOrChannel === "PESONET" || destinationOrChannel === "DIRECT" || destinationOrChannel === "MANUAL") {
      channel = destinationOrChannel;
    } else {
      destination = destinationOrChannel;
      if (maybeChannel) channel = maybeChannel;
    }
  }

  // If no destination is given explicitly, attempt route extraction from text if available
  if (!destination && origin) {
    const route = parseTransferRouteFromText(origin);
    if (route?.origin && route?.destination) {
      origin = route.origin;
      destination = route.destination;
    }
  }

  return detectTransferFee({ origin, destination, channel }).feeMinor;
}
