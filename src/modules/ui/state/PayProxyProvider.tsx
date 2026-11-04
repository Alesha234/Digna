import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PayProxyUser, WalletBalance, VirtualCard, CardTransaction, BillScanResult, AppScreen, SavedBill } from "@/modules/ui/types";
import { demoUser, demoBalance, demoCards, demoTransactions } from "@/modules/ui/data/demoData";
import { supabase, plainError } from "@/modules/ui/lib/supabase";
import { MERCHANTS, YOUR_BILL, DETAILS_MISMATCH, decide, matchCard, type CheckoutForm, type CheckoutOutcome, type PayMethod, type SandboxPayment } from "@/modules/ui/lib/sandbox";

/**
 * Digna's data: a real account in the app's own Supabase project ("live"), or the sample walk-through with no
 * account ("demo"). Both use sample money only. In live mode every change goes through the database's own functions
 * (add_money, create_virtual_card, set_card_status, sandbox_pay), which check who is asking; the screens then read
 * the result back, so what they show is what the database holds.
 */
export type Mode = "guest" | "demo" | "live";

/** What a payment try came to; code says which fix fits a decline (over_cap: raise the limit, insufficient_balance: add money). */
export type PayOutcome = { result: "approved" | "declined"; reason: string | null; code: string | null };

type PayProxyContextValue = {
  mode: Mode;
  ready: boolean;
  user: PayProxyUser | null;
  balance: WalletBalance;
  cards: VirtualCard[];
  transactions: CardTransaction[];
  payments: SandboxPayment[];
  /** The bills and invoices added on Pay a bill (Nov 2, 2026), newest first. */
  bills: SavedBill[];
  /** Keeps a bill Muse Spark read, with its file in the person's own private folder when signed in. */
  addBill(input: { business: string; amountCents: number; dueDate: string | null; fileName: string | null; fileKind: SavedBill["fileKind"]; file?: File | null }): Promise<SavedBill>;
  removeBill(id: string): Promise<void>;
  /** Marks a card made for a bill as that bill's card. */
  linkBillCard(billId: string, cardId: string): Promise<void>;
  /** Pays a bill with a typed card, through the same checkout and checks as every place; approved, the bill is paid. */
  payBill(billId: string, form: CheckoutForm): Promise<CheckoutOutcome>;
  /** A short-lived link to open a bill's own file, or null when it wasn't kept. */
  billFileUrl(bill: SavedBill): Promise<string | null>;
  screen: AppScreen;
  selectedCardId: string | null;
  lastScan: BillScanResult | null;
  /** Something that went wrong with the last change, in plain words, or null. */
  notice: string | null;
  clearNotice(): void;
  signIn(email: string, password: string): Promise<void>;
  /** Creates the account; "check-email" when the project asks people to confirm their email first. */
  signUp(email: string, password: string): Promise<"signed-in" | "check-email">;
  signInDemo(): void;
  signOut(): Promise<void>;
  setScreen(s: AppScreen): void;
  selectCard(id: string | null): void;
  addMoneyCents(cents: number, source?: "cash_app" | "chime" | "prepaid" | "other"): Promise<void>;
  createCard(input: { name: string; capCents: number; endDate: string }): Promise<VirtualCard>;
  freezeCard(id: string): Promise<void>;
  unfreezeCard(id: string): Promise<void>;
  closeCard(id: string): Promise<void>;
  /** Changes a card's limit: down to what it has spent at the least, and up only as far as the wallet covers. */
  setCardLimit(id: string, capCents: number): Promise<void>;
  pay(merchantId: string, amountCents: number, method: PayMethod, cardId?: string | null): Promise<PayOutcome>;
  /** Pays at a sample business's checkout with a typed card: one of your Digna Bill Cards or a practice wallet card. */
  checkout(merchantId: string, amountCents: number, form: CheckoutForm): Promise<CheckoutOutcome>;
  /** Emails a link to set a new password (Supabase sends it; it reaches people once the project has an email service). */
  requestPasswordReset(email: string): Promise<void>;
  /** Sets a new password for the person who opened that link (or who is signed in). */
  updatePassword(password: string): Promise<void>;
  /** Deletes the person's account and everything in it, then signs them out. */
  deleteAccount(): Promise<void>;
  /** Sends feedback to the owner, signed in or not. */
  sendFeedback(message: string, email?: string, page?: string): Promise<void>;
  setLastScan(s: BillScanResult | null): void;
};

