/**
 * The live survey chart for the README (Nov 4, 2026): an SVG picture of how many people picked each answer in
 * Digna's quick survey. It reads survey_summary (migration 0021), which returns counts only, never notes or emails,
 * with the site's public Supabase key. GitHub shows it as an image and refreshes it every few minutes.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Answer = { option: string; count: number };
type Q = { survey: "home" | "after-pay"; question: string; answers: Answer[] };
type Summary = { responses: { home: number; "after-pay": number }; questions: Q[]; updated_at: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const W = 880;
const FONT = "Figtree, 'Segoe UI', Helvetica, Arial, sans-serif";

function svg(body: string, h: number): Response {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="Digna quick survey results"><rect width="${W}" height="${h}" rx="18" fill="#0E1726"/>${body}</svg>`;
  return new Response(doc, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}

function message(text: string): Response {
  return svg(`<text x="32" y="52" font-family="${FONT}" font-size="22" font-weight="700" fill="#FFFFFF">Digna quick survey</text><text x="32" y="86" font-family="${FONT}" font-size="16" fill="#C9CFDB">${esc(text)}</text>`, 120);
}

async function summary(): Promise<Summary | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/rpc/survey_summary`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: "{}",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json().catch(() => null)) as Summary | null;
}

export async function GET(): Promise<Response> {
  const s = await summary();
  if (!s || !Array.isArray(s.questions)) return message("Live results will appear here soon. Try Digna and answer at digna.dev.");
  const total = (s.responses?.home ?? 0) + (s.responses?.["after-pay"] ?? 0);
  if (total === 0) return message("No answers yet. Be the first: try Digna at digna.dev and answer a few quick questions.");

  const parts: string[] = [];
  let y = 50;
  const updated = new Date(s.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  parts.push(`<text x="32" y="${y}" font-family="${FONT}" font-size="24" font-weight="700" fill="#FFFFFF">What people trying Digna tell us</text>`);
  y += 28;
  parts.push(`<text x="32" y="${y}" font-family="${FONT}" font-size="15" fill="#C9CFDB">Live from digna.dev's quick survey · ${total} ${total === 1 ? "answer" : "answers"} · updated ${esc(updated)} · counts only, no names</text>`);
  y += 22;

  for (const key of ["after-pay", "home"] as const) {
    const qs = s.questions.filter((q) => q.survey === key);
    const n = s.responses?.[key] ?? 0;
    if (!qs.length || n === 0) continue;
    y += 26;
    parts.push(`<text x="32" y="${y}" font-family="${FONT}" font-size="15" font-weight="700" fill="#FFB020" letter-spacing="1">${key === "after-pay" ? "RIGHT AFTER A PRACTICE PAYMENT" : "ON THE HOME PAGE"} · ${n} ${n === 1 ? "ANSWER" : "ANSWERS"}</text>`);
    for (const q of qs) {
      const qTotal = q.answers.reduce((t, a) => t + a.count, 0);
      y += 30;
      parts.push(`<text x="32" y="${y}" font-family="${FONT}" font-size="16" font-weight="700" fill="#FFFFFF">${esc(q.question)}</text>`);
      for (const a of q.answers) {
        const pct = qTotal ? a.count / qTotal : 0;
        y += 24;
        const barX = 250;
        const barW = 480;
        parts.push(`<text x="48" y="${y}" font-family="${FONT}" font-size="14" fill="#E9ECF3">${esc(a.option)}</text>`);
        parts.push(`<rect x="${barX}" y="${y - 11}" width="${barW}" height="12" rx="6" fill="#1F2B45"/>`);
        if (pct > 0) parts.push(`<rect x="${barX}" y="${y - 11}" width="${Math.max(6, Math.round(barW * pct))}" height="12" rx="6" fill="#FFB020"/>`);
        parts.push(`<text x="${barX + barW + 16}" y="${y}" font-family="${FONT}" font-size="14" fill="#C9CFDB">${Math.round(pct * 100)}% (${a.count})</text>`);
      }
    }
  }
  y += 34;
  parts.push(`<text x="32" y="${y}" font-family="${FONT}" font-size="13" fill="#95A0B5">Anyone trying Digna's practice version can answer, so this isn't a scientific sample. Answer yourself at digna.dev.</text>`);
  return svg(parts.join(""), y + 26);
}
