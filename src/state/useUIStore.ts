import { create } from "zustand";
import { format } from "date-fns";

export type NavTab = "HOME" | "WALLETS" | "PENDING" | "SETTINGS";
export type QuickAddMode = "EXPENSE" | "TRANSFER" | "SUBSCRIPTION" | "INVOICE";

interface UIState {
  selectedMonth: string;
  activeNavTab: NavTab;
  quickAddOpen: boolean;
  quickAddMode: QuickAddMode;
  editProfileOpen: boolean;
  notificationsOpen: boolean;
  setMonth(value: string): void;
  setTab(value: NavTab): void;
  openQuickAdd(mode?: QuickAddMode): void;
  closeQuickAdd(): void;
  openEditProfile(): void;
  closeEditProfile(): void;
  openNotifications(): void;
  closeNotifications(): void;
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

export const useUIStore = create<UIState>((set) => ({
  selectedMonth: currentMonth,
  activeNavTab: getInitialTab(),
  quickAddOpen: false,
  quickAddMode: "EXPENSE",
  editProfileOpen: false,
  notificationsOpen: false,
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
  openQuickAdd: (quickAddMode = "EXPENSE") => set({ quickAddOpen: true, quickAddMode }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  openEditProfile: () => set({ editProfileOpen: true }),
  closeEditProfile: () => set({ editProfileOpen: false }),
  openNotifications: () => set({ notificationsOpen: true }),
  closeNotifications: () => set({ notificationsOpen: false }),
}));

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const tab = parseNavTab(window.location.hash) ?? "HOME";
    if (useUIStore.getState().activeNavTab !== tab) {
      useUIStore.setState({ activeNavTab: tab });
    }
  });
}
