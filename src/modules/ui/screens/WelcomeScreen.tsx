import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

/** The hero's picture: three capped virtual cards, fanned, each with how much of its cap is spent. Sample cards. */
const HERO_CARDS = [
  { name: "Car rental", cap: 150, spent: 40, last: "7769", bg: "linear-gradient(135deg, #1B2B3A, #0A8F8A)", turn: "-9deg", shift: "-34px -20px" },
  { name: "Hotel", cap: 200, spent: 120, last: "1881", bg: "linear-gradient(135deg, #0A8F8A, #0EC49A)", turn: "6deg", shift: "40px 14px" },
  { name: "Cloud hosting", cap: 50, spent: 32, last: "4242", bg: "linear-gradient(135deg, #0C1F2E, #17405C)", turn: "-2deg", shift: "0px 48px" },
];

function HeroCards() {
  return (
    <div className="pp-card-stack" aria-label="Sample capped cards: cloud hosting, hotel and car rental" role="img">
      {HERO_CARDS.map((c) => (
        <div key={c.name} className="pp-vcard" style={{ background: c.bg, rotate: c.turn, translate: c.shift }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: typography.heading, fontWeight: 700, letterSpacing: "-0.01em" }}>PayProxy</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Virtual · Sample</span>
          </div>
          <div className="pp-vcard-chip" />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{c.name}</span>
              <span style={{ opacity: 0.9 }}>
                ${c.spent} of ${c.cap} cap
              </span>
            </div>
            <div className="pp-vcard-meter">
              <span style={{ width: `${Math.round((c.spent / c.cap) * 100)}%` }} />
            </div>
            <div style={{ fontSize: 14, letterSpacing: "0.16em", marginTop: 10, opacity: 0.9 }}>•••• {c.last}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WelcomeScreen(props: { onGetStarted?: () => void; onSignIn?: () => void; onTryDemo?: () => void }) {
  const { onGetStarted, onSignIn, onTryDemo } = props;
  void theme;

  const focusStyle = ":focus-visible{outline:3px solid " + colors.midnight + ";outline-offset:2px}";

  return (
    <div
      style={{
        background: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
      }}
    >
      <style>{".pp-btn-mint" + focusStyle + ".pp-btn-secondary" + focusStyle + "a" + focusStyle + "button" + focusStyle}</style>

      {/* 1 hero */}
      <section className="pp-hero" style={{ background: colors.page, padding: spacing.xxl + " " + spacing.lg }}>
        <RevealOnScroll delayMs={0}>
          <div className="pp-hero-grid">
            <div>
              <h1 className="pp-hero-title">Pay where your card gets declined.</h1>
              <p style={{ fontFamily: typography.body, color: colors.muted, fontSize: 18, lineHeight: 1.6, maxWidth: 540, margin: "0 0 " + spacing.lg }}>
                Cloud hosting, hotels and car rentals often turn away Cash App, Chime and prepaid cards. PayProxy gives you a
                virtual card for each one, with its own spending cap, so you pay with confidence and never overspend.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md, alignItems: "center" }}>
                <button
                  type="button"
                  className="pp-btn-mint"
                  onClick={onGetStarted}
                  style={{ background: colors.mint, color: colors.midnight, border: "none", borderRadius: radii.pill, padding: "14px 26px", fontFamily: typography.body, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: shadows.soft }}
                >
                  Get started
                </button>
                <button
                  type="button"
                  className="pp-btn-secondary"
                  onClick={onTryDemo}
                  style={{ background: colors.surface, color: colors.ink, border: "1px solid " + colors.line, borderRadius: radii.pill, padding: "14px 26px", fontFamily: typography.body, fontWeight: 600, fontSize: 16, cursor: "pointer" }}
                >
                  Try the demo
                </button>
              </div>
              <p style={{ color: colors.muted, fontSize: 14, margin: spacing.md + " 0 0" }}>
                Already have an account?{" "}
                <button type="button" onClick={onSignIn} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>
                  Sign in
                </button>
              </p>
            </div>
            <HeroCards />
          </div>
        </RevealOnScroll>
      </section>

      {/* 2 acceptance features grid */}
      <section className="pp-section" style={{ padding: spacing.xxl + " " + spacing.lg, background: colors.page }}>
        <RevealOnScroll delayMs={80}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <h2 style={{ fontFamily: typography.heading, color: colors.ink, margin: "0 0 " + spacing.lg }}>Accepted where your card is not</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: spacing.md }}>
              {[
                { t: "Cloud services", b: "Pay cloud providers that only take traditional bank cards." },
                { t: "Hotels", b: "Book hotels that decline prepaid cards at check-in." },
                { t: "Car rentals", b: "Reserve car rentals that require a traditional bank card." },
                { t: "Subscriptions", b: "Keep subscriptions running that only take traditional bank cards." },
              ].map((f) => (
                <article
                  key={f.t}
                  className="pp-card pp-lift"
                  style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.lg, boxShadow: shadows.soft }}
                >
                  <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 17 }}>{f.t}</h3>
                  <p style={{ margin: 0, color: colors.muted, fontSize: 14, lineHeight: 1.5 }}>{f.b}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* 3 virtual cards explainer */}
      <section className="pp-section" style={{ padding: spacing.xxl + " " + spacing.lg, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={160}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <h2 style={{ fontFamily: typography.heading, color: colors.ink, margin: "0 0 " + spacing.md }}>Virtual cards with spending caps</h2>
            <p style={{ color: colors.muted, fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
              Create a separate virtual card for each service with its own spending cap. If a charge goes over the cap,
              it is declined in plain words — so cloud bills, hotel holds, and subscriptions never surprise you.
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* 4 numbered steps How it works */}
      <section className="pp-section" style={{ padding: spacing.xxl + " " + spacing.lg, background: colors.page }}>
        <RevealOnScroll delayMs={0}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <h2 style={{ fontFamily: typography.heading, color: colors.ink, margin: "0 0 " + spacing.lg }}>How it works</h2>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: spacing.md }}>
              {[
                { n: "1", t: "Sign up", b: "Create your PayProxy account in minutes." },
                { n: "2", t: "Add money", b: "Add sample money to your wallet. No real money moves." },
                { n: "3", t: "Create capped card", b: "Create a capped card for each service and pay." },
              ].map((s) => (
                <li key={s.t}>
                  <article className="pp-card pp-lift" style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.lg, boxShadow: shadows.soft }}>
                    <div style={{ fontFamily: typography.heading, background: colors.mint, color: colors.midnight, width: 32, height: 32, borderRadius: radii.pill, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: spacing.md }}>{s.n}</div>
                    <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 17 }}>{s.t}</h3>
                    <p style={{ margin: 0, color: colors.muted, fontSize: 14, lineHeight: 1.5 }}>{s.b}</p>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </RevealOnScroll>
      </section>

      {/* 5 controls */}
      <section className="pp-section" style={{ padding: spacing.xxl + " " + spacing.lg, background: colors.page }}>
        <RevealOnScroll delayMs={80}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <h2 style={{ fontFamily: typography.heading, color: colors.ink, margin: "0 0 " + spacing.md }}>Stay in control</h2>
            <p style={{ color: colors.muted, fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
              Freeze, unfreeze or close in one tap. Pause any card instantly when a charge looks wrong or a trip ends,
              then resume it whenever you are ready.
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* 6 audience */}
      <section className="pp-section" style={{ padding: spacing.xxl + " " + spacing.lg, background: colors.surface, borderTop: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={160}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <h2 style={{ fontFamily: typography.heading, color: colors.ink, margin: "0 0 " + spacing.md }}>For Cash App, Chime and prepaid cards</h2>
            <p style={{ color: colors.muted, fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
              Built for Cash App, Chime, and prepaid users who get turned away by card not accepted. Use PayProxy virtual
              cards with spending caps for cloud services, hotels, car rentals, and subscriptions.
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* 7 midnight CTA */}
      <section className="pp-ledger-band" style={{ background: colors.midnight, color: colors.midnightInk, padding: spacing.xxl + " " + spacing.lg, textAlign: "center" }}>
        <RevealOnScroll delayMs={0}>
          <h2 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md, fontSize: 28 }}>Stop getting declined. Start with a capped card.</h2>
          <button
            type="button"
            className="pp-btn-mint"
            onClick={onGetStarted}
            style={{ background: colors.mint, color: colors.midnight, border: "none", borderRadius: radii.pill, padding: "12px 28px", fontFamily: typography.body, fontWeight: 700, fontSize: 16, cursor: "pointer" }}
          >
            Get started
          </button>
        </RevealOnScroll>
      </section>

    </div>
  );
}
