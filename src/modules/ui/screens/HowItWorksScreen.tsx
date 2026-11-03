import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

const page: React.CSSProperties = { maxWidth: 880, margin: "0 auto", fontFamily: typography.body, color: colors.ink, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 22 };
const box: React.CSSProperties = { background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 24 };
const h2: React.CSSProperties = { fontFamily: typography.heading, fontSize: 22, margin: "0 0 10px", lineHeight: 1.3 };
const h3: React.CSSProperties = { fontFamily: typography.heading, fontSize: 17, margin: "0 0 4px" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 14 };
const grid4: React.CSSProperties = { ...grid, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))" };
const tile: React.CSSProperties = { border: `1px solid ${colors.line}`, borderRadius: 14, padding: 16, background: colors.page };

const REASONS: { title: string; body: string }[] = [
  {
    title: "The place wants to hold money, not just take it",
    body: "Hotels, car rentals and some online services set money aside when you start: a deposit for damage or extra charges. Many only trust credit cards for that, because a hold on a debit or prepaid card freezes your actual cash for days.",
  },
  {
    title: "The place doesn't take prepaid or debit cards at all",
    body: "Some businesses, like cloud services and subscriptions, turn away prepaid and some debit cards because they've been used to skip out on bills. It's about the type of card, not about you.",
  },
  {
    title: "There isn't enough on the card",
    body: "The payment is bigger than what's left. On a Digna card, that's the limit you set; you can raise it on the spot, as far as your money covers.",
  },
  {
    title: "The card is paused, closed or past its date",
    body: "A paused card stops every payment until you turn it back on. A card past its end date stops for good, so old subscriptions can't keep charging you.",
  },
];

/** What Digna is, why cards get declined, and what works today versus what's coming, in everyday words. */
export function HowItWorksScreen() {
  const { mode, setScreen } = usePayProxy();
  const cta: React.CSSProperties = { background: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "13px 24px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
  return (
    <article style={page}>
      <header>
        <h1 style={{ fontFamily: typography.heading, fontSize: 36, margin: "0 0 8px", lineHeight: 1.15 }}>How Digna works</h1>
        <p style={{ margin: 0, fontSize: 18, color: colors.muted, maxWidth: 680 }}>
          Digna is for anyone whose card has been turned away at a hotel desk, a car rental counter or an online checkout, and who was never told why.
          You make a card for one thing, give it a limit, and pay. If something says no, Digna tells you exactly why and how to fix it.
        </p>
      </header>

      <section aria-labelledby="why" style={box}>
        <h2 id="why" style={h2}>Why did my card get declined?</h2>
        <p style={{ margin: "0 0 14px", color: colors.muted }}>Most of the time it isn't about your money. It's about the kind of card. These are the usual reasons:</p>
        <div style={grid}>
          {REASONS.map((r) => (
            <div key={r.title} style={tile}>
              <h3 style={h3}>{r.title}</h3>
              <p style={{ margin: 0, fontSize: 15 }}>{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="card" style={box}>
        <h2 id="card" style={h2}>What a Digna card does</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>One card, one job.</strong> Make a card just for the hotel, the car rental or your cloud bill. Each one has its own number.</li>
          <li><strong>A limit you choose.</strong> The card can never spend more than you set. Need more? Raise the limit, as long as the money is in your Digna wallet.</li>
          <li><strong>An end date.</strong> When the trip or the bill is done, the card stops by itself.</li>
          <li><strong>Pause it any time.</strong> Freeze a card with one tap; turn it back on when you're ready.</li>
          <li><strong>Answers, not codes.</strong> When a payment is turned down, you see the reason and a button to fix it. The money assistant, built on Meta's AI, can explain more.</li>
        </ul>
      </section>

      <section aria-labelledby="steps" style={box}>
        <h2 id="steps" style={h2}>Four steps</h2>
        <div style={grid4}>
          {[
            ["1. Add money", "Put money in your Digna wallet. Every card is paid from it."],
            ["2. Make a card", "Name it, set a limit and an end date."],
            ["3. Pay", "Use the card where you need it."],
            ["4. Know why", "If it's turned down, see the reason and fix it in one tap."],
          ].map(([t, b]) => (
            <div key={t} style={tile}>
              <h3 style={h3}>{t}</h3>
              <p style={{ margin: 0, fontSize: 15 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="today" style={{ ...box, background: "#FFF3D6", borderColor: "#FFD98A" }}>
        <h2 id="today" style={h2}>Today, and what's coming</h2>
        <div style={grid}>
          <div>
            <h3 style={h3}>Today</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15 }}>
              <li>A real account, with your own cards and history.</li>
              <li>Practice money: $250 to start, and you can add more. It isn't real money and can't be cashed out.</li>
              <li>"Pay a bill" lets you pay sample businesses, like a hotel or a cloud service, that follow the same rules real ones do.</li>
              <li>The money assistant and bill reading, built on Meta's AI.</li>
            </ul>
          </div>
          <div>
            <h3 style={h3}>Coming</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15 }}>
              <li>Real Digna cards you can use at real stores, through a licensed card partner.</li>
              <li>Adding real money from your bank, Cash App or Chime.</li>
              <li>We'll say so clearly, right here, the day that changes. Until then, nothing in Digna can pay a real bill.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq" style={box}>
        <h2 id="faq" style={h2}>Straight answers</h2>
        <h3 style={h3}>Is this real money?</h3>
        <p style={{ marginTop: 0 }}>Not yet. Everything in Digna today is practice money, so you can try it all without risk.</p>
        <h3 style={h3}>Is Digna a bank?</h3>
        <p style={{ marginTop: 0 }}>No. Digna is not a bank, and real cards will come through a licensed partner.</p>
        <h3 style={h3}>Will a Digna card always be accepted?</h3>
        <p style={{ marginTop: 0 }}>No card is accepted everywhere. Digna's goal is to work where debit and prepaid cards get turned away, and to always tell you why when something says no.</p>
        <h3 style={h3}>What happens to my information?</h3>
        <p style={{ margin: 0 }}>We keep only what Digna needs to work, never sell it, and you can delete your account any time in Settings. The Privacy page has the details.</p>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {mode === "guest" ? (
          <button type="button" style={cta} onClick={() => setScreen("signup")}>Create a free account</button>
        ) : (
          <button type="button" style={cta} onClick={() => setScreen("snap-bill")}>Pay a bill</button>
        )}
        <button type="button" onClick={() => setScreen("feedback")} style={{ ...cta, background: colors.surface, border: `1px solid ${colors.line}`, fontWeight: 600 }}>
          Ask us something
        </button>
      </div>
    </article>
  );
}
