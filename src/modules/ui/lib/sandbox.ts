import type { VirtualCard } from "@/modules/ui/types";
/**
 * The sandbox checkout's merchants and cards, the same ones the database's sandbox_merchants() and sandbox_pay()
 * use. Everything is sample money: no real card, bank or payment network is ever contacted. The database decides
 * for signed-in people; the demo (no account) decides here with the same rules.
 */
export type CardKind = "credit" | "debit" | "prepaid";

export type Merchant = { id: string; name: string; kind: string; accepts: CardKind[]; rule: string; suggestCents: number };

export const MERCHANTS: Merchant[] = [
  { id: "nimbus_cloud", name: "Nimbus Cloud", kind: "Cloud service bill", accepts: ["credit"], rule: "Credit cards only. Cloud services bill you after you use them, so they want a card that can't come up empty.", suggestCents: 3200 },
  { id: "harborview_hotel", name: "Harborview Hotel", kind: "Hotel check-in hold", accepts: ["credit", "debit"], rule: "Credit or debit, no prepaid. The hotel puts a hold on money at check-in for damage or extras, and a prepaid card can't guarantee it.", suggestCents: 15000 },
  { id: "roadready_rentals", name: "RoadReady Car Rental", kind: "Car rental deposit", accepts: ["credit"], rule: "Credit cards only. The rental counter holds a security deposit, and most rental companies only trust a credit card for it.", suggestCents: 20000 },
  { id: "streambox", name: "StreamBox", kind: "Streaming subscription", accepts: ["credit", "debit", "prepaid"], rule: "Any card works here.", suggestCents: 1599 },
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
    if (card.status === "frozen") return { result: "declined", reason: "This card is paused. Turn it back on to pay.", code: "frozen" };
    if (card.status === "closed") return { result: "declined", reason: "This card is closed, so it can't be used again. Make a new one.", code: "closed" };
    if (new Date(card.endDate).getTime() < Date.now() - 86_400_000) return { result: "declined", reason: "This card has passed the day you set for it to stop.", code: "expired" };
    if (card.spentCents + amountCents > card.capCents) return { result: "declined", reason: `This is more than the card's limit allows: $${dollars(card.capCents - card.spentCents)} left of $${dollars(card.capCents)}.`, code: "over_cap" };
    if (balanceCents < amountCents) return { result: "declined", reason: "There isn't enough money in your wallet for this. Add money first.", code: "insufficient_balance" };
  }
  const kind = kindOf(method);
  if (!merchant.accepts.includes(kind)) return { result: "declined", reason: `${merchant.name} doesn't take ${kind} cards. ${merchant.rule}`, code: "other" };
  return { result: "approved", reason: null, code: null };
}

/** The practice wallet: sample everyday cards anyone can type in at a sample checkout (the database's practice_wallet()).
 *  These are payment companies' published test numbers, so they can never charge a real account. */
export const PRACTICE_WALLET: { method: Exclude<PayMethod, "payproxy">; label: string; kind: CardKind; number: string; exp: string; cvc: string }[] = [
  { method: "chime_debit", label: "Chime debit card (sample)", kind: "debit", number: "4000056655665556", exp: "12/29", cvc: "123" },
  { method: "cash_app_card", label: "Cash App Card (sample)", kind: "debit", number: "5200828282828210", exp: "08/29", cvc: "456" },
  { method: "prepaid_card", label: "Prepaid card (sample)", kind: "prepaid", number: "5105105105105100", exp: "04/28", cvc: "789" },
  { method: "chime_credit_builder", label: "Chime Credit Builder (sample)", kind: "credit", number: "4242424242424242", exp: "10/30", cvc: "321" },
];

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** 4000 0012 3456 7890, as people read card numbers. */
export const formatCardNumber = (s: string) => digitsOnly(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

/** Visa or Mastercard, from the first digit, as checkout forms show it. */
export const brandOf = (s: string): "Visa" | "Mastercard" | null => {
  const d = digitsOnly(s);
  if (d.startsWith("4")) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  return null;
};

/** The card number's own check digit, so typos are caught before paying, like real checkouts do. */
export function luhnOk(s: string): boolean {
  const d = digitsOnly(s);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export type CheckoutForm = { name: string; number: string; exp: string; cvc: string; zip: string };
export type CheckoutOutcome = { result: "approved" | "declined"; reason: string | null; code: string | null; method: PayMethod; cardId: string | null; cardName: string; last4: string };

/** Plain-words problems with a typed card, before anything is sent; null when it looks complete. */
export function formProblem(f: CheckoutForm): string | null {
  if (f.name.trim().length < 2) return "Enter the name on the card.";
  if (!luhnOk(f.number)) return "That card number doesn't look right. Check it and try again.";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.exp.replace(/\s/g, ""))) return "Enter the expiry date as MM/YY.";
  if (!/^\d{3,4}$/.test(f.cvc)) return "Enter the 3-digit security code from the card.";
  if (!/^\d{5}$/.test(f.zip)) return "Enter a 5-digit ZIP code.";
  return null;
}

/** The sample account's copy of checkout_pay: which card was typed, and whether its expiry and code match. */
export function matchCard(f: CheckoutForm, cards: VirtualCard[]): { method: PayMethod; card: VirtualCard | null; label: string; detailsOk: boolean } | null {
  const number = digitsOnly(f.number);
  const exp = f.exp.replace(/\s/g, "");
  const own = cards.find((c) => c.cardNumber === number);
  if (own) return { method: "payproxy", card: own, label: own.name, detailsOk: own.exp === exp && own.cvc === f.cvc };
  const sample = PRACTICE_WALLET.find((c) => c.number === number);
  if (sample) return { method: sample.method, card: null, label: sample.label, detailsOk: sample.exp === exp && sample.cvc === f.cvc };
  return null;
}

export const DETAILS_MISMATCH = "The expiry date or security code doesn't match this card. Check them and try again.";
