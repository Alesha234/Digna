/**
 * The sandbox checkout's merchants and cards, the same ones the database's sandbox_merchants() and sandbox_pay()
 * use. Everything is sample money: no real card, bank or payment network is ever contacted. The database decides
 * for signed-in people; the demo (no account) decides here with the same rules.
 */
export type CardKind = "credit" | "debit" | "prepaid";

export type Merchant = { id: string; name: string; kind: string; accepts: CardKind[]; rule: string; suggestCents: number };

export const MERCHANTS: Merchant[] = [
  { id: "nimbus_cloud", name: "Nimbus Cloud", kind: "Cloud hosting billing", accepts: ["credit"], rule: "Cloud billing accounts take credit cards only: debit and prepaid cards are declined.", suggestCents: 3200 },
  { id: "harborview_hotel", name: "Harborview Hotel", kind: "Hotel check-in hold", accepts: ["credit", "debit"], rule: "The hotel holds a deposit at check-in and turns away prepaid cards.", suggestCents: 15000 },
  { id: "roadready_rentals", name: "RoadReady Car Rental", kind: "Car rental deposit", accepts: ["credit"], rule: "The rental counter takes credit cards only for the security deposit.", suggestCents: 20000 },
  { id: "streambox", name: "StreamBox", kind: "Streaming subscription", accepts: ["credit", "debit", "prepaid"], rule: "Takes any card.", suggestCents: 1599 },
];

export type PayMethod = "payproxy" | "chime_debit" | "cash_app_card" | "prepaid_card" | "chime_credit_builder";

/** The cards you can try: your sample everyday cards, and your Digna capped cards (which run as credit cards). */
export const OUTSIDE_METHODS: { id: Exclude<PayMethod, "payproxy">; label: string; kind: CardKind }[] = [
  { id: "chime_debit", label: "Chime debit card (sample)", kind: "debit" },
  { id: "cash_app_card", label: "Cash App Card (sample)", kind: "debit" },
  { id: "prepaid_card", label: "Prepaid card (sample)", kind: "prepaid" },
  { id: "chime_credit_builder", label: "Chime Credit Builder (sample)", kind: "credit" },
];

export const kindOf = (method: PayMethod): CardKind => (method === "payproxy" ? "credit" : OUTSIDE_METHODS.find((m) => m.id === method)!.kind);

export const methodLabel = (method: PayMethod, cardName?: string) =>
  method === "payproxy" ? `Digna card${cardName ? `: ${cardName}` : ""}` : OUTSIDE_METHODS.find((m) => m.id === method)?.label ?? method;

export type SandboxPayment = {
  id: string;
  merchantId: string;
  merchant: string;
  amountCents: number;
  method: PayMethod;
  cardId: string | null;
  result: "approved" | "declined";
  reason: string | null;
  createdAt: string;
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

/** The demo's own copy of sandbox_pay's rules, for people trying Digna without an account. */
export function decide(
  merchant: Merchant,
  amountCents: number,
  method: PayMethod,
  card: { status: string; endDate: string; capCents: number; spentCents: number } | null,
  balanceCents: number,
): { result: "approved" | "declined"; reason: string | null; code: string | null } {
  if (method === "payproxy") {
    if (!card) return { result: "declined", reason: "Pick one of your Digna cards.", code: "other" };
    if (card.status === "frozen") return { result: "declined", reason: "This card is frozen. Unfreeze it to pay.", code: "frozen" };
    if (card.status === "closed") return { result: "declined", reason: "This card is closed.", code: "closed" };
    if (new Date(card.endDate).getTime() < Date.now() - 86_400_000) return { result: "declined", reason: "This card has passed its end date.", code: "expired" };
    if (card.spentCents + amountCents > card.capCents) return { result: "declined", reason: `This would go over the card's cap: $${dollars(card.capCents - card.spentCents)} left of $${dollars(card.capCents)}.`, code: "over_cap" };
    if (balanceCents < amountCents) return { result: "declined", reason: "Not enough sample money in your wallet. Add money first.", code: "insufficient_balance" };
  }
  const kind = kindOf(method);
  if (!merchant.accepts.includes(kind)) return { result: "declined", reason: `${merchant.name} doesn't accept ${kind} cards here. ${merchant.rule}`, code: "other" };
  return { result: "approved", reason: null, code: null };
}
