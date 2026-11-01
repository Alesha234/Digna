import type { PayProxyUser, WalletBalance, VirtualCard, CardTransaction } from "@/modules/ui/types";

export const demoUser: PayProxyUser = {
  id: "demo-user-1",
  email: "demo@digna.dev",
  displayName: "Demo User",
};

export const demoBalance: WalletBalance = {
  availableCents: 12500,
  currency: "USD",
  updatedAt: "2026-10-30T00:00:00.000Z",
};

export const demoCards: VirtualCard[] = [
  {
    id: "demo-card-google-cloud",
    userId: "demo-user-1",
    name: "Cloud bill",
    last4: "4242",
    cardNumber: "4000001234574242",
    exp: "10/27",
    cvc: "318",
    status: "active",
    capCents: 5000,
    spentCents: 3200,
    endDate: "2027-10-30T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "demo-card-hotel-trip",
    userId: "demo-user-1",
    name: "Hotel trip",
    last4: "1881",
    cardNumber: "4000009876551881",
    exp: "01/27",
    cvc: "552",
    status: "frozen",
    capCents: 30000,
    spentCents: 5000,
    endDate: "2027-01-15T00:00:00.000Z",
    createdAt: "2026-09-10T00:00:00.000Z",
  },
  {
    id: "demo-card-netflix",
    userId: "demo-user-1",
    name: "Streaming",
    last4: "7769",
    cardNumber: "4000005550197769",
    exp: "06/27",
    cvc: "904",
    status: "active",
    capCents: 2000,
    spentCents: 1900,
    endDate: "2027-06-01T00:00:00.000Z",
    createdAt: "2026-08-20T00:00:00.000Z",
  },
];

export const demoTransactions: CardTransaction[] = [
  {
    id: "demo-txn-1",
    cardId: "demo-card-google-cloud",
    storeName: "Nimbus Cloud",
    amountCents: 1200,
    occurredAt: "2026-10-28T14:00:00.000Z",
    result: "approved",
  },
  {
    id: "demo-txn-2",
    cardId: "demo-card-google-cloud",
    storeName: "Nimbus Cloud",
    amountCents: 2000,
    occurredAt: "2026-10-27T10:30:00.000Z",
    result: "approved",
  },
  {
    id: "demo-txn-3",
    cardId: "demo-card-google-cloud",
    storeName: "Nimbus Cloud",
    amountCents: 2500,
    occurredAt: "2026-10-26T09:00:00.000Z",
    result: "declined",
    reason: "Over the card's limit",
  },
  {
    id: "demo-txn-4",
    cardId: "demo-card-hotel-trip",
    storeName: "Harborview Hotel",
    amountCents: 5000,
    occurredAt: "2026-10-25T18:00:00.000Z",
    result: "approved",
  },
  {
    id: "demo-txn-5",
    cardId: "demo-card-hotel-trip",
    storeName: "SkyHop Airlines",
    amountCents: 8000,
    occurredAt: "2026-10-24T12:00:00.000Z",
    result: "declined",
    reason: "Card is frozen",
  },
  {
    id: "demo-txn-6",
    cardId: "demo-card-netflix",
    storeName: "StreamBox",
    amountCents: 1599,
    occurredAt: "2026-10-23T08:00:00.000Z",
    result: "approved",
  },
  {
    id: "demo-txn-7",
    cardId: "demo-card-netflix",
    storeName: "StreamBox",
    amountCents: 301,
    occurredAt: "2026-10-22T08:00:00.000Z",
    result: "approved",
  },
  {
    id: "demo-txn-8",
    cardId: "demo-card-netflix",
    storeName: "StreamBox",
    amountCents: 500,
    occurredAt: "2026-10-21T08:00:00.000Z",
    result: "declined",
    reason: "Over the card's limit",
  },
];

export type PracticeBill = {
  id: string;
  /** Uses only "practice bill" or "practice invoice", never other words. */
  title: string;
  storeName: string;
  amountCents: number;
  dueDate: string;
  confidence: "high" | "medium" | "low";
  /** The full bill text: paste it into the bill box and the app reads it back exactly. */
  billText: string;
};

export const practiceBills: PracticeBill[] = [
  {
    id: "practice-bill-nimbus-cloud",
    title: "Nimbus Cloud practice bill",
    storeName: "Nimbus Cloud",
    amountCents: 3200,
    dueDate: "2026-11-15",
    confidence: "high",
    billText:
      "Nimbus Cloud practice bill\nAccount: demo@digna.dev\nBilling period: Oct 1 - Oct 31, 2026\nAmount due: $32.00\nDue date: 2026-11-15\nPractice money only: no real money moves.",
  },
  {
    id: "practice-invoice-harbor-hotel",
    title: "Harbor Hotel practice invoice",
    storeName: "Harbor Hotel",
    amountCents: 14820,
    dueDate: "2026-11-20",
    confidence: "high",
    billText:
      "Harbor Hotel practice invoice\nInvoice #HH-2041\nGuest stay: Nov 2 - Nov 4, 2026\nAmount due: $148.20\nDue date: 2026-11-20\nPractice money only: no real money moves.",
  },
  {
    id: "practice-bill-city-phone",
    title: "City Phone practice bill",
    storeName: "City Phone",
    amountCents: 4500,
    dueDate: "2026-12-01",
    confidence: "high",
    billText:
      "City Phone practice bill\nAccount: 555-0142\nPlan: Monthly 5G, Nov 2026\nAmount due: $45.00\nDue date: 2026-12-01\nPractice money only: no real money moves.",
  },
];

/** Find the practice bill pasted text (or a chosen example) is from, if any. */
export function matchPracticeBill(haystack: string): PracticeBill | null {
  const hay: string = haystack.toLowerCase();
  if (hay.trim().length === 0) return null;
  for (const b of practiceBills) {
    const full: string = b.billText.toLowerCase();
    if (hay.includes(full) || (hay.length >= 20 && full.includes(hay))) return b;
  }
  for (const b of practiceBills) {
    if (hay.includes(b.storeName.toLowerCase())) return b;
  }
  for (const b of practiceBills) {
    const dollars: string = (b.amountCents / 100).toFixed(2);
    if (hay.includes("$" + dollars) || hay.includes(dollars)) return b;
  }
  return null;
}

export const assistantStarters: string[] = [
  "Why was my Netflix payment declined?",
  "Why was my cloud bill payment declined?",
  "How do I unfreeze my hotel trip card?",
];

export const testModeMessage: string = "Practice money for now: nothing real is charged.";
