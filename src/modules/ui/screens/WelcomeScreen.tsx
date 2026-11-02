import { useEffect, useState } from "react";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";
import { comingSoonPlaces } from "@/modules/ui/data/demoData";
import type { ComingSoonPlace } from "@/modules/ui/types";

/** How each kind of coming-soon place is labelled. */
const COMING_SOON_KIND: Record<ComingSoonPlace["kind"], string> = { hotel: "Hotel", resort: "Resort", flight: "Airline", retailer: "Shop", rental: "Car rental", app: "Apps & games" };

/** A picture Meta's Muse Image drew for this page (app/api/picture); while it draws, or if it can't, a soft panel. */
function Picture({ name, alt, ratio, round = 18, position = "50% 30%", eager = false }: { name: string; alt: string; ratio: string; round?: number | string; position?: string; eager?: boolean }) {
  // Shown only once it has loaded: until then, or if it can't be drawn, the soft panel stays (never a broken image).
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div style={{ aspectRatio: ratio, borderRadius: round, overflow: "hidden", background: "linear-gradient(135deg, #FFF3D6, #D6E8F0)" }}>
      {mounted && (
        <img src={`/api/picture/${name}?v=3`} alt={alt} loading={eager ? "eager" : "lazy"} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position, display: "block", opacity: loaded ? 1 : 0, transition: "opacity .4s ease", color: "transparent" }} />
      )}
    </div>
  );
}

