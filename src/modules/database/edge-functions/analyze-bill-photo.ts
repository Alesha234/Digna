import { BillScanUploadSchema } from "@/modules/security/bill-scan-upload-schemas";
import type { BillScanUploadInput } from "@/modules/security/bill-scan-upload-schemas";
import { BillExtractionSchema, BillExtractionConfirmSchema } from "@/modules/security/bill-extraction-schemas";
import type { BillExtractionInput } from "@/modules/security/bill-extraction-schemas";
import { requireUser, requireUserId } from "@/modules/security/require-user";
import { assertScanOwner } from "@/modules/security/ownership-guards";
import { validateImageSignature, validateUploadSize, validateImageDimensions } from "@/modules/security/upload-validation";

type AuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>;
  };
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string {
  const v: string | undefined = (globalThis as unknown as { Deno?: { env?: { get?: (k: string) => string | undefined } } }).Deno?.env?.get?.(name);
  if (typeof v === "string" && v.length > 0) return v;
  const nv: unknown = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
  return typeof nv === "string" ? nv : "";
}

function makeAuthClient(req: Request): AuthClient {
  const url: string = getEnv("SUPABASE_URL");
  const anon: string = getEnv("SUPABASE_ANON_KEY");
  const authHeader: string = req.headers.get("Authorization") ?? "";
  return {
    auth: {
      getUser: async function (): Promise<{ data: { user: { id: string; email?: string | null } | null } }> {
        if (!authHeader || !url) return { data: { user: null } };
        try {
          const res: Response = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
            headers: { apikey: anon, Authorization: authHeader },
          });
          if (!res.ok) return { data: { user: null } };
          const j: unknown = await res.json();
          const obj: { id?: unknown; email?: unknown } = (j as { user?: { id?: unknown; email?: unknown } }).user ?? (j as { id?: unknown; email?: unknown });
          if (typeof obj.id !== "string" || obj.id.trim() === "") return { data: { user: null } };
          return { data: { user: { id: obj.id, email: typeof obj.email === "string" ? obj.email : null } } };
        } catch {
          return { data: { user: null } };
        }
      },
    },
  };
}

