export function validateEmail(value: string): string | null {
  const trimmed: string = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null;
  }
  return "Enter an email like you@example.com";
}

export function validatePassword(value: string): string | null {
  if (value.length >= 16) {
    return null;
  }
  return "Use at least 16 characters.";
}

export function validateCardName(value: string): string | null {
  const collapsed: string = value.trim().replace(/\s+/g, " ");
  if (collapsed.length >= 2 && collapsed.length <= 40) {
    return null;
  }
  return "Give your card a name 2-40 characters, like Hotel stay.";
}

export function validateCapCents(capCents: number): string | null {
  if (Number.isInteger(capCents) && capCents >= 100 && capCents <= 2000000) {
    return null;
  }
  return "The limit must be between $1 and $20,000.";
}

export function validateEndDateString(endDate: string): string | null {
  const trimmed: string = endDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Pick a future end date within 2 years.";
  }
  const parts: string[] = trimmed.split("-");
  const year: number = Number(parts[0]);
  const month: number = Number(parts[1]);
  const day: number = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return "Pick a future end date within 2 years.";
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return "Pick a future end date within 2 years.";
  }
  const parsed: Date = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return "Pick a future end date within 2 years.";
  }
  const now: Date = new Date();
  const startOfToday: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate: Date = new Date(startOfToday);
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  if (parsed <= startOfToday || parsed > maxDate) {
    return "Pick a future end date within 2 years.";
  }
  return null;
}

export function validateAddMoneyCents(cents: number): string | null {
  if (Number.isInteger(cents) && cents >= 100 && cents <= 500000) {
    return null;
  }
  return "Enter $1 to $5,000.";
}

export function parseDollarsInputToCents(input: string): number | null {
  const stripped: string = input.replace(/[$,\s]/g, "");
  if (stripped === "") {
    return null;
  }
  const parsed: number = Number(stripped);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100);
}
