import { describe, expect, it } from "vitest";
import {
  APP_THEMES,
  applyThemeToDom,
  getStoredThemePreferences,
  getThemeConfig,
  resolveEffectiveMode,
  saveThemePreferences,
} from "../../src/state/theme";
import { useUIStore } from "../../src/state/useUIStore";

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function hexToLuminance(hex: string): number {
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = [...clean].map((x) => x + x).join("");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function calcContrast(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe("WCAG 2.1 AA Theme Contrast Audit", () => {
  it("guarantees WCAG 2.1 AA contrast (>= 4.5:1 for text, >= 3:1 for UI borders) for all 7 themes in light mode", () => {
    for (const theme of APP_THEMES) {
      // Primary button text
      const primaryContrast = calcContrast(theme.hex, theme.textOnPrimary);
      expect(primaryContrast).toBeGreaterThanOrEqual(4.5);

      // Subtle badge text
      const subtleContrast = calcContrast(theme.subtleHex, theme.subtleText);
      expect(subtleContrast).toBeGreaterThanOrEqual(4.5);

      // Accent text on light paper canvas (#FAF8F5)
      const accentContrast = calcContrast(theme.accentText, "#FAF8F5");
      expect(accentContrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("guarantees WCAG 2.1 AA contrast for all 7 themes in dark mode", () => {
    const darkCard = "#1C1D22";
    for (const theme of APP_THEMES) {
      // Dark primary button text
      const primaryContrast = calcContrast(theme.darkPrimaryHex, theme.darkTextOnPrimary);
      expect(primaryContrast).toBeGreaterThanOrEqual(4.5);

      // Dark subtle badge text
      const subtleContrast = calcContrast(theme.darkSubtleHex, theme.darkSubtleText);
      expect(subtleContrast).toBeGreaterThanOrEqual(4.5);

      // Dark accent text on dark card surface
      const accentContrast = calcContrast(theme.darkAccentText, darkCard);
      expect(accentContrast).toBeGreaterThanOrEqual(4.5);

      // Dark primary button non-text boundary vs dark card (WCAG 1.4.11 >= 3.0:1)
      const buttonBorderContrast = calcContrast(theme.darkPrimaryHex, darkCard);
      expect(buttonBorderContrast).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("guarantees WCAG 2.1 AA contrast for semantic status tokens across light and dark modes", () => {
    const lightStatus = [
      { name: "success", bg: "#D1FAE5", text: "#047857", surface: "#FAF8F5" },
      { name: "warning", bg: "#FEF3C7", text: "#92400E", surface: "#FAF8F5" },
      { name: "danger", bg: "#FFE4E6", text: "#BE123C", surface: "#FAF8F5" },
      { name: "info", bg: "#E0F2FE", text: "#0369A1", surface: "#FAF8F5" },
    ];

    for (const s of lightStatus) {
      expect(calcContrast(s.bg, s.text)).toBeGreaterThanOrEqual(4.5);
      expect(calcContrast(s.surface, s.text)).toBeGreaterThanOrEqual(4.5);
    }

    const darkStatus = [
      { name: "success", bg: "#0A3324", text: "#6EE7B7", surface: "#1C1D22" },
      { name: "warning", bg: "#38290E", text: "#FDE68A", surface: "#1C1D22" },
      { name: "danger", bg: "#4C0519", text: "#FDA4AF", surface: "#1C1D22" },
      { name: "info", bg: "#0E2A3E", text: "#7DD3FC", surface: "#1C1D22" },
    ];

    for (const s of darkStatus) {
      expect(calcContrast(s.bg, s.text)).toBeGreaterThanOrEqual(4.5);
      expect(calcContrast(s.surface, s.text)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("guarantees WCAG 1.4.11 Non-text contrast (>= 3.0:1) for UI borders in dark mode", () => {
    const borderInkDark = "#7E8294";
    const darkCanvas = "#121316";
    const darkCard = "#1C1D22";
    const darkSubtle = "#24252C";

    expect(calcContrast(borderInkDark, darkCanvas)).toBeGreaterThanOrEqual(3.0);
    expect(calcContrast(borderInkDark, darkCard)).toBeGreaterThanOrEqual(3.0);
    expect(calcContrast(borderInkDark, darkSubtle)).toBeGreaterThanOrEqual(3.0);
  });

  it("guarantees WCAG 2.1 AA contrast for text hierarchy and placeholders in dark mode", () => {
    const darkCard = "#1C1D22";
    const darkSubtle = "#24252C";

    // Text primary (#F4F4F5)
    expect(calcContrast("#F4F4F5", darkCard)).toBeGreaterThanOrEqual(7.0);

    // Text secondary (#E4E4E7)
    expect(calcContrast("#E4E4E7", darkCard)).toBeGreaterThanOrEqual(7.0);

    // Text tertiary (#D4D4D8)
    expect(calcContrast("#D4D4D8", darkCard)).toBeGreaterThanOrEqual(7.0);

    // Text muted (#A1A1AA) on subtle surface
    expect(calcContrast("#A1A1AA", darkSubtle)).toBeGreaterThanOrEqual(4.5);

    // Placeholder text (#A1A1AA) on card
    expect(calcContrast("#A1A1AA", darkCard)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("theme engine & presets", () => {
  it("resolves theme configs by id, hex, or safe fallback", () => {
    expect(getThemeConfig("plum").id).toBe("plum");
    expect(getThemeConfig("amber").id).toBe("amber");
    expect(getThemeConfig("#047857").id).toBe("mint");
    expect(getThemeConfig("#10b981").id).toBe("mint");
    expect(getThemeConfig("#be123c").id).toBe("rose");
    expect(getThemeConfig("#f43f5e").id).toBe("rose");
    expect(getThemeConfig("unknown-theme").id).toBe("plum");
  });

  it("resolves effective display mode across light, dark, and system", () => {
    expect(resolveEffectiveMode("light")).toBe("light");
    expect(resolveEffectiveMode("dark")).toBe("dark");
    expect(resolveEffectiveMode("system")).toBe("light");
  });

  it("applies theme, dark class, and accessibility attributes to document root", () => {
    const classList = new Set<string>();
    const attributes = new Map<string, string>();
    const styleProperties = new Map<string, string>();

    const fakeRoot = {
      classList: {
        add: (cls: string) => classList.add(cls),
        remove: (cls: string) => classList.delete(cls),
        toggle: (cls: string, force?: boolean) => {
          if (force !== undefined) {
            if (force) classList.add(cls);
            else classList.delete(cls);
          } else {
            if (classList.has(cls)) classList.delete(cls);
            else classList.add(cls);
          }
        },
        contains: (cls: string) => classList.has(cls),
      },
      setAttribute: (name: string, val: string) => attributes.set(name, val),
      style: {
        setProperty: (name: string, val: string) => styleProperties.set(name, val),
      },
    };

    (globalThis as any).document = {
      documentElement: fakeRoot,
    };

    // Dark mode application
    applyThemeToDom({
      themeMode: "dark",
      appTheme: "mint",
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    });

    expect(attributes.get("data-theme")).toBe("dark");
    expect(attributes.get("data-app-theme")).toBe("mint");
    expect(classList.has("dark")).toBe(true);
    expect(classList.has("high-contrast")).toBe(true);
    expect(classList.has("reduce-motion")).toBe(true);
    expect(classList.has("large-text")).toBe(true);
    expect(styleProperties.get("--theme-primary")).toBe("#34D399");
    expect(styleProperties.get("--theme-subtle")).toBe("#0A3324");
    expect(styleProperties.get("--theme-accent-text")).toBe("#6EE7B7");

    // Light mode application
    applyThemeToDom({
      themeMode: "light",
      appTheme: "plum",
      highContrast: false,
      reducedMotion: false,
      largeText: false,
    });

    expect(attributes.get("data-theme")).toBe("light");
    expect(classList.has("dark")).toBe(false);
    expect(classList.has("high-contrast")).toBe(false);
    expect(classList.has("reduce-motion")).toBe(false);
    expect(classList.has("large-text")).toBe(false);
    expect(styleProperties.get("--theme-primary")).toBe("#4A154B");
    expect(styleProperties.get("--theme-subtle")).toBe("#EDE9FE");
    expect(styleProperties.get("--theme-accent-text")).toBe("#4A154B");
  });

  it("persists preferences in localStorage and syncs with UIStore", () => {
    const storage = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, val: string) => storage.set(key, val),
    };

    saveThemePreferences({
      themeMode: "dark",
      appTheme: "azure",
      highContrast: true,
      reducedMotion: true,
      largeText: false,
    });

    expect(storage.get("kaban_theme_mode")).toBe("dark");
    expect(storage.get("kaban_app_theme")).toBe("azure");
    expect(storage.get("kaban_high_contrast")).toBe("true");
    expect(storage.get("kaban_reduced_motion")).toBe("true");

    const loaded = getStoredThemePreferences();
    expect(loaded.themeMode).toBe("dark");
    expect(loaded.appTheme).toBe("azure");
    expect(loaded.highContrast).toBe(true);
    expect(loaded.reducedMotion).toBe(true);
    expect(loaded.largeText).toBe(false);

    // Test UIStore actions
    useUIStore.getState().setThemeMode("light");
    expect(useUIStore.getState().themeMode).toBe("light");
    expect(storage.get("kaban_theme_mode")).toBe("light");

    useUIStore.getState().setAppTheme("rose");
    expect(useUIStore.getState().appTheme).toBe("rose");
    expect(storage.get("kaban_app_theme")).toBe("rose");

    useUIStore.getState().setHighContrast(false);
    expect(useUIStore.getState().highContrast).toBe(false);

    useUIStore.getState().setReducedMotion(false);
    expect(useUIStore.getState().reducedMotion).toBe(false);

    useUIStore.getState().setLargeText(true);
    expect(useUIStore.getState().largeText).toBe(true);
  });
});
