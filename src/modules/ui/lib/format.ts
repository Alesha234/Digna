export function formatCurrency(cents: number, currency?: string): string {
  const safeCents: number = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  const code: string = typeof currency === "string" && currency.length > 0 ? currency : "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(safeCents / 100);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(safeCents / 100);
  }
}

export function formatDate(iso: string): string {
  try {
    if (typeof iso !== "string" || iso.length === 0) return "—";
    const d: Date = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  } catch {
    return "—";
  }
}

export function formatPercent(used: number, cap: number): string {
  try {
    if (typeof used !== "number" || typeof cap !== "number") return "0%";
    if (!Number.isFinite(used) || !Number.isFinite(cap) || cap <= 0) return "0%";
    const pct: number = Math.round((used / cap) * 100);
    if (!Number.isFinite(pct)) return "0%";
    return Math.max(0, pct) + "%";
  } catch {
    return "0%";
  }
}

export function maskCardNumber(last4: string): string {
  try {
    const s: string = typeof last4 === "string" ? last4 : String(last4 ?? "");
    return "•••• " + s;
  } catch {
    return "•••• ";
  }
}

export function formatTxnResult(result: "approved" | "declined"): string {
  try {
    return result === "approved" ? "Approved" : "Declined";
  } catch {
    return "Declined";
  }
}

export function formatCapUsage(spentCents: number, capCents: number): string {
  try {
    return formatCurrency(spentCents) + " of " + formatCurrency(capCents);
  } catch {
    return "$0.00 of $0.00";
  }
}
