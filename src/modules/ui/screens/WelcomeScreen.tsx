import { useEffect, useState } from "react";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";
import { comingSoonPlaces } from "@/modules/ui/data/demoData";
import type { ComingSoonPlace } from "@/modules/ui/types";

/** How each kind of coming-soon place is labelled. */
const COMING_SOON_KIND: Record<ComingSoonPlace["kind"], string> = { hotel: "Hotel", flight: "Airline", retailer: "Shop", rental: "Car rental", app: "Apps & games" };

/** A picture Meta's Muse Image drew for this page (app/api/picture); while it draws, or if it can't, a soft panel. */
function Picture({ name, alt, ratio }: { name: string; alt: string; ratio: string }) {
  // Shown only once it has loaded: until then, or if it can't be drawn, the soft panel stays (never a broken image).
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div style={{ aspectRatio: ratio, borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg, #FFF3D6, #D6E8F0)" }}>
      {mounted && (
        <img src={`/api/picture/${name}?v=2`} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setLoaded(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity .4s ease", color: "transparent" }} />
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
              <p style={{ display: "inline-block", margin: "0 0 14px", padding: "6px 12px", borderRadius: 999, background: "#FFF3D6", color: colors.mintDark, fontWeight: 700, fontSize: 13 }}>Cards with limits you choose · Free to try</p>
              <h1 className="pp-hero-title">Dignity at every checkout.</h1>
              <p style={{ ...lead, fontSize: 18 }}>
                Hotels, car rentals and cloud services often turn away Cash App, Chime and prepaid cards, and rarely say why. Digna gives you a card for each one, paid from your own money, with a limit you choose. No credit check, no debt. And if a place ever says no, you'll know exactly why.
              </p>
              {isSignedIn ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md, alignItems: "center" }}>
                  <button type="button" className="pp-btn-mint" onClick={onDashboard} style={primary}>Dashboard</button>
                  <button type="button" className="pp-btn-secondary" onClick={onPayBill} style={secondary}>Pay a bill</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.md, alignItems: "center" }}>
                    <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Create a free account</button>
                    <button type="button" className="pp-btn-secondary" onClick={onTryDemo} style={secondary}>Look around first</button>
                  </div>
                  <p style={{ color: colors.muted, fontSize: 14, margin: spacing.md + " 0 0" }}>
                    Already have an account?{" "}
                    <button type="button" onClick={onSignIn} style={{ background: "transparent", border: 0, padding: 0, color: colors.mintDark, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>Sign in</button>
                    {" · "}Starts with $250 in practice money.
                  </p>
                </>
              )}
            </div>
            <div style={{ position: "relative", maxWidth: 480, width: "100%", margin: "0 auto" }}>
              <Picture name="hero" alt="A woman smiling at her phone after a payment went through" ratio="1 / 1" />
              <div className="pp-hero-float">
                <SampleCard name="Cloud hosting" spent={32} cap={50} last="4242" bg="linear-gradient(135deg, #0E1726, #17405C)" />
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
          ].map((f) => (
            <article key={f.t} style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, padding: spacing.lg }}>
              <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 8px", color: colors.ink }}>{f.t}</h2>
              <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>{f.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Dignity by design */}
      <section aria-label="Dignity by design" className="pp-section" style={{ ...section, background: colors.midnight, color: "#FFFFFF" }}>
        <div style={inner}>
          <p style={{ margin: "0 0 10px", color: "#FFC94D", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 13 }}>Dignity · Convenience · Efficiency</p>
          <h2 style={{ ...h2, color: "#FFFFFF" }}>A declined card isn't just a failed payment.</h2>
          <p style={{ ...lead, color: "#C9CFDB" }}>It's being told, in public, that your money doesn't count. Digna is built so that never happens to you, and every feature keeps that promise.</p>
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
                <h3 style={{ fontFamily: typography.heading, margin: "0 0 8px", fontSize: 18, color: "#FFFFFF" }}>{f.t}</h3>
                <p style={{ margin: 0, color: "#C9CFDB", lineHeight: 1.6 }}>{f.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={60}>
          <div style={inner}>
            <h2 style={h2}>Made for the moments your card gets turned away</h2>
            <p style={lead}>One card for each place, each with its own limit. Paid from your Digna wallet, and works like a credit card.</p>
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

      {/* Coming soon: the kinds of places practice checkouts add next. Invented names, said plainly. */}
      <section aria-label="Coming soon" className="pp-section" style={section}>
        <RevealOnScroll delayMs={0}>
          <div style={inner}>
            <p style={{ display: "inline-block", margin: "0 0 12px", padding: "6px 12px", borderRadius: 999, background: "#FFF3D6", color: colors.mintDark, fontWeight: 700, fontSize: 13 }}>Coming soon</p>
            <h2 style={h2}>More places to practice, next</h2>
            <p style={lead}>Hotels, airlines, rentals and everyday shops are the places that turn cards away most. These are the checkouts Digna adds next, each with the same rules real places use. The names are examples: Digna isn't partnered with any business yet, and it's all practice money.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {comingSoonPlaces.map((place: ComingSoonPlace) => (
                <div key={place.id} style={{ background: colors.surface, border: "1px solid " + colors.line, borderRadius: radii.card, boxShadow: shadows.soft, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: typography.body, color: colors.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{COMING_SOON_KIND[place.kind]}</span>
                    <span style={{ background: colors.primarySoft, color: colors.mintDark, borderRadius: radii.pill, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>Coming soon</span>
                  </div>
                  <div style={{ fontFamily: typography.heading, color: colors.ink, fontSize: 19, fontWeight: 700 }}>{place.name}</div>
                  <div style={{ color: colors.ink, fontSize: 14, fontWeight: 600 }}>{place.rule}</div>
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
            <h2 style={h2}>How it works</h2>
            <ol style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.md }}>
              {[
                { t: "Create your account", b: "Email and a password. You start with $250 in practice money." },
                { t: "Make a card", b: "One for each place: name it, choose its limit and the day it stops." },
                { t: "Pay and stay in control", b: "Use it at checkout. Pause it in one tap; it can never spend past its limit." },
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

      {/* Pay a bill */}
      <section className="pp-section" style={{ ...section, background: colors.surface, borderTop: "1px solid " + colors.line, borderBottom: "1px solid " + colors.line }}>
        <RevealOnScroll delayMs={0}>
          <div className="pp-hero-grid" style={{ alignItems: "center" }}>
            <div>
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
            <h2 style={h2}>Built on Meta's AI</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: spacing.md, marginTop: 20 }}>
              {[
                { t: "Money assistant", b: "Muse Spark explains why a payment was declined, in plain words, using your own cards and payments." },
                { t: "Pay a bill", b: "Show Digna a bill (a photo, a screenshot or pasted text) and Muse Spark reads who it's from, how much and when it's due, then sets up a card for it." },
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
      <section className="pp-ledger-band" style={{ background: colors.midnight, color: colors.midnightInk, padding: spacing.xxl + " " + spacing.lg, textAlign: "center" }}>
        <h2 style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md, fontSize: 30, color: "#FFFFFF" }}>Your money's good here.</h2>
        <p style={{ margin: "0 auto " + spacing.lg, maxWidth: 560, color: "#C9CFDB", lineHeight: 1.6 }}>Make a free account, get $250 in practice money, and see how it feels when a checkout finally says yes.</p>
        <button type="button" className="pp-btn-mint" onClick={onGetStarted} style={primary}>Create a free account</button>
      </section>
    </div>
  );
}
