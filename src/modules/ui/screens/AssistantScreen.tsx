import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { accessToken } from "@/modules/ui/lib/supabase";
import { MERCHANTS, methodLabel } from "@/modules/ui/lib/sandbox";
import { assistantStarters } from "@/modules/ui/data/demoData";
import type { AssistantMessage } from "@/modules/ui/types";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { startRecording, VOICE_MAX_SECONDS, type Recorder } from "@/modules/ui/lib/voice";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

void theme;

/**
 * A change the assistant offers to make to one of the person's cards (Nov 2, 2026). Nothing happens until they press
 * Confirm, and then only through the same checked functions as the card's own page.
 */
type CardAction = { do: "set_limit" | "freeze" | "unfreeze"; cardId: string; cardName: string; dollars?: number; state?: "idle" | "busy" | "done" | "dismissed"; note?: string };

type ChatMsg = AssistantMessage & { content?: string; action?: CardAction };

type CardLite = { id: string; name: string; status: string; capCents: number; spentCents: number };

/** The card a name points to among the person's own cards: exact first (ignoring case), then the one it's part of. */
function findCard(name: string, cards: CardLite[]): CardLite | undefined {
  const n = name.trim().toLowerCase().replace(/\s+card$/, "");
  return cards.find((c) => c.name.toLowerCase() === n) ?? cards.find((c) => c.status !== "closed" && (c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())));
}

/** Muse Spark's offer, if it ended its answer with an ACTION line: the line is taken out and checked against real cards. */
function actionFrom(reply: string, cards: CardLite[]): { text: string; action?: CardAction } {
  const m = /^\s*ACTION\s*(\{.*\})\s*$/m.exec(reply);
  if (!m) return { text: reply };
  const text = reply.replace(m[0], "").trim();
  try {
    const a = JSON.parse(m[1]) as { do?: unknown; card?: unknown; dollars?: unknown };
    const card = typeof a.card === "string" ? findCard(a.card, cards) : undefined;
    if (!card || card.status === "closed") return { text };
    if (a.do === "set_limit" && typeof a.dollars === "number" && a.dollars > 0 && a.dollars <= 10000) return { text, action: { do: "set_limit", cardId: card.id, cardName: card.name, dollars: Math.round(a.dollars * 100) / 100 } };
    if (a.do === "freeze" || a.do === "unfreeze") return { text, action: { do: a.do, cardId: card.id, cardName: card.name } };
  } catch {
    /* an offer that can't be read is left out */
  }
  return { text };
}

