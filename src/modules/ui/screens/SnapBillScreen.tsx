import * as React from "react";
import { useState } from "react";
import { PhotoPicker } from "@/modules/ui/components/PhotoPicker";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { formatCurrency, formatDate } from "@/modules/ui/lib/format";
import type { BillScanResult } from "@/modules/ui/types";
import { practiceBills, matchPracticeBill } from "@/modules/ui/data/demoData";
import type { PracticeBill } from "@/modules/ui/data/demoData";
import { accessToken } from "@/modules/ui/lib/supabase";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function SnapBillScreen(props: { onMakeCard?: (bill: BillScanResult) => void; onCancel?: () => void }) {
  void theme;
  const { onMakeCard, onCancel } = props;
  const { setLastScan } = usePayProxy();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [billText, setBillText] = useState<string>("");
  const [selectedPractice, setSelectedPractice] = useState<PracticeBill | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BillScanResult | null>(null);
  const [isPracticeExample, setIsPracticeExample] = useState<boolean>(false);

  function practiceScan(bill: PracticeBill): BillScanResult {
    return {
      id: "scan_" + String(Date.now()),
      storeName: bill.storeName,
      amountCents: bill.amountCents,
      dueDate: bill.dueDate,
      confidence: bill.confidence,
    };
  }

  /** An example chip fills the paste box with that practice bill's text and shows a sample preview. */
  function choosePractice(bill: PracticeBill): void {
    handleClearFileOnly();
    setBillText(bill.billText);
    setSelectedPractice(bill);
    setError(null);
    setResult(null);
    setIsPracticeExample(false);
  }

  function handleClearFileOnly(): void {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      // ignore
    }
    setFile(null);
    setPreviewUrl(null);
  }

  function handleFileChosen(next: File): void {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      // ignore
    }
    setSelectedPractice(null);
    setFile(next);
    try {
      const url: string = URL.createObjectURL(next);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
    setError(null);
    setResult(null);
    setIsPracticeExample(false);
  }

  function handleClear(): void {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      // ignore
    }
    setFile(null);
    setPreviewUrl(null);
    setSelectedPractice(null);
    setResult(null);
    setError(null);
    setIsPracticeExample(false);
  }

  function shrinkToDataUrl(source: File): Promise<string | null> {
    return new Promise(function (resolve) {
      try {
        const reader: FileReader = new FileReader();
        reader.onload = function (): void {
          try {
            const raw: string = String(reader.result || "");
            if (!raw) {
              resolve(null);
              return;
            }
            const img: HTMLImageElement = new Image();
            img.onload = function (): void {
              try {
                const maxW: number = 1600;
                const scale: number = img.width > maxW ? maxW / img.width : 1;
                const w: number = Math.max(1, Math.round(img.width * scale));
                const h: number = Math.max(1, Math.round(img.height * scale));
                const canvas: HTMLCanvasElement = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
                if (!ctx) {
                  resolve(raw);
                  return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                try {
                  resolve(canvas.toDataURL("image/jpeg", 0.85));
                } catch {
                  resolve(raw);
                }
              } catch {
                resolve(raw);
              }
            };
            img.onerror = function (): void {
              resolve(raw);
            };
            img.src = raw;
          } catch {
            resolve(null);
          }
        };
        reader.onerror = function (): void {
          resolve(null);
        };
        reader.readAsDataURL(source);
      } catch {
        resolve(null);
      }
    });
  }

  const pastedReady: boolean = billText.trim().length >= 10;
  const canRead: boolean = (!!file || pastedReady) && !isBusy;

  function handleRead(): void {
    if (!file && !pastedReady) {
      return;
    }
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    setError(null);
    void (async function (): Promise<void> {
      try {
        const image: string | null = file ? await shrinkToDataUrl(file) : null;
        const pasted: string = billText.trim();
        const chosen: PracticeBill | null = selectedPractice;
        // Signed out, or the AI call fails: show the matching practice bill exactly, never a made-up reading.
        function showPracticeExample(note: string): void {
          const matched: PracticeBill | null = matchPracticeBill(pasted) ?? chosen ?? practiceBills[2];
          const demo: BillScanResult = practiceScan(matched);
          setIsPracticeExample(true);
          setLastScan(demo);
          setResult(demo);
          setError(note);
        }
        // Meta's Muse Spark reads the photo or pasted text (signed-in people only); otherwise a practice example shows instead.
        const token: string | null = await accessToken();
        if (token && (image || pasted)) {
          try {
            const res: Response = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
              body: JSON.stringify({
                system: "You read photos of bills and invoices. Reply with JSON only, no other words: {\"store\": string, \"amountDollars\": number, \"dueDate\": \"YYYY-MM-DD\" or null, \"confidence\": \"high\"|\"medium\"|\"low\"}.",
                messages: [{ role: "user", content: "Read this bill: who is it from, the total due, and the due date." }],
                ...(image ? { image: image } : {}),
                ...(pasted ? { text: pasted.slice(0, 6000) } : {}),
              }),
            });
            const data = (await res.json().catch(function () { return {}; })) as { text?: unknown; error?: unknown };
            if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Meta's Muse Spark couldn't read that bill. Try again in a moment.");
            const raw: string = typeof data.text === "string" ? data.text : "";
            const json = /\{[\s\S]*\}/.exec(raw);
            const read: { store?: unknown; amountDollars?: unknown; dueDate?: unknown; confidence?: unknown } = json ? (JSON.parse(json[0]) as { store?: unknown; amountDollars?: unknown; dueDate?: unknown; confidence?: unknown }) : {};
            const dollars: number = Number(read.amountDollars);
            if (typeof read.store !== "string" || read.store.trim().length === 0 || !Number.isFinite(dollars) || dollars <= 0) throw new Error("Muse Spark couldn't find who the bill is from and how much it is. Try a clearer photo, or paste the bill text.");
            const scan: BillScanResult = {
              id: "scan_" + String(Date.now()),
              storeName: read.store.trim().slice(0, 60),
              amountCents: Math.round(dollars * 100),
              dueDate: typeof read.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(read.dueDate) ? read.dueDate : chosen?.dueDate ?? practiceBills[2].dueDate,
              confidence: read.confidence === "high" || read.confidence === "medium" ? read.confidence : "low",
            };
            setIsPracticeExample(false);
            setLastScan(scan);
            setResult(scan);
          } catch (e: unknown) {
            showPracticeExample("Meta's Muse Spark couldn't read that right now. Showing a practice example instead; Try paying with it, or try again in a moment.");
          }
        } else if (!token) {
          showPracticeExample("Sign in to have Meta's Muse Spark read your bill. Showing a practice example instead: a practice bill with its amount as the limit.");
        } else {
          throw new Error("Couldn't open that photo. Try again or paste the bill text.");
        }
      } catch (e: unknown) {
        setError(e instanceof Error && e.message ? e.message : "Could not read the bill. Please try again.");
      } finally {
        setIsBusy(false);
      }
    })();
  }

  function handleMakeCard(): void {
    if (!result) {
      return;
    }
    setLastScan(result);
    if (onMakeCard) {
      onMakeCard(result);
    }
  }

  function handleRetake(): void {
    handleClear();
    if (onCancel) {
      onCancel();
    }
  }

  const rec: Record<string, unknown> = result as unknown as Record<string, unknown>;
  const amountCents: number | null =
    result && typeof result.amountCents === "number" && Number.isFinite(result.amountCents) ? result.amountCents : null;
  const storeText: string =
    result && typeof (result as BillScanResult).storeName === "string" && (result as BillScanResult).storeName.length > 0
      ? (result as BillScanResult).storeName
      : typeof rec["store"] === "string" && (rec["store"] as string).length > 0
        ? (rec["store"] as string)
        : "Unknown place or business";
  const dueIso: string | null = result && typeof result.dueDate === "string" && result.dueDate.length > 0 ? result.dueDate : null;

  return (
    <div style={{ backgroundColor: colors.page, color: colors.ink, fontFamily: typography.body, minHeight: "100vh" }}>
      <style>{".pp-section{max-width:560px;margin:0 auto;padding:" + spacing.lg + " " + spacing.md + "}.pp-card{background:" + colors.surface + ";border:1px solid " + colors.line + ";border-radius:" + radii.card + "px;box-shadow:" + shadows.soft + ";padding:" + spacing.lg + "}.pp-lift{transition:transform .18s ease,box-shadow .18s ease}.pp-lift:hover{transform:translateY(-2px)}.pp-btn-mint{display:inline-flex;align-items:center;justify-content:center;background:" + colors.mint + ";color:#0E1726;border:none;border-radius:999px;padding:12px 18px;font-weight:700;cursor:pointer;width:100%}.pp-btn-mint:hover{background:" + colors.mintDark + ";color:#fff}.pp-btn-ghost{display:inline-flex;align-items:center;justify-content:center;background:transparent;color:" + colors.ink + ";border:1px solid " + colors.line + ";border-radius:999px;padding:12px 18px;font-weight:600;cursor:pointer;width:100%}.pp-reveal{opacity:0;transform:translateY(10px);transition:opacity .35s ease,transform .35s ease}.pp-reveal.is-visible{opacity:1;transform:none}@media(prefers-reduced-motion:reduce){.pp-reveal{opacity:1;transform:none;transition:none}.pp-lift{transition:none}}"}</style>
      <RevealOnScroll>
        <section aria-labelledby="snap-title" className="pp-section">
          <h2 id="snap-title" style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md, fontSize: 26, lineHeight: 1.2 }}>
            Snap a practice bill
          </h2>
          <div className="pp-card pp-lift">
            <p style={{ margin: 0, fontSize: 14, color: colors.muted, lineHeight: 1.5 }}>It can read a practice bill or practice invoice. Meta&apos;s Muse Spark finds the amount, the place or business, and the due date, then you can make a card with the bill amount as its limit.</p>
            <p style={{ margin: spacing.md + " 0 0 0", fontSize: 13, color: colors.muted }}>Practice money only: no real money moves. The photo stays on this device.</p>
          </div>
        </section>
      </RevealOnScroll>
      <RevealOnScroll delayMs={60}>
        <section aria-label="Bill photo or pasted text" className="pp-section" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 " + spacing.md }}>1. Add the bill</h2>
          <p style={{ margin: "0 0 " + spacing.sm, fontSize: 14, color: colors.muted }}>Try a practice bill or a practice invoice to fill the box below. Practice money only.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }}>
            {practiceBills.map(function (bill: PracticeBill) {
              const active: boolean = selectedPractice !== null && selectedPractice.id === bill.id;
              return (
                <button
                  key={bill.id}
                  type="button"
                  onClick={function (): void { choosePractice(bill); }}
                  aria-pressed={active}
                  style={{
                    cursor: "pointer",
                    borderRadius: 999,
                    border: "1px solid " + (active ? colors.mintDark : colors.line),
                    backgroundColor: active ? colors.mint : colors.surface,
                    color: colors.ink,
                    padding: "6px 12px",
                    fontFamily: typography.body,
                    fontSize: 14,
                  }}
                >
                  {bill.title} · {formatCurrency(bill.amountCents)}
                </button>
              );
            })}
          </div>
          {selectedPractice ? (
            <div role="img" aria-label={"Sample photo of the " + selectedPractice.title} style={{ border: "1px solid " + colors.line, borderRadius: 12, backgroundColor: colors.page, padding: spacing.md, lineHeight: 1.7, marginBottom: spacing.md }}>
              <p style={{ margin: 0, fontFamily: typography.heading, fontSize: 17 }}>{selectedPractice.storeName}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: 15 }}><strong>{formatCurrency(selectedPractice.amountCents)}</strong> · due {formatDate(selectedPractice.dueDate)}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: colors.muted }}>Sample photo of a {selectedPractice.title}. The text is in the paste box below.</p>
            </div>
          ) : null}
          <PhotoPicker previewUrl={previewUrl} isBusy={isBusy} error={error} onFileChosen={handleFileChosen} onClear={handleClear} />
          <label htmlFor="snap-bill-text" style={{ display: "block", marginTop: spacing.md, fontSize: 14, fontWeight: 600 }}>
            Or paste the bill text
          </label>
          <textarea
            id="snap-bill-text"
            value={billText}
            onChange={function (e: React.ChangeEvent<HTMLTextAreaElement>): void {
              setBillText(e.target.value);
              setSelectedPractice(null);
              setIsPracticeExample(false);
            }}
            rows={5}
            placeholder="Paste the bill or its email here instead of adding a photo"
            style={{ marginTop: spacing.sm, width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: "1px solid " + colors.line, fontSize: 15, fontFamily: typography.body, backgroundColor: colors.surface, color: colors.ink }}
          />
          <button
            type="button"
            disabled={!canRead}
            onClick={handleRead}
            aria-busy={isBusy}
            style={{
              marginTop: spacing.md,
              width: "100%",
              padding: "12px 18px",
              borderRadius: 999,
              border: "none",
              backgroundColor: !canRead ? colors.line : colors.mint,
              color: !canRead ? colors.muted : "#0E1726",
              fontFamily: typography.body,
              fontWeight: 700,
              cursor: !canRead ? "not-allowed" : "pointer",
            }}
          >
            {isBusy ? "Analyzing…" : "Read bill"}
          </button>
          {isBusy ? (
            <p role="status" style={{ color: colors.muted, fontSize: 14 }}>
              Analyzing bill…
            </p>
          ) : null}
        </section>
      </RevealOnScroll>
      <RevealOnScroll delayMs={120}>
        <section aria-label="Bill result" className="pp-section" style={{ paddingTop: 0, paddingBottom: spacing.xl }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 " + spacing.md }}>2. Result</h2>
          <div className="pp-card pp-lift" aria-live="polite" aria-atomic="true">
            {result ? (
              <div>
                {isPracticeExample ? (
                  <p style={{ margin: "0 0 " + spacing.sm, fontSize: 13, fontWeight: 700, color: colors.muted }}>Practice example</p>
                ) : null}
                <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>Amount</p>
                <p style={{ margin: "4px 0 0 0", fontFamily: typography.heading, fontSize: 28 }}>{amountCents !== null ? formatCurrency(amountCents) : "—"}</p>
                <dl style={{ margin: spacing.md + " 0 0 0", display: "grid", gap: spacing.md }}>
                  <div>
                    <dt style={{ fontSize: 13, color: colors.muted }}>Place or business</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: 16 }}>{storeText}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 13, color: colors.muted }}>Due date</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: 16 }}>{dueIso ? formatDate(dueIso) : "—"}</dd>
                  </div>
                </dl>
                {result.confidence === "low" ? (
                  <p style={{ margin: spacing.md + " 0 0 0", fontSize: 13, color: colors.muted }}>Please check the amount and due date before making a card.</p>
                ) : null}
                <div style={{ display: "grid", gap: spacing.md, marginTop: spacing.lg }}>
                  <button type="button" className="pp-btn-mint" onClick={handleMakeCard}>
                    Make a card with the right limit
                  </button>
                  <button type="button" className="pp-btn-ghost" onClick={handleRetake}>
                    Retake
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: colors.muted, fontSize: 14 }}>{isBusy ? "Reading amount, place or business, and due date…" : "No bill read yet. Add a photo or paste the bill text to see the amount, place or business, and due date here."}</p>
            )}
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
