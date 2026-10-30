import { formatPercent, formatCapUsage } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

export function SpendingMeter(props: { spentCents: number; capCents: number; showLabels?: boolean }) {
  const { spentCents, capCents, showLabels = true }: { spentCents: number; capCents: number; showLabels?: boolean } = props;
  const safeSpent: number = typeof spentCents === "number" && Number.isFinite(spentCents) ? spentCents : 0;
  const safeCap: number = typeof capCents === "number" && Number.isFinite(capCents) ? capCents : 0;
  const pct: number = safeCap <= 0 ? 0 : Math.round((safeSpent / safeCap) * 100);
  const safePct: number = Number.isFinite(pct) ? pct : 0;
  const clamped: number = Math.min(100, Math.max(0, safePct));
  const fillColor: string = safePct >= 100 ? colors.danger : safePct >= 80 ? colors.warning : colors.primary;
  return (
    <div>
      {showLabels ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.xs,
            gap: spacing.sm,
          }}
        >
          <span style={{ fontSize: typography.sizeSm, color: colors.textMuted }}>
            {formatCapUsage(safeSpent, safeCap)}
          </span>
          <span style={{ fontSize: typography.sizeXs, color: colors.textMuted }}>
            {formatPercent(safeSpent, safeCap)}
          </span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={safePct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: "100%",
          backgroundColor: theme.colors.primarySoft,
          border: "1px solid " + colors.border,
          borderRadius: radii.pill,
          height: spacing.sm,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: clamped + "%",
            height: "100%",
            backgroundColor: fillColor,
            borderRadius: radii.pill,
          }}
        />
      </div>
    </div>
  );
}