const PayProxyContext = createContext<PayProxyContextValue | null>(null);

export function usePayProxy(): PayProxyContextValue {
  const ctx = useContext(PayProxyContext);
  if (!ctx) throw new Error("usePayProxy must be used within PayProxyProvider");
  return ctx;
}

const EMPTY_BALANCE: WalletBalance = { availableCents: 0, currency: "USD", updatedAt: new Date(0).toISOString() };

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function cardFrom(r: Row): VirtualCard {
  return {
    id: str(r.id),
    userId: str(r.user_id),
    name: str(r.name),
    last4: str(r.last4),
    capCents: num(r.spending_cap_cents),
    spentCents: num(r.spent_cents),
    status: str(r.status) as VirtualCard["status"],
    endDate: str(r.end_date),
    createdAt: str(r.created_at),
    cardNumber: r.card_number ? str(r.card_number) : undefined,
    exp: r.exp_month ? `${String(r.exp_month).padStart(2, "0")}/${String(r.exp_year).padStart(2, "0")}` : undefined,
    cvc: r.cvc ? str(r.cvc) : undefined,
  };
}

function txnFrom(r: Row): CardTransaction {
  return {
    id: str(r.id),
    cardId: str(r.card_id),
    storeName: str(r.merchant),
    amountCents: num(r.amount_cents),
    occurredAt: str(r.occurred_at),
    result: str(r.result) as CardTransaction["result"],
    reason: r.decline_reason ? str(r.decline_reason) : undefined,
  };
}

