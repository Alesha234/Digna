import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { assistantStarters, testModeMessage } from "@/modules/ui/data/demoData";
import { formatCurrency, formatDate } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";
import type { VirtualCard, CardTransaction, AssistantMessage, AppScreen } from "@/modules/ui/types";

void PayProxyProvider;
void theme;

function makeId(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 100000).toString(36);
}

function cardLabel(card: VirtualCard | undefined): string {
  if (!card) return "your card";
  const rec = card as unknown as Record<string, unknown>;
  if (typeof rec.label === "string" && (rec.label as string).length > 0) return rec.label as string;
  if (typeof rec.name === "string" && (rec.name as string).length > 0) return rec.name as string;
  return "your card";
}

function buildLocalReply(input: string, txn: CardTransaction | undefined, card: VirtualCard | undefined): string {
  const q = input.toLowerCase();
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
  const store = txn.storeName;
  const amount = formatCurrency(txn.amountCents);
  const reason = (txn.reason || "").toLowerCase();
  const label = cardLabel(card);
  const status = card ? card.status : "active";
  let cause = "it went over a limit";
  let next = "You can raise the cap on the \"" + label + "\" card, add demo money, or make a new card just for " + store + ".";
  if (status === "frozen" || reason.includes("frozen")) {
    cause = "the \"" + label + "\" card is frozen";
    next = "Unfreeze the \"" + label + "\" card from your dashboard, then try the " + amount + " payment at " + store + " again.";
  } else if (status === "closed") {
    cause = "the \"" + label + "\" card is closed";
    next = "Make a new card for " + store + " and try the " + amount + " payment again.";
  } else if (reason.includes("cap") || reason.includes("over") || reason.includes("limit")) {
    if (card) {
      const remaining = card.capCents - card.spentCents;
      if (remaining < txn.amountCents) {
        cause = "it was over the spending cap on \"" + label + "\" — only " + formatCurrency(Math.max(0, remaining)) + " was left under the " + formatCurrency(card.capCents) + " cap";
      } else {
        cause = "it was near the " + formatCurrency(card.capCents) + " cap on \"" + label + "\"";
      }
    } else {
      cause = "it was over the card spending cap";
    }
    next = "You can raise the cap on \"" + label + "\", add demo money, or make a new card for " + store + ".";
  } else if (q.includes("balance") || reason.includes("balance")) {
    cause = "your wallet balance was too low for the " + amount + " payment";
    next = "Add some demo money from the dashboard, then try " + store + " again.";
  } else if (q.includes("expir") || reason.includes("expir")) {
    cause = "the card may have expired";
    next = "Make a new card for " + store + " with a later date and try again.";
  }
  return "That " + amount + " payment at " + store + " on " + formatDate(txn.occurredAt) + " was declined because " + cause + ". In calm words: the store asked, and PayProxy said no to protect you. Next step: " + next + " This is test mode, so nothing real moves.";
}

