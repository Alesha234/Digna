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

function buildLocalReply(input: string, txn: { storeName: string; amountCents: number; occurredAt: string; reason?: string; cardId: string } | undefined, card: { status: string; capCents: number; spentCents: number } | undefined, label: string): string {
  const q: string = input.toLowerCase();
  if (!txn) {
    if (q.includes("unfreeze") || q.includes("frozen") || q.includes("freeze")) {
      return "To unfreeze a card, open it from your dashboard, tap Unfreeze, and try the payment again. This is test mode, so nothing real moves.";
    }
    if (q.includes("cap") || q.includes("limit") || q.includes("raise")) {
      return "If a payment is near your card cap, you can raise the cap, add demo money, or make a new card for that store. Tell me which store was declined and I will walk through it.";
    }
    if (q.includes("balance") || q.includes("add money")) {
      return "If your wallet balance is low, add some demo money from the dashboard, then try the payment again. No real money moves in test mode.";
    }
    return "I can explain a decline in simple words. Pick one of the declined payments above, or tell me the store name and amount, and I will suggest a calm next step.";
  }
  const amount: string = cents(txn.amountCents);
  const reason: string = (txn.reason || "").toLowerCase();
  const status: string = card ? card.status : "active";
  let cause: string = "it went over a limit";
  let next: string = "You can raise the cap on the \"" + label + "\" card, add demo money, or make a new card just for " + txn.storeName + ".";
  if (status === "frozen" || reason.includes("frozen")) {
    cause = "the \"" + label + "\" card is frozen";
    next = "Unfreeze the \"" + label + "\" card from your dashboard, then try the " + amount + " payment at " + txn.storeName + " again.";
  } else if (status === "closed") {
    cause = "the \"" + label + "\" card is closed";
    next = "Make a new card for " + txn.storeName + " and try the " + amount + " payment again.";
  } else if (reason.includes("cap") || reason.includes("over") || reason.includes("limit")) {
    if (card) {
      const remaining: number = card.capCents - card.spentCents;
      if (remaining < txn.amountCents) {
        cause = "it was over the spending cap on \"" + label + "\" — only " + cents(Math.max(0, remaining)) + " was left under the " + cents(card.capCents) + " cap";
      } else {
        cause = "it was near the " + cents(card.capCents) + " cap on \"" + label + "\"";
      }
    } else {
      cause = "it was over the card spending cap";
    }
    next = "You can raise the cap on \"" + label + "\", add demo money, or make a new card for " + txn.storeName + ".";
  } else if (q.includes("balance") || reason.includes("balance")) {
    cause = "your wallet balance was too low for the " + amount + " payment";
    next = "Add some demo money from the dashboard, then try " + txn.storeName + " again.";
  } else if (q.includes("expir") || reason.includes("expir")) {
    cause = "the card may have expired";
    next = "Make a new card for " + txn.storeName + " with a later date and try again.";
  }
  return "That " + amount + " payment at " + txn.storeName + " on " + day(txn.occurredAt) + " was declined because " + cause + ". In calm words: the store asked, and PayProxy said no to protect you. Next step: " + next + " This is test mode, so nothing real moves.";
}

export function AssistantScreen(props: { initialPrompt?: string }) {
  const { cards, transactions, payments, balance, mode } = usePayProxy();
  const [messages, setMessages] = useState<ChatMsg[]>(function () {
    const first: string = props.initialPrompt && props.initialPrompt.trim().length > 0 ? props.initialPrompt.trim() : "Hi, I am your PayProxy helper. Pick a declined payment below or ask me why a payment did not go through. I will explain it in plain words.";
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
    // What Muse Spark is told: what PayProxy is, the sandbox merchants' rules, and this person's own cards and tries.
    const system: string = [
      "You are PayProxy's money assistant. PayProxy is a sandbox with sample money only: no real card, bank or merchant is involved.",
      "PayProxy gives people whose Cash App, Chime, debit or prepaid cards get declined a virtual card per service, with its own spending cap, that runs as a credit card and is paid from their PayProxy wallet.",
      "Answer in plain, friendly words, in 2 to 5 short sentences: why it happened and the one or two things to do next. Never invent rules beyond the ones below.",
      "Merchant rules: " + MERCHANTS.map(function (m) { return m.name + " (" + m.kind + "): " + m.rule; }).join(" "),
      "Wallet: " + cents(balance.availableCents) + " sample money.",
      "Cards: " + (cards.length ? cards.slice(0, 8).map(function (c) { return c.name + " cap " + cents(c.capCents) + ", spent " + cents(c.spentCents) + ", " + c.status; }).join("; ") : "none yet") + ".",
      "Recent tries: " + (payments.length ? payments.slice(0, 6).map(function (p) { return cents(p.amountCents) + " at " + p.merchant + " with " + methodLabel(p.method) + ": " + p.result + (p.reason ? " (" + p.reason + ")" : ""); }).join("; ") : "none") + ".",
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
            <p style={{ color: colors.muted, margin: 0, marginTop: spacing.sm, fontSize: 13 }}>Test mode: sample money, no real money moves.</p>
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
                  color: "#06332A",
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
