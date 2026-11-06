import { create } from "zustand";
import { format } from "date-fns";
import {
  type ThemeMode,
  type AppThemeId,
  applyThemeToDom,
  getStoredThemePreferences,
  saveThemePreferences,
} from "./theme";

export type { ThemeMode, AppThemeId } from "./theme";
export type NavTab = "HOME" | "WALLETS" | "PENDING" | "SETTINGS";
export type QuickAddMode = "EXPENSE" | "INCOME" | "TRANSFER" | "CASH_IN" | "SUBSCRIPTION" | "INVOICE" | "LOAN" | "INSTALLMENT";

export interface QuickAddPrefill {
  amountPhp?: number;
  toWalletId?: string;
}

interface UIState {
  selectedMonth: string;
  activeNavTab: NavTab;
  quickAddOpen: boolean;
  quickAddMode: QuickAddMode;
  quickAddPrefill?: QuickAddPrefill;
  editProfileOpen: boolean;
  notificationsOpen: boolean;
  themeMode: ThemeMode;
  appTheme: AppThemeId;
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  setMonth(value: string): void;
  setTab(value: NavTab): void;
  openQuickAdd(mode?: QuickAddMode, prefill?: QuickAddPrefill): void;
  closeQuickAdd(): void;
  openEditProfile(): void;
  closeEditProfile(): void;
  openNotifications(): void;
  closeNotifications(): void;
  setThemeMode(mode: ThemeMode): void;
  setAppTheme(theme: AppThemeId): void;
  setHighContrast(enabled: boolean): void;
  setReducedMotion(enabled: boolean): void;
  setLargeText(enabled: boolean): void;
}

function parseNavTab(value: string | null | undefined): NavTab | null {
  if (!value) return null;
  const upper = value.replace("#", "").toUpperCase();
  if (upper === "HOME" || upper === "WALLETS" || upper === "PENDING" || upper === "SETTINGS") {
    return upper as NavTab;
  }
  return null;
}

function getInitialTab(): NavTab {
  if (typeof window !== "undefined") {
    const fromHash = parseNavTab(window.location.hash);
    if (fromHash) return fromHash;
    try {
      const fromStorage = parseNavTab(localStorage.getItem("kromaledger_active_tab"));
      if (fromStorage) return fromStorage;
    } catch {}
  }
  return "HOME";
}

const currentMonth = format(new Date(), "yyyy-MM");
const initialThemePrefs = getStoredThemePreferences();

if (typeof window !== "undefined") {
  applyThemeToDom(initialThemePrefs);
}

export const useUIStore = create<UIState>((set) => ({
  selectedMonth: currentMonth,
  activeNavTab: getInitialTab(),
  quickAddOpen: false,
  quickAddMode: "EXPENSE",
  quickAddPrefill: undefined,
  editProfileOpen: false,
  notificationsOpen: false,
  themeMode: initialThemePrefs.themeMode,
  appTheme: initialThemePrefs.appTheme,
  highContrast: initialThemePrefs.highContrast,
  reducedMotion: initialThemePrefs.reducedMotion,
  largeText: initialThemePrefs.largeText,
  setMonth: (selectedMonth) => set({ selectedMonth }),
  setTab: (activeNavTab) => {
    if (typeof window !== "undefined") {
      try {
        const hash = activeNavTab === "HOME" ? "" : activeNavTab.toLowerCase();
        if (window.location.hash.replace("#", "") !== hash) {
          if (hash) {
            window.location.hash = hash;
          } else {
            history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        }
        localStorage.setItem("kromaledger_active_tab", activeNavTab);
      } catch {}
    }
    set({ activeNavTab });
  },
  openQuickAdd: (quickAddMode = "EXPENSE", quickAddPrefill) => set({ quickAddOpen: true, quickAddMode, quickAddPrefill }),
  closeQuickAdd: () => set({ quickAddOpen: false, quickAddPrefill: undefined }),
  openEditProfile: () => set({ editProfileOpen: true }),
  closeEditProfile: () => set({ editProfileOpen: false }),
  openNotifications: () => set({ notificationsOpen: true }),
  closeNotifications: () => set({ notificationsOpen: false }),
  setThemeMode: (themeMode) => {
    saveThemePreferences({ themeMode });
    set((state) => {
      const next = { ...state, themeMode };
      applyThemeToDom(next);
      return { themeMode };
    });
  },
  setAppTheme: (appTheme) => {
    saveThemePreferences({ appTheme });
    set((state) => {
      const next = { ...state, appTheme };
      applyThemeToDom(next);
      return { appTheme };
    });
  },
  setHighContrast: (highContrast) => {
    saveThemePreferences({ highContrast });
    set((state) => {
      const next = { ...state, highContrast };
      applyThemeToDom(next);
      return { highContrast };
    });
  },
  setReducedMotion: (reducedMotion) => {
    saveThemePreferences({ reducedMotion });
    set((state) => {
      const next = { ...state, reducedMotion };
      applyThemeToDom(next);
      return { reducedMotion };
    });
  },
  setLargeText: (largeText) => {
    saveThemePreferences({ largeText });
    set((state) => {
      const next = { ...state, largeText };
      applyThemeToDom(next);
      return { largeText };
    });
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const tab = parseNavTab(window.location.hash) ?? "HOME";
    if (useUIStore.getState().activeNavTab !== tab) {
      useUIStore.setState({ activeNavTab: tab });
    }
  });

  if (window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", () => {
      const s = useUIStore.getState();
      if (s.themeMode === "system") {
        applyThemeToDom(s);
      }
    });
  }
}
