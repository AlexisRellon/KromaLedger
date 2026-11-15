import type { AppNotification } from "../models";

export type AppUpdateTargetTab = "HOME" | "WALLETS" | "PENDING" | "SETTINGS";

export interface AppReleaseNote {
  version: string;
  title: string;
  summary: string;
  highlights: string[];
  ctaLabel: string;
  targetTab: AppUpdateTargetTab;
}

export const APP_VERSION = "1.1.0";
export const APP_UPDATE_SEEN_KEY = "kaban_last_seen_version";
export const APP_UPDATE_NOTIF_PREFIX = "app-update-";

export const LATEST_RELEASE: AppReleaseNote = {
  version: APP_VERSION,
  title: "Automated Bank Interest & Catch-Up",
  summary: "Track daily and monthly interest from PH digital banks with receipt verification and missed-day reminders.",
  highlights: [
    "Built-in PH digital bank presets (MariBank, Maya, GoTyme, CIMB, OwnBank)",
    "Midnight Asia/Manila catch-up with Estimated to Verified receipt control",
    "Baulito missed-days catch-up reminder before automated interest posts",
  ],
  ctaLabel: "Explore Bank Interest",
  targetTab: "WALLETS",
};

export function getAppUpdateNotificationId(version: string = LATEST_RELEASE.version): string {
  return `${APP_UPDATE_NOTIF_PREFIX}${version}`;
}

export function buildAppUpdateNotification(
  release: AppReleaseNote = LATEST_RELEASE,
  createdAt: string = new Date().toISOString().slice(0, 10)
): AppNotification {
  return {
    id: getAppUpdateNotificationId(release.version),
    title: `What's new in v${release.version}: ${release.title}`,
    message: `${release.summary} • ${release.highlights.join(" • ")}`,
    type: "INFO",
    createdAt,
    read: false,
    entityType: "SYSTEM",
    actionLink: release.targetTab,
  };
}

export function isOnboardingPending(storage: Pick<Storage, "getItem">): boolean {
  const status =
    storage.getItem("kaban_onboarding") ??
    storage.getItem("kromaledger_onboarding");
  return status === "pending";
}

export function hasUnseenAppUpdate(
  storage: Pick<Storage, "getItem">,
  version: string = LATEST_RELEASE.version
): boolean {
  if (isOnboardingPending(storage)) return false;
  return storage.getItem(APP_UPDATE_SEEN_KEY) !== version;
}

export function markAppUpdateSeen(
  storage: Pick<Storage, "setItem">,
  version: string = LATEST_RELEASE.version
): void {
  storage.setItem(APP_UPDATE_SEEN_KEY, version);
}
