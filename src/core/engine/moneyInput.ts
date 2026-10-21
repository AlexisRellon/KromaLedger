export function parseMinorInput(value: string): number {
  const clean = value.replace(/[₱$,\s]/g, "").trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(clean);
  if (!match) throw new Error("Enter an amount with at most two decimal places.");
  const cents = BigInt(match[1] ?? "0") * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Amount must be positive and within the safe money range.");
  return Number(cents);
}

export function sanitizeMoneyInput(value: string): string {
  let cleaned = value.replace(/[^0-9.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    const intPart = cleaned.slice(0, dotIndex);
    const rest = cleaned.slice(dotIndex + 1).replace(/\./g, "");
    cleaned = `${intPart}.${rest.slice(0, 2)}`;
  }
  return cleaned;
}

export function sanitizeQuantityInput(value: string): string {
  let cleaned = value.replace(/[^0-9.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    const intPart = cleaned.slice(0, dotIndex);
    const rest = cleaned.slice(dotIndex + 1).replace(/\./g, "");
    cleaned = `${intPart}.${rest.slice(0, 3)}`;
  }
  return cleaned;
}

export function blockInvalidNumberKeys(
  e: { key: string; ctrlKey?: boolean; metaKey?: boolean; currentTarget: { value: string }; preventDefault(): void },
  allowDecimal = true
): void {
  if (
    e.key === "Backspace" ||
    e.key === "Delete" ||
    e.key === "Tab" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Home" ||
    e.key === "End" ||
    e.key === "Enter" ||
    e.key === "Escape" ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }
  if (allowDecimal && e.key === ".") {
    if (e.currentTarget.value.includes(".")) {
      e.preventDefault();
    }
    return;
  }
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
}

