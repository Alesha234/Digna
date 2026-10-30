export function isValidDateString(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed: Date = new Date(value + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.toISOString().slice(0, 10) === value;
}

function getTodayUtcMidnightMs(): number {
  const now: Date = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function isFutureDateString(value: string): boolean {
  if (!isValidDateString(value)) {
    return false;
  }
  const targetMs: number = new Date(value + "T00:00:00Z").getTime();
  return targetMs > getTodayUtcMidnightMs();
}

export function isWithinTwoYears(value: string): boolean {
  if (!isValidDateString(value)) {
    return false;
  }
  const todayMs: number = getTodayUtcMidnightMs();
  const targetMs: number = new Date(value + "T00:00:00Z").getTime();
  const maxMs: number = todayMs + 730 * 24 * 60 * 60 * 1000;
  return targetMs > todayMs && targetMs <= maxMs;
}

export function validateCardEndDate(value: string): string | null {
  if (!isValidDateString(value)) {
    return "Pick an end date in the future, within 2 years.";
  }
  if (!isFutureDateString(value)) {
    return "Pick an end date in the future, within 2 years.";
  }
  if (!isWithinTwoYears(value)) {
    return "Pick an end date in the future, within 2 years.";
  }
  return null;
}
