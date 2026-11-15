import changelogRaw from "../../../CHANGELOG.md?raw";
import type { AppNotification } from "../models";

export type AppUpdateTargetTab = "HOME" | "WALLETS" | "PENDING" | "SETTINGS";

export interface AppReleaseSection {
  heading: string;
  items: string[];
}

export interface AppReleaseNote {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  sections: AppReleaseSection[];
  ctaLabel: string;
  targetTab: AppUpdateTargetTab;
}

export const APP_UPDATE_SEEN_KEY = "kaban_last_seen_version";
export const APP_UPDATE_NOTIF_PREFIX = "app-update-";

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function isValidTargetTab(value: string): value is AppUpdateTargetTab {
  return value === "HOME" || value === "WALLETS" || value === "PENDING" || value === "SETTINGS";
}

export function parseChangelog(markdown: string): AppReleaseNote[] {
  const lines = markdown.split(/\r?\n/);
  const releases: AppReleaseNote[] = [];
  let current: AppReleaseNote | null = null;
  let currentSection: AppReleaseSection | null = null;

  const finalizeCurrent = () => {
    if (!current) return;
    const allItems = current.sections.flatMap((s) => s.items);
    current.highlights = allItems;
    if (!current.summary) {
      current.summary = allItems[0] ?? `Release v${current.version}`;
    }
    if (!current.title) {
      const headings = current.sections.map((s) => s.heading);
      current.title = headings.length > 0 ? `${headings.join(" & ")} Updates` : `Release v${current.version}`;
    }
    releases.push(current);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const versionMatch = /^##\s+\[([^\]]+)\](?:\s*-\s*(\S+))?/.exec(line);
    if (versionMatch) {
      finalizeCurrent();
      const version = versionMatch[1]!.trim();
      const date = versionMatch[2]?.trim() ?? "";
      current = {
        version,
        date,
        title: "",
        summary: "",
        highlights: [],
        sections: [],
        ctaLabel: "Open Wallets",
        targetTab: "WALLETS",
      };
      currentSection = null;
      continue;
    }

    if (!current) continue;

    const ctaMatch = /^<!--\s*cta:\s*([^|]+)\|\s*([A-Z]+)\s*-->$/.exec(line);
    if (ctaMatch) {
      const label = ctaMatch[1]!.trim();
      const tab = ctaMatch[2]!.trim();
      if (label) current.ctaLabel = label;
      if (isValidTargetTab(tab)) current.targetTab = tab;
      continue;
    }

    const sectionMatch = /^###\s+(.+)$/.exec(line);
    if (sectionMatch) {
      currentSection = { heading: sectionMatch[1]!.trim(), items: [] };
      current.sections.push(currentSection);
      continue;
    }

    const bulletMatch = /^-\s+(.+)$/.exec(line);
    if (bulletMatch) {
      const cleanItem = stripMarkdownInline(bulletMatch[1]!);
      if (!currentSection) {
        currentSection = { heading: "Changes", items: [] };
        current.sections.push(currentSection);
      }
      currentSection.items.push(cleanItem);
    }
  }

  finalizeCurrent();
  return releases;
}

export const RELEASES: AppReleaseNote[] = parseChangelog(changelogRaw);

export const LATEST_RELEASE: AppReleaseNote = RELEASES[0] ?? {
  version: "1.0.0",
  date: "",
  title: "Kaban Release",
  summary: "Local-first personal financial vault.",
  highlights: [],
  sections: [],
  ctaLabel: "Open Wallets",
  targetTab: "WALLETS",
};

export const APP_VERSION = LATEST_RELEASE.version;

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
    message: release.highlights.join(" • ") || release.summary,
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
