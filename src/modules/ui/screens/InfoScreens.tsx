import { useState, type FormEvent } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

const page: React.CSSProperties = { maxWidth: 760, margin: "0 auto", fontFamily: typography.body, color: colors.ink, lineHeight: 1.7 };
const h1: React.CSSProperties = { fontFamily: typography.heading, fontSize: 32, margin: "0 0 8px" };
const h2: React.CSSProperties = { fontFamily: typography.heading, fontSize: 20, margin: "28px 0 6px" };
const UPDATED = "October 31, 2026";

/** What Digna keeps and why, in plain words. */
export function PrivacyScreen() {
  return (
    <article style={page}>
      <h1 style={h1}>Privacy</h1>
      <p style={{ color: colors.muted, margin: 0 }}>Last updated {UPDATED}</p>
      <h2 style={h2}>What Digna is</h2>
      <p>Digna gives you cards with limits you choose, for the places that turn your card away. Your account, cards and history are real and saved, but for now every dollar is practice money. Digna is not a bank, and today it never touches real cards, bank accounts or money.</p>
      <h2 style={h2}>What we keep</h2>
      <ul>
        <li>Your email address and a password (stored scrambled by our sign-in provider, Supabase; we never see it).</li>
        <li>Your Digna activity: your wallet, the cards you make, and the payments you try.</li>
        <li>Feedback you choose to send, with the email you give.</li>
        <li>Bills you add on Pay a bill (photos, screenshots or pasted text) are read once by the AI and not kept.</li>
      </ul>
      <h2 style={h2}>Who processes it</h2>
      <ul>
        <li><strong>Supabase</strong> stores your account and your Digna activity.</li>
        <li><strong>Meta's Model API</strong> answers the money assistant (Muse Spark) and reads bill photos. We send your question with your Digna cards and recent payments, nothing else.</li>
        <li><strong>Northflank</strong> hosts the website.</li>
      </ul>
      <h2 style={h2}>What we never do</h2>
      <p>Sell or share your data for advertising, ask for real card or bank numbers, or contact you for marketing.</p>
      <h2 style={h2}>Your choices</h2>
      <p>You can delete your account at any time in Settings: it removes your sign-in and everything in your account right away. Questions? Use Send feedback at the bottom of any page.</p>
    </article>
  );
}

/** The terms, short and plain. */
export function TermsScreen() {
  return (
    <article style={page}>
      <h1 style={h1}>Terms</h1>
      <p style={{ color: colors.muted, margin: 0 }}>Last updated {UPDATED}</p>
      <h2 style={h2}>Practice money, for now</h2>
      <p>Today, every dollar in Digna is practice money, and the businesses on Try paying are samples. Nothing you do here moves real money, and Digna cards can't be used at real stores yet. We'll say clearly on the site when that changes.</p>
      <h2 style={h2}>Not a bank, not affiliated</h2>
      <p>Digna is not a bank. Chime, Cash App and any card or business named here are examples only; Digna isn't connected to or endorsed by them. The sample businesses' rules show common real-world rules, but every real place sets its own.</p>
      <h2 style={h2}>AI answers</h2>
      <p>The money assistant and Pay a bill use Meta's AI. Their answers can be wrong, and they are not financial advice.</p>
      <h2 style={h2}>Fair use</h2>
      <p>One account per person, please. Don't try to break, overload or misuse the service; we may limit or remove accounts that do. The AI has daily limits so it stays available for everyone.</p>
      <h2 style={h2}>As is</h2>
      <p>Digna is provided as is while it's being built. Features may change or pause, and practice money may be reset.</p>
    </article>
  );
}

/** Feedback for the owner: what broke, what's confusing, what people want. */
export function FeedbackScreen() {
  const { sendFeedback, user, screen } = usePayProxy();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    setError(null);
    if (message.length < 3) return setError("Tell us a little more.");
    setBusy(true);
    try {
      await sendFeedback(message, email || undefined, screen);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section style={{ ...page, background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 28 }}>
      <h1 style={h1}>Send feedback</h1>
      {done ? (
        <p role="status" style={{ fontSize: 17 }}>Thank you! It went straight to the Digna team.</p>
      ) : (
        <>
          <p style={{ color: colors.muted, marginTop: 0 }}>What worked, what broke, what you wish Digna did. Every note is read.</p>
          <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
              Your feedback
              <textarea name="message" rows={6} maxLength={2000} style={{ padding: 12, borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16, fontFamily: typography.body }} />
            </label>
            {!user && (
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14 }}>
                Your email (optional, if you'd like a reply)
                <input name="email" type="email" autoComplete="email" style={{ padding: 12, borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16 }} />
              </label>
            )}
            {error && <p role="alert" style={{ margin: 0, color: "#B42318" }}>{error}</p>}
            <button type="submit" disabled={busy} style={{ alignSelf: "flex-start", background: colors.mint, color: colors.midnight, border: 0, borderRadius: radii.pill, padding: "14px 26px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              {busy ? "Sending…" : "Send"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
