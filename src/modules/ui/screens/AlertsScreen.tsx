import { useMemo, useState } from "react";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { WarningBanner } from "@/modules/ui/components/WarningBanner";
import { isNearCap, isExpiringSoon, isLowBalance, buildWarnings } from "@/modules/ui/lib/alerts";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function AlertsScreen() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const { cards: demoCards, balance: demoBalance } = usePayProxy();

  const warnings = useMemo(function () {
    return buildWarnings(demoCards, demoBalance);
  }, [demoCards, demoBalance]);

  const lowBalance: boolean = isLowBalance(demoBalance);
  const nearCapCount: number = demoCards.filter(function (card) {
    return isNearCap(card);
  }).length;
  const expiringCount: number = demoCards.filter(function (card) {
    return isExpiringSoon(card);
  }).length;

  function handleWarningAction(w: { id: string; kind: string; title: string; message: string; actionLabel?: string }): void {
    void w;
  }

  function toggle(): void {
    setEnabled(function (prev: boolean) {
      return !prev;
    });
  }

  return (
    <div
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
        minHeight: "100vh",
      }}
    >
      <RevealOnScroll delayMs={0}>
        <section
          className="pp-hero"
          style={{
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.line}`,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: spacing.md,
              fontFamily: typography.body,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Test mode
          </p>
          <h1
            style={{
              margin: 0,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontSize: 32,
              lineHeight: 1.1,
              color: colors.ink,
            }}
          >
            Alerts
          </h1>
          <p
            style={{
              margin: 0,
              marginBottom: spacing.lg,
              fontFamily: typography.body,
              fontSize: 16,
              lineHeight: 1.5,
              color: colors.muted,
              maxWidth: 560,
            }}
          >
            Quiet warnings when balance runs low or card nears cap.
          </p>
          <p
            style={{
              margin: 0,
              marginBottom: spacing.lg,
              fontFamily: typography.body,
              fontSize: 14,
              lineHeight: 1.5,
              color: colors.muted,
            }}
          >
            {testModeMessage} No real money moves.
          </p>
          <button
            type="button"
            className="pp-btn-mint"
            aria-pressed={enabled}
            onClick={toggle}
            style={{
              backgroundColor: enabled ? colors.mintDark : colors.mint,
              color: "#0E1726",
              border: "none",
              borderRadius: radii.pill,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              paddingLeft: spacing.lg,
              paddingRight: spacing.lg,
              fontFamily: typography.body,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: shadows.soft,
            }}
          >
            Turn on warnings
          </button>
        </section>
      </RevealOnScroll>

      {enabled ? (
        <div
          style={{
            paddingTop: spacing.lg,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
          }}
        >
          <WarningBanner warnings={warnings} onAction={handleWarningAction} />
        </div>
      ) : null}

      <RevealOnScroll delayMs={80}>
        <section
          className="pp-section"
          style={{
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontSize: 22,
              color: colors.ink,
            }}
          >
            Low balance
          </h2>
          <div className="pp-grid" style={{ display: "grid", gap: spacing.md }}>
            <article
              className="pp-card pp-lift"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: radii.card,
                boxShadow: shadows.soft,
                padding: spacing.lg,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: spacing.md,
                  fontFamily: typography.heading,
                  fontSize: 17,
                  color: colors.ink,
                }}
              >
                Warn before the wallet runs dry
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.body,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: colors.muted,
                }}
              >
                We check your balance with isLowBalance and surface a gentle nudge when funds dip
                below the test threshold{lowBalance ? " — your demo balance is low right now." : "."}
              </p>
            </article>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={160} className="pp-reveal-last">
        <section
          className="pp-section"
          style={{
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: spacing.md,
              fontFamily: typography.heading,
              fontSize: 22,
              color: colors.ink,
            }}
          >
            Close to cap
          </h2>
          <div className="pp-grid" style={{ display: "grid", gap: spacing.md }}>
            <article
              className="pp-card pp-lift"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: radii.card,
                boxShadow: shadows.soft,
                padding: spacing.lg,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: spacing.md,
                  fontFamily: typography.heading,
                  fontSize: 17,
                  color: colors.ink,
                }}
              >
                Catch cards nearing their limit
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.body,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: colors.muted,
                }}
              >
                We use isNearCap and isExpiringSoon to flag cards at 80% of cap or expiring within
                7 days{nearCapCount > 0 ? ` — ${nearCapCount} demo card${nearCapCount === 1 ? " is" : "s are"} near cap` : ""}
                {expiringCount > 0 ? ` and ${expiringCount} expiring soon` : ""}. Turn on warnings
                to see them above via {theme.spacing.sm} rhythm.
              </p>
            </article>
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
