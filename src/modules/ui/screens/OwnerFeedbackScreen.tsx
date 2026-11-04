import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/modules/ui/lib/supabase";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

/**
 * The owner's private Feedback dashboard (Nov 4, 2026). Survey answers as counts and bars, then every message (survey
 * notes and the Feedback page) newest first. Only the owner can open it: the database's owner_feedback refuses anyone
 * not listed in app_owners (migration 0021), so this page shows nothing private to anyone else.
 */
type Answer = { option: string; count: number };
type SummaryQuestion = { survey: "home" | "after-pay"; question: string; answers: Answer[] };
type Summary = { responses: { home: number; "after-pay": number }; questions: SummaryQuestion[]; updated_at: string };
type Row = { id: string; created_at: string; page: string | null; message: string; email: string | null };

const SURVEY_TITLE: Record<SummaryQuestion["survey"], string> = {
  home: "On the home page",
  "after-pay": "Right after a practice payment",
};

const card: React.CSSProperties = { background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 20 };

function Bars({ q }: { q: SummaryQuestion }) {
  const total = q.answers.reduce((s, a) => s + a.count, 0);
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: colors.ink }}>{q.question}</p>
      {q.answers.map((a) => {
        const pct = total ? Math.round((a.count / total) * 100) : 0;
        return (
          <div key={a.option} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 38%) 1fr 72px", alignItems: "center", gap: 10, marginBottom: 6, fontSize: 14 }}>
            <span style={{ color: colors.ink }}>{a.option}</span>
            <span style={{ height: 12, borderRadius: 999, background: "#EEF0F4", overflow: "hidden" }} aria-hidden="true">
              <span style={{ display: "block", height: "100%", width: pct + "%", background: "#FFB020", borderRadius: 999 }} />
            </span>
            <span style={{ textAlign: "right", color: colors.muted, fontVariantNumeric: "tabular-nums" }}>{a.count} · {pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function OwnerFeedbackScreen() {
  const [state, setState] = useState<"loading" | "not-owner" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "survey" | "feedback">("all");

  async function load(): Promise<void> {
    const sb = supabase();
    if (!sb) {
      setError("This site isn't connected to its database.");
      return setState("error");
    }
    setState("loading");
    const owner = await sb.rpc("am_i_owner");
    if (owner.error) {
      setError("The Feedback dashboard isn't set up yet. Run migration 0021 in Supabase's SQL Editor, then add yourself as the owner.");
      return setState("error");
    }
    if (owner.data !== true) return setState("not-owner");
    const [s, f] = await Promise.all([sb.rpc("survey_summary"), sb.rpc("owner_feedback", { p_limit: 500 })]);
    if (s.error || f.error) {
      setError((s.error ?? f.error)?.message ?? "Couldn't load feedback.");
      return setState("error");
    }
    setSummary(s.data as Summary);
    setRows((f.data as Row[]) ?? []);
    setState("ready");
  }

  useEffect(() => {
    void load();
  }, []);

  const shown = useMemo(
    () => rows.filter((r) => filter === "all" || (filter === "survey" ? (r.page ?? "").startsWith("survey-") : !(r.page ?? "").startsWith("survey-"))),
    [rows, filter],
  );

  const page: React.CSSProperties = { maxWidth: 900, margin: "0 auto", fontFamily: typography.body };
  const h1: React.CSSProperties = { fontFamily: typography.heading, fontSize: "clamp(28px, 4vw, 38px)", letterSpacing: "-0.02em", margin: "0 0 6px", color: colors.ink };

  if (state === "loading") return <section style={page}><p>Loading feedback…</p></section>;
  if (state === "not-owner")
    return (
      <section style={page}>
        <h1 style={h1}>Feedback dashboard</h1>
        <p style={{ color: colors.muted }}>This page is only for the Digna owner.</p>
      </section>
    );
  if (state === "error")
    return (
      <section style={page}>
        <h1 style={h1}>Feedback dashboard</h1>
        <p role="alert" style={{ color: "#B42318" }}>{error}</p>
      </section>
    );

  const surveys = (["home", "after-pay"] as const).map((key) => ({ key, questions: (summary?.questions ?? []).filter((q) => q.survey === key), count: summary?.responses[key] ?? 0 }));
  const notes = rows.filter((r) => !(r.page ?? "").startsWith("survey-")).length;

  return (
    <section style={page}>
      <h1 style={h1}>Feedback dashboard</h1>
      <p style={{ color: colors.muted, margin: "0 0 20px" }}>Only you can see this page. Survey totals also appear, as counts only, on the README's live chart.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          ["Home page answers", surveys[0].count],
          ["After-payment answers", surveys[1].count],
          ["Feedback messages", notes],
        ].map(([label, n]) => (
          <div key={String(label)} style={{ ...card, padding: 16 }}>
            <div style={{ fontFamily: typography.heading, fontSize: 32, fontWeight: 700, color: colors.ink }}>{n}</div>
            <div style={{ color: colors.muted, fontSize: 14 }}>{label}</div>
          </div>
        ))}
      </div>

      {surveys.map((s) => (
        <div key={s.key} style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 20, margin: "0 0 14px", color: colors.ink }}>
            {SURVEY_TITLE[s.key]} <span style={{ color: colors.muted, fontWeight: 500, fontSize: 15 }}>· {s.count} {s.count === 1 ? "answer" : "answers"}</span>
          </h2>
          {s.questions.map((q) => <Bars key={q.question} q={q} />)}
        </div>
      ))}

      <div style={{ ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 20, margin: 0, color: colors.ink }}>Every message</h2>
          <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([["all", "All"], ["survey", "Surveys"], ["feedback", "Feedback page"]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} style={{ minHeight: 40, padding: "8px 14px", borderRadius: 999, border: `1px solid ${filter === k ? colors.mintDark : colors.line}`, background: filter === k ? "#FFF3D6" : colors.surface, fontWeight: 700, cursor: "pointer" }}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => void load()} style={{ minHeight: 40, padding: "8px 14px", borderRadius: 999, border: `1px solid ${colors.line}`, background: colors.surface, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
          </div>
        </div>
        {shown.length === 0 && <p style={{ color: colors.muted }}>Nothing here yet.</p>}
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((r) => (
            <li key={r.id} style={{ border: `1px solid ${colors.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: colors.muted, marginBottom: 6 }}>
                <span>{new Date(r.created_at).toLocaleString()}</span>
                <span style={{ fontWeight: 700, color: "#8A5300", background: "#FFF3D6", padding: "1px 8px", borderRadius: 999 }}>{r.page ?? "feedback"}</span>
                {r.email && <span>{r.email}</span>}
              </div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", color: colors.ink, lineHeight: 1.55 }}>{r.message}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
