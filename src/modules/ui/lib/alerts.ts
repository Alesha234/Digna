import type { AppWarning, VirtualCard, WalletBalance } from "@/modules/ui/types";
import { formatCurrency, formatPercent } from "@/modules/ui/lib/format";

export function isNearCap(card: VirtualCard): boolean {
  if (card.status !== "active") return false;
  if (card.capCents <= 0) return false;
  return card.spentCents / card.capCents >= 0.8;
}

export function isExpiringSoon(card: VirtualCard, now?: Date): boolean {
  if (card.status !== "active") return false;
  const reference: Date = now ?? new Date();
  const end: Date = new Date(card.endDate);
  if (Number.isNaN(end.getTime())) return false;
  const diffMs: number = end.getTime() - reference.getTime();
  if (diffMs < 0) return false;
  const sevenDaysMs: number = 7 * 24 * 60 * 60 * 1000;
  return diffMs <= sevenDaysMs;
}

export function isLowBalance(balance: WalletBalance): boolean {
  return balance.availableCents < 2500;
}

export function buildWarnings(cards: VirtualCard[], balance: WalletBalance): AppWarning[] {
  const warnings: AppWarning[] = [];
  for (const card of cards) {
    if (isNearCap(card)) {
      warnings.push({
        id: `near-cap-${card.id}`,
        kind: "near-cap",
        title: `${card.name} near its cap`,
        message: `${card.name} has used ${formatPercent(card.spentCents, card.capCents)} of its ${formatCurrency(card.capCents, balance.currency)} cap. Consider raising the cap or adding money.`,
        cardId: card.id,
      });
    }
  }
  for (const card of cards) {
    if (isExpiringSoon(card)) {
      warnings.push({
        id: `expiring-${card.id}`,
        kind: "expiring",
        title: `${card.name} expires soon`,
        message: `${card.name} expires soon. You may want to create a replacement so spending is not interrupted.`,
        cardId: card.id,
      });
    }
  }
  if (isLowBalance(balance)) {
    warnings.push({
      id: "low-balance",
      kind: "low-balance",
      title: "Low wallet balance",
      message: `Your wallet balance is ${formatCurrency(balance.availableCents, balance.currency)}. Consider adding money to avoid declines.`,
    });
  }
  return warnings;
}
