import * as React from "react";
import { useState } from "react";
import { PhotoPicker } from "@/modules/ui/components/PhotoPicker";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { formatCurrency, formatDate } from "@/modules/ui/lib/format";
import type { BillScanResult } from "@/modules/ui/types";
import { demoUser, demoBalance, demoCards, demoTransactions } from "@/modules/ui/data/demoData";
import { accessToken } from "@/modules/ui/lib/supabase";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function SnapBillScreen(props: { onMakeCard?: (bill: BillScanResult) => void; onCancel?: () => void }) {
  void theme;
  void demoUser;
  void demoBalance;
  void demoCards;
  void demoTransactions;
  const { onMakeCard, onCancel } = props;
  const { setLastScan } = usePayProxy();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BillScanResult | null>(null);

  function handleFileChosen(next: File): void {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      // ignore
    }
    setFile(next);
    try {
      const url: string = URL.createObjectURL(next);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
    setError(null);
    setResult(null);
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
    setResult(null);
    setError(null);
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

  function handleRead(): void {
    if (!file || isBusy) {
      return;
    }
    setIsBusy(true);
    setError(null);
    void (async function (): Promise<void> {
      try {
        const image: string | null = await shrinkToDataUrl(file);
        const due: Date = new Date(Date.now() + 14 * 86400000);
        let scan: BillScanResult = {
          id: "scan_" + String(Date.now()),
          storeName: "Sample bill",
          amountCents: 4500,
          dueDate: due.toISOString().slice(0, 10),
          confidence: "low",
        };
        // Muse Spark reads the photo (signed-in people only); without an account, a sample result shows instead.
        const token: string | null = await accessToken();
        if (token && image) {
          const res: Response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({
              system: "You read photos of bills and invoices. Reply with JSON only, no other words: {\"store\": string, \"amountDollars\": number, \"dueDate\": \"YYYY-MM-DD\" or null, \"confidence\": \"high\"|\"medium\"|\"low\"}.",
              messages: [{ role: "user", content: "Read this bill: who is it from, the total due, and the due date." }],
              image: image,
            }),
          });
          const data = (await res.json().catch(function () { return {}; })) as { text?: unknown; error?: unknown };
          if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "The AI couldn't read that photo.");
          const raw: string = typeof data.text === "string" ? data.text : "";
          const json = /\{[\s\S]*\}/.exec(raw);
          const read = json ? (JSON.parse(json[0]) as { store?: unknown; amountDollars?: unknown; dueDate?: unknown; confidence?: unknown }) : {};
          const dollars: number = Number(read.amountDollars);
          if (typeof read.store !== "string" || !Number.isFinite(dollars) || dollars <= 0) throw new Error("The AI couldn't find a store and an amount on that photo. Try a clearer one.");
          scan = {
            id: "scan_" + String(Date.now()),
            storeName: read.store.slice(0, 60),
            amountCents: Math.round(dollars * 100),
            dueDate: typeof read.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(read.dueDate) ? read.dueDate : scan.dueDate,
            confidence: read.confidence === "high" || read.confidence === "medium" ? read.confidence : "low",
          };
        } else {
          setError("Sign in to have the AI read your bill. Showing a sample result.");
        }
        const demo: BillScanResult = scan;
        setLastScan(demo);
        setResult(demo);
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
        : "Unknown store";
  const dueIso: string | null = result && typeof result.dueDate === "string" && result.dueDate.length > 0 ? result.dueDate : null;

  return (
    <div style={{ backgroundColor: colors.page, color: colors.ink, fontFamily: typography.body, minHeight: "100vh" }}>
      <style>{".pp-section{max-width:560px;margin:0 auto;padding:" + spacing.lg + " " + spacing.md + "}.pp-card{background:" + colors.surface + ";border:1px solid " + colors.line + ";border-radius:" + radii.card + "px;box-shadow:" + shadows.soft + ";padding:" + spacing.lg + "}.pp-lift{transition:transform .18s ease,box-shadow .18s ease}.pp-lift:hover{transform:translateY(-2px)}.pp-btn-mint{display:inline-flex;align-items:center;justify-content:center;background:" + colors.mint + ";color:#0E1726;border:none;border-radius:999px;padding:12px 18px;font-weight:700;cursor:pointer;width:100%}.pp-btn-mint:hover{background:" + colors.mintDark + ";color:#fff}.pp-btn-ghost{display:inline-flex;align-items:center;justify-content:center;background:transparent;color:" + colors.ink + ";border:1px solid " + colors.line + ";border-radius:999px;padding:12px 18px;font-weight:600;cursor:pointer;width:100%}.pp-reveal{opacity:0;transform:translateY(10px);transition:opacity .35s ease,transform .35s ease}.pp-reveal.is-visible{opacity:1;transform:none}@media(prefers-reduced-motion:reduce){.pp-reveal{opacity:1;transform:none;transition:none}.pp-lift{transition:none}}"}</style>
      <RevealOnScroll>
        <section aria-labelledby="snap-title" className="pp-section">
          <h2 id="snap-title" style={{ fontFamily: typography.heading, margin: "0 0 " + spacing.md, fontSize: 26, lineHeight: 1.2 }}>
            Snap a bill
          </h2>
          <div className="pp-card pp-lift">
            <p style={{ margin: 0, fontSize: 14, color: colors.muted, lineHeight: 1.5 }}>How it works: SAM finds the bill, Muse reads the amount, store, and due date.</p>
            <p style={{ margin: spacing.md + " 0 0 0", fontSize: 13, color: colors.muted }}>Test mode: sample money, no real money moves. Photo stays on this device.</p>
          </div>
        </section>
      </RevealOnScroll>
      <RevealOnScroll delayMs={60}>
        <section aria-label="Bill photo" className="pp-section" style={{ paddingTop: 0 }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: "0 0 " + spacing.md }}>1. Capture</h2>
          <PhotoPicker previewUrl={previewUrl} isBusy={isBusy} error={error} onFileChosen={handleFileChosen} onClear={handleClear} />
          <button
            type="button"
            disabled={!file || isBusy}
            onClick={handleRead}
            aria-busy={isBusy}
            style={{
              marginTop: spacing.md,
              width: "100%",
              padding: "12px 18px",
              borderRadius: 999,
              border: "none",
              backgroundColor: !file || isBusy ? colors.line : colors.mint,
              color: !file || isBusy ? colors.muted : "#0E1726",
              fontFamily: typography.body,
              fontWeight: 700,
              cursor: !file || isBusy ? "not-allowed" : "pointer",
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
                <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>Amount</p>
                <p style={{ margin: "4px 0 0 0", fontFamily: typography.heading, fontSize: 28 }}>{amountCents !== null ? formatCurrency(amountCents) : "—"}</p>
                <dl style={{ margin: spacing.md + " 0 0 0", display: "grid", gap: spacing.md }}>
                  <div>
                    <dt style={{ fontSize: 13, color: colors.muted }}>Store</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: 16 }}>{storeText}</dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: 13, color: colors.muted }}>Due date</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: 16 }}>{dueIso ? formatDate(dueIso) : "—"}</dd>
                  </div>
                </dl>
                <div style={{ display: "grid", gap: spacing.md, marginTop: spacing.lg }}>
                  <button type="button" className="pp-btn-mint" onClick={handleMakeCard}>
                    Make a card with the right cap
                  </button>
                  <button type="button" className="pp-btn-ghost" onClick={handleRetake}>
                    Retake
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: colors.muted, fontSize: 14 }}>{isBusy ? "Reading amount, store, and due date…" : "No bill scanned yet. Capture a photo to see the amount, store, and due date here."}</p>
            )}
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
