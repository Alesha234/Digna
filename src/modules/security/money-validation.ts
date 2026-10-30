export function parseDollarsToCents(value: string | number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value < 0.01 || value > 5000) {
      return null;
    }
    const cents: number = Math.round(value * 100);
    if (!Number.isFinite(cents)) {
      return null;
    }
    if (Math.abs(value * 100 - cents) > 0.00001) {
      return null;
    }
    return cents;
  }
  if (typeof value !== "string") {
    return null;
  }
  let s: string = value.trim();
  if (s.length === 0) {
    return null;
  }
  if (s.charAt(0) === "$") {
    s = s.slice(1).trim();
  }
  if (s.length === 0) {
    return null;
  }
  s = s.replace(/[,\s]/g, "");
  if (s.length === 0) {
    return null;
  }
  const ok: boolean = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(s);
  if (!ok) {
    return null;
  }
  const dollars: number = Number(s);
  if (!Number.isFinite(dollars)) {
    return null;
  }
  if (dollars < 0.01 || dollars > 5000) {
    return null;
  }
  return Math.round(dollars * 100);
}

export function formatCentsToDollars(cents: number): string {
  if (!Number.isInteger(cents)) {
    return "$0.00";
  }
  if (cents < 0 || cents > 500000) {
    return "$0.00";
  }
  return "$" + (cents / 100).toFixed(2);
}

export function isValidAmountCents(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 500000;
}
