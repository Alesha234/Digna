import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { accessToken } from "@/modules/ui/lib/supabase";
import { MERCHANTS, methodLabel } from "@/modules/ui/lib/sandbox";
import { assistantStarters } from "@/modules/ui/data/demoData";
import type { AssistantMessage } from "@/modules/ui/types";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

void theme;

type ChatMsg = AssistantMessage & { content?: string };

function getContent(m: ChatMsg): string {
  const rec = m as unknown as Record<string, unknown>;
  if (typeof rec.content === "string" && (rec.content as string).length > 0) return rec.content as string;
  if (typeof rec.text === "string") return rec.text as string;
  return "";
}

function makeMsg(role: "user" | "assistant", body: string): ChatMsg {
  const base = {
    id: role + "_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 100000).toString(36),
    role: role,
    text: body,
    createdAt: new Date().toISOString(),
  } as unknown as Record<string, unknown>;
  base.content = body;
  return base as unknown as ChatMsg;
}

function cents(c: number): string {
  return "$" + (c / 100).toFixed(2);
}

function day(s: string): string {
  try {
    const d: Date = new Date(s);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

function buildLocalReply(input: string, txn: { storeName: string; amountCents: number; occurredAt: string; reason?: string; cardId: string } | undefined, card: { status: string; capCents: number; spentCents: number; endDate?: string } | undefined, label: string): string {
  const q: string = input.toLowerCase();
  if (!txn) {
    if (q.includes("unfreeze") || q.includes("frozen") || q.includes("freeze") || q.includes("paus")) {
      return "To turn a paused card back on, open it from your dashboard, tap Unfreeze, and try the payment again.";
    }
    if (q.includes("cap") || q.includes("limit") || q.includes("raise")) {
      return "If a payment is more than a card's limit, open the card and use Change limit. You can raise it as far as the money in your wallet covers; if that's not enough, add money first. Tell me which place turned you down and I'll walk you through it.";
    }
    if (q.includes("balance") || q.includes("add money") || q.includes("wallet")) {
      return "If your wallet is low, add money from the dashboard, then try the payment again.";
    }
    return "I can explain a decline in simple words. Pick one of the declined payments above, or tell me the place or business and amount, and I will suggest a calm next step.";
  }
  const amount: string = cents(txn.amountCents);
  const reason: string = (txn.reason || "").toLowerCase();
  const status: string = card ? card.status : "active";
  let expiredByDate: boolean = false;
  try {
    if (card && typeof card.endDate === "string" && card.endDate.length > 0) {
      expiredByDate = new Date(card.endDate).getTime() < Date.now() - 86400000;
    }
  } catch {
    expiredByDate = false;
  }
  const expiredByReason: boolean = reason.includes("expir") || reason.includes("passed the day") || (reason.includes("pass") && reason.includes("stop"));
  let cause: string = "it went over a limit";
  let next: string = "You can raise the limit on the \"" + label + "\" card (as far as your wallet covers), add practice money, or make a new card just for " + txn.storeName + ".";
  if (status === "frozen" || reason.includes("frozen") || reason.includes("paus")) {
    cause = "the \"" + label + "\" card is paused or frozen";
    next = "Turn the \"" + label + "\" card back on from your dashboard (Unfreeze), then try the " + amount + " payment at " + txn.storeName + " again.";
  } else if (status === "closed" || reason.includes("closed")) {
    cause = "the \"" + label + "\" card is closed";
    next = "Make a new card for " + txn.storeName + " and try the " + amount + " payment again.";
  } else if (expiredByDate || expiredByReason || q.includes("expir")) {
    cause = "the \"" + label + "\" card has expired";
    next = "Make a new card for " + txn.storeName + " with a later date and try the " + amount + " payment again.";
  } else if (reason.includes("cap") || reason.includes("over") || reason.includes("limit")) {
    if (card) {
      const remaining: number = card.capCents - card.spentCents;
      if (remaining < txn.amountCents) {
        cause = "it was over the limit on \"" + label + "\": only " + cents(Math.max(0, remaining)) + " was left of its " + cents(card.capCents) + " limit";
      } else {
        cause = "it was close to the " + cents(card.capCents) + " limit on \"" + label + "\"";
      }
    } else {
      cause = "it was over the card's limit";
    }
    next = "You can raise the limit on \"" + label + "\" (as far as your wallet covers), add practice money, or make a new card for " + txn.storeName + ".";
  } else if (q.includes("balance") || q.includes("wallet") || reason.includes("balance") || reason.includes("wallet") || reason.includes("enough money") || reason.includes("add money")) {
    cause = "your wallet was too low for the " + amount + " payment";
    next = "Add practice money from the dashboard, then try " + txn.storeName + " again.";
  }
  return "That " + amount + " payment at " + txn.storeName + " on " + day(txn.occurredAt) + " was declined because " + cause + ". Digna said no to protect you from spending more than you planned. Next step: " + next;
}

export function AssistantScreen(props: { initialPrompt?: string }) {
  const { cards, transactions, payments, balance, mode } = usePayProxy();
  const [messages, setMessages] = useState<ChatMsg[]>(function () {
    const first: string = props.initialPrompt && props.initialPrompt.trim().length > 0 ? props.initialPrompt.trim() : "Hi, I am your Digna helper. Pick a declined payment below or ask me why a payment did not go through. I will explain it in plain words.";
    return [makeMsg("assistant", first)];
  });
  const [input, setInput] = useState<string>(function () {
    return "";
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const declined = transactions.filter(function (t) {
    return t.result === "declined";
  });

  const selectedTxn = declined.find(function (t) {
    return t.id === selectedId;
  });

  function cardLabelFor(id: string): string {
    const c = cards.find(function (x) {
      return x.id === id;
    });
    if (!c) return "your card";
    const rec = c as unknown as Record<string, unknown>;
    if (typeof rec.name === "string" && (rec.name as string).length > 0) return rec.name as string;
    return "your card";
  }

  useEffect(function () {
    const el: HTMLUListElement | null = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  function pickStarter(s: string): void {
    setInput(s);
    setError(null);
  }

  async function send(): Promise<void> {
    const trimmed: string = input.trim();
    if (trimmed.length === 0 || loading) return;
    setError(null);
    const um: ChatMsg = makeMsg("user", trimmed);
    setMessages(function (prev: ChatMsg[]) {
      return [...prev, um];
    });
    setInput("");
    setLoading(true);
    const snapTxn = selectedTxn;
    const snapCard = snapTxn ? cards.find(function (c) {
      return c.id === snapTxn.cardId;
    }) : undefined;
    const label: string = snapTxn ? cardLabelFor(snapTxn.cardId) : "your card";
    let reply: string = buildLocalReply(trimmed, snapTxn, snapCard, label);
    // What Muse Spark is told: what Digna is, the sample businesses' rules, and this person's own cards and payments.
    const system: string = [
      "You are Digna's money assistant. For now Digna uses practice money only: no real card, bank or business is involved. Use only plain words: practice money, Try paying, place or business, limit.",
      "Digna gives people whose Cash App, Chime, debit or prepaid cards get declined a card for each place, with a limit they choose, that works like a credit card and is paid from their Digna wallet. A card's limit can be raised on its page, but only as far as the money in the wallet covers.",
      "Answer in plain, friendly, everyday words, in 2 to 5 short sentences: why it happened and the one or two things to do next. Explain the reason behind a place's rule (for example, hotels hold a deposit). Never invent rules beyond the ones below.",
      "Sample businesses and what they accept: " + MERCHANTS.map(function (m) { return m.name + " (" + m.kind + "): " + m.rule; }).join(" "),
      "Wallet: " + cents(balance.availableCents) + " in practice money.",
      "Cards: " + (cards.length ? cards.slice(0, 8).map(function (c) { return c.name + " limit " + cents(c.capCents) + ", spent " + cents(c.spentCents) + ", " + c.status; }).join("; ") : "none yet") + ".",
      "Recent payments: " + (payments.length ? payments.slice(0, 6).map(function (p) { return cents(p.amountCents) + " at " + p.merchant + " with " + methodLabel(p.method) + ": " + p.result + (p.reason ? " (" + p.reason + ")" : ""); }).join("; ") : "none") + ".",
    ].join(" ").slice(0, 2000);
    const history = messages.slice(-6).map(function (m) { return { role: m.role, content: m.text.slice(0, 1000) }; });
    try {
      const token: string | null = mode === "live" ? await accessToken() : null;
      if (!token) throw new Error(mode === "demo" ? "The AI answers signed-in people. Create a free account to ask it; here's a quick explanation for now." : "Sign in to ask the AI; here's a quick explanation for now.");
      const res: Response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          system,
          messages: [
            ...history,
            { role: "user", content: trimmed + (snapTxn ? " Context: " + snapTxn.storeName + " " + cents(snapTxn.amountCents) + " on " + day(snapTxn.occurredAt) + ", reason: " + (snapTxn.reason || "declined") : "") },
          ],
        }),
      });
      const data = (await res.json().catch(function () { return {}; })) as { text?: unknown; error?: unknown };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "The AI couldn't answer right now.");
      if (typeof data.text === "string" && data.text.trim().length > 0) reply = data.text;
      // Every declined-payment answer must name the amount, the place or business, and the date, with a plain-words
      // reason and one concrete next step. If the model's answer leaves those out, use the local explanation instead.
      if (snapTxn) {
        const lowered: string = reply.toLowerCase();
        const namesPlace: boolean = lowered.includes(snapTxn.storeName.toLowerCase());
        const namesAmount: boolean = reply.includes((snapTxn.amountCents / 100).toFixed(2));
        if (!namesPlace || !namesAmount) reply = buildLocalReply(trimmed, snapTxn, snapCard, label);
      }
    } catch (e) {
      const msg: string = e instanceof Error && e.message ? e.message : "Assistant is unavailable right now.";
      setError(msg);
      reply = buildLocalReply(trimmed, snapTxn, snapCard, label);
    }
    const am: ChatMsg = makeMsg("assistant", reply);
    setMessages(function (prev: ChatMsg[]) {
      return [...prev, am];
    });
    setLoading(false);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setInput(e.target.value);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") void send();
  }

  const disabled: boolean = input.trim().length === 0 || loading;

  return (
    <section className="pp-section" style={{ backgroundColor: colors.page, minHeight: "100vh", padding: spacing.md, fontFamily: typography.body }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.md }}>
        <RevealOnScroll>
          <div className="pp-card pp-lift" style={{ backgroundColor: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.lg }}>
            <h1 style={{ fontFamily: typography.heading, color: colors.ink, margin: 0, marginBottom: spacing.sm }}>Money assistant</h1>
            <p style={{ color: colors.muted, margin: 0, fontFamily: typography.body }}>Explains why a payment declined and what to do next, in plain words.</p>
            <p style={{ color: colors.muted, margin: 0, marginTop: spacing.sm, fontSize: 13 }}>Practice money for now: nothing real is charged.</p>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delayMs={80}>
          <div className="pp-card pp-lift" style={{ backgroundColor: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.lg, display: "flex", flexDirection: "column", gap: spacing.md }}>
            {declined.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
                {declined.map(function (t) {
                  const active: boolean = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={function () {
                        setSelectedId(function (prev: string | null) {
                          return prev === t.id ? null : t.id;
                        });
                      }}
                      aria-pressed={active}
                      style={{
                        cursor: "pointer",
                        borderRadius: radii.pill,
                        border: "1px solid " + (active ? colors.mintDark : colors.line),
                        backgroundColor: active ? colors.mint : colors.surface,
                        color: active ? colors.surface : colors.ink,
                        padding: "6px 12px",
                        fontFamily: typography.body,
                      }}
                    >
                      {t.storeName} · {cents(t.amountCents)}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {assistantStarters.map(function (s: string) {
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={function () {
                      pickStarter(s);
                    }}
                    style={{
                      cursor: "pointer",
                      borderRadius: radii.pill,
                      border: "1px solid " + colors.line,
                      backgroundColor: colors.page,
                      color: colors.ink,
                      padding: "6px 12px",
                      fontFamily: typography.body,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <ul
              ref={listRef}
              aria-live="polite"
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: spacing.sm,
                maxHeight: 340,
                overflowY: "auto",
              }}
            >
              {messages.map(function (m: ChatMsg) {
                const isUser: boolean = m.role === "user";
                return (
                  <li
                    key={m.id}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      backgroundColor: isUser ? colors.ink : colors.page,
                      color: isUser ? colors.surface : colors.ink,
                      border: "1px solid " + colors.line,
                      borderRadius: radii.card,
                      padding: spacing.sm + " " + spacing.md,
                      maxWidth: "88%",
                      fontFamily: typography.body,
                    }}
                  >
                    {getContent(m)}
                  </li>
                );
              })}
              {loading ? (
                <li style={{ alignSelf: "flex-start", color: colors.muted, fontFamily: typography.body }}>Thinking in plain words…</li>
              ) : null}
            </ul>
            {error ? (
              <p role="alert" style={{ color: colors.ink, backgroundColor: colors.page, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.sm, margin: 0 }}>
                {error}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
              <label htmlFor="assistant-input" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
                Ask about a declined payment
              </label>
              <input
                id="assistant-input"
                value={input}
                onChange={onChange}
                onKeyDown={onKey}
                placeholder="Ask why a payment was declined…"
                aria-label="Ask about a declined payment"
                disabled={loading}
                style={{
                  flex: 1,
                  border: "1px solid " + colors.line,
                  borderRadius: radii.pill,
                  padding: "10px 14px",
                  fontFamily: typography.body,
                  color: colors.ink,
                  backgroundColor: colors.surface,
                }}
              />
              <button
                type="button"
                className="pp-btn-mint"
                onClick={function () {
                  void send();
                }}
                disabled={disabled}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  border: "none",
                  borderRadius: radii.pill,
                  backgroundColor: colors.mint,
                  color: "#0E1726",
                  padding: "10px 18px",
                  fontFamily: typography.body,
                  fontWeight: 700,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
