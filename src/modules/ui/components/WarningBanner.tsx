import { AppWarning } from "@/modules/ui/types";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

export function WarningBanner(props: { warning: AppWarning; actionLabel?: string; onAction?: () => void }) {
  const { warning, actionLabel, onAction }: { warning: AppWarning; actionLabel?: string; onAction?: () => void } = props;
  const resolvedLabel: string = actionLabel ?? "View";
  const accent: string = warning.kind === "near-cap" ? colors.warning : warning.kind === "low-balance" ? colors.danger : colors.primary;
  const iconText: string = warning.kind === "expiring" ? "◷" : "!";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: radii.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        paddingLeft: spacing.md,
        paddingRight: spacing.md,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: radii.md,
          backgroundColor: colors.primarySoft,
          color: accent,
          fontSize: typography.sizeSm,
          fontWeight: typography.weightBold,
          border: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        {iconText}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: colors.text,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightBold,
          }}
        >
          {warning.title}
        </div>
        <div
          style={{
            color: colors.textMuted,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
          }}
        >
          {warning.message}
        </div>
      </div>
      {onAction ? (
        <button
          type="button"
          onClick={() => {
            if (onAction) {
              onAction();
            }
          }}
          style={{
            backgroundColor: colors.surface,
            color: colors.primary,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            paddingLeft: spacing.md,
            paddingRight: spacing.md,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {resolvedLabel}
        </button>
      ) : null}
    </div>
  );
}
