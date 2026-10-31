import { colors, spacing, radii, typography, theme } from "@/modules/ui/theme";
import { formatCurrency, formatCapUsage } from "@/modules/ui/lib/format";
import type { VirtualCard } from "@/modules/ui/types";
import { SpendingMeter } from "@/modules/ui/components/SpendingMeter";

export function LedgerBand(props: {
  card: VirtualCard;
  balanceCents: number;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onViewHistory?: () => void;
}) {
  const { card, balanceCents, onFreeze, onUnfreeze, onViewHistory }: {
    card: VirtualCard;
    balanceCents: number;
    onFreeze: () => void;
    onUnfreeze: () => void;
    onViewHistory?: () => void;
  } = props;
  void theme;
  const isFrozen: boolean = card.status === "frozen";
  const balanceText: string = formatCurrency(balanceCents);
  const usageText: string = formatCapUsage(card.spentCents, card.capCents);
  const statusLabel: string =
    card.status === "active" ? "Active" : card.status === "frozen" ? "Frozen" : "Closed";

  return (
    <section
      className="pp-ledger-band"
      aria-label="Card and balance summary"
      style={{
        backgroundColor: colors.midnight,
        color: colors.midnightInk,
        borderRadius: radii.card,
        padding: spacing.lg,
        fontFamily: typography.body,
        display: "flex",
        flexWrap: "wrap",
        gap: spacing.lg,
      }}
    >
      <div
        className="pp-ledger-band-card"
        style={{
          flex: "1 1 240px",
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
        }}
      >
        <p
          className="pp-ledger-band-name"
          style={{
            fontFamily: typography.heading,
            fontSize: "20px",
            lineHeight: "28px",
            margin: "0",
            color: colors.midnightInk,
          }}
        >
          {card.name}
        </p>
        <p
          className="pp-ledger-band-number"
          style={{
            fontFamily: typography.body,
            fontSize: "15px",
            letterSpacing: "0.08em",
            margin: "0",
            color: colors.midnightInk,
          }}
        >
          {"•••• •••• •••• " + card.last4}
        </p>
        <p
          className="pp-ledger-band-end"
          style={{ fontFamily: typography.body, fontSize: "14px", margin: "0", color: colors.midnightInk }}
        >
          {"Ends " + card.endDate}
        </p>
        <span
          className="pp-ledger-band-status"
          aria-live="polite"
          style={{
            display: "inline-block",
            alignSelf: "flex-start",
            fontFamily: typography.body,
            fontSize: "13px",
            lineHeight: "20px",
            padding: "2px 12px",
            borderRadius: 999,
            backgroundColor: colors.mint,
            color: colors.midnight,
          }}
        >
          {statusLabel}
        </span>
      </div>
      <div
        className="pp-ledger-band-balance"
        style={{
          flex: "1 1 240px",
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
        }}
      >
        <p
          className="pp-ledger-band-balance-label"
          style={{ fontFamily: typography.body, fontSize: "13px", margin: "0", color: colors.midnightInk }}
        >
          Available balance
        </p>
        <p
          className="pp-ledger-band-balance-value"
          style={{
            fontFamily: typography.heading,
            fontSize: "32px",
            lineHeight: "40px",
            margin: "0",
            color: colors.midnightInk,
          }}
        >
          {balanceText}
        </p>
        <p
          className="pp-ledger-band-usage"
          style={{ fontFamily: typography.body, fontSize: "14px", margin: "0", color: colors.midnightInk }}
        >
          {usageText}
        </p>
        <SpendingMeter spentCents={card.spentCents} capCents={card.capCents} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md }}>
          {isFrozen ? (
            <button
              type="button"
              aria-label="Unfreeze card"
              onClick={onUnfreeze}
              style={{
                fontFamily: typography.body,
                backgroundColor: colors.mint,
                color: colors.midnight,
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              Unfreeze
            </button>
          ) : (
            <button
              type="button"
              aria-label="Freeze card"
              onClick={onFreeze}
              style={{
                fontFamily: typography.body,
                backgroundColor: colors.mint,
                color: colors.midnight,
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              Freeze
            </button>
          )}
          {typeof onViewHistory === "function" ? (
            <button
              type="button"
              onClick={onViewHistory}
              style={{
                fontFamily: typography.body,
                backgroundColor: "transparent",
                color: colors.midnightInk,
                border: "1px solid " + colors.midnightInk,
                borderRadius: 999,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              View history
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
