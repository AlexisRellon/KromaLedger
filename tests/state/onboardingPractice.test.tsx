import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { OnboardingPractice } from "../../src/ui/components/OnboardingPractice";

vi.mock("react", async (importOriginal) => ({ ...await importOriginal<typeof import("react")>(), useState: vi.fn() }));

describe("onboarding practice", () => {
  beforeEach(() => vi.mocked(useState).mockReset());

  it.each(["EXPENSE", "TRANSFER", "SUBSCRIPTION", "INVOICE"] as const)("completes %s without accessing storage", (mode) => {
    const values = ["Coffee", "100", "2026-11-06", "sample-cash", "sample-bank", "MONTHLY", "RECEIVABLE", ""];
    for (const value of values) vi.mocked(useState).mockReturnValueOnce([value, vi.fn()] as never);
    const complete = vi.fn();
    const tree = OnboardingPractice({ mode, guidance: "Practice", onCancel: vi.fn(), onComplete: complete });
    const preventDefault = vi.fn();
    tree.props.onSubmit({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledOnce();
  });

  it("does not complete an invalid transfer", () => {
    const setError = vi.fn();
    const values = ["", "100", "2026-11-06", "sample-cash", "sample-cash", "MONTHLY", "RECEIVABLE"];
    for (const value of values) vi.mocked(useState).mockReturnValueOnce([value, vi.fn()] as never);
    vi.mocked(useState).mockReturnValueOnce(["", setError] as never);
    const complete = vi.fn();
    const tree = OnboardingPractice({ mode: "TRANSFER", guidance: "Practice", onCancel: vi.fn(), onComplete: complete });
    tree.props.onSubmit({ preventDefault: vi.fn() });
    expect(complete).not.toHaveBeenCalled();
    expect(setError).toHaveBeenLastCalledWith("Choose different source and destination wallets.");
  });
});
