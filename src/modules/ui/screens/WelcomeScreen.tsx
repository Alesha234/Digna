import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

export function WelcomeScreen() {
  void PayProxyProvider;
  void theme;
  const { setScreen, signInDemo } = usePayProxy();

  function handleDemo() {
    signInDemo();
    setScreen("dashboard");
  }

  const benefits: Array<{ title: string; body: string; icon: string }> = [
    {
      title: "Capped cards for each service",
      body: "Create a virtual card per service with its own spending cap for cloud, hotels, rentals, and subscriptions.",
      icon: "💳",
    },
    {
      title: "Freeze in one tap",
      body: "Pause or resume any card instantly when a charge looks wrong or a trip ends.",
      icon: "❄️",
    },
    {
      title: "Plain-words decline help",
      body: "Understand why a payment was declined and what to do next, without bank jargon.",
      icon: "💬",
    },
  ];

  return (
    <div
      style={{
        background: colors.background,
        fontFamily: typography.fontFamily,
        minHeight: "100vh",
        padding: spacing.lg,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div
          style={{
            display: "inline-block",
            background: colors.primarySoft,
            color: colors.primary,
            borderRadius: radii.pill,
            padding: "6px 12px",
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            marginBottom: spacing.md,
          }}
        >
          {testModeMessage}
        </div>

        <div
          style={{
            fontSize: typography.sizeSm,
            fontWeight: typography.weightBold,
            color: colors.primary,
            letterSpacing: 1,
            marginBottom: spacing.md,
          }}
        >
          PayProxy
        </div>

        <h1
          style={{
            fontSize: typography.sizeLg,
            fontWeight: typography.weightBold,
            color: colors.text,
            margin: `0 0 ${spacing.md}px 0`,
            lineHeight: 1.3,
          }}
        >
          Virtual cards with spending caps when your card is not accepted
        </h1>

        <p
          style={{
            fontSize: typography.sizeSm,
            color: colors.textMuted,
            margin: `0 0 ${spacing.lg}px 0`,
            lineHeight: 1.5,
          }}
        >
          PayProxy helps Cash App, Chime, and prepaid users who get declined by
          cloud providers, hotels, car rentals, and subscriptions. Set a cap
          for each service and pay with confidence.
        </p>

        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.lg,
            boxShadow: shadows.soft,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            display: "flex",
            flexDirection: "column",
            gap: spacing.md,
          }}
        >
          {benefits.map((b) => (
            <div
              key={b.title}
              style={{ display: "flex", gap: spacing.md, alignItems: "flex-start" }}
            >
              <div
                style={{
                  background: colors.primarySoft,
                  borderRadius: radii.md,
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span>{b.icon}</span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: typography.sizeMd,
                    fontWeight: typography.weightMedium,
                    color: colors.text,
                  }}
                >
                  {b.title}
                </div>
                <div
                  style={{
                    fontSize: typography.sizeSm,
                    color: colors.textMuted,
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {b.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, marginBottom: spacing.xl }}>
          <button
            type="button"
            onClick={() => setScreen("auth")}
            style={{
              background: colors.primary,
              color: colors.white,
              border: "none",
              borderRadius: radii.md,
              padding: spacing.md,
              fontSize: typography.sizeMd,
              fontWeight: typography.weightBold,
              fontFamily: typography.fontFamily,
              cursor: "pointer",
            }}
          >
            Get started
          </button>
          <button
            type="button"
            onClick={handleDemo}
            style={{
              background: colors.white,
              color: colors.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              padding: spacing.md,
              fontSize: typography.sizeMd,
              fontWeight: typography.weightMedium,
              fontFamily: typography.fontFamily,
              cursor: "pointer",
              boxShadow: shadows.soft,
            }}
          >
            Try demo
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: typography.sizeSm,
            color: colors.textMuted,
          }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setScreen("auth")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: colors.primary,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightMedium,
              fontFamily: typography.fontFamily,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
