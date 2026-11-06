import { useState, useEffect } from "react";
import type { CardNetwork, Wallet, WalletType } from "../../core/models";

export interface PhInstitutionMeta {
  id: string;
  label: string;
  domain: string;
  keywords: string[];
  defaultType: WalletType;
  defaultNetwork: CardNetwork;
  badgeBg: string;
  badgeFg: string;
  cardColor?: string;
}

export const PH_INSTITUTIONS: PhInstitutionMeta[] = [
  {
    id: "gcash",
    label: "GCash",
    domain: "gcash.com",
    keywords: ["gcash", "g-cash", "gxi"],
    defaultType: "E_WALLET",
    defaultNetwork: "VISA",
    badgeBg: "#007DFE",
    badgeFg: "#FFFFFF",
    cardColor: "#0EA5E9",
  },
  {
    id: "maya",
    label: "Maya",
    domain: "maya.ph",
    keywords: ["maya", "paymaya"],
    defaultType: "E_WALLET",
    defaultNetwork: "VISA",
    badgeBg: "#18181B",
    badgeFg: "#2EE59D",
    cardColor: "#10B981",
  },
  {
    id: "gotyme",
    label: "GoTyme",
    domain: "gotyme.com.ph",
    keywords: ["gotyme", "go tyme"],
    defaultType: "BANK",
    defaultNetwork: "VISA",
    badgeBg: "#0F172A",
    badgeFg: "#00F0FF",
    cardColor: "#0EA5E9",
  },
  {
    id: "maribank",
    label: "MariBank",
    domain: "seabank.ph",
    keywords: ["maribank", "mari bank", "seabank", "sea bank"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#FF5A00",
    badgeFg: "#FFFFFF",
    cardColor: "#F59E0B",
  },
  {
    id: "bdo",
    label: "BDO",
    domain: "bdo.com.ph",
    keywords: ["bdo", "banco de oro", "unibank"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#0038A8",
    badgeFg: "#FBBF24",
    cardColor: "#0EA5E9",
  },
  {
    id: "bpi",
    label: "BPI",
    domain: "bpi.com.ph",
    keywords: ["bpi", "bank of the philippine islands", "vybe"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#B91C1C",
    badgeFg: "#FDE68A",
    cardColor: "#F43F5E",
  },
  {
    id: "unionbank",
    label: "UnionBank",
    domain: "unionbankph.com",
    keywords: ["unionbank", "union bank", "ubp"],
    defaultType: "BANK",
    defaultNetwork: "VISA",
    badgeBg: "#F97316",
    badgeFg: "#FFFFFF",
    cardColor: "#F59E0B",
  },
  {
    id: "metrobank",
    label: "Metrobank",
    domain: "metrobank.com.ph",
    keywords: ["metrobank", "mbtc", "metro bank"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#1D4ED8",
    badgeFg: "#FFFFFF",
    cardColor: "#0EA5E9",
  },
  {
    id: "landbank",
    label: "LandBank",
    domain: "landbank.com",
    keywords: ["landbank", "land bank", "lbp"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#15803D",
    badgeFg: "#FDE68A",
    cardColor: "#10B981",
  },
  {
    id: "rcbc",
    label: "RCBC",
    domain: "rcbc.com",
    keywords: ["rcbc", "rizal commercial", "diskartech"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#0284C7",
    badgeFg: "#FFFFFF",
    cardColor: "#0EA5E9",
  },
  {
    id: "pnb",
    label: "PNB",
    domain: "pnb.com.ph",
    keywords: ["pnb", "philippine national bank"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#1E3A8A",
    badgeFg: "#FBBF24",
    cardColor: "#0EA5E9",
  },
  {
    id: "securitybank",
    label: "Security Bank",
    domain: "securitybank.com",
    keywords: ["security bank", "securitybank", "sb"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#0369A1",
    badgeFg: "#A7F3D0",
    cardColor: "#10B981",
  },
  {
    id: "chinabank",
    label: "Chinabank",
    domain: "chinabank.ph",
    keywords: ["chinabank", "china bank", "cbc"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#DC2626",
    badgeFg: "#FFFFFF",
    cardColor: "#F43F5E",
  },
  {
    id: "eastwest",
    label: "EastWest",
    domain: "eastwestbanker.com",
    keywords: ["eastwest", "east west", "komo"],
    defaultType: "BANK",
    defaultNetwork: "VISA",
    badgeBg: "#6B21A8",
    badgeFg: "#FFFFFF",
    cardColor: "#4A154B",
  },
  {
    id: "cimb",
    label: "CIMB",
    domain: "cimbbank.com.ph",
    keywords: ["cimb", "gsave"],
    defaultType: "BANK",
    defaultNetwork: "VISA",
    badgeBg: "#DC2626",
    badgeFg: "#FFFFFF",
    cardColor: "#F43F5E",
  },
  {
    id: "tonik",
    label: "Tonik",
    domain: "tonikbank.com",
    keywords: ["tonik"],
    defaultType: "BANK",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#7C3AED",
    badgeFg: "#D9F938",
    cardColor: "#4A154B",
  },
  {
    id: "coinsph",
    label: "Coins.ph",
    domain: "coins.ph",
    keywords: ["coins.ph", "coinsph", "coins"],
    defaultType: "CRYPTO",
    defaultNetwork: "NONE",
    badgeBg: "#1E40AF",
    badgeFg: "#FBBF24",
    cardColor: "#0EA5E9",
  },
  {
    id: "grabpay",
    label: "GrabPay",
    domain: "grab.com",
    keywords: ["grabpay", "grab pay", "grab"],
    defaultType: "E_WALLET",
    defaultNetwork: "MASTERCARD",
    badgeBg: "#00B14F",
    badgeFg: "#FFFFFF",
    cardColor: "#10B981",
  },
  {
    id: "shopeepay",
    label: "ShopeePay",
    domain: "shopee.ph",
    keywords: ["shopeepay", "shopee pay", "shopee"],
    defaultType: "E_WALLET",
    defaultNetwork: "NONE",
    badgeBg: "#EE4D2D",
    badgeFg: "#FFFFFF",
    cardColor: "#F43F5E",
  },
];

/**
 * Builds a Logo.dev Image CDN URL (`https://img.logo.dev/...`) for a matched
 * Philippine institution domain or arbitrary bank/e-wallet brand name.
 */
export function getLogoDevUrl(
  institution?: string,
  walletName?: string,
  tokenOverride?: string
): string | null {
  const matched = matchPhInstitution(institution, walletName);
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const token =
    tokenOverride ??
    env?.VITE_LOGO_DEV_TOKEN ??
    env?.VITE_LOGODEV_TOKEN ??
    "";

  const params = new URLSearchParams({
    size: "128",
    format: "png",
    retina: "true",
    fallback: "404",
  });
  if (token) {
    params.set("token", token);
  }

  if (matched) {
    return `https://img.logo.dev/${matched.domain}?${params.toString()}`;
  }

  const rawInst = institution?.trim();
  if (
    rawInst &&
    rawInst.toLowerCase() !== "kaban" &&
    rawInst.toLowerCase() !== "cash" &&
    rawInst.toLowerCase() !== "physical cash"
  ) {
    if (rawInst.includes(".") && !rawInst.includes(" ")) {
      return `https://img.logo.dev/${encodeURIComponent(rawInst.toLowerCase())}?${params.toString()}`;
    }
    return `https://img.logo.dev/name/${encodeURIComponent(rawInst)}?${params.toString()}`;
  }

  return null;
}

export function matchPhInstitution(
  institution?: string,
  walletName?: string
): PhInstitutionMeta | null {
  const candidates = [institution, walletName]
    .filter(Boolean)
    .map((s) => s!.trim().toLowerCase());

  for (const text of candidates) {
    for (const meta of PH_INSTITUTIONS) {
      if (meta.keywords.some((kw) => text === kw || text.includes(kw))) {
        return meta;
      }
    }
  }
  return null;
}

export function resolveCardNetwork(
  wallet: Pick<Wallet, "type" | "cardNetwork" | "accountNumber" | "institution" | "name">
): CardNetwork {
  if (wallet.cardNetwork) {
    return wallet.cardNetwork;
  }
  if (wallet.type === "CASH" && !wallet.accountNumber?.trim()) {
    return "NONE";
  }
  const matched = matchPhInstitution(wallet.institution, wallet.name);
  if (matched) {
    if (!wallet.accountNumber?.trim() && matched.defaultNetwork === "NONE") {
      return "NONE";
    }
    return matched.defaultNetwork;
  }
  if (wallet.type === "OTHER" && !wallet.accountNumber?.trim()) {
    return "NONE";
  }
  return "MASTERCARD";
}

function renderBrandmarkGlyph(id: string | undefined, fg: string) {
  switch (id) {
    case "gcash":
      // GCash iconic G + right signal wave arcs
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M13.5 7.2A5.5 5.5 0 1 0 15 14.5H11V11.8H15.5"
            stroke={fg}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 8.5a5 5 0 0 1 0 7M20.2 6.5a8 8 0 0 1 0 11"
            stroke={fg}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "maya":
      // Maya bold geometric M arch
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 17V9.5C4 7.5 5.5 6 7.5 6C9.2 6 10.6 7.1 12 9C13.4 7.1 14.8 6 16.5 6C18.5 6 20 7.5 20 9.5V17"
            stroke={fg}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="5.5" r="1.8" fill={fg} />
        </svg>
      );

    case "gotyme":
      // GoTyme prism triangle/infinity loop
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 16L12 5L18 16H6Z"
            stroke={fg}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12.5" r="2.2" fill="#FBBF24" />
        </svg>
      );

    case "maribank":
      // MariBank / SeaBank rising sun & double wave crest
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="9" r="3.5" fill={fg} />
          <path
            d="M4 15.5C6.5 13.5 9.5 13.5 12 15.5C14.5 17.5 17.5 17.5 20 15.5"
            stroke={fg}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M4 19C6.5 17 9.5 17 12 19C14.5 21 17.5 21 20 19"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "bdo":
      // BDO bold monogram bar lockup
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="#0038A8" />
          <path d="M4 16.5H20" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
          <text
            x="12"
            y="13.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            BDO
          </text>
        </svg>
      );

    case "bpi":
      // BPI classic shield & 3 heritage pillars
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 4H19V12C19 16.5 12 20 12 20C12 20 5 16.5 5 12V4Z"
            stroke={fg}
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
          <path d="M9 8V14M12 8V15M15 8V14" stroke={fg} strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );

    case "unionbank":
      // UnionBank interlocking U monogram
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6.5 5.5V13C6.5 16.2 8.9 18.5 12 18.5C15.1 18.5 17.5 16.2 17.5 13V5.5"
            stroke={fg}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M10 5.5V12.5C10 13.7 10.9 14.5 12 14.5C13.1 14.5 14 13.7 14 12.5V5.5"
            stroke={fg}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "metrobank":
      // Metrobank 4-petal quatrefoil crest
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="3.5" stroke={fg} strokeWidth="2" />
          <circle cx="15" cy="9" r="3.5" stroke={fg} strokeWidth="2" />
          <circle cx="9" cy="15" r="3.5" stroke={fg} strokeWidth="2" />
          <circle cx="15" cy="15" r="3.5" stroke={fg} strokeWidth="2" />
        </svg>
      );

    case "landbank":
      // LandBank diamond & sprout leaf
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon points="12,3 21,12 12,21 3,12" stroke={fg} strokeWidth="2.1" />
          <path d="M12 16V9M12 11C12 9 14.5 8 16 9.5M12 12.5C12 10.5 9.5 9.5 8 11" stroke={fg} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "rcbc":
      // RCBC hexagonal cube blocks
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" stroke={fg} strokeWidth="2.2" />
          <path d="M4 7.5L12 12L20 7.5M12 12V21" stroke={fg} strokeWidth="2" />
        </svg>
      );

    case "pnb":
      // PNB triangle & sun rays
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon points="12,4 20,18 4,18" stroke={fg} strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="12" cy="13.5" r="2.2" fill={fg} />
        </svg>
      );

    case "securitybank":
      // Security Bank interlocking dual rings
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9.5" cy="12" r="4.5" stroke="#FFFFFF" strokeWidth="2.2" />
          <circle cx="14.5" cy="12" r="4.5" stroke={fg} strokeWidth="2.2" />
        </svg>
      );

    case "chinabank":
      // Chinabank ancient coin (circle with square center)
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" stroke={fg} strokeWidth="2.2" />
          <rect x="9" y="9" width="6" height="6" stroke={fg} strokeWidth="2" />
        </svg>
      );

    case "eastwest":
      // EastWest compass star
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" stroke={fg} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );

    case "cimb":
      // CIMB forward double chevron
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6L12 12L6 18M12 6L18 12L12 18" stroke={fg} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "tonik":
      // Tonik T lightning bolt
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6H18M12 6L10 13H14L11 19" stroke={fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "coinsph":
      // Coins.ph dual C coin arc
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15.5 8A5.5 5.5 0 1 0 15.5 16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="15.5" cy="12" r="2.2" fill={fg} />
        </svg>
      );

    case "grabpay":
      // GrabPay stylized G
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15.5 7.5A5.5 5.5 0 1 0 17 13H12" stroke={fg} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "shopeepay":
      // ShopeePay bag & S emblem
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="8" width="14" height="12" rx="2" stroke={fg} strokeWidth="2.1" />
          <path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke={fg} strokeWidth="2" />
          <path d="M13.8 12c-.5-.6-2.5-.7-2.8.3-.3.9 2.8.9 2.6 2.3-.2 1.1-2.2 1-2.9.2" stroke={fg} strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );

    default:
      // Default Kaban Vault emblem
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
  }
}

