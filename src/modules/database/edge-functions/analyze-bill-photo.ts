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

/** Meta's Model API, reached with the owner's META_API_KEY. Muse Spark is the only AI this function uses. */
const META_MODEL_API = "https://api.meta.ai/v1/chat/completions";
const META_MODEL = "muse-spark-1.3";

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
    if (!Number.isFinite(f)) throw new Error("Please check the bill amount.");
    if (s.includes(".")) return Math.round(f * 100);
    return Math.round(f);
  }
  throw new Error("Please check the bill amount.");
}

function toIsoDate(value: unknown): string {
  if (typeof value !== "string") throw new Error("Please check the due date.");
  const s: string = value.trim();
  const iso: RegExpExecArray | null = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  const m: RegExpExecArray | null = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const mm: string = String(m[1]).padStart(2, "0");
    const dd: string = String(m[2]).padStart(2, "0");
    return m[3] + "-" + mm + "-" + dd;
  }
  throw new Error("Please check the due date.");
}

export function buildBillExtractionPrompt(): string {
  return [
    "You read practice bills and practice invoices for Digna, using practice money only.",
    "No real bill is paid, no real money moves, and you never ask for real bank or card details.",
    "Read the bill photo and/or the pasted bill text and find the place or business it is from, the total amount due, and the due date.",
    'Reply with JSON only, no other words, exactly: {"store": string, "amountDollars": number, "dueDate": "YYYY-MM-DD" or null, "confidence": "high"|"medium"|"low"}.',
    "store is the place or business name. amountDollars is the total due as a positive number. dueDate is YYYY-MM-DD, or null when the bill shows none. confidence is high when every field is clear, medium when mostly clear, low when you are guessing.",
  ].join(" ");
}

export function mapBillExtractionResult(raw: unknown): BillExtractionInput {
  const obj: Record<string, unknown> =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const storeRaw: unknown = obj.store ?? obj.merchant ?? obj.storeName ?? obj.store_name;
  const amountRaw: unknown = obj.amountDollars ?? obj.amount ?? obj.amount_cents ?? obj.amountCents ?? obj.total_cents;
  const dueRaw: unknown = obj.dueDate ?? obj.due_date ?? obj.due;
  const capRaw: unknown = obj.suggestedCapCents ?? obj.suggested_cap_cents ?? amountRaw;
  if (typeof storeRaw !== "string" || storeRaw.trim() === "") {
    throw new Error("Please check the place or business name.");
  }
  let amountCents: number;
  if (typeof amountRaw === "number" || (typeof amountRaw === "string" && amountRaw.trim() !== "")) {
    const dollars: number = Number(typeof amountRaw === "string" ? amountRaw.replace(/[$,\s]/g, "") : amountRaw);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      throw new Error("Please check the bill amount.");
    }
    amountCents = Math.round(dollars * 100);
  } else {
    amountCents = toCents(amountRaw);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new Error("Please check the bill amount.");
    }
  }
  const dueDate: string = toIsoDate(dueRaw);
  const capCents: number = capRaw === amountRaw ? amountCents : toCents(capRaw);
  const parsed: BillExtractionInput = BillExtractionSchema.parse({
    storeName: storeRaw.trim(),
    amountCents: amountCents,
    dueDate: dueDate,
    suggestedCapCents: Math.max(capCents, amountCents),
    currency: "USD",
  });
  return parsed;
}

