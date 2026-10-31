import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function AppShellScreen() {
  void theme;
  return (
    <div
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
        minHeight: "100%",
      }}
    >
      <style>{`.pp-hero{padding:${spacing.xxl} ${spacing.lg} ${spacing.xl};background-color:${colors.surface};border-bottom:1px solid ${colors.line}}.pp-eyebrow{display:inline-block;font-family:${typography.heading};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${colors.midnightInk};background-color:${colors.midnight};border-radius:${radii.pill}px;padding:6px 14px;margin-bottom:${spacing.md}}.pp-hero h1{font-family:${typography.heading};font-size:40px;line-height:1.05;margin:0 0 ${spacing.md};color:${colors.ink}}.pp-hero p{margin:0;max-width:34rem;color:${colors.muted};font-size:17px;line-height:1.6}.pp-wrap{max-width:960px;margin:0 auto;padding:${spacing.xl} ${spacing.lg} ${spacing.xxl}}.pp-section{margin:0 0 ${spacing.xl}}.pp-section h2{font-family:${typography.heading};font-size:22px;margin:0 0 ${spacing.md};color:${colors.ink}}.pp-grid{display:grid;grid-template-columns:1fr;gap:${spacing.md}}.pp-card{background-color:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;padding:${spacing.lg};box-shadow:${shadows.soft};transition:transform 180ms ease,box-shadow 180ms ease}.pp-card h3{font-family:${typography.heading};font-size:17px;margin:0 0 8px;color:${colors.ink}}.pp-card p{margin:0 0 ${spacing.md};color:${colors.muted};font-size:15px;line-height:1.6}.pp-lift:hover{transform:translateY(-3px);box-shadow:${shadows.lift}}.pp-btn-row{display:flex;flex-wrap:wrap;gap:${spacing.md}}.pp-btn-mint{font-family:${typography.heading};font-size:15px;font-weight:700;color:${colors.midnightInk};background-color:${colors.mint};border:1px solid ${colors.mint};border-radius:${radii.pill}px;padding:12px 22px;cursor:pointer;transition:transform 150ms ease,box-shadow 150ms ease}.pp-btn-mint:hover{transform:translateY(-2px);box-shadow:${shadows.lift}}.pp-btn-mint:focus-visible{outline:3px solid ${colors.midnight};outline-offset:3px}.pp-note{font-size:14px;color:${colors.muted};margin:${spacing.md} 0 0;line-height:1.6}.pp-foot{border-top:1px solid ${colors.line};padding:${spacing.lg};text-align:center;color:${colors.muted};font-size:14px}@media(min-width:720px){.pp-grid{grid-template-columns:repeat(3,1fr)}}@media(prefers-reduced-motion:reduce){.pp-card,.pp-btn-mint,.pp-lift{transition:none!important;transform:none!important}}`}</style>
      <section className="pp-hero" aria-labelledby="app-shell-heading">
        <RevealOnScroll delayMs={0}>
          <span className="pp-eyebrow">Clear Mint</span>
          <h1 id="app-shell-heading">App shell</h1>
          <p>A calm shell with sticky navigation and held content width.</p>
        </RevealOnScroll>
      </section>
      <div className="pp-wrap">
        <section className="pp-section" aria-labelledby="app-shell-dashboard">
          <RevealOnScroll delayMs={0}>
            <h2 id="app-shell-dashboard">Dashboard home</h2>
            <div className="pp-grid">
              <article className="pp-card pp-lift">
                <h3>Dashboard home</h3>
                <p>The dashboard is home, with balance at a glance and a cards grid for quick review.</p>
              </article>
            </div>
          </RevealOnScroll>
        </section>
        <section className="pp-section" aria-labelledby="app-shell-width">
          <RevealOnScroll delayMs={80}>
            <h2 id="app-shell-width">Held content width</h2>
            <div className="pp-grid">
              <article className="pp-card pp-lift">
                <h3>Held content width</h3>
                <p>A centered main landmark, mobile-first and readable on phones, keeps content comfortably held.</p>
              </article>
            </div>
            <p className="pp-note">The real sticky nav comes from AppShell; this page only describes it.</p>
          </RevealOnScroll>
        </section>
        <section className="pp-section" aria-labelledby="app-shell-actions">
          <RevealOnScroll delayMs={160}>
            <h2 id="app-shell-actions">Primary actions</h2>
            <div className="pp-grid">
              <article className="pp-card pp-lift">
                <h3>Primary actions</h3>
                <p>Start with demo actions. Nothing navigates and focus stays visible by keyboard.</p>
                <div className="pp-btn-row">
                  <button type="button" className="pp-btn-mint">
                    Add money
                  </button>
                  <button type="button" className="pp-btn-mint">
                    New card
                  </button>
                </div>
              </article>
            </div>
          </RevealOnScroll>
        </section>
        <p className="pp-note">Test mode: no real money moves.</p>
      </div>
    </div>
  );
}
