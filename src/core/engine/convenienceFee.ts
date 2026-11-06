import { parseMinorInput } from "./moneyInput";

export function convenienceFeeMinor(principalMinor: number, mode: "FIXED" | "PERCENT", value: string): number {
  if (!Number.isSafeInteger(principalMinor) || principalMinor < 0) throw new RangeError("Invalid cash-in amount");
  const units = value.trim() === "" || /^0(?:\.0{1,2})?$/.test(value.trim()) ? 0 : parseMinorInput(value);
  // Percentage input uses two decimals (1.25% = 125 basis points).
  const fee = mode === "FIXED" ? BigInt(units) : (BigInt(principalMinor) * BigInt(units) + 5000n) / 10000n;
  if (fee > BigInt(Number.MAX_SAFE_INTEGER) || BigInt(principalMinor) + fee > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Cash-in amount and fee are too large");
  }
  return Number(fee);
}