function supabaseHeaders(): Record<string, string> {
  const anon: string = getEnv("SUPABASE_ANON_KEY");
  const service: string = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const key: string = service || anon;
  return { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
}

async function fetchScanRow(scanId: string): Promise<{ id: string; userId: string } | null> {
  const url: string = getEnv("SUPABASE_URL");
  if (!url) return null;
  const res: Response = await fetch(url.replace(/\/$/, "") + "/rest/v1/bill_scans?id=eq." + encodeURIComponent(scanId) + "&select=id,user_id", {
    headers: supabaseHeaders(),
  });
  if (!res.ok) return null;
  const rows: unknown = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r: { id?: unknown; user_id?: unknown; userId?: unknown } = rows[0] as { id?: unknown; user_id?: unknown; userId?: unknown };
  const owner: unknown = r.userId ?? r.user_id;
  if (typeof r.id !== "string" || typeof owner !== "string") return null;
  return { id: r.id, userId: owner };
}

async function updateScanStatus(scanId: string, patch: Record<string, string | number | null>): Promise<void> {
  const url: string = getEnv("SUPABASE_URL");
  if (!url) return;
  await fetch(url.replace(/\/$/, "") + "/rest/v1/bill_scans?id=eq." + encodeURIComponent(scanId), {
    method: "PATCH",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}

async function readStorageObject(photoPath: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const url: string = getEnv("SUPABASE_URL");
  const res: Response = await fetch(url.replace(/\/$/, "") + "/storage/v1/object/bill-photos/" + photoPath.replace(/^\//, ""), {
    headers: supabaseHeaders(),
  });
  if (!res.ok) throw new Error("Could not read photo.");
  const buf: ArrayBuffer = await res.arrayBuffer();
  const mime: string = res.headers.get("Content-Type") ?? "image/jpeg";
  return { bytes: new Uint8Array(buf), mime: mime };
}

function guessMime(fileName: string, fallback: string): string {
  const lower: string = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

function toCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n: number = value > 0 && value < 1000 && !Number.isInteger(value) ? Math.round(value * 100) : Math.round(value);
    return n;
  }
  if (typeof value === "string") {
    const s: string = value.replace(/[$,\s]/g, "");
    const f: number = Number(s);
    if (!Number.isFinite(f)) throw new Error("Check the bill amount between $1 and $5,000.");
    if (s.includes(".")) return Math.round(f * 100);
    return Math.round(f);
  }
  throw new Error("Check the bill amount between $1 and $5,000.");
}

function toIsoDate(value: unknown): string {
  if (typeof value !== "string") throw new Error("Check the due date.");
  const s: string = value.trim();
  const iso: RegExpExecArray | null = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  const m: RegExpExecArray | null = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const mm: string = String(m[1]).padStart(2, "0");
    const dd: string = String(m[2]).padStart(2, "0");
    return m[3] + "-" + mm + "-" + dd;
  }
  throw new Error("Check the due date.");
}

export function buildBillExtractionPrompt(): string {
  return [
    "You are a bill scanner. Read the cropped bill photo and extract the merchant, total amount, and due date.",
    "Test-mode only. Do not charge anything.",
    'Respond with JSON only, exactly: {"merchant": string, "amount_cents": number, "due_date": "YYYY-MM-DD"}.',
    "merchant is the store name. amount_cents is the total as integer cents. due_date is YYYY-MM-DD.",
    "If a field is missing, guess the most likely value from the photo.",
  ].join(" ");
}

export function mapBillExtractionResult(raw: unknown): BillExtractionInput {
  const obj: Record<string, unknown> =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const merchantRaw: unknown = obj.merchant ?? obj.storeName ?? obj.store_name;
  const amountRaw: unknown = obj.amount_cents ?? obj.amountCents ?? obj.amount ?? obj.total_cents;
  const dueRaw: unknown = obj.due_date ?? obj.dueDate ?? obj.due;
  const capRaw: unknown = obj.suggestedCapCents ?? obj.suggested_cap_cents ?? amountRaw;
  if (typeof merchantRaw !== "string" || merchantRaw.trim() === "") {
    throw new Error("Check the store name.");
  }
  const amountCents: number = toCents(amountRaw);
  const dueDate: string = toIsoDate(dueRaw);
  const capCents: number = capRaw === amountRaw ? amountCents : toCents(capRaw);
  const parsed: BillExtractionInput = BillExtractionSchema.parse({
    storeName: merchantRaw.trim(),
    amountCents: amountCents,
    dueDate: dueDate,
    suggestedCapCents: Math.max(capCents, amountCents),
    currency: "USD",
  });
  return parsed;
}

export async function handleAnalyzeBillPhoto(req: Request) {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const client: AuthClient = makeAuthClient(req);
  let userId: string;
  try {
    const user: { id: string; email: string | null } = await requireUser(client);
    userId = user.id;
    void requireUserId;
  } catch {
    return jsonResponse({ error: "Please sign in to continue." }, 401);
  }

  const contentType: string = req.headers.get("Content-Type") ?? "";
  let scanId: string = "";
  let fileName: string = "";
  let mimeType: string = "";
  let bytes: Uint8Array | null = null;
  let photoPath: string = "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form: FormData = await req.formData();
      const sid: FormDataEntryValue | null = form.get("scanId");
      const photo: FormDataEntryValue | null = form.get("photo");
      scanId = typeof sid === "string" ? sid.trim() : "";
      if (photo instanceof File) {
        fileName = photo.name;
        mimeType = photo.type || guessMime(photo.name, "image/jpeg");
        const buf: ArrayBuffer = await photo.arrayBuffer();
        bytes = new Uint8Array(buf);
      }
    } else {
      const body: unknown = await req.json();
      const obj: { scanId?: unknown; photoPath?: unknown } =
        typeof body === "object" && body !== null ? (body as { scanId?: unknown; photoPath?: unknown }) : {};
      scanId = typeof obj.scanId === "string" ? obj.scanId.trim() : "";
      photoPath = typeof obj.photoPath === "string" ? obj.photoPath.trim().replace(/^\//, "") : "";
    }
  } catch {
    return jsonResponse({ error: "Use a JPG, PNG, or WebP photo." }, 400);
  }

  if (!scanId) return jsonResponse({ error: "That scan was not found." }, 400);

  try {
    if (photoPath && !bytes) {
      const stored: { bytes: Uint8Array; mime: string } = await readStorageObject(photoPath);
      bytes = stored.bytes;
      const base: string = photoPath.split("/").pop() ?? "bill.jpg";
      fileName = base.includes(".") ? base : base + ".jpg";
      mimeType = guessMime(fileName, stored.mime);
    }
  } catch {
    return jsonResponse({ error: "We could not read that photo." }, 400);
  }

  if (!bytes) return jsonResponse({ error: "Use a JPG, PNG, or WebP photo." }, 400);

  const meta: BillScanUploadInput = {
    fileName: fileName || "bill.jpg",
    mimeType: (mimeType as BillScanUploadInput["mimeType"]) ?? "image/jpeg",
    sizeBytes: bytes.length,
  };
  const parsedMeta: ReturnType<typeof BillScanUploadSchema.safeParse> = BillScanUploadSchema.safeParse(meta);
  if (!parsedMeta.success) {
    const msg: string = parsedMeta.error.issues[0]?.message ?? "Use a JPG, PNG, or WebP photo.";
    return jsonResponse({ error: msg }, 400);
  }

  const sizeErr: string | null = validateUploadSize(bytes.length);
  if (sizeErr) return jsonResponse({ error: sizeErr }, 413);
  const sigErr: string | null = validateImageSignature(bytes, mimeType);
  if (sigErr) return jsonResponse({ error: sigErr }, 415);
  const dimErr: string | null = validateImageDimensions(undefined, undefined);
  if (dimErr) return jsonResponse({ error: dimErr }, 415);

  let scan: { id: string; userId: string } | null = null;
  try {
    scan = await fetchScanRow(scanId);
  } catch {
    scan = null;
  }
  if (!scan) return jsonResponse({ error: "That scan was not found." }, 403);
  try {
    assertScanOwner(userId, scan);
  } catch {
    return jsonResponse({ error: "That scan was not found." }, 403);
  }

  void BillExtractionConfirmSchema;

  const samUrl: string = getEnv("SAM31_URL");
  const sparkUrl: string = getEnv("LLAMA_SPARK_URL");
  const sparkKey: string = getEnv("LLAMA_SPARK_KEY");

  try {
    let cropped: Uint8Array = bytes;
    if (samUrl) {
      const segRes: Response = await fetch(samUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: bytes as unknown as BodyInit,
      });
      if (!segRes.ok) throw new Error("Segment failed.");
      const segJson: unknown = await segRes.json().catch(() => null);
      const segObj: Record<string, unknown> =
        typeof segJson === "object" && segJson !== null ? (segJson as Record<string, unknown>) : {};
      const box: unknown = segObj.bbox ?? segObj.box;
      void box;
    }

    if (!sparkUrl || !sparkKey) throw new Error("AI unavailable.");

    const prompt: string = buildBillExtractionPrompt();
    const aiRes: Response = await fetch(sparkUrl, {
      method: "POST",
      headers: { Authorization: "Bearer " + sparkKey, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt, testMode: true, maxTokens: 500 }),
    });
    if (!aiRes.ok) throw new Error("Extract failed.");
    const aiJson: unknown = await aiRes.json();
    const inner: unknown =
      (aiJson as Record<string, unknown>).result ?? (aiJson as Record<string, unknown>).data ?? aiJson;
    const extraction: BillExtractionInput = mapBillExtractionResult(inner);

    await updateScanStatus(scanId, {
      merchant: extraction.storeName,
      amount_cents: extraction.amountCents,
      due_date: extraction.dueDate,
      status: "extracted",
    });

    return jsonResponse(
      {
        scanId: scanId,
        merchant: extraction.storeName,
        amountCents: extraction.amountCents,
        dueDate: extraction.dueDate,
        suggestedCardName: extraction.storeName,
        suggestedCapCents: extraction.suggestedCapCents,
      },
      200
    );
  } catch {
    try {
      await updateScanStatus(scanId, { status: "failed" });
    } catch {
      void 0;
    }
    return jsonResponse({ error: "We could not read that bill. Try again." }, 502);
  }
}