/** One Digna card, as the app shows them. Sample card. */
function SampleCard({ name, spent, cap, last, bg, style }: { name: string; spent: number; cap: number; last: string; bg: string; style?: React.CSSProperties }) {
  return (
    <div className="pp-vcard" style={{ background: bg, position: "relative", left: "auto", top: "auto", margin: 0, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: typography.heading, fontWeight: 700 }}>Digna</span>
        <span style={{ fontSize: 12, opacity: 0.85 }}>Digna card · Example</span>
      </div>
      <div className="pp-vcard-chip" />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span style={{ fontWeight: 700 }}>{name}</span>
          <span style={{ opacity: 0.9 }}>${spent} of ${cap} limit</span>
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
  { picture: "cloud", alt: "A developer in a wheelchair setting up hosting on a laptop", title: "Cloud bills", text: "Cloud services bill you after you use them, so many take credit cards only. Make a Digna card just for that bill, with a limit, so it can never run over." },
  { picture: "hotel", alt: "An older traveler checking in at a hotel desk with a friendly receptionist", title: "Hotel check-in", text: "Hotels set money aside at check-in for damage or extras, and many turn away prepaid cards for it. Give the hotel its own card, with a limit that covers the stay and nothing more." },
  { picture: "rental", alt: "Two friends picking up keys at a car rental counter", title: "Car rentals", text: "Rental counters hold a security deposit, and most only trust a credit card for it. A Digna card covers the deposit, and you can pause it in one tap when you bring the car back." },
];

const FAQS = [
  { q: "Is this real money?", a: "Not yet. Your account, cards and history are real and saved, but for now every dollar is practice money, so you can try everything without risk. Real cards are on the way, and we'll say so clearly here when they arrive." },
  { q: "What can I do today?", a: "Make a free account and you start with $250 in practice money. Make cards with limits, pause or close them, raise a limit when you need more, and use Pay a bill to pay sample businesses with an everyday card or a Digna card and see what each would say, and why." },
  { q: "Why do hotels, car rentals and cloud services turn down Cash App, Chime or prepaid cards?", a: "Usually it isn't about you or your money. Places that hold a deposit, or bill you after you use something, want a card that can't come up empty, so many only trust credit cards. The businesses on Pay a bill follow rules like these, so you can see exactly why a card gets turned down." },
  { q: "What does the money assistant use?", a: "Meta's Muse Spark AI. It looks at your cards and recent payments and explains a decline in plain words, with what to do next. It also reads your bills on Pay a bill." },
  { q: "Is Digna a bank?", a: "No. Digna is not a bank. When real cards arrive, they'll come through a licensed card partner." },
  { q: "Who drew the pictures on this page?", a: "Meta's Muse Image model. The people in them are invented." },
];

export function WelcomeScreen(props: { onGetStarted?: () => void; onSignIn?: () => void; onTryDemo?: () => void; onHowItWorks?: () => void; isSignedIn?: boolean; onDashboard?: () => void; onPayBill?: () => void }) {
  const { onGetStarted, onSignIn, onTryDemo, isSignedIn, onDashboard, onPayBill } = props;
  const section: React.CSSProperties = { padding: `${spacing.xxl} ${spacing.lg}` };
  const inner: React.CSSProperties = { maxWidth: 1080, margin: "0 auto" };
  const h2: React.CSSProperties = { fontFamily: typography.heading, color: colors.ink, fontSize: "clamp(28px, 3.6vw, 40px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, margin: "0 0 14px" };
  const lead: React.CSSProperties = { color: colors.muted, fontSize: 17, lineHeight: 1.6, maxWidth: 640, margin: "0 0 28px" };
  const primary: React.CSSProperties = { background: colors.mint, color: colors.midnight, border: "none", borderRadius: radii.pill, padding: "14px 26px", minHeight: 44, fontFamily: typography.body, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: shadows.soft };
  const secondary: React.CSSProperties = { background: colors.surface, color: colors.ink, border: "1px solid " + colors.line, borderRadius: radii.pill, padding: "14px 26px", minHeight: 44, fontFamily: typography.body, fontWeight: 600, fontSize: 16, cursor: "pointer" };

  return (
    <div style={{ background: colors.page, color: colors.ink, fontFamily: typography.body }}>
      {/* Hero (Nov 2, 2026): the promise on the left; on the right, a friendly person paying on their phone, drawn by Muse Image. */}
      <section className="pp-hero" style={section}>
        <RevealOnScroll delayMs={0}>
          <div className="pp-hero-split">
            <div className="pp-hero-copy">
              <span className="pp-blob pp-blob-left" aria-hidden="true" />
              <p className="pp-eyebrow">
                <span className="pp-pill-toggle-dot" aria-hidden="true" />
                Cards with limits you choose · Free to try
              </p>
              <h1 className="pp-hero-title pp-hero-title-left">Dignity at every checkout.</h1>
              <p className="pp-hero-lead">
                Hotels, car rentals and cloud services often turn away Cash App, Chime and prepaid cards, and rarely say why. Digna gives you a card for each one, paid from your own money, with a limit you choose. No credit check, no debt. And if a place ever says no, you'll know exactly why.
              </p>
              {isSignedIn ? (
                <>
                  <div className="pp-hero-cta-row pp-hero-cta-left">
                    <button type="button" className="pp-btn-mint" onClick={onDashboard} style={primary}>Dashboard</button>
                    <button type="button" className="pp-btn-secondary" onClick={onPayBill} style={secondary}>Pay a bill</button>
                  </div>
                  <p className="pp-micro pp-micro-left">Practice money for now: nothing real is charged.</p>
                </>
              ) : (
                <>
                  <div className="pp-hero-cta-row pp-hero-cta-left">
                    <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Create a free account</button>
                    <button type="button" className="pp-btn-secondary" onClick={onTryDemo} style={secondary}>Look around first</button>
                  </div>
                  <p className="pp-micro pp-micro-left">
                    Already have an account?{" "}
                    <button type="button" onClick={onSignIn} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Sign in</button>
                    {" · "}Starts with $250 in practice money.
                  </p>
                </>
              )}
              <div className="pp-faces" aria-label="Digna is made for everyone">
                <div className="pp-face-row" aria-hidden="true">
                  {["phone-a", "phone-b", "phone-c"].map((n) => (
                    <div key={n} className="pp-face">
                      <Picture name={n} alt="" ratio="1 / 1" round="50%" position="50% 35%" eager />
                    </div>
                  ))}
                </div>
                <p className="pp-faces-text">Made for everyone who's ever been turned away at a counter.</p>
              </div>
            </div>
            <div className="pp-hero-visual">
              <span className="pp-blob pp-blob-right" aria-hidden="true" />
              <div className="pp-hero-photo">
                <Picture name="hero" alt="A smiling woman paying on her phone in a sunny cafe" ratio="4 / 5" round={28} position="50% 35%" eager />
              </div>
              <div className="pp-hero-toast" aria-label="Example notification">
                <span className="pp-hero-toast-check" aria-hidden="true">✓</span>
                <span>
                  <strong>Approved · Harborview Hotel</strong>
                  <span className="pp-hero-toast-sub">$150.00 · Hotel card · Example</span>
                </span>
              </div>
              <div className="pp-hero-float-card">
                <SampleCard name="Hotel check-in" spent={150} cap={200} last="1881" bg="linear-gradient(135deg, #17405C, #0E1726)" />
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* What it is */}
      <section aria-label="Digna in 30 seconds" style={{ padding: `0 ${spacing.lg} ${spacing.xxl}` }}>
        <div style={{ ...inner, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.md }}>
          {[
            { t: "The problem", b: "Cash App, Chime, debit and prepaid cards get turned away by many hotels, car rentals and cloud services, and nobody explains why." },
            { t: "What Digna does", b: "Gives you a card for each of those places. It works like a credit card, pays from your Digna wallet, and can never spend past the limit you choose." },
            { t: "What you can do today", b: "Make an account, get $250 in practice money, make cards, and see what real-world checkouts say to your everyday card versus a Digna card. Real cards are coming." },
          ].map((f, i) => (
            <article key={f.t} className="pp-feature">
              <span className="pp-feature-num" aria-hidden="true">{i + 1}</span>
              <h2 style={{ fontFamily: typography.heading, fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: colors.ink }}>{f.t}</h2>
              <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{f.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Dignity by design */}
      <section aria-label="Dignity by design" className="pp-section" style={{ ...section, background: colors.midnight, color: colors.surface, borderRadius: radii.card, margin: `0 ${spacing.lg} ${spacing.xxl}` }}>
        <div style={inner}>
          <p style={{ margin: "0 0 10px", color: colors.mint, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 13 }}>Dignity · Convenience · Efficiency</p>
          <h2 style={{ ...h2, color: colors.surface }}>A declined card isn't just a failed payment.</h2>
          <p style={{ ...lead, color: colors.midnightInk }}>It's being told, in public, that your money doesn't count. Digna is built so that never happens to you, and every feature keeps that promise.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { t: "No public declines", b: "Know before you pay. Pay a bill and the money assistant show you whether a card will work, and why, so you're not caught out at the counter." },
              { t: "No credit check, no judgment", b: "Sign up with an email. Your history doesn't decide your access." },
              { t: "Your money, not a loan", b: "Every card spends only your own money. No debt, no interest, no traps." },
              { t: "Limits that protect you", b: "No place can take more than you allowed, so a surprise charge never costs you rent. Need more? Raise it, as far as your money covers." },
              { t: "Plain words", b: "Banks speak in codes. Digna's assistant, built on Meta's Muse Spark, speaks like a person and tells you what to do next." },
              { t: "Private by default", b: "We keep only what's needed, never sell your data, and you can delete everything in one tap." },
            ].map((f) => (
              <article key={f.t} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: radii.card, padding: spacing.lg }}>
                <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 18, color: colors.surface }}>{f.t}</h3>
                <p style={{ margin: 0, color: colors.midnightInk, lineHeight: 1.6 }}>{f.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={60}>
          <div style={inner}>
            <span className="pp-kicker">Where Digna helps</span>
            <h2 style={h2}>Made for the moments your card gets turned away</h2>
            <p style={lead}>One card for each place, each with its own limit. Paid from your Digna wallet, and works like a credit card.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              {STORIES.map((s) => (
                <article key={s.title}>
                  <div className="pp-story-photo">
                    <Picture name={s.picture} alt={s.alt} ratio="3 / 2" round={20} />
                  </div>
                  <h3 style={{ fontFamily: typography.heading, fontSize: 20, margin: "16px 0 6px" }}>{s.title}</h3>
                  <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Coming soon: member deals Digna is working toward. Invented examples, said plainly. */}
      <section aria-label="Coming soon" className="pp-section" style={section}>
        <RevealOnScroll delayMs={0}>
          <div style={inner}>
            <p style={{ display: "inline-block", margin: "0 0 12px", padding: "6px 12px", borderRadius: 999, background: colors.primarySoft, color: colors.mintDark, fontWeight: 700, fontSize: 13 }}>Coming soon</p>
            <h2 style={h2}>Member deals, coming soon</h2>
            <p style={lead}>Digna is working on discounts for its members at the places that turn cards away most: hotels, resorts, airlines, car rentals and shops. These are examples of the kind of deals coming. None are live yet, Digna isn't partnered with these businesses, and today everything uses practice money.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {comingSoonPlaces.map((place: ComingSoonPlace) => (
                <div key={place.id} style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, boxShadow: shadows.soft, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: typography.body, color: colors.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{COMING_SOON_KIND[place.kind]}</span>
                    <span style={{ background: colors.primarySoft, color: colors.mintDark, borderRadius: radii.pill, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>Example deal</span>
                  </div>
                  <div style={{ fontFamily: typography.heading, color: colors.ink, fontSize: 19, fontWeight: 700 }}>{place.name}</div>
                  <div style={{ color: colors.mintDark, fontFamily: typography.heading, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{place.rule}</div>
                  <p style={{ color: colors.muted, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>{place.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* How it works */}
      <section className="pp-section" style={section}>
        <RevealOnScroll delayMs={0}>
          <div style={inner}>
            <span className="pp-kicker">Three steps</span>
            <h2 style={h2}>How it works</h2>
            <ol style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.md }}>
              {[
                { t: "Create your account", b: "Email and a password. You start with $250 in practice money." },
                { t: "Make a card", b: "One for each place: name it, choose its limit and the day it stops." },
                { t: "Pay and stay in control", b: "Use it at checkout. Pause it in one tap; it can never spend past its limit." },
              ].map((s, i) => (
                <li key={s.t} className="pp-feature">
                  <div style={{ fontFamily: typography.heading, background: colors.mint, color: colors.midnight, width: 34, height: 34, borderRadius: radii.pill, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: spacing.md }}>{i + 1}</div>
                  <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 18 }}>{s.t}</h3>
                  <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </RevealOnScroll>
      </section>

      {/* Pay a bill */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={0}>
          <div className="pp-hero-grid" style={{ alignItems: "center" }}>
            <div>
              <span className="pp-kicker">Pay a bill</span>
              <h2 style={h2}>Try it before you need it</h2>
              <p style={lead}>
                Pay a bill has sample businesses that follow real-world rules: a cloud service that takes credit cards only, a hotel that turns away prepaid cards, a car rental counter and a streaming service. Pay with an example Chime debit card, Cash App Card or prepaid card, then with a Digna card, and see what each one says, and why.
              </p>
              <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Pay a bill</button>
            </div>
            <div aria-label="An example from Pay a bill" role="img" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { who: "Chime debit card (example)", at: "Nimbus Cloud · $32.00", out: "Declined: credit cards only", ok: false },
                { who: "Prepaid card (example)", at: "Harborview Hotel · $150.00", out: "Declined: no prepaid cards", ok: false },
                { who: "Digna card: Cloud hosting", at: "Nimbus Cloud · $32.00", out: "Approved · $18.00 left of its limit", ok: true },
              ].map((r) => (
                <div key={r.who} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 12, background: r.ok ? "#F0FBF7" : "#FFF5F4", border: `1px solid ${r.ok ? "#12B76A" : "#F4B4AE"}` }}>
                  <span><strong>{r.who}</strong><span style={{ display: "block", fontSize: 13, color: colors.muted }}>{r.at}</span></span>
                  <strong style={{ color: r.ok ? "#067647" : "#B42318", textAlign: "right" }}>{r.out}</strong>
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
            <span className="pp-kicker">Under the hood</span>
            <h2 style={h2}>Built on Meta's AI</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.md, marginTop: 20 }}>
              {[
                { t: "Money assistant", b: "Muse Spark explains why a payment was declined, in plain words, using your own cards and payments." },
                { t: "Pay a bill", b: "Show Digna a bill (a photo, a screenshot or pasted text) and Muse Spark reads who it's from, how much and when it's due, then sets up a card for it." },
                { t: "This page's pictures", b: "Drawn by Muse Image. The people in them are invented." },
              ].map((f) => (
                <article key={f.t} className="pp-feature">
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
          <span className="pp-kicker">Good to know</span>
          <h2 style={h2}>Questions</h2>
          {FAQS.map((f) => (
            <details key={f.q} style={{ borderTop: "1px solid " + colors.line, padding: "16px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 17 }}>{f.q}</summary>
              <p style={{ margin: "10px 0 0", color: colors.muted, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
          {props.onHowItWorks && (
            <p style={{ borderTop: "1px solid " + colors.line, margin: 0, paddingTop: 16 }}>
              <button type="button" onClick={props.onHowItWorks} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, fontSize: 16, cursor: "pointer", textDecoration: "underline" }}>
                Read how Digna works, and why cards get declined
              </button>
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="pp-ledger-band" style={{ background: colors.midnight, color: colors.midnightInk, borderRadius: radii.card, padding: spacing.xxl + " " + spacing.lg, textAlign: "center", margin: `0 ${spacing.lg} ${spacing.xxl}` }}>
        <h2 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md, fontSize: 30, color: colors.surface }}>Your money's good here.</h2>
        <p style={{ margin: "0 auto " + spacing.lg, maxWidth: 560, color: colors.midnightInk, lineHeight: 1.6 }}>Make a free account, get $250 in practice money, and see how it feels when a checkout finally says yes.</p>
        <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Create a free account</button>
      </section>
    </div>
  );
}