/** When Muse Spark isn't asked (the sample account), plain requests still bring up the same Confirm card. */
function actionFromWords(question: string, cards: CardLite[]): CardAction | undefined {
  const q = question.toLowerCase();
  const limit = /(?:raise|increase|lower|set|change|bump|make)\s+(?:the\s+)?(?:limit\s+(?:on|of)\s+)?(?:my\s+)?(.+?)\s+card(?:'s)?(?:\s+limit)?\s+to\s+\$?([\d,]+(?:\.\d{1,2})?)/.exec(q);
  if (limit) {
    const card = findCard(limit[1], cards);
    const dollars = Number(limit[2].replace(/,/g, ""));
    if (card && dollars > 0 && dollars <= 10000) return { do: "set_limit", cardId: card.id, cardName: card.name, dollars };
  }
  const status = /(unfreeze|unpause|turn\s+back\s+on|freeze|pause)\s+(?:my\s+)?(.+?)\s+card/.exec(q);
  if (status) {
    const card = findCard(status[2], cards);
    if (card) return { do: /un|back on/.test(status[1]) ? "unfreeze" : "freeze", cardId: card.id, cardName: card.name };
  }
  return undefined;
}

/** "Digna can do this for you": the offered change, the wallet, and Confirm or Not now. */
function ActionCard(props: { action: CardAction; card?: CardLite; walletCents: number; onConfirm: () => void; onDismiss: () => void }) {
  const { action: a, card } = props;
  if (a.state === "dismissed") return null;
  const cur = card ? card.capCents / 100 : 0;
  const words =
    a.do === "set_limit"
      ? `${(a.dollars ?? 0) >= cur ? "Raise" : "Lower"} \u201c${a.cardName}\u201d from $${cur.toFixed(2)} to $${(a.dollars ?? 0).toFixed(2)}`
      : a.do === "freeze"
        ? `Pause \u201c${a.cardName}\u201d`
        : `Turn \u201c${a.cardName}\u201d back on`;
  const tooMuch = a.do === "set_limit" && card ? Math.round((a.dollars ?? 0) * 100) > card.capCents && Math.round((a.dollars ?? 0) * 100) - card.spentCents > props.walletCents : false;
  return (
    <li className="pp-action" style={{ alignSelf: "flex-start", maxWidth: "92%" }}>
      <span className="pp-action-kicker">Digna can do this for you</span>
      <strong className="pp-action-what">{words}</strong>
      <span className="pp-action-wallet">Wallet: ${(props.walletCents / 100).toFixed(2)} in practice money</span>
      {a.state === "done" ? (
        <span className="pp-action-done">✓ {a.note}</span>
      ) : tooMuch ? (
        <span className="pp-action-note">Your wallet doesn&apos;t cover that yet. Add practice money first, then ask again.</span>
      ) : (
        <span style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button type="button" className="pp-action-yes" disabled={a.state === "busy"} onClick={props.onConfirm}>{a.state === "busy" ? "Doing it…" : "Confirm"}</button>
          <button type="button" className="pp-action-no" disabled={a.state === "busy"} onClick={props.onDismiss}>Not now</button>
        </span>
      )}
      {a.note && a.state !== "done" && <span className="pp-action-note" role="alert">{a.note}</span>}
    </li>
  );
}

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
      return "That payment was likely declined because the card is paused. Next step: open it from your dashboard, tap Unfreeze, then pay again on Pay a bill.";
    }
    if (q.includes("cap") || q.includes("limit") || q.includes("raise")) {
      return "That payment was likely declined because it was over the card's limit. Next step: open the card and raise the limit as far as the practice money in your wallet covers (add practice money first if that's not enough), then pay again on Pay a bill. Tell me which place or business turned you down and I'll walk you through it.";
    }
    if (q.includes("balance") || q.includes("add money") || q.includes("wallet")) {
      return "That payment was likely declined because the practice money in the wallet was too low. Next step: add practice money from the dashboard, then pay again on Pay a bill.";
    }
    return "I don't have enough detail yet to say why it was declined. Next step: pick one of the declined payments above, or tell me the place or business and the amount, then pay again on Pay a bill and I'll tell you exactly why.";
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
  let cause: string = "there is not enough detail in the saved record to pin down why, but it is often over the limit or a low wallet";
  let next: string = "Open the \"" + label + "\" card and check whether it is paused, what is left of its limit, and the practice money in the wallet, then pay the " + amount + " at " + txn.storeName + " again. You can also raise the limit, add practice money, or make a new card just for " + txn.storeName + ".";
  if (status === "frozen" || reason.includes("frozen") || reason.includes("paus")) {
    cause = "the \"" + label + "\" card is paused or frozen";
    next = "Turn the \"" + label + "\" card back on from your dashboard (Unfreeze), then pay the " + amount + " at " + txn.storeName + " again.";
  } else if (status === "closed" || reason.includes("closed")) {
    cause = "the \"" + label + "\" card is closed";
    next = "Make a new card for " + txn.storeName + ", then pay the " + amount + " again on Pay a bill.";
  } else if (expiredByDate || expiredByReason || q.includes("expir")) {
    cause = "the \"" + label + "\" card is past its end date";
    next = "Make a new card for " + txn.storeName + " with a later date, then pay the " + amount + " again on Pay a bill.";
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
    next = "Raise the limit on \"" + label + "\" (as far as the practice money in the wallet covers), add practice money if needed, then pay the " + amount + " at " + txn.storeName + " again. Or make a new card just for " + txn.storeName + ".";
  } else if (q.includes("balance") || q.includes("wallet") || reason.includes("balance") || reason.includes("wallet") || reason.includes("enough money") || reason.includes("add money")) {
    cause = "the practice money in the wallet was too low for the " + amount + " payment";
    next = "Add practice money from the dashboard, then pay at " + txn.storeName + " again.";
  }
  return "That " + amount + " payment at " + txn.storeName + " on " + day(txn.occurredAt) + " was declined because " + cause + ". Digna said no to protect you from spending more than you planned. Next step: " + next;
}

