import type { NavTab } from "../../../state/useUIStore";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { WalletsSkeleton } from "./WalletsSkeleton";
import { PendingSkeleton } from "./PendingSkeleton";
import { SettingsSkeleton } from "./SettingsSkeleton";

export function ScreenSkeleton({
  tab,
}: {
  tab?: NavTab | "HOME" | "WALLETS" | "PENDING" | "SETTINGS" | "dashboard" | "wallets" | "pending" | "settings";
}) {
  switch (tab?.toUpperCase()) {
    case "WALLETS":
      return <WalletsSkeleton />;
    case "PENDING":
      return <PendingSkeleton />;
    case "SETTINGS":
      return <SettingsSkeleton />;
    case "HOME":
    case "DASHBOARD":
    default:
      return <DashboardSkeleton />;
  }
}
