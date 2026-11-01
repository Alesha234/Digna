import { useEffect, useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { accessToken } from "@/modules/ui/lib/supabase";
import type { BillScanResult } from "@/modules/ui/types";
import { practiceBills, matchPracticeBill } from "@/modules/ui/data/demoData";
import type { PracticeBill } from "@/modules/ui/data/demoData";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

const box: React.CSSProperties = { background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 22 };
const pick: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 20px", borderRadius: radii.pill, fontWeight: 700, fontSize: 15, cursor: "pointer", border: `1px solid ${colors.line}`, background: colors.surface, color: colors.ink };
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** A picture made small enough for the AI step (about 1.5 MB at most), as a JPEG data URL. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't open that picture."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a picture we can read. Try a screenshot (PNG or JPEG)."));
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Pay a bill: a photo on a phone, a screenshot or saved picture on any device, or the bill's text pasted from an email.
 * Meta's Muse Spark reads who it's from, how much, and when it's due; then one tap makes a card with that limit.
 */
export function AddBillScreen(props: { onMakeCard?: (bill: BillScanResult) => void }) {
  const { setLastScan, mode } = usePayProxy();
  const [camera, setCamera] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sample, setSample] = useState<PracticeBill | null>(null);
  const [isPractice, setIsPractice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BillScanResult | null>(null);

  // Taking a photo is offered only where it makes sense: a phone or tablet with a touch screen.
  useEffect(() => {
    setCamera(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  function practiceResult(bill: PracticeBill): BillScanResult {
    return { id: `scan_${Date.now()}`, storeName: bill.storeName, amountCents: bill.amountCents, dueDate: bill.dueDate, confidence: bill.confidence };
  }

  /** Choosing a practice bill fills the paste box and shows it as the sample photo. */
  function choosePractice(bill: PracticeBill): void {
    setText(bill.billText);
    setSample(bill);
    setPreview(null);
    setIsPractice(false);
    setResult(null);
    setError(null);
  }

  /** Signed out, or the AI call failed: show the matching practice bill exactly, never a made-up reading. */
  function showPracticeExample(pastedText: string): boolean {
    const matched: PracticeBill | null = matchPracticeBill(pastedText) ?? sample;
    if (!matched) return false;
    const bill: BillScanResult = practiceResult(matched);
    setResult(bill);
    setLastScan(bill);
    setIsPractice(true);
    return true;
  }

  async function read(input: { image?: string; text?: string }): Promise<void> {
    setError(null);
    setResult(null);
    setIsPractice(false);
    setBusy(true);
    try {
      const token = mode === "live" ? await accessToken() : null;
      if (!token) {
        if (showPracticeExample(input.text ?? text)) {
          setError("Meta's Muse Spark reads bills for people with an account. This is a practice example of what it finds; create a free account to read your own.");
          return;
        }
        const fallback: BillScanResult = practiceResult(practiceBills[0]);
        setResult(fallback);
        setLastScan(fallback);
        setIsPractice(true);
        setError("Meta's Muse Spark reads bills for people with an account. Here's a practice example of what it finds; create a free account to read your own.");
        return;
      }
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          system: 'You read bills and invoices. Reply with JSON only, no other words: {"store": string, "amountDollars": number, "dueDate": "YYYY-MM-DD" or null, "confidence": "high"|"medium"|"low"}.',
          messages: [{ role: "user", content: input.text ? `Read this bill: who it is from, the total due, and the due date.\n\n${input.text.slice(0, 6000)}` : "Read this bill: who it is from, the total due, and the due date." }],
          ...(input.image ? { image: input.image } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { text?: unknown; error?: unknown };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "The AI couldn't read that bill.");
      const json = /\{[\s\S]*\}/.exec(typeof data.text === "string" ? data.text : "");
      const got: { store?: unknown; amountDollars?: unknown; dueDate?: unknown; confidence?: unknown } = json ? (JSON.parse(json[0]) as { store?: unknown; amountDollars?: unknown; dueDate?: unknown; confidence?: unknown }) : {};
      const dollars = Number(got.amountDollars);
      if (typeof got.store !== "string" || !Number.isFinite(dollars) || dollars <= 0) throw new Error("The AI couldn't find who the bill is from and how much it is. Try a clearer picture, or paste the text.");
      const bill: BillScanResult = {
        id: `scan_${Date.now()}`,
        storeName: got.store.slice(0, 60),
        amountCents: Math.round(dollars * 100),
        dueDate: typeof got.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(got.dueDate) ? got.dueDate : "",
        confidence: got.confidence === "high" || got.confidence === "medium" ? got.confidence : "low",
      };
      setResult(bill);
      setLastScan(bill);
    } catch (e: unknown) {
      if (showPracticeExample(input.text ?? text)) {
        setError("Meta's Muse Spark couldn't read that right now. This is a practice example instead; Try paying with it, or try again in a moment.");
      } else {
        setError(e instanceof Error ? e.message : "The AI couldn't read that bill. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined): Promise<void> {
    if (!file) return;
    try {
      const image = await shrink(file);
      setPreview(image);
      setSample(null);
      await read({ image });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't open that picture.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: typography.body, color: colors.ink, maxWidth: 760 }}>
      <header>
        <h1 style={{ fontFamily: typography.heading, fontSize: 30, margin: "0 0 6px" }}>Pay a practice bill</h1>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>Got a bill, like a cloud service, phone or hotel invoice? Show it to Digna. Meta&apos;s Muse Spark reads the amount, the place or business it is from and the due date, then makes a card just for it, with the bill&apos;s amount as its limit. Practice money only: no real money moves. No typing it all in.</p>
      </header>

      <section aria-label="Try a practice bill" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 6px" }}>Try a practice bill</h2>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>New here? Pick one to fill the paste box below. Practice money only: no real money moves.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {practiceBills.map((bill) => {
            const active = sample?.id === bill.id;
            return (
              <button
                key={bill.id}
                type="button"
                onClick={() => choosePractice(bill)}
                aria-pressed={active}
                style={{ ...pick, background: active ? colors.mint : colors.surface, borderColor: active ? colors.mint : colors.line }}
              >
                {bill.title} · {money(bill.amountCents)}
              </button>
            );
          })}
        </div>
        {sample && (
          <div role="img" aria-label={`Sample photo of the ${sample.title}`} style={{ marginTop: 14, borderRadius: 12, border: `1px solid ${colors.line}`, background: colors.page, padding: 16, lineHeight: 1.7 }}>
            <p style={{ margin: 0, fontFamily: typography.heading, fontSize: 17 }}>{sample.storeName}</p>
            <p style={{ margin: "4px 0 0", fontSize: 15 }}><strong>{money(sample.amountCents)}</strong> · due {sample.dueDate}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.muted }}>Sample photo of a {sample.title}. The text is in the paste box below.</p>
          </div>
        )}
      </section>

      <section aria-label="Picture of the bill" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>A picture of the bill</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {camera && (
            <label style={{ ...pick, background: colors.mint, borderColor: colors.mint }}>
              Take a photo
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
          )}
          <label style={pick}>
            Upload a screenshot or photo
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: colors.muted }}>On a computer, a screenshot of the bill or its email works best. Pictures are read once and not kept.</p>
        {preview && <img src={preview} alt="The bill you added" style={{ marginTop: 14, maxWidth: "100%", maxHeight: 260, borderRadius: 12, border: `1px solid ${colors.line}` }} />}
      </section>

      <section aria-label="Bill text" style={box}>
        <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 12px" }}>Or paste the bill's text</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste the bill or its email here" style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: `1px solid ${colors.line}`, fontSize: 15, fontFamily: typography.body }} />
        <button type="button" disabled={busy || text.trim().length < 10} onClick={() => void read({ text })} style={{ ...pick, marginTop: 10, background: colors.mint, borderColor: colors.mint, opacity: busy || text.trim().length < 10 ? 0.6 : 1 }}>
          Read this text
        </button>
      </section>

      {busy && <p role="status" style={{ margin: 0 }}>Reading the bill…</p>}
      {error && <p role="alert" style={{ margin: 0, color: "#B42318" }}>{error}</p>}
      {result && (
        <section role="status" aria-label="What the AI found" style={{ ...box, borderColor: colors.mint }}>
          {isPractice && <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: colors.muted }}>Practice example</p>}
          <h2 style={{ fontFamily: typography.heading, fontSize: 20, margin: "0 0 8px" }}>{result.storeName}</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            <strong>{money(result.amountCents)}</strong>
            {result.dueDate ? ` · due ${result.dueDate}` : ""} · {result.confidence === "high" ? "read clearly" : result.confidence === "medium" ? "mostly clear, worth a check" : "hard to read, please check"}
          </p>
          {result.confidence === "low" ? (
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>Please check the amount and due date before making a card.</p>
          ) : null}
          <p style={{ margin: "8px 0 0", fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>The card would use {money(result.amountCents)} as its limit.</p>
          <button type="button" onClick={() => props.onMakeCard?.(result)} style={{ ...pick, marginTop: 14, background: colors.mint, borderColor: colors.mint }}>
            Make a card for this bill
          </button>
        </section>
      )}
    </div>
  );
}
