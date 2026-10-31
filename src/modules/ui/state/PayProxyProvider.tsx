import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PayProxyUser, WalletBalance, VirtualCard, CardTransaction, BillScanResult, AppScreen } from "@/modules/ui/types";
import { demoUser, demoBalance, demoCards, demoTransactions } from "@/modules/ui/data/demoData";
import { supabase, plainError } from "@/modules/ui/lib/supabase";
import { MERCHANTS, decide, type PayMethod, type SandboxPayment } from "@/modules/ui/lib/sandbox";

/**
 * Digna's data: a real account in the app's own Supabase project ("live"), or the sample walk-through with no
 * account ("demo"). Both use sample money only. In live mode every change goes through the database's own functions
 * (add_money, create_virtual_card, set_card_status, sandbox_pay), which check who is asking; the screens then read
 * the result back, so what they show is what the database holds.
 */
export type Mode = "guest" | "demo" | "live";

type PayProxyContextValue = {
  mode: Mode;
  ready: boolean;
  user: PayProxyUser | null;
  balance: WalletBalance;
  cards: VirtualCard[];
  transactions: CardTransaction[];
  payments: SandboxPayment[];
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
  pay(merchantId: string, amountCents: number, method: PayMethod, cardId?: string | null): Promise<{ result: "approved" | "declined"; reason: string | null }>;
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
      setScreen((s) => (s === "welcome" || s === "auth" || s === "signup" ? "dashboard" : s));
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
    async function call(fn: string, args: Record<string, unknown>): Promise<Row> {
      if (!sb) throw new Error("Digna's database isn't set up on this site yet.");
      const { data, error } = await sb.rpc(fn, args);
      if (error) {
        const msg = plainError(error);
        setNotice(msg);
        throw new Error(msg);
      }
      await load();
      return (data ?? {}) as Row;
    }
    function demoStatus(id: string, status: VirtualCard["status"]): void {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
    return {
      mode,
      ready,
      user,
      balance,
      cards,
      transactions,
      payments,
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
        const card: VirtualCard = {
          id: `demo-card-${Date.now()}`,
          userId: demoUser.id,
          name: input.name,
          last4: String(Math.floor(1000 + Math.random() * 9000)),
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
      async pay(merchantId, amountCents, method, cardId = null) {
        if (live) {
          const out = await call("sandbox_pay", { p_merchant_id: merchantId, p_amount_cents: amountCents, p_method: method, p_card_id: method === "payproxy" ? cardId : null });
          return { result: str(out.result) as "approved" | "declined", reason: out.reason ? str(out.reason) : null };
        }
        const merchant = MERCHANTS.find((m) => m.id === merchantId);
        if (!merchant) throw new Error("Pick one of the sandbox merchants.");
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
        setScreen("welcome");
      },
      async sendFeedback(message, email, page) {
        if (!sb) throw new Error("Feedback isn't set up on this site yet.");
        const { error } = await sb.rpc("send_feedback", { p_message: message, p_email: email?.trim() || null, p_page: page ?? null });
        if (error) throw new Error(plainError(error));
      },
      setLastScan,
    };
  }, [mode, ready, user, balance, cards, transactions, payments, screen, selectedCardId, lastScan, notice, load, enter]);

  return <PayProxyContext.Provider value={value}>{props.children}</PayProxyContext.Provider>;
}