/** A practice card number like the database's: 16 digits starting 400000, with a correct check digit. */
function practiceCardNumber(): string {
  const body = "400000" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(body[14 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return body + String((10 - (sum % 10)) % 10);
}

function billFrom(r: Row): SavedBill {
  return {
    id: str(r.id),
    business: str(r.business),
    amountCents: num(r.amount_cents),
    dueDate: r.due_date ? str(r.due_date) : null,
    fileName: r.file_name ? str(r.file_name) : null,
    filePath: r.file_path ? str(r.file_path) : null,
    fileKind: (str(r.file_kind) || "photo") as SavedBill["fileKind"],
    status: str(r.status) === "paid" ? "paid" : "unpaid",
    cardId: r.card_id ? str(r.card_id) : null,
    paidAt: r.paid_at ? str(r.paid_at) : null,
    createdAt: str(r.created_at),
  };
}

function paymentFrom(r: Row): SandboxPayment {
  return {
    id: str(r.id),
    merchantId: str(r.merchant_id),
    merchant: str(r.merchant),
    amountCents: num(r.amount_cents),
    method: str(r.method) as PayMethod,
    cardId: r.card_id ? str(r.card_id) : null,
    result: str(r.result) as SandboxPayment["result"],
    reason: r.reason ? str(r.reason) : null,
    createdAt: str(r.created_at),
  };
}

export function PayProxyProvider(props: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("guest");
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PayProxyUser | null>(null);
  const [balance, setBalance] = useState<WalletBalance>(EMPTY_BALANCE);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [payments, setPayments] = useState<SandboxPayment[]>([]);
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<BillScanResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** Reads the signed-in person's wallet, cards and history back from the database. */
  const load = useCallback(async (): Promise<void> => {
    const sb = supabase();
    if (!sb) return;
    const [w, c, t, p] = await Promise.all([
      sb.from("wallets").select("balance_cents, currency, updated_at").maybeSingle(),
      sb.from("virtual_cards").select("*").order("created_at", { ascending: false }),
      sb.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(100),
      sb.from("sandbox_payments").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const failed = [w, c, t, p].find((x) => x.error);
    if (failed?.error) throw failed.error;
    const wallet = (w.data ?? {}) as Row;
    setBalance({ availableCents: num(wallet.balance_cents), currency: str(wallet.currency) || "USD", updatedAt: str(wallet.updated_at) });
    setCards(((c.data ?? []) as Row[]).map(cardFrom));
    setTransactions(((t.data ?? []) as Row[]).map(txnFrom));
    setPayments(((p.data ?? []) as Row[]).map(paymentFrom));
    // Bills (Nov 2, 2026): read on their own, so a database without that table yet still loads everything else.
    const b = await sb.from("practice_bills").select("*").order("created_at", { ascending: false }).limit(200);
    setBills(b.error ? [] : ((b.data ?? []) as Row[]).map(billFrom));
  }, []);

  /** A signed-in session: makes sure the account exists (a new one gets $250 of sample money), then loads it. */
  const enter = useCallback(
    async (session: { user: { id: string; email?: string | null } } | null): Promise<void> => {
      const sb = supabase();
      if (!sb || !session) return;
      const { error } = await sb.rpc("ensure_my_account");
      if (error) throw error;
      const email = session.user.email ?? "";
      setUser({ id: session.user.id, email, displayName: email.split("@")[0] || "You" });
      setMode("live");
      await load();
      // Signing in keeps the person where they were: on the welcome page they stay there, and from the sign-in screen
      // they go back to the welcome page (a page a guest tried to open is sent by the app itself, after this).
      setScreen((s) => (s === "auth" || s === "signup" ? "welcome" : s));
    },
    [load],
  );

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      setReady(true);
      return;
    }
    let alive = true;
    sb.auth
      .getSession()
      .then(({ data }) => (data.session ? enter(data.session) : undefined))
      .catch((e: unknown) => alive && setNotice(plainError(e)))
      .finally(() => alive && setReady(true));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setMode("guest");
        setUser(null);
      }
      if (event === "SIGNED_IN" && session) enter(session).catch((e: unknown) => setNotice(plainError(e)));
      // Opened from a "reset your password" email: ask for the new password first.
      if (event === "PASSWORD_RECOVERY") setScreen("new-password");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [enter]);

  const value = useMemo<PayProxyContextValue>(() => {
    const live = mode === "live";
    const sb = supabase();
    /** Runs one database function, then reads everything back; a refusal becomes a plain notice and is thrown. */
    /** Runs one of the database's functions; quiet when the screen shows the problem itself (no banner too). */
    async function call(fn: string, args: Record<string, unknown>, quiet = false): Promise<Row> {
      if (!sb) throw new Error("Digna's database isn't set up on this site yet.");
      const { data, error } = await sb.rpc(fn, args);
      if (error) {
        const msg = plainError(error);
        if (!quiet) setNotice(msg);
        throw new Error(msg);
      }
      await load();
      return (data ?? {}) as Row;
    }
    function demoStatus(id: string, status: VirtualCard["status"]): void {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
    const api: PayProxyContextValue = {
      mode,
      ready,
      user,
      balance,
      cards,
      transactions,
      payments,
      bills,
      async addBill(input) {
        const business = input.business.trim().slice(0, 80) || "A bill";
        const amountCents = Math.round(input.amountCents);
        if (!(amountCents > 0 && amountCents <= 500000)) throw new Error("A bill can be between $0.01 and $5,000 in practice money.");
        if (!live) {
          const bill: SavedBill = { id: `demo-bill-${Date.now()}`, business, amountCents, dueDate: input.dueDate, fileName: input.fileName, filePath: null, fileKind: input.fileKind, status: "unpaid", cardId: null, paidAt: null, createdAt: new Date().toISOString() };
          setBills((prev) => [bill, ...prev]);
          return bill;
        }
        if (!sb || !user) throw new Error("Sign in to keep your bills.");
        // The file itself goes to the person's own private folder; if that can't be done, the bill is still kept.
        let filePath: string | null = null;
        if (input.file) {
          const safe = (input.fileName ?? "bill").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
          const path = `${user.id}/bills/${Date.now()}-${safe}`;
          const up = await sb.storage.from("bill-photos").upload(path, input.file, { contentType: input.file.type || "application/octet-stream", upsert: false });
          if (!up.error) filePath = path;
        }
        const { data, error } = await sb
          .from("practice_bills")
          .insert({ user_id: user.id, business, amount_cents: amountCents, due_date: input.dueDate, file_name: input.fileName?.slice(0, 160) ?? null, file_kind: input.fileKind, file_path: filePath })
          .select("*")
          .single();
        if (error) throw new Error(/practice_bills/.test(error.message) ? "Saving bills isn't switched on yet: the site's database needs its newest update (0019)." : plainError(error));
        const bill = billFrom(data as Row);
        setBills((prev) => [bill, ...prev]);
        return bill;
      },
      async removeBill(id) {
        const bill = bills.find((b) => b.id === id);
        if (live && sb) {
          const { error } = await sb.from("practice_bills").delete().eq("id", id);
          if (error) throw new Error(plainError(error));
          if (bill?.filePath) await sb.storage.from("bill-photos").remove([bill.filePath]).catch(() => undefined);
        }
        setBills((prev) => prev.filter((b) => b.id !== id));
      },
      async linkBillCard(billId, cardId) {
        if (live) {
          await call("bill_use_card", { p_bill_id: billId, p_card_id: cardId }, true);
          return;
        }
        setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, cardId } : b)));
      },
      async payBill(billId, form) {
        const bill = bills.find((b) => b.id === billId);
        if (!bill) throw new Error("Pick one of your bills.");
        if (bill.status === "paid") throw new Error("This bill is already paid.");
        if (live) {
          const out = await call("pay_bill", { p_bill_id: billId, p_number: form.number, p_exp: form.exp, p_cvc: form.cvc, p_name: form.name, p_zip: form.zip }, true);
          return {
            result: str(out.result) as "approved" | "declined",
            reason: out.reason ? str(out.reason) : null,
            code: out.code ? str(out.code) : null,
            method: str(out.method) as PayMethod,
            cardId: out.card_id ? str(out.card_id) : null,
            cardName: str(out.card_name),
            last4: str(out.last4),
          };
        }
        // The sample account: the same rules, in memory, under the bill's own name.
        const match = matchCard(form, cards);
        if (!match) throw new Error("This card number isn't one of your Digna Bill Cards or a practice wallet card. Copy one from your wallet and try again.");
        const last4 = form.number.replace(/\D/g, "").slice(-4);
        const at = new Date().toISOString();
        if (!match.detailsOk) {
          setPayments((prev) => [{ id: `demo-pay-${Date.now()}`, merchantId: YOUR_BILL.id, merchant: bill.business, amountCents: bill.amountCents, method: match.method, cardId: match.card?.id ?? null, result: "declined", reason: DETAILS_MISMATCH, createdAt: at }, ...prev]);
          return { result: "declined", reason: DETAILS_MISMATCH, code: "card_details", method: match.method, cardId: match.card?.id ?? null, cardName: match.label, last4 };
        }
        const out = decide({ ...YOUR_BILL, name: bill.business }, bill.amountCents, match.method, match.card ?? null, balance.availableCents);
        if (match.method === "payproxy" && match.card) {
          const card = match.card;
          setTransactions((prev) => [{ id: `demo-txn-${Date.now()}`, cardId: card.id, storeName: bill.business, amountCents: bill.amountCents, occurredAt: at, result: out.result, reason: out.reason ?? undefined }, ...prev]);
          if (out.result === "approved") {
            setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, spentCents: c.spentCents + bill.amountCents } : c)));
            setBalance((b) => ({ ...b, availableCents: b.availableCents - bill.amountCents, updatedAt: at }));
          }
        }
        setPayments((prev) => [{ id: `demo-pay-${Date.now()}`, merchantId: YOUR_BILL.id, merchant: bill.business, amountCents: bill.amountCents, method: match.method, cardId: match.card?.id ?? null, result: out.result, reason: out.reason, createdAt: at }, ...prev]);
        if (out.result === "approved") setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, status: "paid", paidAt: at, cardId: match.card?.id ?? b.cardId } : b)));
        return { ...out, method: match.method, cardId: match.card?.id ?? null, cardName: match.label, last4 };
      },
      async billFileUrl(bill) {
        if (!live || !sb || !bill.filePath) return null;
        const { data } = await sb.storage.from("bill-photos").createSignedUrl(bill.filePath, 300);
        return data?.signedUrl ?? null;
      },
      screen,
      selectedCardId,
      lastScan,
      notice,
      clearNotice: () => setNotice(null),
      async signIn(email, password) {
        if (!sb) throw new Error("Accounts aren't set up on this site yet. Try the demo.");
        const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(plainError(error));
        await enter(data.session);
      },
      async signUp(email, password) {
        if (!sb) throw new Error("Accounts aren't set up on this site yet. Try the demo.");
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw new Error(plainError(error));
        if (!data.session) return "check-email";
        await enter(data.session);
        return "signed-in";
      },
      signInDemo() {
        setUser(demoUser);
        setBalance({ ...demoBalance });
        setCards([...demoCards]);
        setTransactions([...demoTransactions]);
        setPayments([]);
        setBills([]);
        setMode("demo");
        setScreen("dashboard");
      },
      async signOut() {
        if (live && sb) await sb.auth.signOut();
        setMode("guest");
        setUser(null);
        setBalance(EMPTY_BALANCE);
        setCards([]);
        setTransactions([]);
        setPayments([]);
        setBills([]);
        setScreen("welcome");
      },
      setScreen,
      selectCard: setSelectedCardId,
      async addMoneyCents(cents, source = "other") {
        if (live) {
          await call("add_money", { p_amount_cents: cents, p_source: source });
          return;
        }
        setBalance((b) => ({ ...b, availableCents: b.availableCents + cents, updatedAt: new Date().toISOString() }));
      },
      async createCard(input) {
        if (live) {
          const made = await call("create_virtual_card", { p_name: input.name, p_spending_cap_cents: input.capCents, p_end_date: input.endDate.slice(0, 10) });
          return cardFrom(made);
        }
        // The sample account's cards get practice details too (like the database's own), so they can be paid with.
        const number = practiceCardNumber();
        const end = new Date(input.endDate);
        const card: VirtualCard = {
          id: `demo-card-${Date.now()}`,
          userId: demoUser.id,
          name: input.name,
          last4: number.slice(-4),
          cardNumber: number,
          exp: `${String(end.getMonth() + 1).padStart(2, "0")}/${String(end.getFullYear() % 100).padStart(2, "0")}`,
          cvc: String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
          capCents: input.capCents,
          spentCents: 0,
          status: "active",
          endDate: input.endDate,
          createdAt: new Date().toISOString(),
        };
        setCards((prev) => [card, ...prev]);
        return card;
      },
      async freezeCard(id) {
        if (live) await call("set_card_status", { p_card_id: id, p_new_status: "frozen" });
        else demoStatus(id, "frozen");
      },
      async unfreezeCard(id) {
        if (live) await call("set_card_status", { p_card_id: id, p_new_status: "active" });
        else demoStatus(id, "active");
      },
      async closeCard(id) {
        if (live) await call("set_card_status", { p_card_id: id, p_new_status: "closed" });
        else demoStatus(id, "closed");
      },
      async setCardLimit(id, capCents) {
        if (live) {
          await call("set_card_limit", { p_card_id: id, p_cap_cents: capCents }, true);
          return;
        }
        const card = cards.find((c) => c.id === id);
        if (!card) throw new Error("Pick one of your cards.");
        if (card.status === "closed") throw new Error("This card is closed. Make a new one instead.");
        if (!Number.isFinite(capCents) || capCents > 1_000_000) throw new Error("A card's limit can be at most $10,000.");
        const usd = (c: number) => (c / 100).toFixed(2);
        if (capCents < Math.max(card.spentCents, 1)) throw new Error(`The limit can't be lower than what this card has already spent ($${usd(card.spentCents)}).`);
        if (capCents > card.capCents && capCents - card.spentCents > balance.availableCents) {
          throw new Error(`You have $${usd(balance.availableCents)} in your wallet, so this card's limit can go up to $${usd(Math.max(card.capCents, card.spentCents + balance.availableCents))}. Add money first to raise it more.`);
        }
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, capCents } : c)));
      },
      async pay(merchantId, amountCents, method, cardId = null) {
        if (live) {
          const out = await call("sandbox_pay", { p_merchant_id: merchantId, p_amount_cents: amountCents, p_method: method, p_card_id: method === "payproxy" ? cardId : null });
          return { result: str(out.result) as "approved" | "declined", reason: out.reason ? str(out.reason) : null, code: out.code ? str(out.code) : null };
        }
        const merchant = MERCHANTS.find((m) => m.id === merchantId);
        if (!merchant) throw new Error("Pick one of the places to pay.");
        const card = method === "payproxy" ? (cards.find((c) => c.id === cardId) ?? null) : null;
        const out = decide(merchant, amountCents, method, card, balance.availableCents);
        const at = new Date().toISOString();
        if (method === "payproxy" && card) {
          setTransactions((prev) => [{ id: `demo-txn-${Date.now()}`, cardId: card.id, storeName: merchant.name, amountCents, occurredAt: at, result: out.result, reason: out.reason ?? undefined }, ...prev]);
          if (out.result === "approved") {
            setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, spentCents: c.spentCents + amountCents } : c)));
            setBalance((b) => ({ ...b, availableCents: b.availableCents - amountCents, updatedAt: at }));
          }
        }
        setPayments((prev) => [{ id: `demo-pay-${Date.now()}`, merchantId, merchant: merchant.name, amountCents, method, cardId: card?.id ?? null, result: out.result, reason: out.reason, createdAt: at }, ...prev]);
        return out;
      },
      async checkout(merchantId, amountCents, form) {
        if (live) {
          const out = await call("checkout_pay", { p_merchant_id: merchantId, p_amount_cents: amountCents, p_number: form.number, p_exp: form.exp, p_cvc: form.cvc, p_name: form.name, p_zip: form.zip }, true);
          return {
            result: str(out.result) as "approved" | "declined",
            reason: out.reason ? str(out.reason) : null,
            code: out.code ? str(out.code) : null,
            method: str(out.method) as PayMethod,
            cardId: out.card_id ? str(out.card_id) : null,
            cardName: str(out.card_name),
            last4: str(out.last4),
          };
        }
        const merchant = MERCHANTS.find((m) => m.id === merchantId);
        if (!merchant) throw new Error("Pick one of the places to pay.");
        const match = matchCard(form, cards);
        if (!match) throw new Error("This card number isn't one of your Digna Bill Cards or a practice wallet card. Copy one from your wallet and try again.");
        const last4 = form.number.replace(/\D/g, "").slice(-4);
        if (!match.detailsOk) {
          const at = new Date().toISOString();
          setPayments((prev) => [{ id: `demo-pay-${Date.now()}`, merchantId, merchant: merchant.name, amountCents, method: match.method, cardId: match.card?.id ?? null, result: "declined", reason: DETAILS_MISMATCH, createdAt: at }, ...prev]);
          return { result: "declined", reason: DETAILS_MISMATCH, code: "card_details", method: match.method, cardId: match.card?.id ?? null, cardName: match.label, last4 };
        }
        const out = await api.pay(merchantId, amountCents, match.method, match.card?.id ?? null);
        return { ...out, method: match.method, cardId: match.card?.id ?? null, cardName: match.label, last4 };
      },
      async requestPasswordReset(email) {
        if (!sb) throw new Error("Accounts aren't set up on this site yet.");
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (error) throw new Error(plainError(error));
      },
      async updatePassword(password) {
        if (!sb) throw new Error("Accounts aren't set up on this site yet.");
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw new Error(plainError(error));
        setScreen("dashboard");
      },
      async deleteAccount() {
        if (!sb || !live) throw new Error("Sign in to delete your account.");
        const { error } = await sb.rpc("delete_my_account");
        if (error) throw new Error(plainError(error));
        await sb.auth.signOut();
        setMode("guest");
        setUser(null);
        setBalance(EMPTY_BALANCE);
        setCards([]);
        setTransactions([]);
        setPayments([]);
        setBills([]);
        setScreen("welcome");
      },
      async sendFeedback(message, email, page) {
        if (!sb) throw new Error("Feedback isn't set up on this site yet.");
        const { error } = await sb.rpc("send_feedback", { p_message: message, p_email: email?.trim() || null, p_page: page ?? null });
        if (error) throw new Error(plainError(error));
      },
      setLastScan,
    };
    return api;
  }, [mode, ready, user, balance, cards, transactions, payments, bills, screen, selectedCardId, lastScan, notice, load, enter]);

  return <PayProxyContext.Provider value={value}>{props.children}</PayProxyContext.Provider>;
}
