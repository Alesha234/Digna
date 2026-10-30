import type { VirtualCard } from "@/modules/ui/types";
import { formatDate, formatPercent, maskCardNumber, formatCapUsage } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

export function VirtualCardView(props: { card: VirtualCard; selected?: boolean; onOpen?: (id: string) => void }) {
  const card: VirtualCard = props.card;
  const selected: boolean = props.selected ?? false;
  const onOpen: ((id: string) => void) | undefined = props.onOpen;
  const themeFont: string = theme.typography.fontFamily;
  const cap: number = card.capCents > 0 ? card.capCents : 0;
  const rawPct: number = cap > 0 ? (card.spentCents / cap) * 100 : 0;
  const pct: number = Math.min(100, Math.max(0, rawPct));
  const nearCap: boolean = pct >= 80;
  const statusLabel: string = card.status === "active" ? "Active" : card.status === "frozen" ? "Frozen" : "Closed";
  const statusColor: string = card.status === "active" ? colors.success : card.status === "frozen" ? colors.warning : colors.textMuted;

  function handleOpen(): void {
    if (onOpen) {
      onOpen(card.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      style={{
        backgroundColor: colors.surface,
        border: "1px solid " + colors.border,
        outline: selected ? "2px solid " + colors.primary : "none",
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        padding: spacing.lg,
        fontFamily: typography.fontFamily,
        color: colors.text,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          backgroundColor: colors.primary,
          backgroundImage: "linear-gradient(135deg, " + colors.primary + ", " + colors.primaryDark + ")",
          borderRadius: radii.md,
          padding: spacing.md,
          color: colors.white,
          fontFamily: themeFont,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm }}>
          <span style={{ fontSize: typography.sizeMd, fontWeight: typography.weightBold }}>{card.name}</span>
          <span
            style={{
              backgroundColor: colors.primarySoft,
              color: statusColor,
              borderRadius: radii.pill,
              padding: "2px 10px",
              fontSize: typography.sizeXs,
              fontWeight: typography.weightBold,
            }}
          >
            {statusLabel}
          </span>
        </div>
        <div style={{ marginTop: spacing.sm, fontSize: typography.sizeSm, fontWeight: typography.weightMedium }}>
          {maskCardNumber(card.last4)}
        </div>
        <div style={{ marginTop: spacing.sm, fontSize: typography.sizeXs }}>Ends {formatDate(card.endDate)}</div>
      </div>
      <div style={{ marginTop: spacing.md, display: "flex", justifyContent: "space-between", gap: spacing.sm }}>
        <span style={{ fontSize: typography.sizeSm, fontWeight: typography.weightMedium, color: colors.text }}>
          {formatCapUsage(card.spentCents, card.capCents)}
        </span>
        <span style={{ fontSize: typography.sizeXs, color: colors.textMuted }}>{formatPercent(card.spentCents, card.capCents)}</span>
      </div>
      <div
        style={{
          marginTop: spacing.sm,
          height: 8,
          borderRadius: radii.pill,
          backgroundColor: colors.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: pct + "%",
            height: "100%",
            borderRadius: radii.pill,
            backgroundColor: nearCap ? colors.warning : colors.success,
          }}
        />
      </div>
    </div>
  );
}