function fallbackBody(scanId: string, message: string): Response {
  return jsonResponse(
    {
      scanId: scanId,
      store: "Unknown place or business",
      amountCents: 0,
      dueDate: null,
      confidence: "low",
      needsCheck: true,
      suggestedCardName: "Unknown place or business",
      suggestedLimitCents: 0,
      message: message,
    },
    200
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let s: string = "";
  const chunk: number = 8192;
  for (let i: number = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
  }
  const g: { btoa?: (s: string) => string; Buffer?: { from: (b: Uint8Array) => { toString: (enc: string) => string } } } =
    globalThis as unknown as { btoa?: (s: string) => string; Buffer?: { from: (b: Uint8Array) => { toString: (enc: string) => string } } };
  if (typeof g.btoa === "function") {
    return g.btoa(s);
  }
  if (g.Buffer) {
    return g.Buffer.from(bytes).toString("base64");
  }
  throw new Error("Could not read that photo.");
}

async function readWithMuseSpark(input: { imageDataUrl: string | null; billText: string }): Promise<unknown> {
  const metaKey: string = getEnv("META_API_KEY");
  if (!metaKey) throw new Error("Muse Spark key is missing.");
  const userText: string = input.billText
    ? "Read this bill: the place or business it is from, the total due, and the due date.\n\nPasted bill text:\n" + input.billText.slice(0, 6000)
    : "Read this bill photo: the place or business it is from, the total due, and the due date.";
  const userContent: unknown = input.imageDataUrl
    ? [{ type: "image_url", image_url: { url: input.imageDataUrl } }, { type: "text", text: userText }]
    : userText;
  const aiRes: Response = await fetch(META_MODEL_API, {
    method: "POST",
    headers: { Authorization: "Bearer " + metaKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: META_MODEL,
      max_tokens: 500,
      messages: [
        { role: "system", content: buildBillExtractionPrompt() },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!aiRes.ok) throw new Error("Muse Spark could not read it.");
  const aiJson: unknown = await aiRes.json();
  const choices: unknown = (aiJson as Record<string, unknown>).choices;
  const first: unknown = Array.isArray(choices) ? choices[0] : null;
  const message: unknown = (first as Record<string, unknown> | null)?.message ?? null;
  const content: unknown = (message as Record<string, unknown> | null)?.content ?? (aiJson as Record<string, unknown>).text ?? "";
  const text: string = typeof content === "string" ? content : JSON.stringify(content ?? "");
  const json = /\{[\s\S]*\}/.exec(text);
  if (!json) throw new Error("Muse Spark returned no reading.");
  return JSON.parse(json[0]) as unknown;
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
  let billText: string = "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form: FormData = await req.formData();
      const sid: FormDataEntryValue | null = form.get("scanId");
      const photo: FormDataEntryValue | null = form.get("photo");
      const pasted: FormDataEntryValue | null = form.get("billText");
      scanId = typeof sid === "string" ? sid.trim() : "";
      if (typeof pasted === "string") billText = pasted.slice(0, 6000);
      if (photo instanceof File) {
        fileName = photo.name;
        mimeType = photo.type || guessMime(photo.name, "image/jpeg");
        const buf: ArrayBuffer = await photo.arrayBuffer();
        bytes = new Uint8Array(buf);
      }
    } else {
      const body: unknown = await req.json();
      const obj: { scanId?: unknown; photoPath?: unknown; billText?: unknown } =
        typeof body === "object" && body !== null ? (body as { scanId?: unknown; photoPath?: unknown; billText?: unknown }) : {};
      scanId = typeof obj.scanId === "string" ? obj.scanId.trim() : "";
      photoPath = typeof obj.photoPath === "string" ? obj.photoPath.trim().replace(/^\//, "") : "";
      if (typeof obj.billText === "string") billText = obj.billText.slice(0, 6000);
    }
  } catch {
    return jsonResponse({ error: "Add a JPG, PNG, or WebP photo, or paste the bill text." }, 400);
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

  if (!bytes && billText.trim().length < 10) {
    return jsonResponse({ error: "Add a JPG, PNG, or WebP photo, or paste the bill text." }, 400);
  }

  if (bytes) {
    const meta: BillScanUploadInput = {
      fileName: fileName || "bill.jpg",
      mimeType: (mimeType as BillScanUploadInput["mimeType"]) ?? "image/jpeg",
      sizeBytes: bytes.length,
    };
    const parsedMeta: ReturnType<typeof BillScanUploadSchema.safeParse> = BillScanUploadSchema.safeParse(meta);
    if (!parsedMeta.success) {
      const msg: string = parsedMeta.error.issues[0]?.message ?? "Add a JPG, PNG, or WebP photo, or paste the bill text.";
      return jsonResponse({ error: msg }, 400);
    }

    const sizeErr: string | null = validateUploadSize(bytes.length);
    if (sizeErr) return jsonResponse({ error: sizeErr }, 413);
    const sigErr: string | null = validateImageSignature(bytes, mimeType);
    if (sigErr) return jsonResponse({ error: sigErr }, 415);
    const dimErr: string | null = validateImageDimensions(undefined, undefined);
    if (dimErr) return jsonResponse({ error: dimErr }, 415);
  }

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

  const pasted: string = billText.trim();

  try {
    const imageDataUrl: string | null =
      bytes != null ? "data:" + (mimeType || "image/jpeg") + ";base64," + bytesToBase64(bytes) : null;
    const raw: unknown = await readWithMuseSpark({ imageDataUrl: imageDataUrl, billText: pasted });
    const extraction: BillExtractionInput = mapBillExtractionResult(raw);

    await updateScanStatus(scanId, {
      merchant: extraction.storeName,
      amount_cents: extraction.amountCents,
      due_date: extraction.dueDate,
      status: "extracted",
    });

    return jsonResponse(
      {
        scanId: scanId,
        store: extraction.storeName,
        amountCents: extraction.amountCents,
        dueDate: extraction.dueDate,
        confidence:
          typeof (raw as Record<string, unknown>).confidence === "string" &&
          ["high", "medium", "low"].includes(String((raw as Record<string, unknown>).confidence))
            ? String((raw as Record<string, unknown>).confidence)
            : "low",
        needsCheck: false,
        suggestedCardName: extraction.storeName,
        suggestedLimitCents: extraction.suggestedCapCents,
      },
      200
    );
  } catch {
    try {
      await updateScanStatus(scanId, { status: "needs_check" });
    } catch {
      void 0;
    }
    // Practice money only: this fallback never claims a real bill was paid and never asks for bank or card details.
    return fallbackBody(scanId, "Please check the bill: the place or business, amount, or due date was unclear. No real bill was paid and no real money moved.");
  }
}
