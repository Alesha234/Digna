import { useEffect, useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

/**
 * A few-tap survey for the people trying Digna (Nov 4, 2026): on the home page, the problem they face and whether
 * Digna makes sense; right after a practice payment, how using it actually felt. The answers go to the owner through the same private
 * feedback table as the Feedback page (send_feedback), so nobody else can read them and nothing new is stored. Shown
 * at the end of the home page and once after a practice payment; after someone answers, it thanks them and stays out
 * of their way on that device.
 */
type Question = { id: string; q: string; options: readonly string[] };

/** On the home page: the problem people face, and whether Digna makes sense to them. */
const HOME: Question[] = [
  { id: "declined", q: "Has a card ever been declined when you had the money?", options: ["Yes", "No"] },
  { id: "where", q: "Where does it happen most?", options: ["Hotels", "Car rentals", "Online services", "Somewhere else"] },
  { id: "clear", q: "How easy is Digna to understand?", options: ["Very easy", "Easy", "Okay", "Confusing"] },
  { id: "would_use", q: "Would you use a Bill Card for real?", options: ["Yes", "Maybe", "No"] },
];

/** Right after a practice payment: how using Digna actually felt. */
const AFTER_PAY: Question[] = [
  { id: "ease", q: "How easy was that?", options: ["Very easy", "Easy", "Okay", "Hard"] },
  { id: "why", q: "Did Digna make it clear why your card was approved or declined?", options: ["Yes, clearly", "Sort of", "No"] },
  { id: "feel", q: "How did it feel to use?", options: ["Calm and in control", "Fine", "Stressful"] },
  { id: "would_use", q: "Would you use a Bill Card for real?", options: ["Yes", "Maybe", "No"] },
];

const doneKey = (where: string) => "digna-survey-done-" + where;

function alreadyDone(where: string): boolean {
  try {
    return window.localStorage.getItem(doneKey(where)) === "1";
  } catch {
    return false;
  }
}

function markDone(where: string): void {
  try {
    window.localStorage.setItem(doneKey(where), "1");
  } catch {
    /* private window: the thank-you still shows */
  }
}

export function QuickSurvey(props: { where: "home" | "after-pay" }) {
  const { sendFeedback, user } = usePayProxy();
  const QUESTIONS = props.where === "home" ? HOME : AFTER_PAY;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "open" | "sent" | "hidden">("loading");

  useEffect(() => {
    // On the home page someone who already answered sees a short thank-you; after a payment it simply stays away.
    setState(alreadyDone(props.where) ? (props.where === "home" ? "sent" : "hidden") : "open");
  }, [props.where]);

  if (state === "loading" || state === "hidden") return null;

  const answered = QUESTIONS.every((x) => answers[x.id]);

  async function submit(): Promise<void> {
    setError(null);
    if (!answered) return setError("Tap one answer for each question.");
    setBusy(true);
    try {
      const lines = [
        "QUICK SURVEY (" + props.where + ")",
        ...QUESTIONS.map((x) => `${x.q} ${answers[x.id]}`),
        note.trim() ? `${props.where === "home" ? "Anything else" : "What would make it better"}: ${note.trim().slice(0, 1200)}` : null,
      ].filter(Boolean);
      await sendFeedback(lines.join("\n"), email.trim() || undefined, "survey-" + props.where);
      markDone(props.where);
      setState("sent");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const compact = props.where === "after-pay";
  const box: React.CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: radii.card,
    boxShadow: shadows.soft,
    padding: compact ? 18 : 28,
    maxWidth: 760,
    margin: compact ? "16px 0 0" : "0 auto",
    fontFamily: typography.body,
  };

  if (state === "sent") {
    return (
      <div style={box} role="status">
        <p style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>Thank you for answering! 💛</p>
        <p style={{ margin: "6px 0 0", color: colors.muted }}>Your answers went straight to the Digna team and help decide what we build next.</p>
      </div>
    );
  }

  return (
    <div style={box} aria-label="Quick survey">
      <p style={{ margin: 0, fontFamily: typography.heading, fontWeight: 700, fontSize: compact ? 18 : 24, color: colors.ink }}>
        {compact ? "How was that? A few quick taps" : "Help shape Digna: a few quick taps"}
      </p>
      <p style={{ margin: "6px 0 18px", color: colors.muted, fontSize: 15 }}>Your answers go privately to the Digna team. No account needed.</p>
      {QUESTIONS.map((x) => (
        <fieldset key={x.id} style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
          <legend style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: colors.ink }}>{x.q}</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {x.options.map((o) => {
              const on = answers[x.id] === o;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAnswers((a) => ({ ...a, [x.id]: o }))}
                  style={{
                    minHeight: 44,
                    padding: "10px 18px",
                    borderRadius: radii.pill,
                    border: `1.5px solid ${on ? colors.mintDark : colors.line}`,
                    background: on ? colors.mint : colors.page,
                    color: on ? colors.midnight : colors.ink,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: typography.body,
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
        {compact ? "What would make it better? (optional)" : "Anything else? (optional)"}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={compact ? 2 : 3} maxLength={1200} style={{ padding: 12, borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16, fontFamily: typography.body }} />
      </label>
      {!user && (
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
          Email (optional, if you'd like updates)
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" maxLength={320} style={{ padding: 12, borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 16 }} />
        </label>
      )}
      {error && <p role="alert" style={{ margin: "0 0 12px", color: "#B42318" }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        style={{ minHeight: 48, background: colors.midnight, color: "#FFFFFF", border: 0, borderRadius: radii.pill, padding: "13px 26px", fontWeight: 700, fontSize: 16, cursor: busy ? "wait" : "pointer", opacity: answered ? 1 : 0.85 }}
      >
        {busy ? "Sending…" : "Send my answers"}
      </button>
    </div>
  );
}