export function InstitutionBrandmark({
  institution,
  walletName,
  size = "md",
}: {
  institution?: string;
  walletName?: string;
  size?: "sm" | "md";
}) {
  const matched = matchPhInstitution(institution, walletName);
  const localBrandmarkPath = matched ? `/brands/${matched.id}.png` : null;
  const logoDevUrl = getLogoDevUrl(institution, walletName);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [localBrandmarkPath, logoDevUrl]);

  const bg = matched ? matched.badgeBg : "#FFFFFF";
  const fg = matched ? matched.badgeFg : "#4A154B";
  const boxSize = size === "sm" ? "h-5 w-5 rounded-[5px]" : "h-6 w-6 rounded-md";
  const imageSrc = !imgFailed ? (localBrandmarkPath || logoDevUrl) : null;

  return (
    <div
      style={{ backgroundColor: imageSrc ? "#FFFFFF" : bg, color: fg }}
      className={`relative flex ${boxSize} shrink-0 items-center justify-center overflow-hidden border-1.5 border-neutral-900 shadow-[1.5px_1.5px_0px_#18181B]`}
      title={matched ? matched.label : institution || "Kaban Vault"}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${matched?.label || institution || "Institution"} brandmark`}
          className="h-full w-full object-contain p-[1.5px]"
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        renderBrandmarkGlyph(matched?.id, fg)
      )}
    </div>
  );
}
