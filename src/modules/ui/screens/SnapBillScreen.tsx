import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { accessToken } from "@/modules/ui/lib/supabase";
import type { BillScanResult } from "@/modules/ui/types";
import { practiceBills, matchPracticeBill } from "@/modules/ui/data/demoData";
import type { PracticeBill } from "@/modules/ui/data/demoData";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

export type { PracticeBill };

/** What Meta's Muse Spark reads from a practice bill photo or pasted text. */
export type BillReading = {
  storeName: string;
  amountCents: number;
  dueDate: string;
  confidence: "high" | "medium" | "low";
};

/** A practice bill as a scan result, exactly as written, never a made-up reading. */
export function practiceScan(bill: PracticeBill): BillScanResult {
  return {
    id: "scan_" + String(Date.now()),
    storeName: bill.storeName,
    amountCents: bill.amountCents,
    dueDate: bill.dueDate,
    confidence: bill.confidence,
  };
}

/** The practice bill some pasted text is from, if any. */
export function matchPastedBill(pastedText: string): PracticeBill | null {
  return matchPracticeBill(pastedText);
}

/** The first practice bill, used when nothing pasted matches one. */
export function fallbackPracticeBill(): PracticeBill {
  return practiceBills[2] ?? practiceBills[0];
}

/** A picture made small enough for the AI step, as a JPEG data URL, or null when it can't be opened. */
export function shrinkToDataUrl(source: File): Promise<string | null> {
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

/** The JSON reading inside Meta's Muse Spark reply, or null when it holds no usable bill. */
export function parseBillReading(raw: string): BillReading | null {
  try {
    const json = /\{[\s\S]*\}/.exec(typeof raw === "string" ? raw : "");
    if (!json) return null;
    const read: { store?: unknown; amountDollars?: unknown; dueDate?: unknown; confidence?: unknown } = JSON.parse(json[0]) as {
      store?: unknown;
      amountDollars?: unknown;
      dueDate?: unknown;
      confidence?: unknown;
    };
    const dollars: number = Number(read.amountDollars);
    if (typeof read.store !== "string" || read.store.trim().length === 0 || !Number.isFinite(dollars) || dollars <= 0) return null;
    return {
      storeName: read.store.trim().slice(0, 60),
      amountCents: Math.round(dollars * 100),
      dueDate: typeof read.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(read.dueDate) ? read.dueDate : "",
      confidence: read.confidence === "high" || read.confidence === "medium" ? read.confidence : "low",
    };
  } catch {
    return null;
  }
}

/**
 * Meta's Muse Spark reads a practice bill photo or pasted text through /api/ai.
 * Signed out, it shows the matching practice bill exactly instead. It throws when
 * signed in but the reading fails, so the caller can offer a retry.
 */
export async function readBillViaAi(input: { image?: string | null; text?: string }): Promise<{ scan: BillScanResult; practice: boolean }> {
  const pasted: string = (input.text ?? "").trim();
  const image: string | null = input.image ?? null;
  const token: string | null = await accessToken();
  if (!token) {
    const matched: PracticeBill = matchPracticeBill(pasted) ?? fallbackPracticeBill();
    return { scan: practiceScan(matched), practice: true };
  }
  const res: Response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({
      system: "You read photos of bills and invoices. Reply with JSON only, no other words: {\"store\": string, \"amountDollars\": number, \"dueDate\": \"YYYY-MM-DD\" or null, \"confidence\": \"high\"|\"medium\"|\"low\"}.",
      messages: [{ role: "user", content: "Read this bill: who is it from, the total due, and the due date." }],
      ...(image ? { image } : {}),
      ...(pasted ? { text: pasted.slice(0, 6000) } : {}),
    }),
  });
  const data = (await res.json().catch(function () { return {}; })) as { text?: unknown; error?: unknown };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Meta's Muse Spark couldn't read that bill. Try again in a moment.");
  const reading: BillReading | null = parseBillReading(typeof data.text === "string" ? data.text : "");
  if (!reading) throw new Error("Muse Spark couldn't find who the bill is from and how much it is. Try a clearer photo, or paste the bill text.");
  return {
    scan: {
      id: "scan_" + String(Date.now()),
      storeName: reading.storeName,
      amountCents: reading.amountCents,
      dueDate: reading.dueDate,
      confidence: reading.confidence,
    },
    practice: false,
  };
}

/**
 * This page has moved: there is only one Pay a bill section now. It keeps no
 * bill form of its own; the reading helpers above are reused by Pay a bill.
 */
export function SnapBillScreen(props: { onGoToPayBill?: () => void }) {
  const { setScreen } = usePayProxy();
  function go(): void {
    if (props.onGoToPayBill) {
      props.onGoToPayBill();
      return;
    }
    setScreen("checkout");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: typography.body, color: colors.ink, maxWidth: 760 }}>
      <section
        aria-label="Page moved"
        style={{ background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 22 }}
      >
        <h1 style={{ fontFamily: typography.heading, fontSize: 26, margin: "0 0 8px" }}>This page moved</h1>
        <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>
          Paying a bill now lives in one place: Pay a bill. Upload a screenshot or photo of the practice bill, or paste
          its text, and Meta&apos;s Muse Spark reads the amount, the place or business, and the due date. Practice money only.
        </p>
        <button
          type="button"
          onClick={go}
          style={{ marginTop: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 20px", borderRadius: radii.pill, fontWeight: 700, fontSize: 15, cursor: "pointer", border: 0, background: colors.mint, color: colors.ink }}
        >
          Go to Pay a bill
        </button>
      </section>
    </div>
  );
}
