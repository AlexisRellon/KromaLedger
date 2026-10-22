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
const currentMonth = format(new Date(), "yyyy-MM");
export const useUIStore = create<UIState>((set) => ({
  selectedMonth: currentMonth,
  activeNavTab: "HOME",
  quickAddOpen: false,
  quickAddMode: "EXPENSE",
  editProfileOpen: false,
  notificationsOpen: false,
  setMonth: (selectedMonth) => set({ selectedMonth }),
  setTab: (activeNavTab) => set({ activeNavTab }),
  openQuickAdd: (quickAddMode = "EXPENSE") => set({ quickAddOpen: true, quickAddMode }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  openEditProfile: () => set({ editProfileOpen: true }),
  closeEditProfile: () => set({ editProfileOpen: false }),
  openNotifications: () => set({ notificationsOpen: true }),
  closeNotifications: () => set({ notificationsOpen: false }),
}));