export function AssistantScreen() {
  const { cards, transactions, setScreen } = usePayProxy();
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: "assistant-hello",
      role: "assistant",
      text: "Hi, I am your PayProxy helper. Pick a declined payment below or ask me why a payment did not go through. I will explain it in plain words.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const declined: CardTransaction[] = useMemo(() => {
    return transactions.filter((t: CardTransaction) => t.result === "declined");
  }, [transactions]);

  const selectedTxn: CardTransaction | undefined = useMemo(() => {
    return declined.find((t: CardTransaction) => t.id === selectedId);
  }, [declined, selectedId]);

  const selectedCard: VirtualCard | undefined = useMemo(() => {
    if (!selectedTxn) return undefined;
    return cards.find((c: VirtualCard) => c.id === selectedTxn.cardId);
  }, [cards, selectedTxn]);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isBusy]);

  function handleBack(): void {
    const target: AppScreen = "dashboard";
    setScreen(target);
  }

  function handlePickStarter(s: string): void {
    setInput(s);
  }

  function handleSelectTxn(id: string): void {
    setSelectedId((prev: string | null) => (prev === id ? null : id));
  }

  async function handleSend(): Promise<void> {
    const trimmed = input.trim();
    if (trimmed.length === 0 || isBusy) return;
    const userMsg: AssistantMessage = {
      id: makeId("user"),
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev: AssistantMessage[]) => [...prev, userMsg]);
    setInput("");
    setIsBusy(true);
    const txnSnapshot = selectedTxn;
    const cardSnapshot = selectedCard;
    const question = trimmed;

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 600);
    });

    let replyText = buildLocalReply(question, txnSnapshot, cardSnapshot);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                question +
                (txnSnapshot
                  ? " Context: " +
                    txnSnapshot.storeName +
                    " " +
                    formatCurrency(txnSnapshot.amountCents) +
                    " on " +
                    formatDate(txnSnapshot.occurredAt) +
                    ", reason: " +
                    (txnSnapshot.reason || "declined")
                  : ""),
            },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: unknown };
        if (data && typeof data.text === "string" && data.text.trim().length > 0) {
          replyText = data.text;
        }
      }
    } catch {
      replyText = buildLocalReply(question, txnSnapshot, cardSnapshot);
    }

    const aiMsg: AssistantMessage = {
      id: makeId("assistant"),
      role: "assistant",
      text: replyText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev: AssistantMessage[]) => [...prev, aiMsg]);
    setIsBusy(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setInput(e.target.value);
  }

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      void handleSend();
    }
  }

  const sendDisabled = input.trim().length === 0 || isBusy;

  return (
    <div
      style={{
        backgroundColor: colors.background,
        minHeight: "100vh",
        fontFamily: typography.fontFamily,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, padding: spacing.md, paddingBottom: spacing.lg }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.primary,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            fontFamily: typography.fontFamily,
            padding: 0,
            marginBottom: spacing.sm,
          }}
        >
          ← Back to dashboard
        </button>

        <h1
          style={{
            color: colors.text,
            fontSize: typography.sizeLg,
            fontWeight: typography.weightBold,
            margin: 0,
            marginBottom: spacing.sm,
          }}
        >
          Payment helper
        </h1>
        <p style={{ color: colors.textMuted, fontSize: typography.sizeSm, margin: 0, marginBottom: spacing.md }}>
          {testModeMessage}
        </p>

        <div
          style={{
            backgroundColor: colors.surface,
            border: "1px solid " + colors.border,
            borderRadius: radii.lg,
            boxShadow: shadows.soft,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <p
            style={{
              color: colors.text,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              margin: 0,
              marginBottom: spacing.sm,
            }}
          >
            Declined payments — pick one for context
          </p>
          {declined.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: typography.sizeSm, margin: 0 }}>
              No declined payments right now. Nice work.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {declined.map((t: CardTransaction) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTxn(t.id)}
                    style={{
                      cursor: "pointer",
                      borderRadius: radii.pill,
                      border: "1px solid " + (active ? colors.primary : colors.border),
                      backgroundColor: active ? colors.primarySoft : colors.white,
                      color: active ? colors.primary : colors.text,
                      fontSize: typography.sizeSm,
                      fontWeight: typography.weightMedium,
                      fontFamily: typography.fontFamily,
                      padding: "6px 12px",
                    }}
                  >
                    {t.storeName} · {formatCurrency(t.amountCents)} · {formatDate(t.occurredAt)}
                  </button>
                );
              })}
            </div>
          )}
          {selectedTxn ? (
            <p style={{ color: colors.textMuted, fontSize: typography.sizeSm, margin: 0, marginTop: spacing.sm }}>
              Giving context: {selectedTxn.storeName} · {formatCurrency(selectedTxn.amountCents)} ·{" "}
              {formatDate(selectedTxn.occurredAt)}
              {selectedTxn.reason ? " · " + selectedTxn.reason : ""}
            </p>
          ) : null}
        </div>

        <div
          style={{
            backgroundColor: colors.surface,
            border: "1px solid " + colors.border,
            borderRadius: radii.lg,
            boxShadow: shadows.soft,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <p
            style={{
              color: colors.text,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              margin: 0,
              marginBottom: spacing.sm,
            }}
          >
            Try asking
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
            {assistantStarters.map((s: string) => (
              <button
                key={s}
                type="button"
                onClick={() => handlePickStarter(s)}
                style={{
                  cursor: "pointer",
                  borderRadius: radii.pill,
                  border: "1px solid " + colors.border,
                  backgroundColor: colors.primarySoft,
                  color: colors.text,
                  fontSize: typography.sizeSm,
                  fontFamily: typography.fontFamily,
                  padding: "6px 12px",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={listRef}
          style={{
            backgroundColor: colors.surface,
            border: "1px solid " + colors.border,
            borderRadius: radii.lg,
            boxShadow: shadows.soft,
            padding: spacing.md,
            maxHeight: 340,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          {messages.map((m: AssistantMessage) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  backgroundColor: isUser ? colors.primary : colors.primarySoft,
                  color: isUser ? colors.white : colors.text,
                  borderRadius: radii.md,
                  padding: spacing.sm + " " + spacing.md,
                  maxWidth: "85%",
                  fontSize: typography.sizeMd,
                }}
              >
                <div>{m.text}</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: typography.sizeSm,
                    color: isUser ? colors.white : colors.textMuted,
                    opacity: 0.85,
                  }}
                >
                  {formatDate(m.createdAt)}
                </div>
              </div>
            );
          })}
          {isBusy ? (
            <div
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.primarySoft,
                color: colors.textMuted,
                borderRadius: radii.md,
                padding: spacing.sm + " " + spacing.md,
                fontSize: typography.sizeSm,
              }}
            >
              Thinking in plain words…
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            gap: spacing.sm,
            alignItems: "center",
            backgroundColor: colors.surface,
            border: "1px solid " + colors.border,
            borderRadius: radii.lg,
            boxShadow: shadows.soft,
            padding: spacing.sm,
          }}
        >
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKey}
            placeholder="Ask why a payment was declined…"
            aria-label="Ask the assistant"
            style={{
              flex: 1,
              border: "1px solid " + colors.border,
              borderRadius: radii.pill,
              padding: "10px 14px",
              fontSize: typography.sizeMd,
              fontFamily: typography.fontFamily,
              color: colors.text,
              backgroundColor: colors.white,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sendDisabled}
            style={{
              cursor: sendDisabled ? "not-allowed" : "pointer",
              border: "none",
              borderRadius: radii.pill,
              backgroundColor: sendDisabled ? colors.border : colors.primary,
              color: colors.white,
              fontSize: typography.sizeMd,
              fontWeight: typography.weightMedium,
              fontFamily: typography.fontFamily,
              padding: "10px 18px",
            }}
          >
            {isBusy ? "…" : "Send"}
          </button>
        </div>

        <p style={{ color: colors.success, fontSize: typography.sizeSm, marginTop: spacing.sm, marginBottom: 0 }}>
          Test helper: answers use simple words and never need a secret key.
        </p>
      </div>
    </div>
  );
}
