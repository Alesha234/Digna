import { AppWarning } from "@/modules/ui/types";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function WarningBanner(props: { warnings: AppWarning[]; onAction?: (w: AppWarning) => void }) {
  const { warnings, onAction } = props;
  if (!warnings || warnings.length === 0) {
    return null;
  }
  function getActionLabel(w: AppWarning): string | undefined {
    return (w as AppWarning & { actionLabel?: string }).actionLabel;
  }
  return (
    <section
      className="pp-warnings"
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
        }}
      >
        {warnings.map((w: AppWarning) => {
          const label: string | undefined = getActionLabel(w);
          return (
            <li
              key={w.id}
              className="pp-card pp-warning"
              style={{
                backgroundColor: colors.surface,
                color: colors.ink,
                border: `1px solid ${colors.line}`,
                borderLeft: `4px solid ${colors.mint}`,
                borderRadius: radii.card,
                boxShadow: shadows.soft,
                paddingTop: spacing.md,
                paddingBottom: spacing.md,
                paddingLeft: spacing.md,
                paddingRight: spacing.md,
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontFamily: typography.heading,
                  color: colors.ink,
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: spacing.sm,
                }}
              >
                {w.title}
              </strong>
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.body,
                  color: colors.muted,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {w.message}
              </p>
              {label ? (
                <button
                  type="button"
                  className="pp-btn-mint"
                  onClick={() => {
                    if (onAction) {
                      onAction(w);
                    }
                  }}
                  style={{
                    marginTop: spacing.sm,
                    backgroundColor: colors.mint,
                    color: "#0E1726",
                    border: "none",
                    borderRadius: radii.card,
                    paddingTop: spacing.sm,
                    paddingBottom: spacing.sm,
                    paddingLeft: spacing.md,
                    paddingRight: spacing.md,
                    fontFamily: typography.body,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
