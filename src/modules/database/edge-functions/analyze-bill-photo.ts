import { requireUser } from "@/modules/security/require-user";

type AuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>;
  };
};

/**
 * Bill reading through Meta only: Muse Spark on Meta's Model API, the same
 * endpoint and model as app/api/ai/route.ts. No other AI provider is used here.
 * (No SAM helper exists in this repo, so there is nothing else to call.)
 */
const META_MODEL_API = "https://api.meta.ai/v1/chat/completions";
const META_MODEL = "muse-spark-1.3";

const IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 2_000_000;

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

export function buildBillExtractionPrompt(): string {
  return [
    "You read practice bills and practice invoices for Digna, using practice money only.",
    "No real bill is paid, no real money moves, and you never ask for real bank or card details.",
    "Read the bill photo and/or the pasted bill text and find the place or business it is from, the total amount due, and the due date.",
    'Reply with JSON only, no other words, exactly: {"store": string, "amountDollars": number, "dueDate": "YYYY-MM-DD" or null, "confidence": "high"|"medium"|"low"}.',
    "store is the place or business name. amountDollars is the total due as a positive number. dueDate is YYYY-MM-DD, or null when the bill shows none. confidence is high when every field is clear, medium when mostly clear, low when you are guessing.",
  ].join(" ");
}

export type BillReading = {
  store: string;
  amountDollars: number;
  dueDate: string | null;
  confidence: "high" | "medium" | "low";
};

/** Keep only a real reading: never invent the place or amount when they cannot be read. */
export function mapBillReading(raw: unknown): BillReading {
  const obj: Record<string, unknown> =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const store: unknown = obj.store;
  const dollars: number = Number(obj.amountDollars);
  if (typeof store !== "string" || store.trim() === "" || !Number.isFinite(dollars) || dollars <= 0) {
    throw new Error("Muse Spark could not read the place or business and the amount.");
  }
  const due: unknown = obj.dueDate;
  return {
    store: store.trim().slice(0, 60),
    amountDollars: dollars,
    dueDate: typeof due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null,
    confidence: obj.confidence === "high" || obj.confidence === "medium" ? obj.confidence : "low",
  };
}

async function readWithMuseSpark(input: { image: string | null; billText: string }): Promise<unknown> {
  const metaKey: string = getEnv("META_API_KEY");
  if (!metaKey) throw new Error("Muse Spark is not available right now.");
  const userText: string = input.billText
    ? "Read this bill: the place or business it is from, the total due, and the due date.\n\nPasted bill text:\n" + input.billText.slice(0, 6000)
    : "Read this bill photo: the place or business it is from, the total due, and the due date.";
  const userContent: unknown = input.image
    ? [{ type: "image_url", image_url: { url: input.image } }, { type: "text", text: userText }]
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

/**
 * Accepts {image} (a PNG/JPEG/WebP data URL) or {text} (pasted bill text), or
 * both. Returns {store, amountDollars, dueDate, confidence}. On a missing key
 * or any upstream failure it returns a plain 503 error the UI falls back from.
 */
export async function handleAnalyzeBillPhoto(req: Request) {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    await requireUser(makeAuthClient(req));
  } catch {
    return jsonResponse({ error: "Please sign in to continue." }, 401);
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Send a photo or pasted bill text." }, 400);
  }
  const obj: { image?: unknown; text?: unknown } =
    typeof body === "object" && body !== null ? (body as { image?: unknown; text?: unknown }) : {};
  const image: string | null =
    typeof obj.image === "string" && obj.image.length <= MAX_IMAGE_CHARS && IMAGE.test(obj.image) ? obj.image : null;
  const billText: string = typeof obj.text === "string" ? obj.text.slice(0, 6000).trim() : "";
  if (!image && billText.length < 10) {
    return jsonResponse({ error: "Send a photo or pasted bill text." }, 400);
  }

  try {
    const raw: unknown = await readWithMuseSpark({ image: image, billText: billText });
    return jsonResponse(mapBillReading(raw), 200);
  } catch {
    return jsonResponse({ error: "Muse Spark couldn't read that bill right now. Try again in a moment." }, 503);
  }
}
