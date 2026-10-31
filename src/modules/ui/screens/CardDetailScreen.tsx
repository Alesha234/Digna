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
  void onAddMoney;
  const { cards, transactions, balance, freezeCard, unfreezeCard, closeCard }: {
    cards: VirtualCard[];
    transactions: CardTransaction[];
    balance: { availableCents: number };
    freezeCard: (id: string) => void;
    unfreezeCard: (id: string) => void;
    closeCard: (id: string) => void;
  } = usePayProxy() as unknown as {
    cards: VirtualCard[];
    transactions: CardTransaction[];
    balance: { availableCents: number };
    freezeCard: (id: string) => void;
    unfreezeCard: (id: string) => void;
    closeCard: (id: string) => void;
  };

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
      title: found.name + " is near its cap",
      message: formatCapUsage(found.spentCents, found.capCents) + " used.",
      cardId: found.id,
    });
  }
  if (isExpiringSoon(found)) {
    warnings.push({
      id: "expiring-" + found.id,
      kind: "expiring",
      title: found.name + " ends soon",
      message: "Ends " + formatDate(found.endDate) + ".",
      cardId: found.id,
    });
  }

  function handleFreeze(): void {
    freezeCard(found.id);
  }
  function handleUnfreeze(): void {
    unfreezeCard(found.id);
  }
  function handleClose(): void {
    closeCard(found.id);
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
      <div className="pp-reveal">
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
      <div className="pp-reveal">
        <LedgerBand card={found} balanceCents={balanceCents} onFreeze={handleFreeze} onUnfreeze={handleUnfreeze} />
      </div>
      <div className="pp-reveal">
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
              <span style={{ color: colors.muted, fontSize: 13 }}>Cap </span>
              <span>{formatCurrency(found.capCents)}</span>
            </div>
            <div>
              <span style={{ color: colors.muted, fontSize: 13 }}>Spent </span>
              <span>{formatCapUsage(found.spentCents, found.capCents)}</span>
            </div>
            <div>
              <span style={{ color: colors.muted, fontSize: 13 }}>Ends </span>
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
      <div className="pp-reveal">
        <SpendingMeter spentCents={found.spentCents} capCents={found.capCents} />
      </div>
      {warnings.length > 0 ? (
        <div className="pp-reveal">
          <WarningBanner warnings={warnings} />
        </div>
      ) : null}
      <div className="pp-reveal">
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
