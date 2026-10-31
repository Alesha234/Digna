import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

const swatches: Array<{ label: string; value: string; bg: string; fg: string; border?: string }> = [
  { label: "Page", value: colors.page, bg: colors.page, fg: colors.ink, border: colors.line },
  { label: "White cards", value: colors.surface, bg: colors.surface, fg: colors.ink, border: colors.line },
  { label: "Midnight band", value: colors.midnight, bg: colors.midnight, fg: colors.midnightInk },
  { label: "Mint", value: colors.mint, bg: colors.mint, fg: colors.midnight },
];

export function StylesScreen() {
  return (
    <main
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
      }}
    >
      <style>{`
        .pp-hero{background:${theme.colors.surface};border-bottom:1px solid ${theme.colors.line};padding:${theme.spacing.xxl} ${theme.spacing.lg};}
        .pp-hero-inner{max-width:960px;margin:0 auto;}
        .pp-eyebrow{display:inline-block;background:${theme.colors.mint};color:${theme.colors.midnight};border-radius:${theme.radii.pill}px;padding:4px 14px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;}
        .pp-hero h1{font-family:${theme.typography.heading};font-size:44px;line-height:1.05;margin:${theme.spacing.md} 0 ${theme.spacing.sm} 0;}
        .pp-hero p{color:${theme.colors.muted};font-size:18px;max-width:60ch;margin:0;}
        .pp-section{max-width:960px;margin:0 auto;padding:${theme.spacing.xxl} ${theme.spacing.lg};}
        .pp-kicker{color:${theme.colors.muted};font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 ${theme.spacing.sm} 0;}
        .pp-section h2{font-family:${theme.typography.heading};font-size:28px;margin:0 0 ${theme.spacing.lg} 0;}
        .pp-grid{display:grid;gap:${theme.spacing.lg};grid-template-columns:1fr;}
        @media(min-width:760px){.pp-grid{grid-template-columns:repeat(3,1fr);}.pp-grid.pp-grid-2{grid-template-columns:repeat(2,1fr);}}
        .pp-card{background:${theme.colors.surface};border:1px solid ${theme.colors.line};border-radius:${theme.radii.card}px;padding:${theme.spacing.lg};box-shadow:${theme.shadows.soft};}
        .pp-card h3{font-family:${theme.typography.heading};font-size:18px;margin:0 0 ${theme.spacing.sm} 0;}
        .pp-card p{color:${theme.colors.muted};margin:0;font-size:15px;line-height:1.6;}
        .pp-lift{transition:transform 180ms ease,box-shadow 180ms ease;}
        .pp-lift:hover,.pp-lift:focus-within{transform:translateY(-4px);box-shadow:${theme.shadows.lift};}
        .pp-tint{background:${theme.colors.surface};border-top:1px solid ${theme.colors.line};border-bottom:1px solid ${theme.colors.line};}
        .pp-swatch{display:flex;align-items:center;gap:${theme.spacing.md};padding:${theme.spacing.sm} 0;border-bottom:1px solid ${theme.colors.line};}
        .pp-dot{width:32px;height:32px;border-radius:${theme.radii.pill}px;flex:none;border:1px solid ${theme.colors.line};}
        .pp-list{list-style:none;margin:${theme.spacing.md} 0 0 0;padding:0;display:grid;gap:${theme.spacing.sm};}
        .pp-list li{border:1px solid ${theme.colors.line};border-radius:${theme.radii.card}px;padding:${theme.spacing.sm} ${theme.spacing.md};font-size:14px;}
        .pp-list code{font-family:${theme.typography.body};font-weight:700;}
        @media(prefers-reduced-motion:reduce){.pp-lift,.pp-reveal{transition:none !important;transform:none !important;}}
      `}</style>
      <RevealOnScroll delayMs={0}>
        <section className="pp-hero" aria-labelledby="styles-title">
          <div className="pp-hero-inner">
            <span className="pp-eyebrow">Clear Mint</span>
            <h1 id="styles-title">Styles</h1>
            <p>Light and airy soft cards with one calm blue, rounded corners, and gentle motion.</p>
          </div>
        </section>
      </RevealOnScroll>
      <RevealOnScroll delayMs={80}>
        <section className="pp-section" aria-labelledby="readable-title">
          <p className="pp-kicker">Readable system</p>
          <h2 id="readable-title">A calm product language</h2>
          <div className="pp-grid">
            <article className="pp-card pp-lift" tabIndex={0}>
              <h3>Soft cards</h3>
              <p>White surfaces on a mint-tinted page with 14px radius and soft shadow for airy grouping.</p>
            </article>
            <article className="pp-card pp-lift" tabIndex={0}>
              <h3>Calm actions</h3>
              <p>One deep blue band for focus moments, mint actions for the happy path, never competing.</p>
            </article>
            <article className="pp-card pp-lift" tabIndex={0}>
              <h3>Mobile-first</h3>
              <p>Single column stacks into three-up grids, comfortable spacing, and full keyboard order.</p>
            </article>
          </div>
        </section>
      </RevealOnScroll>
      <RevealOnScroll delayMs={160} className="pp-tint">
        <section className="pp-section" aria-labelledby="colour-space-title">
          <p className="pp-kicker">Tokens</p>
          <h2 id="colour-space-title">Colour and space</h2>
          <div className="pp-grid pp-grid-2">
            <article
              className="pp-card pp-lift"
              tabIndex={0}
              aria-label="Colour tokens"
              style={{ padding: spacing.xl, boxShadow: shadows.soft, borderRadius: radii.card }}
            >
              <h3>Colour</h3>
              {swatches.map(function (s) {
                return (
                  <div className="pp-swatch" key={s.label}>
                    <span className="pp-dot" style={{ backgroundColor: s.bg, borderColor: s.border ?? s.bg }} aria-hidden="true" />
                    <div>
                      <strong>{s.label}</strong>
                      <br />
                      <code style={{ color: colors.muted }}>{s.value}</code>
                    </div>
                  </div>
                );
              })}
            </article>
            <article
              className="pp-card pp-lift"
              tabIndex={0}
              aria-label="Space tokens"
              style={{ padding: spacing.xl, boxShadow: shadows.soft, borderRadius: radii.card }}
            >
              <h3>Space and shape</h3>
              <p>Comfortable scale, 14px radius, and soft shadow that lifts to calm depth on hover.</p>
              <ul className="pp-list">
                <li>
                  <code>spacing.md</code> — {spacing.md}
                </li>
                <li>
                  <code>spacing.lg</code> — {spacing.lg}
                </li>
                <li>
                  <code>spacing.xl</code> — {spacing.xl}
                </li>
                <li>
                  <code>spacing.xxl</code> — {spacing.xxl}
                </li>
                <li>
                  <code>radii.card</code> — {radii.card}px
                </li>
                <li>
                  <code>radii.pill</code> — {radii.pill}px
                </li>
                <li>
                  <code>shadows.soft</code> — {shadows.soft}
                </li>
                <li>
                  <code>shadows.lift</code> — {shadows.lift}
                </li>
                <li>
                  <code>typography.heading</code> — {typography.heading}
                </li>
                <li>
                  <code>typography.body</code> — {typography.body}
                </li>
              </ul>
            </article>
          </div>
        </section>
      </RevealOnScroll>
    </main>
  );
}
