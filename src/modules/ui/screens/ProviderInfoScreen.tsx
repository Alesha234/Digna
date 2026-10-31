import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

const _themeCheck = theme;

export function ProviderInfoScreen() {
  return (
    <div
      className="pp-provider"
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
      }}
    >
      <style>{`
        .pp-provider { min-height: 100vh; }
        .pp-hero {
          background-color: ${colors.surface};
          border-bottom: 1px solid ${colors.line};
          padding: ${spacing.xxl} ${spacing.lg} ${spacing.xl};
          text-align: center;
        }
        .pp-eyebrow {
          display: inline-block;
          background-color: ${colors.mint};
          color: ${colors.midnight};
          font-family: ${typography.body};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px ${spacing.md};
          border-radius: ${radii.pill}px;
        }
        .pp-hero h1 {
          font-family: ${typography.heading};
          font-size: clamp(32px, 6vw, 52px);
          line-height: 1.05;
          margin: ${spacing.md} 0 ${spacing.md};
        }
        .pp-hero p {
          font-family: ${typography.body};
          color: ${colors.muted};
          font-size: 17px;
          line-height: 1.6;
          max-width: 36rem;
          margin: 0 auto;
        }
        .pp-section {
          padding: ${spacing.xl} ${spacing.lg};
          max-width: 72rem;
          margin: 0 auto;
        }
        .pp-section h2 {
          font-family: ${typography.heading};
          font-size: 24px;
          line-height: 1.2;
          margin: 0 0 ${spacing.md};
        }
        .pp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: ${spacing.md};
        }
        @media (min-width: 720px) {
          .pp-grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        }
        .pp-card {
          background-color: ${colors.surface};
          border: 1px solid ${colors.line};
          border-radius: ${radii.card}px;
          box-shadow: ${shadows.soft};
          padding: ${spacing.lg};
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .pp-card h3 {
          font-family: ${typography.heading};
          font-size: 18px;
          margin: 0 0 ${spacing.md};
        }
        .pp-card p {
          font-family: ${typography.body};
          color: ${colors.muted};
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }
        .pp-lift:hover, .pp-lift:focus-visible {
          transform: translateY(-4px);
          box-shadow: ${shadows.lift};
        }
        .pp-lift:focus-visible {
          outline: 2px solid ${colors.mint};
          outline-offset: 3px;
        }
        .pp-note {
          background-color: ${colors.midnight};
          color: ${colors.midnightInk};
          border-radius: ${radii.card}px;
          padding: ${spacing.lg};
          margin: ${spacing.xl} ${spacing.lg} ${spacing.xxl};
          max-width: 72rem;
          font-family: ${typography.body};
          font-size: 14px;
          line-height: 1.6;
          text-align: center;
        }
        @media (min-width: 720px) {
          .pp-note { margin-left: auto; margin-right: auto; }
        }
        .pp-reveal { opacity: 0; transform: translateY(12px); transition: opacity 240ms ease, transform 240ms ease; }
        .pp-reveal.is-visible { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .pp-reveal { opacity: 1; transform: none; transition: none; }
          .pp-card, .pp-lift, .pp-lift:hover, .pp-lift:focus-visible { transform: none; transition: none; }
          * { animation: none; }
        }
      `}</style>

      <section className="pp-hero" aria-labelledby="provider-title">
        <RevealOnScroll delayMs={0}>
          <span className="pp-eyebrow">Test mode</span>
          <h1 id="provider-title">Provider</h1>
          <p>
            The provider holds the PayProxy balance and issues capped virtual cards in test mode with no
            real money moves.
          </p>
        </RevealOnScroll>
      </section>

      <section className="pp-section" aria-labelledby="provider-balance">
        <RevealOnScroll delayMs={0}>
          <h2 id="provider-balance">Holds balance</h2>
          <div className="pp-grid">
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Holds balance">
              <h3>Holds balance</h3>
              <p>See the PayProxy balance at a glance. Test-mode sample money only.</p>
            </article>
          </div>
        </RevealOnScroll>
      </section>

      <section className="pp-section" aria-labelledby="provider-cards">
        <RevealOnScroll delayMs={80}>
          <h2 id="provider-cards">Creates capped cards</h2>
          <div className="pp-grid">
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Creates capped cards">
              <h3>Creates capped cards</h3>
              <p>
                Each card has a name like Google Cloud, a spending cap, and an end date YYYY-MM-DD. Freeze,
                unfreeze, or close in one tap.
              </p>
            </article>
          </div>
        </RevealOnScroll>
      </section>

      <section className="pp-section" aria-labelledby="provider-history">
        <RevealOnScroll delayMs={160}>
          <h2 id="provider-history">Records charges and declines</h2>
          <div className="pp-grid">
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Records charges and declines">
              <h3>Records charges and declines</h3>
              <p>
                History shows store name, amount, and date with a result of approved or declined.
              </p>
            </article>
          </div>
        </RevealOnScroll>
      </section>

      <p className="pp-note">{testModeMessage}</p>
    </div>
  );
}
