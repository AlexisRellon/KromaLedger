const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnlyUtc(dateOnly: string): Date {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateOnly) {
    throw new RangeError(`Invalid calendar date: ${dateOnly}`);
  }
  return date;
}

/**
 * Returns the current calendar date (`YYYY-MM-DD`) in `Asia/Manila` (UTC+8).
 */
export function getTodayManila(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + MANILA_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Adds a signed number of days to an ISO calendar date (`YYYY-MM-DD`).
 */
export function addDaysManila(dateOnly: string, days: number): string {
  const date = parseDateOnlyUtc(dateOnly);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Returns whole calendar days from `fromDate` to `toDate`.
 */
export function daysBetweenManila(fromDate: string, toDate: string): number {
  const from = parseDateOnlyUtc(fromDate);
  const to = parseDateOnlyUtc(toDate);
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Returns milliseconds remaining until the next `00:00:00 Asia/Manila` (UTC+8).
 */
export function msUntilNextManilaMidnight(now: Date = new Date()): number {
  const manilaMs = now.getTime() + MANILA_OFFSET_MS;
  const elapsedTodayMs = ((manilaMs % DAY_MS) + DAY_MS) % DAY_MS;
  return DAY_MS - elapsedTodayMs;
}

/**
 * Extracts `YYYY-MM` from an ISO calendar date (`YYYY-MM-DD`).
 */
export function getManilaMonthKey(dateOnly: string): string {
  parseDateOnlyUtc(dateOnly);
  return dateOnly.slice(0, 7);
}

/**
 * Returns the number of calendar days in the given 1-indexed month.
 */
export function daysInManilaMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
