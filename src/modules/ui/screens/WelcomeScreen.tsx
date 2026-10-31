import { useEffect, useState } from "react";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

/** A picture Meta's Muse Image drew for this page (app/api/picture); while it draws, or if it can't, a soft panel. */
function Picture({ name, alt, ratio }: { name: string; alt: string; ratio: string }) {
  // Shown only once it has loaded: until then, or if it can't be drawn, the soft panel stays (never a broken image).
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div style={{ aspectRatio: ratio, borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, #E3F7F1, #D6E8F0)" }}>
      {mounted && (
        <img src={`/api/picture/${name}`} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setLoaded(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity .4s ease", color: "transparent" }} />
      )}
    </div>
  );
}

/** One capped virtual card, as the app shows them. Sample card. */
function SampleCard({ name, spent, cap, last, bg, style }: { name: string; spent: number; cap: number; last: string; bg: string; style?: React.CSSProperties }) {
  return (
    <div className="pp-vcard" style={{ background: bg, position: "relative", left: "auto", top: "auto", margin: 0, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: typography.heading, fontWeight: 700 }}>PayProxy</span>
        <span style={{ fontSize: 12, opacity: 0.85 }}>Virtual · Sample</span>
      </div>
      <div className="pp-vcard-chip" />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span style={{ fontWeight: 700 }}>{name}</span>
          <span style={{ opacity: 0.9 }}>${spent} of ${cap} cap</span>
        </div>
        <div className="pp-vcard-meter">
          <span style={{ width: `${Math.round((spent / cap) * 100)}%` }} />
        </div>
        <div style={{ fontSize: 14, letterSpacing: "0.16em", marginTop: 10, opacity: 0.9 }}>•••• {last}</div>
      </div>
    </div>
  );
}

const STORIES = [
  { picture: "cloud", alt: "A developer setting up hosting on a laptop", title: "Cloud bills", text: "Hosting and cloud billing pages often take credit cards only. Make a capped PayProxy card just for that bill, so it goes through and never runs over." },
  { picture: "hotel", alt: "A traveler checking in at a hotel desk", title: "Hotel check-in", text: "Hotels hold a deposit at check-in and many turn away prepaid cards. Give the hotel its own card with a cap that covers the stay and nothing more." },
  { picture: "rental", alt: "Friends picking up keys at a car rental counter", title: "Car rentals", text: "Rental counters ask for a credit card for the security deposit. A PayProxy card covers the deposit and freezes in one tap when you return the car." },
];

const FAQS = [
  { q: "Is this real money?", a: "No. PayProxy is a working sandbox: your account, wallet, cards and payments are real records, but every dollar is sample money. No real card, bank or merchant is ever contacted." },
  { q: "What can I try?", a: "Create an account and you start with $250 of sample money. Make capped virtual cards, freeze or close them, and use the test checkout to pay sample merchants with your everyday cards or your PayProxy cards and see what each would say." },
  { q: "Why do some checkouts decline Cash App, Chime or prepaid cards?", a: "Some merchants, like many cloud billing pages and rental counters, only take credit cards for billing or deposits. The test checkout's sample merchants follow rules like these so you can see the difference a capped card makes." },
  { q: "What does the money assistant use?", a: "Meta's Muse Spark model. It reads your cards and recent tries and explains a decline in plain words, with what to do next. It also reads photos of bills in Snap a bill." },
  { q: "Who drew the pictures on this page?", a: "Meta's Muse Image model. The people in them are invented." },
];

export function WelcomeScreen(props: { onGetStarted?: () => void; onSignIn?: () => void; onTryDemo?: () => void }) {
  const { onGetStarted, onSignIn, onTryDemo } = props;
  const section: React.CSSProperties = { padding: `${spacing.xxl} ${spacing.lg}` };
  const inner: React.CSSProperties = { maxWidth: 1080, margin: "0 auto" };
  const h2: React.CSSProperties = { fontFamily: typography.heading, color: colors.ink, fontSize: "clamp(26px, 3.4vw, 36px)", lineHeight: 1.15, margin: "0 0 12px" };
  const lead: React.CSSProperties = { color: colors.muted, fontSize: 17, lineHeight: 1.6, maxWidth: 640, margin: "0 0 28px" };
  const primary: React.CSSProperties = { background: colors.mint, color: colors.midnight, border: "none", borderRadius: radii.pill, padding: "14px 26px", fontFamily: typography.body, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: shadows.soft };
  const secondary: React.CSSProperties = { background: colors.surface, color: colors.ink, border: "1px solid " + colors.line, borderRadius: radii.pill, padding: "14px 26px", fontFamily: typography.body, fontWeight: 600, fontSize: 16, cursor: "pointer" };

  return (
    <div style={{ background: colors.page, color: colors.ink, fontFamily: typography.body }}>
      {/* Hero */}
      <section className="pp-hero" style={section}>
        <RevealOnScroll delayMs={0}>
          <div className="pp-hero-grid">
            <div>
              <p style={{ display: "inline-block", margin: "0 0 14px", padding: "6px 12px", borderRadius: 999, background: "#E3F7F1", color: colors.mintDark, fontWeight: 700, fontSize: 13 }}>Capped virtual cards · Free to try with sample money</p>
              <h1 className="pp-hero-title">Pay where your card gets declined.</h1>
              <p style={{ ...lead, fontSize: 18 }}>
                Cloud billing, hotels and car rentals often turn away Cash App, Chime and prepaid cards. PayProxy gives you a virtual card for each one, with its own spending cap, so you pay with confidence and never overspend.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md, alignItems: "center" }}>
                <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Create a free account</button>
                <button type="button" className="pp-btn-secondary" onClick={onTryDemo} style={secondary}>Try the demo</button>
              </div>
              <p style={{ color: colors.muted, fontSize: 14, margin: spacing.md + " 0 0" }}>
                Already have an account?{" "}
                <button type="button" onClick={onSignIn} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>Sign in</button>
                {" · "}Starts with $250 of sample money.
              </p>
            </div>
            <div style={{ position: "relative", maxWidth: 480, width: "100%", margin: "0 auto" }}>
              <Picture name="hero" alt="A person smiling at their phone after a payment went through" ratio="1 / 1" />
              <div className="pp-hero-float">
                <SampleCard name="Cloud hosting" spent={32} cap={50} last="4242" bg="linear-gradient(135deg, #0C1F2E, #17405C)" />
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* What it is */}
      <section aria-label="PayProxy in 30 seconds" style={{ padding: `0 ${spacing.lg} ${spacing.xxl}` }}>
        <div style={{ ...inner, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.md }}>
          {[
            { t: "The problem", b: "Cash App, Chime, debit and prepaid cards get turned away by many cloud bills, hotels and car rentals that want a credit card." },
            { t: "What PayProxy does", b: "Gives you a virtual card for each of those services. It runs like a credit card, pays from your PayProxy wallet, and can never spend past the cap you set." },
            { t: "What you can do today", b: "Make an account, get $250 of sample money, create capped cards, and see what real-style checkouts say to your everyday card versus a PayProxy card." },
          ].map((f) => (
            <article key={f.t} style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.lg }}>
              <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 8px", color: colors.ink }}>{f.t}</h2>
              <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{f.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={60}>
          <div style={inner}>
            <h2 style={h2}>Made for the moments your card gets turned away</h2>
            <p style={lead}>One card per service, each with its own cap. Paid from your PayProxy wallet, accepted like a credit card.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              {STORIES.map((s) => (
                <article key={s.title}>
                  <Picture name={s.picture} alt={s.alt} ratio="3 / 2" />
                  <h3 style={{ fontFamily: typography.heading, fontSize: 20, margin: "16px 0 6px" }}>{s.title}</h3>
                  <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* How it works */}
      <section className="pp-section" style={section}>
        <RevealOnScroll delayMs={0}>
          <div style={inner}>
            <h2 style={h2}>How it works</h2>
            <ol style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.md }}>
              {[
                { t: "Create your account", b: "Email and a password. You start with $250 of sample money in your wallet." },
                { t: "Make a capped card", b: "One per service: name it, set its cap and an end date." },
                { t: "Pay and stay in control", b: "Use it at checkout. Freeze it in one tap; it can never go over its cap." },
              ].map((s, i) => (
                <li key={s.t} className="pp-card" style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.lg, boxShadow: shadows.soft }}>
                  <div style={{ fontFamily: typography.heading, background: colors.mint, color: colors.midnight, width: 34, height: 34, borderRadius: radii.pill, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: spacing.md }}>{i + 1}</div>
                  <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 18 }}>{s.t}</h3>
                  <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </RevealOnScroll>
      </section>

      {/* Test checkout */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={0}>
          <div className="pp-hero-grid" style={{ alignItems: "center" }}>
            <div>
              <h2 style={h2}>Try it before you need it</h2>
              <p style={lead}>
                The test checkout has sample merchants with real-world rules: a cloud host that takes credit cards only, a hotel that turns away prepaid cards, a rental counter, a streaming service. Pay with a sample Chime debit card, a Cash App Card or a prepaid card, then with a PayProxy card, and see exactly what each checkout says.
              </p>
              <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Open the test checkout</button>
            </div>
            <div aria-label="An example of the test checkout" role="img" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { who: "Chime debit card (sample)", at: "Nimbus Cloud · $32.00", out: "Declined: credit cards only", ok: false },
                { who: "Prepaid card (sample)", at: "Harborview Hotel · $150.00", out: "Declined: no prepaid cards", ok: false },
                { who: "PayProxy card: Cloud hosting", at: "Nimbus Cloud · $32.00", out: "Approved · $18.00 left of cap", ok: true },
              ].map((r) => (
                <div key={r.who} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 12, background: r.ok ? "#F0FBF7" : "#FFF5F4", border: `1px solid ${r.ok ? colors.mint : "#F4B4AE"}` }}>
                  <span><strong>{r.who}</strong><span style={{ display: "block", fontSize: 13, color: colors.muted }}>{r.at}</span></span>
                  <strong style={{ color: r.ok ? colors.mintDark : "#B42318", textAlign: "right" }}>{r.out}</strong>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Built with Meta */}
      <section className="pp-section" style={section}>
        <RevealOnScroll delayMs={0}>
          <div style={inner}>
            <h2 style={h2}>Built on Meta's AI</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.md, marginTop: 20 }}>
              {[
                { t: "Money assistant", b: "Muse Spark explains why a payment was declined, in plain words, using your own cards and tries." },
                { t: "Snap a bill", b: "Muse Spark reads a photo of a bill: who it's from, how much, and when it's due." },
                { t: "This page's pictures", b: "Drawn by Muse Image. The people in them are invented." },
              ].map((f) => (
                <article key={f.t} className="pp-card" style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.lg }}>
                  <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 18 }}>{f.t}</h3>
                  <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{f.b}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* FAQ */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line }}>
        <div style={{ ...inner, maxWidth: 760 }}>
          <h2 style={h2}>Questions</h2>
          {FAQS.map((f) => (
            <details key={f.q} style={{ borderTop: "1px solid " + colors.line, padding: "16px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 17 }}>{f.q}</summary>
              <p style={{ margin: "10px 0 0", color: colors.muted, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pp-ledger-band" style={{ background: colors.midnight, color: colors.midnightInk, padding: spacing.xxl + " " + spacing.lg, textAlign: "center" }}>
        <h2 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md, fontSize: 30, color: "#FFFFFF" }}>Stop getting declined. Start with a capped card.</h2>
        <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Create a free account</button>
      </section>
    </div>
  );
}
