import { CardTransaction } from "@/modules/ui/types";
import { formatCurrency, formatDate, formatTxnResult } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

export function TransactionList(props: { transactions: CardTransaction[]; cardsById?: Record<string, string>; emptyTitle?: string; emptyHint?: string }) {
  const transactions: CardTransaction[] = props.transactions;
  const cardsById: Record<string, string> | undefined = props.cardsById;
  const emptyTitle: string = props.emptyTitle ?? "No history yet";
  const emptyHint: string = props.emptyHint ?? "Charges and declines will appear here";

  if (transactions.length === 0) {
    return (
      <div
        style={{
          fontFamily: theme.typography.fontFamily,
          backgroundColor: colors.surface,
          border: "1px solid " + colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: colors.text,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightMedium,
          }}
        >
          {emptyTitle}
        </div>
        <div
          style={{
            color: colors.textMuted,
            fontSize: typography.sizeSm,
            marginTop: spacing.sm,
          }}
        >
          {emptyHint}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: theme.typography.fontFamily,
        display: "flex",
        flexDirection: "column",
        gap: spacing.sm,
      }}
    >
      {transactions.map((txn: CardTransaction) => {
        const approved: boolean = txn.result === "approved";
        const cardName: string | undefined = cardsById ? cardsById[txn.cardId] : undefined;
        return (
          <div
            key={txn.id}
            style={{
              backgroundColor: colors.surface,
              border: "1px solid " + colors.border,
              borderRadius: radii.md,
              padding: spacing.md,
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.sm,
              }}
            >
              <span
                style={{
                  color: colors.text,
                  fontSize: typography.sizeMd,
                  fontWeight: typography.weightMedium,
                }}
              >
                {txn.storeName}
              </span>
              <span
                style={{
                  color: colors.text,
                  fontSize: typography.sizeMd,
                  fontWeight: typography.weightMedium,
                }}
              >
                {formatCurrency(txn.amountCents)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.sm,
              }}
            >
              <span
                style={{
                  color: colors.textMuted,
                  fontSize: typography.sizeSm,
                }}
              >
                {formatDate(txn.occurredAt)}
                {cardName ? " · " + cardName : ""}
              </span>
              <span
                style={{
                  color: approved ? colors.success : colors.danger,
                  backgroundColor: colors.primarySoft,
                  borderRadius: radii.pill,
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  paddingTop: spacing.sm / 2,
                  paddingBottom: spacing.sm / 2,
                  fontSize: typography.sizeSm,
                  fontWeight: typography.weightMedium,
                }}
              >
                {formatTxnResult(txn.result)}
              </span>
            </div>
            {txn.result === "declined" && txn.reason ? (
              <div
                style={{
                  color: colors.textMuted,
                  fontSize: typography.sizeSm,
                }}
              >
                {txn.reason}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
