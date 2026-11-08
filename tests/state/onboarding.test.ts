import { describe, expect, it } from "vitest";
import { markFirstBoot, parseStartingBalance, restartOnboarding } from "../../src/state/onboarding";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = { ...initial };
  return {
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => { values[key] = value; },
  };
}

describe("first boot onboarding", () => {
  it("starts a tour for a new installation and preserves it across reloads", () => {
    const storage = memoryStorage();
    markFirstBoot(storage);
    markFirstBoot(storage);
    expect(storage.getItem("kaban_onboarding")).toBe("pending");
    expect(storage.getItem("kromaledger_onboarding")).toBe("pending");
    storage.setItem("kaban_onboarding", "done");
    storage.setItem("kromaledger_onboarding", "done");
    markFirstBoot(storage);
    expect(storage.getItem("kaban_onboarding")).toBe("done");
    expect(storage.getItem("kromaledger_onboarding")).toBe("done");
  });

  it("does not introduce a tour to an existing installation", () => {
    const storage = memoryStorage({ kaban_booted: "1" });
    markFirstBoot(storage);
    expect(storage.getItem("kaban_onboarding")).toBeNull();
    expect(storage.getItem("kromaledger_onboarding")).toBeNull();
  });

  it("preserves backward compatibility for existing kromaledger_booted installations", () => {
    const storage = memoryStorage({ kromaledger_booted: "1" });
    markFirstBoot(storage);
    expect(storage.getItem("kaban_onboarding")).toBeNull();
    expect(storage.getItem("kromaledger_onboarding")).toBeNull();
  });

  it("marks onboarding pending again after a reset and keeps it pending across boot", () => {
    const storage = memoryStorage({ kaban_booted: "1", kaban_onboarding: "done" });
    restartOnboarding(storage);
    markFirstBoot(storage);
    expect(storage.getItem("kaban_onboarding")).toBe("pending");
    expect(storage.getItem("kromaledger_onboarding")).toBe("pending");
  });
});

describe("starting balance", () => {
  it("accepts zero and preserves cents, while rejecting invalid amounts", () => {
    expect(parseStartingBalance("0.00")).toBe(0);
    expect(parseStartingBalance("1,234.56")).toBe(123456);
    expect(() => parseStartingBalance("-1")).toThrow();
    expect(() => parseStartingBalance("1.234")).toThrow();
  });
});
