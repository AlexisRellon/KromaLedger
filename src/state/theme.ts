export type ThemeMode = "light" | "dark" | "system";
export type AppThemeId = "plum" | "amber" | "mint" | "rose" | "azure" | "obsidian" | "volt";

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  tagline: string;
  // Light Mode Tokens (calibrated for >= 4.5:1 on light canvas and surfaces)
  hex: string;
  hoverHex: string;
  textOnPrimary: string;
  subtleHex: string;
  subtleText: string;
  accentText: string;
  // Dark Mode Tokens (calibrated for >= 4.5:1 on dark cards and surfaces)
  darkPrimaryHex: string;
  darkHoverHex: string;
  darkTextOnPrimary: string;
  darkSubtleHex: string;
  darkSubtleText: string;
  darkAccentText: string;
}

export interface ThemePreferences {
  themeMode: ThemeMode;
  appTheme: AppThemeId;
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
}

export const APP_THEMES: AppThemeConfig[] = [
  {
    id: "plum",
    name: "Kaban Plum",
    tagline: "Heritage Royal Plum",
    hex: "#4A154B",
    hoverHex: "#3B0764",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#EDE9FE",
    subtleText: "#18181B",
    accentText: "#4A154B",
    darkPrimaryHex: "#C084FC",
    darkHoverHex: "#A855F7",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#2E2137",
    darkSubtleText: "#E9D5FF",
    darkAccentText: "#DDD6FE",
  },
  {
    id: "amber",
    name: "Treasure Amber",
    tagline: "Family Heirloom Gold",
    hex: "#B45309",
    hoverHex: "#92400E",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#FEF3C7",
    subtleText: "#18181B",
    accentText: "#92400E",
    darkPrimaryHex: "#FBBF24",
    darkHoverHex: "#F59E0B",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#38290E",
    darkSubtleText: "#FDE68A",
    darkAccentText: "#FDE68A",
  },
  {
    id: "mint",
    name: "Mint Sage",
    tagline: "Forest Emerald Inflow",
    hex: "#047857",
    hoverHex: "#065F46",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#D1FAE5",
    subtleText: "#18181B",
    accentText: "#047857",
    darkPrimaryHex: "#34D399",
    darkHoverHex: "#10B981",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#0A3324",
    darkSubtleText: "#A7F3D0",
    darkAccentText: "#6EE7B7",
  },
  {
    id: "rose",
    name: "Coral Rose",
    tagline: "Warm Philippine Coral",
    hex: "#BE123C",
    hoverHex: "#9F1239",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#FFE4E6",
    subtleText: "#18181B",
    accentText: "#BE123C",
    darkPrimaryHex: "#FB7185",
    darkHoverHex: "#F43F5E",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#3B1721",
    darkSubtleText: "#FECDD3",
    darkAccentText: "#FDA4AF",
  },
  {
    id: "azure",
    name: "Sky Azure",
    tagline: "Deep Archipelago Blue",
    hex: "#0369A1",
    hoverHex: "#075985",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#E0F2FE",
    subtleText: "#18181B",
    accentText: "#0369A1",
    darkPrimaryHex: "#38BDF8",
    darkHoverHex: "#0EA5E9",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#0E2A3E",
    darkSubtleText: "#BAE6FD",
    darkAccentText: "#7DD3FC",
  },
  {
    id: "obsidian",
    name: "Obsidian Noir",
    tagline: "Tactile Monochrome Ink",
    hex: "#18181B",
    hoverHex: "#09090B",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#F4F4F5",
    subtleText: "#18181B",
    accentText: "#18181B",
    darkPrimaryHex: "#E4E4E7",
    darkHoverHex: "#D4D4D8",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#27272A",
    darkSubtleText: "#F4F4F5",
    darkAccentText: "#F4F4F5",
  },
  {
    id: "volt",
    name: "Electric Volt",
    tagline: "High-Visibility Cyber Volt",
    hex: "#4D7C0F",
    hoverHex: "#3F6212",
    textOnPrimary: "#FFFFFF",
    subtleHex: "#ECFCCB",
    subtleText: "#18181B",
    accentText: "#4D7C0F",
    darkPrimaryHex: "#D9F938",
    darkHoverHex: "#BEF264",
    darkTextOnPrimary: "#18181B",
    darkSubtleHex: "#26310C",
    darkSubtleText: "#ECFCCB",
    darkAccentText: "#EBFB67",
  },
];

