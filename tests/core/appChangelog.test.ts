import { describe, expect, it } from "vitest";
import { appNotificationSchema } from "../../src/core/models";
import {
  APP_UPDATE_SEEN_KEY,
  LATEST_RELEASE,
  buildAppUpdateNotification,
  getAppUpdateNotificationId,
  hasUnseenAppUpdate,
  markAppUpdateSeen,
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
  it("builds a valid SYSTEM changelog notification targeting the new feature tab", () => {
    const notif = buildAppUpdateNotification(LATEST_RELEASE, "2026-11-15");
    const parsed = appNotificationSchema.parse(notif);
    expect(parsed.id).toBe(getAppUpdateNotificationId(LATEST_RELEASE.version));
    expect(parsed.entityType).toBe("SYSTEM");
    expect(parsed.actionLink).toBe("WALLETS");
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
