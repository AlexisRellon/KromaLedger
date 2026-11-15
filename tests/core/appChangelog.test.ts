import { describe, expect, it } from "vitest";
import { appNotificationSchema } from "../../src/core/models";
import {
  APP_UPDATE_SEEN_KEY,
  APP_VERSION,
  LATEST_RELEASE,
  RELEASES,
  buildAppUpdateNotification,
  getAppUpdateNotificationId,
  hasUnseenAppUpdate,
  markAppUpdateSeen,
  parseChangelog,
} from "../../src/core/engine/appChangelog";

function makeMemoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("appChangelog", () => {
  it("derives RELEASES and LATEST_RELEASE directly from CHANGELOG.md", () => {
    expect(RELEASES.length).toBeGreaterThanOrEqual(3);
    expect(LATEST_RELEASE.version).toBe(APP_VERSION);
    expect(RELEASES.map((r) => r.version)).toContain("1.1.0");
    expect(RELEASES.map((r) => r.version)).toContain("1.0.0");
    expect(LATEST_RELEASE.highlights.length).toBeGreaterThan(0);
    expect(LATEST_RELEASE.sections.length).toBeGreaterThan(0);
  });

  it("parses custom markdown changelog sections and cta comments", () => {
    const parsed = parseChangelog(`# Changelog
## [2.0.0] - 2026-12-01
<!-- cta: Check Settings | SETTINGS -->

### Added
- **New Theme**: Added dark weave palette.

### Fixed
- Fixed \`reconcile\` edge case.
`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      version: "2.0.0",
      date: "2026-12-01",
      ctaLabel: "Check Settings",
      targetTab: "SETTINGS",
    });
    expect(parsed[0]?.highlights).toEqual([
      "New Theme: Added dark weave palette.",
      "Fixed reconcile edge case.",
    ]);
  });

  it("builds a valid SYSTEM changelog notification targeting the new feature tab", () => {
    const notif = buildAppUpdateNotification(LATEST_RELEASE, "2026-11-15");
    const parsed = appNotificationSchema.parse(notif);
    expect(parsed.id).toBe(getAppUpdateNotificationId(LATEST_RELEASE.version));
    expect(parsed.entityType).toBe("SYSTEM");
    expect(parsed.actionLink).toBe(LATEST_RELEASE.targetTab);
    expect(parsed.message).toContain(LATEST_RELEASE.highlights[0]);
  });

  it("detects unseen updates for returning users and skips while onboarding is pending", () => {
    const pendingStorage = makeMemoryStorage({ kaban_onboarding: "pending" });
    expect(hasUnseenAppUpdate(pendingStorage)).toBe(false);

    const upgradingStorage = makeMemoryStorage({
      kaban_onboarding: "done",
      [APP_UPDATE_SEEN_KEY]: "1.0.0",
    });
    expect(hasUnseenAppUpdate(upgradingStorage)).toBe(true);

    markAppUpdateSeen(upgradingStorage);
    expect(hasUnseenAppUpdate(upgradingStorage)).toBe(false);
  });
});
