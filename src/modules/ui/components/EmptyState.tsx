import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

export function EmptyState({ title, hint = "", actionLabel, onAction }: { title: string; hint?: string; actionLabel?: string; onAction?: () => void }) {
  void theme;
  const showAction: boolean = Boolean(actionLabel && onAction);
  const handleAction: () => void = () => {
    if (onAction) {
      onAction();
    }
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radii.lg,
          boxShadow: shadows.soft,
          padding: spacing.lg,
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          fontFamily: typography.fontFamily,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: colors.primarySoft,
            color: colors.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
            fontFamily: typography.fontFamily,
            margin: `0 auto ${spacing.md}px auto`,
          }}
        >
          +
        </div>
        <div
          style={{
            color: colors.text,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
            fontFamily: typography.fontFamily,
            marginBottom: spacing.md,
          }}
        >
          {title}
        </div>
        {hint ? (
          <div
            style={{
              color: colors.textMuted,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              fontFamily: typography.fontFamily,
              marginBottom: showAction ? spacing.md : 0,
            }}
          >
            {hint}
          </div>
        ) : null}
        {showAction ? (
          <button
            type="button"
            onClick={handleAction}
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: `1px solid ${colors.primary}`,
              borderRadius: radii.lg,
              padding: `${spacing.md / 2}px ${spacing.md}px`,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              fontFamily: typography.fontFamily,
              cursor: "pointer",
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