export function getThemeConfig(idOrHex: string): AppThemeConfig {
  const byId = APP_THEMES.find((t) => t.id === idOrHex);
  if (byId) return byId;

  const normalizedHex = idOrHex.toLowerCase();
  const byHex = APP_THEMES.find(
    (t) =>
      t.hex.toLowerCase() === normalizedHex ||
      t.darkPrimaryHex.toLowerCase() === normalizedHex ||
      (t.id === "amber" && normalizedHex === "#f59e0b") ||
      (t.id === "mint" && normalizedHex === "#10b981") ||
      (t.id === "rose" && normalizedHex === "#f43f5e") ||
      (t.id === "azure" && normalizedHex === "#0284c7") ||
      (t.id === "volt" && normalizedHex === "#d9f938")
  );
  if (byHex) return byHex;

  return APP_THEMES[0]!;
}

export function resolveEffectiveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return mode;
}

export function applyThemeToDom(prefs: ThemePreferences) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const effectiveMode = resolveEffectiveMode(prefs.themeMode);
  const theme = getThemeConfig(prefs.appTheme);
  const isDark = effectiveMode === "dark";

  // Set data attributes
  root.setAttribute("data-theme", effectiveMode);
  root.setAttribute("data-app-theme", theme.id);

  // Toggle dark class
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Accessibility flags
  root.classList.toggle("high-contrast", prefs.highContrast);
  root.classList.toggle("reduce-motion", prefs.reducedMotion);
  root.classList.toggle("large-text", prefs.largeText);

  // Dynamic CSS variables for active brand theme (WCAG AA calibrated)
  if (isDark) {
    root.style.setProperty("--theme-primary", theme.darkPrimaryHex);
    root.style.setProperty("--theme-primary-hover", theme.darkHoverHex);
    root.style.setProperty("--theme-subtle", theme.darkSubtleHex);
    root.style.setProperty("--theme-subtle-text", theme.darkSubtleText);
    root.style.setProperty("--theme-text-on-primary", theme.darkTextOnPrimary);
    root.style.setProperty("--theme-accent-text", theme.darkAccentText);
    root.style.setProperty("--theme-border", "#7E8294");
  } else {
    root.style.setProperty("--theme-primary", theme.hex);
    root.style.setProperty("--theme-primary-hover", theme.hoverHex);
    root.style.setProperty("--theme-subtle", theme.subtleHex);
    root.style.setProperty("--theme-subtle-text", theme.subtleText);
    root.style.setProperty("--theme-text-on-primary", theme.textOnPrimary);
    root.style.setProperty("--theme-accent-text", theme.accentText);
    root.style.setProperty("--theme-border", "#18181B");
  }
}

export function getStoredThemePreferences(): ThemePreferences {
  if (typeof window === "undefined" && typeof localStorage === "undefined") {
    return {
      themeMode: "light",
      appTheme: "plum",
      highContrast: false,
      reducedMotion: false,
      largeText: false,
    };
  }

  try {
    const storage = typeof localStorage !== "undefined" ? localStorage : window.localStorage;
    const rawMode = storage.getItem("kaban_theme_mode") as ThemeMode | null;
    const themeMode: ThemeMode =
      rawMode === "light" || rawMode === "dark" || rawMode === "system" ? rawMode : "light";

    const rawTheme = storage.getItem("kaban_app_theme") as AppThemeId | null;
    const appTheme: AppThemeId =
      rawTheme && APP_THEMES.some((t) => t.id === rawTheme) ? rawTheme : "plum";

    const highContrast = storage.getItem("kaban_high_contrast") === "true";
    const reducedMotion = storage.getItem("kaban_reduced_motion") === "true";
    const largeText = storage.getItem("kaban_large_text") === "true";

    return {
      themeMode,
      appTheme,
      highContrast,
      reducedMotion,
      largeText,
    };
  } catch {
    return {
      themeMode: "light",
      appTheme: "plum",
      highContrast: false,
      reducedMotion: false,
      largeText: false,
    };
  }
}

export function saveThemePreferences(partial: Partial<ThemePreferences>) {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return;

  try {
    const storage = typeof localStorage !== "undefined" ? localStorage : window.localStorage;
    if (partial.themeMode !== undefined) {
      storage.setItem("kaban_theme_mode", partial.themeMode);
    }
    if (partial.appTheme !== undefined) {
      storage.setItem("kaban_app_theme", partial.appTheme);
    }
    if (partial.highContrast !== undefined) {
      storage.setItem("kaban_high_contrast", String(partial.highContrast));
    }
    if (partial.reducedMotion !== undefined) {
      storage.setItem("kaban_reduced_motion", String(partial.reducedMotion));
    }
    if (partial.largeText !== undefined) {
      storage.setItem("kaban_large_text", String(partial.largeText));
    }
  } catch {
    // Ignore storage quota or access errors in restricted contexts
  }
}
