import { useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { formatCurrency, formatDate, formatCapUsage } from "@/modules/ui/lib/format";
import { isNearCap, isExpiringSoon } from "@/modules/ui/lib/alerts";
import { LedgerBand } from "@/modules/ui/components/LedgerBand";
import { SpendingMeter } from "@/modules/ui/components/SpendingMeter";
import { TransactionList } from "@/modules/ui/components/TransactionList";
import { WarningBanner } from "@/modules/ui/components/WarningBanner";
import { EmptyState } from "@/modules/ui/components/EmptyState";
import type { VirtualCard, CardTransaction } from "@/modules/ui/types";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function CardDetailScreen(props: { cardId: string; onBack: () => void; onAddMoney?: () => void }) {
  const { cardId, onBack, onAddMoney }: { cardId: string; onBack: () => void; onAddMoney?: () => void } = props;
  void theme;
  const { cards, transactions, balance, freezeCard, unfreezeCard, closeCard, setCardLimit } = usePayProxy();
  const [limitText, setLimitText] = useState<string>("");
  const [limitBusy, setLimitBusy] = useState<boolean>(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [limitDone, setLimitDone] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);


  const card: VirtualCard | undefined = cards.find((c: VirtualCard) => c.id === cardId);
  const cardTxns: CardTransaction[] = transactions.filter((t: CardTransaction) => t.cardId === cardId);

  if (!card) {
    return (
      <div style={{ backgroundColor: colors.page, minHeight: "100vh", padding: spacing.lg, fontFamily: typography.body }}>
        <EmptyState title="Card not found" hint="This card no longer exists." actionLabel="Back" onAction={onBack} />
      </div>
    );
  }

  const found: VirtualCard = card;
  const balanceCents: number = balance.availableCents;
  const isFrozen: boolean = found.status === "frozen";
  const isClosed: boolean = found.status === "closed";

  const warnings: { id: string; kind: "near-cap" | "expiring"; title: string; message: string; cardId?: string }[] = [];
  if (isNearCap(found)) {
    warnings.push({
      id: "near-cap-" + found.id,
      kind: "near-cap",
      title: found.name + " is near its limit",
      message: formatCapUsage(found.spentCents, found.capCents) + " used.",
      cardId: found.id,
    });
  }
  if (isExpiringSoon(found)) {
    warnings.push({
      id: "expiring-" + found.id,
      kind: "expiring",
      title: found.name + " ends soon",
      message: "It stops working " + formatDate(found.endDate) + ".",
      cardId: found.id,
    });
  }

  function handleFreeze(): void {
    void freezeCard(found.id);
  }
  function handleUnfreeze(): void {
    void unfreezeCard(found.id);
  }
  function handleClose(): void {
    void closeCard(found.id);
  }

  // A limit can go down to what the card has spent, and up only as far as the money in the wallet covers.
  const highestCents: number = Math.min(1_000_000, Math.max(found.capCents, found.spentCents + balanceCents));
  async function handleLimit(): Promise<void> {
    setLimitError(null);
    setLimitDone(null);
    const cents = Math.round(Number(limitText.replace(/[$,\s]/g, "")) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return setLimitError("Enter the new limit in dollars, like 180.");
    if (cents < Math.max(found.spentCents, 1)) return setLimitError("The limit can't be lower than what this card has already spent (" + formatCurrency(found.spentCents) + ").");
    if (cents > highestCents) {
      return setLimitError("You have " + formatCurrency(balanceCents) + " in your wallet, so this card's limit can go up to " + formatCurrency(highestCents) + ". Add money first to raise it more.");
    }
    setLimitBusy(true);
    try {
      await setCardLimit(found.id, cents);
      setLimitDone("Done. " + found.name + "'s limit is now " + formatCurrency(cents) + ".");
      setLimitText("");
    } catch (e: unknown) {
      setLimitError(e instanceof Error ? e.message : "The limit couldn't be changed. Try again.");
    } finally {
      setLimitBusy(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        minHeight: "100vh",
        padding: spacing.lg,
        fontFamily: typography.body,
        display: "flex",
        flexDirection: "column",
        gap: spacing.lg,
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: colors.surface,
            color: colors.ink,
            border: "1px solid " + colors.line,
            borderRadius: radii.card,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
            fontFamily: typography.body,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
      <div>
        <LedgerBand card={found} balanceCents={balanceCents} onFreeze={handleFreeze} onUnfreeze={handleUnfreeze} />
      </div>
      <div>
        <section
          className="pp-card"
          aria-label="Card details"
          style={{
            backgroundColor: colors.surface,
            border: "1px solid " + colors.line,
            borderRadius: radii.card,
            boxShadow: shadows.soft,
            padding: spacing.lg,
            display: "grid",
            gap: spacing.md,
          }}
        >
          <div style={{ display: "grid", gap: spacing.md }}>
            <div>
              <span style={{ color: colors.muted, fontSize: 13 }}>Limit </span>
              <span>{formatCurrency(found.capCents)}</span>
            </div>
            <div>
              <span style={{ color: colors.muted, fontSize: 13 }}>Spent </span>
              <span>{formatCapUsage(found.spentCents, found.capCents)}</span>
            </div>
            <div>
              <span style={{ color: colors.muted, fontSize: 13 }}>Stops working </span>
              <span>{formatDate(found.endDate)}</span>
            </div>
            <div>
              <span
                aria-live="polite"
                style={{
                  display: "inline-block",
                  backgroundColor: isClosed ? colors.line : colors.mint,
                  color: isClosed ? colors.muted : colors.midnightInk,
                  borderRadius: 999,
                  padding: "2px 12px",
                  fontSize: 13,
                }}
              >
                {found.status}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: spacing.md, flexWrap: "wrap" }}>
            {isFrozen ? (
              <button
                type="button"
                aria-label={"Unfreeze " + found.name}
                onClick={handleUnfreeze}
                disabled={isClosed}
                style={{
                  backgroundColor: colors.midnight,
                  color: colors.midnightInk,
                  border: "none",
                  borderRadius: radii.card,
                  padding: spacing.md,
                  fontFamily: typography.body,
                  cursor: isClosed ? "not-allowed" : "pointer",
                }}
              >
                Unfreeze
              </button>
            ) : (
              <button
                type="button"
                aria-label={"Freeze " + found.name}
                onClick={handleFreeze}
                disabled={isClosed}
                style={{
                  backgroundColor: colors.midnight,
                  color: colors.midnightInk,
                  border: "none",
                  borderRadius: radii.card,
                  padding: spacing.md,
                  fontFamily: typography.body,
                  cursor: isClosed ? "not-allowed" : "pointer",
                }}
              >
                Freeze
              </button>
            )}
            <button
              type="button"
              aria-label={"Close " + found.name}
              onClick={handleClose}
              disabled={isClosed}
              style={{
                backgroundColor: colors.surface,
                color: colors.ink,
                border: "1px solid " + colors.line,
                borderRadius: radii.card,
                padding: spacing.md,
                fontFamily: typography.body,
                cursor: isClosed ? "not-allowed" : "pointer",
              }}
            >
              Close
            </button>
          </div>
        </section>
      </div>
      <div>
        <SpendingMeter spentCents={found.spentCents} capCents={found.capCents} />
      </div>
      {found.cardNumber && !isClosed ? (
        <section
          aria-label="Card number"
          style={{ background: "linear-gradient(135deg, #0E1726, #17405C)", color: "#FFFFFF", borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.lg }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ fontFamily: typography.heading, margin: 0, fontSize: 20, color: "#FFFFFF" }}>{found.name}</h2>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Digna · Visa · practice card</span>
          </div>
          <p style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 22, letterSpacing: 2, margin: "18px 0 10px" }}>
            {showDetails ? found.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : "•••• •••• •••• " + found.last4}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 14, alignItems: "center" }}>
            <span>Expires <strong>{showDetails ? found.exp : "••/••"}</strong></span>
            <span>Security code <strong>{showDetails ? found.cvc : "•••"}</strong></span>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              style={{ marginLeft: "auto", background: "#FFB020", color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "9px 16px", fontWeight: 700, cursor: "pointer" }}
            >
              {showDetails ? "Hide details" : "Show card details"}
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={() => { try { void navigator.clipboard?.writeText(found.cardNumber ?? ""); } catch { /* copying is optional */ } }}
                style={{ background: "transparent", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.4)", borderRadius: radii.pill, padding: "9px 16px", fontWeight: 600, cursor: "pointer" }}
              >
                Copy number
              </button>
            ) : null}
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "#C9CFDB" }}>
            Use these details on Try paying, just like a real card. Practice card: it works only on Digna's practice checkouts.
          </p>
        </section>
      ) : null}
      {!isClosed ? (
        <div>
          <section
            aria-label="Change limit"
            style={{ backgroundColor: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, boxShadow: shadows.soft, padding: spacing.lg }}
          >
            <h2 style={{ fontFamily: typography.heading, marginTop: 0, marginBottom: 6, color: colors.ink }}>Change limit</h2>
            <p style={{ margin: "0 0 12px", color: colors.muted, lineHeight: 1.6 }}>
              Need a little more for this bill? Raise the limit as far as the money in your wallet covers: up to <strong style={{ color: colors.ink }}>{formatCurrency(highestCents)}</strong> right now.
              You can lower it any time, down to what's already been spent ({formatCurrency(found.spentCents)}).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
                New limit (USD)
                <input
                  inputMode="decimal"
                  value={limitText}
                  placeholder={(found.capCents / 100).toFixed(2)}
                  onChange={(e) => setLimitText(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid " + colors.line, fontSize: 16, width: 160 }}
                />
              </label>
              <button
                type="button"
                onClick={() => void handleLimit()}
                disabled={limitBusy || limitText.trim() === ""}
                style={{ backgroundColor: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "13px 22px", fontWeight: 700, fontSize: 15, cursor: limitBusy ? "wait" : "pointer", opacity: limitText.trim() === "" ? 0.6 : 1 }}
              >
                {limitBusy ? "Saving…" : "Save limit"}
              </button>
              {onAddMoney ? (
                <button
                  type="button"
                  onClick={onAddMoney}
                  style={{ backgroundColor: colors.surface, color: colors.ink, border: "1px solid " + colors.line, borderRadius: radii.pill, padding: "13px 22px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                >
                  Add money
                </button>
              ) : null}
            </div>
            {limitError ? <p role="alert" style={{ margin: "12px 0 0", color: "#B42318" }}>{limitError}</p> : null}
            {limitDone ? <p role="status" style={{ margin: "12px 0 0", color: "#067647", fontWeight: 600 }}>{limitDone}</p> : null}
          </section>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div>
          <WarningBanner warnings={warnings} />
        </div>
      ) : null}
      <div>
        <section
          aria-label="History"
          style={{
            backgroundColor: colors.surface,
            border: "1px solid " + colors.line,
            borderRadius: radii.card,
            boxShadow: shadows.soft,
            padding: spacing.lg,
          }}
        >
          <h2 style={{ fontFamily: typography.heading, marginTop: 0, color: colors.ink }}>History</h2>
          <TransactionList transactions={cardTxns} />
        </section>
      </div>
    </div>
  );
}
