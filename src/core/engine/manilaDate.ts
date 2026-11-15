const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const MANILA_DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getManilaParts(now: Date) {
  const parts = new Map<string, string>();
  for (const part of MANILA_DATE_TIME_FORMAT.formatToParts(now)) {
    if (part.type !== "literal") parts.set(part.type, part.value);
  }
  return {
    year: parts.get("year") ?? "1970",
    month: parts.get("month") ?? "01",
    day: parts.get("day") ?? "01",
    hour: Number(parts.get("hour") ?? "0") % 24,
    minute: Number(parts.get("minute") ?? "0"),
    second: Number(parts.get("second") ?? "0"),
  };
}

/**
 * Parses an ISO calendar date (`YYYY-MM-DD`) into a UTC midnight `Date` using integer components.
 */
export function parseUtcDate(dateOnly: string): Date {
  const match = DATE_ONLY_REGEX.exec(dateOnly);
  if (!match) {
    throw new RangeError(`Invalid calendar date: ${dateOnly}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${dateOnly}`);
  }
  return date;
}

/**
 * Formats a UTC `Date` as `YYYY-MM-DD`.
 */
export function formatUtcDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current calendar date (`YYYY-MM-DD`) in `Asia/Manila`.
 */
export function getTodayManila(now: Date = new Date()): string {
  const { year, month, day } = getManilaParts(now);
  return `${year}-${month}-${day}`;
}

/**
 * Adds a signed number of days to an ISO calendar date (`YYYY-MM-DD`).
 */
export function addDaysManila(dateOnly: string, days: number): string {
  const date = parseUtcDate(dateOnly);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

/**
 * Returns whole calendar days from `fromDate` to `toDate`.
 */
export function daysBetweenManila(fromDate: string, toDate: string): number {
  const from = parseUtcDate(fromDate);
  const to = parseUtcDate(toDate);
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Returns milliseconds remaining until the next `00:00:00 Asia/Manila`.
 */
export function msUntilNextManilaMidnight(now: Date = new Date()): number {
  const { hour, minute, second } = getManilaParts(now);
  const elapsedTodayMs = ((hour * 60 + minute) * 60 + second) * 1000 + now.getUTCMilliseconds();
  return DAY_MS - elapsedTodayMs;
}

/**
 * Extracts `YYYY-MM` from an ISO calendar date (`YYYY-MM-DD`).
 */
export function getManilaMonthKey(dateOnly: string): string {
  parseUtcDate(dateOnly);
  return dateOnly.slice(0, 7);
}

/**
 * Returns the number of calendar days in the given 1-indexed month.
 */
export function daysInManilaMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
