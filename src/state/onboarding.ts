import { parseMinorInput } from "../core/engine/moneyInput";

export function parseStartingBalance(value: string): number {
  return /^0+(?:\.0{1,2})?$/.test(value.trim()) ? 0 : parseMinorInput(value);
}

export function restartOnboarding(storage: Pick<Storage, "setItem">) {
  storage.setItem("kaban_onboarding", "pending");
  storage.setItem("kromaledger_onboarding", "pending");
}

export function markFirstBoot(storage: Pick<Storage, "getItem" | "setItem">) {
  const isBooted =
    storage.getItem("kaban_booted") === "1" ||
    storage.getItem("kromaledger_booted") === "1";
  const onboardingStatus =
    storage.getItem("kaban_onboarding") ??
    storage.getItem("kromaledger_onboarding");

  if (!isBooted && !onboardingStatus) {
    storage.setItem("kaban_onboarding", "pending");
    storage.setItem("kromaledger_onboarding", "pending");
  }
  storage.setItem("kaban_booted", "1");
  storage.setItem("kromaledger_booted", "1");
}