/** inPanel: shown in the floating assistant panel (Nov 2, 2026), whose header already names it. */
export function AssistantScreen(props: { initialPrompt?: string; inPanel?: boolean }) {
  const { cards, transactions, payments, balance, mode, setCardLimit, freezeCard, unfreezeCard } = usePayProxy();
  // Talking to Digna (Nov 2, 2026): the mic records, Meta's Muse Voice Transcribe writes it down into the box.
  const [listening, setListening] = useState<number | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef<Recorder | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>(function () {
    const first: string = props.initialPrompt && props.initialPrompt.trim().length > 0 ? props.initialPrompt.trim() : "Hi, I am your Digna helper. Pick a declined payment below or ask me why a payment did not go through. I'll tell you exactly why, and what to do next.";
    return [makeMsg("assistant", first)];
  });
  const [input, setInput] = useState<string>(function () {
    return "";
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
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

  async function sendQuestion(trimmed: string, isRetry: boolean): Promise<void> {
    if (trimmed.length === 0 || loading) return;
    setError(null);
    setLastFailed(null);
    if (!isRetry) {
      const um: ChatMsg = makeMsg("user", trimmed);
      setMessages(function (prev: ChatMsg[]) {
        return [...prev, um];
      });
      setInput("");
    }
    setLoading(true);
    const snapTxn = selectedTxn;
    const snapCard = snapTxn ? cards.find(function (c) {
      return c.id === snapTxn.cardId;
    }) : undefined;
    const label: string = snapTxn ? cardLabelFor(snapTxn.cardId) : "your card";
    let reply: string = buildLocalReply(trimmed, snapTxn, snapCard, label);
    // What Muse Spark is told: what Digna is, the sample businesses' rules, and this person's own cards and payments.
    // The question plus the recent declined payments and their cards go to Meta's Muse Spark through /api/ai.
    const declinedForAi: string = declined.length
      ? declined.slice(0, 6).map(function (t) {
        const c = cards.find(function (x) { return x.id === t.cardId; });
        const cardBits: string = c ? " on card \"" + cardLabelFor(c.id) + "\" (limit " + cents(c.capCents) + ", spent " + cents(c.spentCents) + ", " + c.status + ")" : "";
        return cents(t.amountCents) + " at " + t.storeName + " on " + day(t.occurredAt) + cardBits + (t.reason ? ", saved reason: " + t.reason : "");
      }).join("; ")
      : "none";
    const system: string = [
      "If the person asks you to change one of their cards (raise or lower its limit, pause it, or turn it back on), say in one sentence what you'll set up, then end your answer with one last line exactly like ACTION {\"do\":\"set_limit\",\"card\":\"Hotel\",\"dollars\":180}. do is set_limit, freeze or unfreeze (dollars only for set_limit). Use only a card name from the Cards list. The person must press Confirm; never say it's done. Never write ACTION otherwise.",
      "You are Digna's money assistant. For now Digna uses practice money only: no real card, bank or business is involved. Use only plain words: practice money, Pay a bill, place or business, limit.",
      "Digna gives people whose Cash App, Chime, debit or prepaid cards get declined a card for each place, with a limit they choose, that works like a credit card and is paid from their Digna wallet. A card's limit can be raised on its page, but only as far as the money in the wallet covers.",
      "Answer in plain, friendly, everyday words, in 2 to 5 short sentences: always explain the likely why (over the limit, a paused card, past its end date, a low wallet, or not enough detail) and give one clear next step (raise the limit, unfreeze, add practice money, or make a card) using the words Pay a bill. Explain the reason behind a place's rule (for example, hotels hold a deposit). Never invent rules beyond the ones below.",
      "Sample businesses and what they accept: " + MERCHANTS.map(function (m) { return m.name + " (" + m.kind + "): " + m.rule; }).join(" "),
      "Wallet: " + cents(balance.availableCents) + " in practice money.",
      "Cards: " + (cards.length ? cards.slice(0, 8).map(function (c) { return c.name + " limit " + cents(c.capCents) + ", spent " + cents(c.spentCents) + ", " + c.status; }).join("; ") : "none yet") + ".",
      "Recent declined payments and their cards: " + declinedForAi + ".",
      "Recent payments: " + (payments.length ? payments.slice(0, 6).map(function (p) { return cents(p.amountCents) + " at " + p.merchant + " with " + methodLabel(p.method) + ": " + p.result + (p.reason ? " (" + p.reason + ")" : ""); }).join("; ") : "none") + ".",
    ].join(" ").slice(0, 3500);
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
      setLastFailed(trimmed);
      reply = buildLocalReply(trimmed, snapTxn, snapCard, label);
    }
    // An offered change to a card (Nov 2, 2026): from Muse Spark's ACTION line, or from plain words when it wasn't asked.
    const lite: CardLite[] = cards.map(function (c) { return { id: c.id, name: c.name, status: c.status, capCents: c.capCents, spentCents: c.spentCents }; });
    const offered = actionFrom(reply, lite);
    const action: CardAction | undefined = offered.action ?? actionFromWords(trimmed, lite);
    if (action && !offered.action) {
      reply = action.do === "set_limit" ? "I can set that up. Check it below, then press Confirm." : "I can do that for you. Press Confirm below.";
      // The change is set up either way, so a note that the AI wasn't asked would only get in the way.
      setError(null);
      setLastFailed(null);
    }
    const am: ChatMsg = makeMsg("assistant", offered.text || reply);
    if (action) am.action = { ...action, state: "idle" };
    setMessages(function (prev: ChatMsg[]) {
      return [...prev, am];
    });
    setLoading(false);
  }

  function updateAction(id: string, patch: Partial<CardAction>): void {
    setMessages(function (prev: ChatMsg[]) {
      return prev.map(function (m) { return m.id === id && m.action ? { ...m, action: { ...m.action, ...patch } } : m; });
    });
  }

  /** Confirm: the change goes through the card's own checked functions; their plain-words refusal shows as it is. */
  async function confirmAction(m: ChatMsg): Promise<void> {
    const a = m.action;
    if (!a) return;
    updateAction(m.id, { state: "busy", note: undefined });
    try {
      if (a.do === "set_limit") await setCardLimit(a.cardId, Math.round((a.dollars ?? 0) * 100));
      else if (a.do === "freeze") await freezeCard(a.cardId);
      else await unfreezeCard(a.cardId);
      const done = a.do === "set_limit" ? `Done. Your ${a.cardName} card's limit is now $${(a.dollars ?? 0).toFixed(2)}.` : a.do === "freeze" ? `Done. Your ${a.cardName} card is paused.` : `Done. Your ${a.cardName} card is back on.`;
      updateAction(m.id, { state: "done", note: done });
    } catch (e) {
      updateAction(m.id, { state: "idle", note: e instanceof Error && e.message ? e.message : "That couldn't be changed. Try again." });
    }
  }

  /** The mic: tap to start, tap again to stop (it stops by itself at 60 seconds); the words land in the box to check. */
  async function toggleMic(): Promise<void> {
    setError(null);
    setLastFailed(null);
    if (recorder.current) {
      const rec = recorder.current;
      recorder.current = null;
      setListening(null);
      setTranscribing(true);
      try {
        const audio = await rec.stop();
        const token: string | null = mode === "live" ? await accessToken() : null;
        if (!token) throw new Error("Make a free account to talk to Digna.");
        const res = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ audio }) });
        const data = (await res.json().catch(function () { return {}; })) as { text?: unknown; error?: unknown };
        if (!res.ok || typeof data.text !== "string") throw new Error(typeof data.error === "string" ? data.error : "Couldn't write down what you said. Try again, or type it.");
        setInput(function (prev: string) { return (prev.trim() ? prev.trim() + " " : "") + String(data.text); });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't write down what you said.");
      } finally {
        setTranscribing(false);
      }
      return;
    }
    if (mode !== "live") {
      setError("Make a free account to talk to Digna.");
      return;
    }
    try {
      recorder.current = await startRecording();
      setListening(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The microphone couldn't start.");
    }
  }

  useEffect(function () {
    if (listening === null) return;
    if (listening >= VOICE_MAX_SECONDS) {
      void toggleMic();
      return;
    }
    const t = window.setTimeout(function () { setListening(function (s) { return s === null ? null : s + 1; }); }, 1000);
    return function () { window.clearTimeout(t); };
  }, [listening]);

  useEffect(function () {
    return function () { recorder.current?.cancel(); };
  }, []);

  async function send(): Promise<void> {
    await sendQuestion(input.trim(), false);
  }

  async function retry(): Promise<void> {
    if (lastFailed) await sendQuestion(lastFailed, true);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setInput(e.target.value);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") void send();
  }

  const disabled: boolean = input.trim().length === 0 || loading;

  return (
    <section className="pp-section" style={{ backgroundColor: colors.page, minHeight: props.inPanel ? "auto" : "100vh", padding: spacing.md, fontFamily: typography.body }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: spacing.md }}>
        {!props.inPanel && (
        <RevealOnScroll>
          <div className="pp-card pp-lift" style={{ backgroundColor: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.lg }}>
            <h1 style={{ fontFamily: typography.heading, color: colors.ink, margin: 0, marginBottom: spacing.sm }}>Money assistant</h1>
            <p style={{ color: colors.muted, margin: 0, fontFamily: typography.body }}>Explains exactly why a payment was declined, and what to do next.</p>
            <p style={{ color: colors.muted, margin: 0, marginTop: spacing.sm, fontSize: 13 }}>Practice money for now: nothing real is charged.</p>
          </div>
        </RevealOnScroll>
        )}
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
                const actionCard = m.action ? (
                  <ActionCard
                    key={m.id + "-action"}
                    action={m.action}
                    card={cards.find(function (c) { return c.id === m.action!.cardId; })}
                    walletCents={balance.availableCents}
                    onConfirm={function () { void confirmAction(m); }}
                    onDismiss={function () { updateAction(m.id, { state: "dismissed" }); }}
                  />
                ) : null;
                return [
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
                  </li>,
                  actionCard,
                ];
              })}
              {loading ? (
                <li style={{ alignSelf: "flex-start", color: colors.muted, fontFamily: typography.body }}>Thinking it through…</li>
              ) : null}
            </ul>
            {error ? (
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                <p role="alert" style={{ color: colors.ink, backgroundColor: colors.page, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.sm, margin: 0 }}>
                  {error}
                </p>
                {lastFailed && !loading ? (
                  <button
                    type="button"
                    onClick={function () {
                      void retry();
                    }}
                    style={{
                      cursor: "pointer",
                      alignSelf: "flex-start",
                      border: "none",
                      borderRadius: radii.pill,
                      backgroundColor: colors.mint,
                      color: "#0E1726",
                      padding: "10px 18px",
                      fontFamily: typography.body,
                      fontWeight: 700,
                    }}
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            ) : null}
            {listening !== null ? (
              <p className="pp-listening" role="status">● Listening… 0:{String(listening).padStart(2, "0")} · tap the mic to stop</p>
            ) : transcribing ? (
              <p className="pp-listening is-writing" role="status">Writing down what you said…</p>
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
                placeholder="Ask, or tap the mic and just say it…"
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
                className={listening !== null ? "pp-mic is-on" : "pp-mic"}
                onClick={function () { void toggleMic(); }}
                disabled={loading || transcribing}
                aria-pressed={listening !== null}
                aria-label={listening !== null ? "Stop and write down what I said" : "Talk to Digna"}
                title={listening !== null ? "Tap to stop" : "Talk to Digna"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
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
