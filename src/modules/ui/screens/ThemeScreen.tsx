import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function ThemeScreen() {
  const pageStyle = {
    backgroundColor: colors.page,
    color: colors.ink,
    fontFamily: typography.body,
    paddingBottom: spacing.xl,
  };
  const heroStyle = {
    backgroundColor: colors.surface,
    borderBottom: "1px solid " + colors.line,
    padding: spacing.xl + " " + spacing.lg,
  };
  const eyebrowStyle = {
    display: "inline-block",
    backgroundColor: colors.page,
    border: "1px solid " + colors.mint,
    borderRadius: radii.pill,
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    padding: "6px 14px",
    margin: "0 0 " + spacing.md,
  };
  const h1Style = {
    fontFamily: typography.heading,
    fontSize: "40px",
    lineHeight: 1.1,
    margin: "0 0 " + spacing.md,
  };
  const subcopyStyle = {
    fontFamily: typography.body,
    color: colors.muted,
    fontSize: "17px",
    lineHeight: 1.6,
    maxWidth: "60ch",
    margin: 0,
  };
  const sectionStyle = {
    padding: spacing.xl + " " + spacing.lg,
  };
  const sectionTitleStyle = {
    fontFamily: typography.heading,
    fontSize: "24px",
    margin: "0 0 " + spacing.md,
  };
  const cardBase = {
    backgroundColor: colors.surface,
    border: "1px solid " + colors.line,
    borderRadius: radii.card,
    padding: spacing.lg,
  };
  const swatchRowStyle = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: spacing.md,
    marginTop: spacing.md,
  };
  const tokenTextStyle = {
    fontFamily: typography.body,
    color: colors.muted,
    fontSize: "13px",
    lineHeight: 1.6,
    margin: spacing.md + " 0 0",
  };
  const codeStyle = {
    fontFamily: typography.body,
    backgroundColor: colors.page,
    border: "1px solid " + colors.line,
    borderRadius: radii.card,
    display: "block",
    fontSize: "13px",
    marginTop: spacing.md,
    padding: spacing.md,
    overflowX: "auto" as const,
  };

  return (
    <article className="pp-card pp-lift" style={pageStyle}>
      <section className="pp-hero" aria-labelledby="theme-heading" style={heroStyle}>
        <p style={eyebrowStyle}>Clear Mint</p>
        <h1 id="theme-heading" style={h1Style}>
          Theme
        </h1>
        <p style={subcopyStyle}>
          Design tokens for a calm bank feel: soft surfaces, readable type, and gentle
          elevation.
        </p>
        <div style={swatchRowStyle}>
          <span
            style={{
              backgroundColor: colors.mint,
              borderRadius: radii.pill,
              display: "inline-block",
              width: "56px",
              height: "24px",
              border: "1px solid " + colors.line,
            }}
            role="img"
            aria-label={"Accent " + colors.mint}
          />
          <span
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.pill,
              display: "inline-block",
              width: "56px",
              height: "24px",
              border: "1px solid " + colors.line,
            }}
            role="img"
            aria-label={"Surface " + colors.surface}
          />
          <span
            style={{
              backgroundColor: colors.page,
              borderRadius: radii.pill,
              display: "inline-block",
              width: "56px",
              height: "24px",
              border: "1px solid " + colors.line,
            }}
            role="img"
            aria-label={"Page " + colors.page}
          />
        </div>
        <p style={tokenTextStyle}>
          page {theme.colors.page} · surface {theme.colors.surface} · ink{" "}
          {theme.colors.ink} · muted {theme.colors.muted} · mint {theme.colors.mint} ·
          line {theme.colors.line}
        </p>
      </section>

      <section
        className="pp-section"
        aria-labelledby="shadows-heading"
        style={sectionStyle}
      >
        <h2 id="shadows-heading" style={sectionTitleStyle}>
          Shadows
        </h2>
        <div className="pp-grid">
          <RevealOnScroll>
            <div style={{ ...cardBase, boxShadow: shadows.soft }}>
              <h3 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md }}>
                Soft
              </h3>
              <p style={{ ...subcopyStyle, fontSize: "15px" }}>
                Resting elevation for white 14px cards. Keeps content grounded on the
                page background without harsh edges.
              </p>
              <code style={codeStyle}>{shadows.soft}</code>
              <p style={tokenTextStyle}>
                Use at rest: lists, cards, panels on {colors.page}.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delayMs={120}>
            <div style={{ ...cardBase, boxShadow: shadows.lift }}>
              <h3 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md }}>
                Lift
              </h3>
              <p style={{ ...subcopyStyle, fontSize: "15px" }}>
                Hover-lift for interactive cards. Adds depth on focus or hover to signal
                that the card can be acted on.
              </p>
              <code style={codeStyle}>{shadows.lift}</code>
              <p style={tokenTextStyle}>
                Use on hover or focus: raised cards, tappable previews, dialogs.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="pp-section" aria-labelledby="type-heading" style={sectionStyle}>
        <h2 id="type-heading" style={sectionTitleStyle}>
          Type
        </h2>
        <div className="pp-grid">
          <RevealOnScroll>
            <div style={{ ...cardBase, boxShadow: shadows.soft }}>
              <h3 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md }}>
                Space Grotesk headings
              </h3>
              <p
                style={{
                  fontFamily: typography.heading,
                  fontSize: "28px",
                  lineHeight: 1.2,
                  margin: "0 0 " + spacing.md,
                }}
              >
                Calm money, clearly shown
              </p>
              <p style={{ ...subcopyStyle, fontSize: "15px" }}>
                Structured product headings with a grotesque voice. Use for page titles,
                card titles, and section labels.
              </p>
              <code style={codeStyle}>{typography.heading}</code>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delayMs={120}>
            <div style={{ ...cardBase, boxShadow: shadows.soft }}>
              <h3 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md }}>
                Figtree body
              </h3>
              <p
                style={{
                  fontFamily: typography.body,
                  fontSize: "17px",
                  lineHeight: 1.6,
                  margin: "0 0 " + spacing.md,
                }}
              >
                Humanist sans for balances, helper text, and long passages. Comfortable
                spacing keeps banking tasks easy to scan.
              </p>
              <p style={{ ...subcopyStyle, fontSize: "15px" }}>
                The quick transfer to Maya cleared before lunch.
              </p>
              <code style={codeStyle}>{typography.body}</code>
            </div>
          </RevealOnScroll>
        </div>
        <p style={tokenTextStyle}>
          radii.card {String(radii.card)} · spacing {spacing.md} / {spacing.lg} /{" "}
          {spacing.xl} · theme keys: colors, spacing, radii, shadows, typography
        </p>
      </section>
    </article>
  );
}
