import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { VirtualCardView } from "@/modules/ui/components/VirtualCardView";
import { SpendingMeter } from "@/modules/ui/components/SpendingMeter";
import { TransactionList } from "@/modules/ui/components/TransactionList";
import { WarningBanner } from "@/modules/ui/components/WarningBanner";
import { buildWarnings } from "@/modules/ui/lib/alerts";
import { formatCurrency, formatDate } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

export function CardDetailScreen() {
  void PayProxyProvider;
  void theme;
  const { cards, transactions, balance, selectedCardId, freezeCard, unfreezeCard, closeCard, setScreen } = usePayProxy();
  const card = cards.find((c) => c.id === selectedCardId);

  if (!card) {
    return (
      <div
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          padding: spacing.lg,
          fontSize: typography.sizeMd,
          fontWeight: typography.weightMedium,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            backgroundColor: colors.surface,
            border: "1px solid " + colors.border,
            borderRadius: radii.lg,
            padding: spacing.lg,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: typography.sizeMd, fontWeight: typography.weightBold, color: colors.text }}>
            No card selected
          </p>
          <p style={{ fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.textMuted }}>
            Choose a card to see its details.
          </p>
          <button
            type="button"
            onClick={() => setScreen("dashboard")}
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.primary,
              color: colors.white,
              border: "1px solid " + colors.border,
              borderRadius: radii.pill,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightBold,
              cursor: "pointer",
            }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const cardId: string = card.id;
  const spentCents: number = card.spentCents;
  const capCents: number = card.capCents;
  const endDate: string = card.endDate;
  const status: string = card.status;
  const warnings = buildWarnings(cards, balance).filter((w) => w.cardId === cardId);
  const cardTxns = transactions.filter((t) => t.cardId === cardId);
  const cardsById: Record<string, string> = {};
  for (const c of cards) {
    cardsById[c.id] = c.name;
  }

  function handleClose(): void {
    if (confirm("Close this card?")) {
      closeCard(cardId);
      setScreen("dashboard");
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        minHeight: "100vh",
        padding: spacing.md,
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <button
        type="button"
        onClick={() => setScreen("dashboard")}
        style={{
          alignSelf: "flex-start",
          backgroundColor: colors.surface,
          color: colors.primary,
          border: "1px solid " + colors.border,
          borderRadius: radii.pill,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          fontSize: typography.sizeSm,
          fontWeight: typography.weightMedium,
          cursor: "pointer",
        }}
      >
        Back
      </button>

      <VirtualCardView card={card} />

      <div
        style={{
          backgroundColor: colors.surface,
          border: "1px solid " + colors.border,
          borderRadius: radii.lg,
          padding: spacing.md,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
        }}
      >
        <SpendingMeter spentCents={spentCents} capCents={capCents} showLabels={true} />
        <div style={{ fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.textMuted }}>
          Ends {formatDate(endDate)} · Cap {formatCurrency(capCents)}
        </div>
        <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
          {status === "active" ? (
            <button
              type="button"
              onClick={() => freezeCard(cardId)}
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
                border: "1px solid " + colors.border,
                borderRadius: radii.md,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                paddingLeft: spacing.md,
                paddingRight: spacing.md,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightBold,
                cursor: "pointer",
              }}
            >
              Freeze
            </button>
          ) : null}
          {status === "frozen" ? (
            <button
              type="button"
              onClick={() => unfreezeCard(cardId)}
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
                border: "1px solid " + colors.border,
                borderRadius: radii.md,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                paddingLeft: spacing.md,
                paddingRight: spacing.md,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightBold,
                cursor: "pointer",
              }}
            >
              Unfreeze
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClose}
            style={{
              backgroundColor: colors.surface,
              color: colors.danger,
              border: "1px solid " + colors.border,
              borderRadius: radii.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
              paddingLeft: spacing.lg,
              paddingRight: spacing.lg,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {warnings.map((w) => (
        <WarningBanner key={w.id} warning={w} />
      ))}

      <div
        style={{
          backgroundColor: colors.surface,
          border: "1px solid " + colors.border,
          borderRadius: radii.lg,
          padding: spacing.md,
        }}
      >
        <div
          style={{
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          Transactions
        </div>
        <TransactionList transactions={cardTxns} cardsById={cardsById} />
      </div>
    </div>
  );
}
