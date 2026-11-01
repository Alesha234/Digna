import { createClient } from "@supabase/supabase-js";

/** The app's one AI step: Muse Spark on Meta's Model API, with the app owner's server-side key (MUSE_SPARK_API_KEY, falling back to META_API_KEY), for signed-in users only. Takes system/messages plus an optional bill image or pasted bill text, and returns the model's text unchanged. */
const MODEL = "muse-spark-1.3";
/** Plain retry wording for every Muse Spark outage: missing key, timeout, upstream 429 or any upstream failure. Never a dead end. */
const BUSY = "Muse Spark is busy — try again in a moment";
const MAX_CHARS = 8000;
/** Room for Muse Spark's brief thinking and its answer (thinking counts against max_tokens). */
const MAX_OUTPUT_TOKENS = 4000;
const MAX_MESSAGES = 20;
/** One picture per request, as a data URL of at most about 1.5 MB: the app shrinks a photo before sending it. */
const MAX_IMAGE_CHARS = 2_000_000;
const IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
/** Each person's AI requests a day, and the whole site's (AI_SITE_DAILY_LIMIT on the host, 300 when unset): a cap on the owner's Meta bill, since anyone can make a free account. */
const DAILY_LIMIT = 20;
const SITE_DAILY_LIMIT = Math.max(1, Number(process.env.AI_SITE_DAILY_LIMIT) || 300);
const used = new Map<string, { day: string; n: number }>();
const site = { day: "", n: 0 };

type Message = { role: "user" | "assistant"; content: string };
const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(req: Request): Promise<Response> {
  const key = process.env.MUSE_SPARK_API_KEY || process.env.META_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !url || !anon) {
    // Only the names of what is missing, never a value: it shows in the host's logs, so the owner can see why.
    console.error(`[ai] not set on the host: ${[!key && "META_API_KEY", !url && "NEXT_PUBLIC_SUPABASE_URL", !anon && "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(Boolean).join(", ")}`);
    return fail(503, BUSY);
  }
  const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return fail(401, "Sign in first.");
  const { data, error } = await createClient(url, anon).auth.getUser(token);
  if (error || !data.user) return fail(401, "Sign in first.");
  let body: { messages?: { role?: unknown; content?: unknown }[]; system?: unknown; image?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "Send JSON.");
  }
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m): m is Message => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES);
  const system = typeof body.system === "string" ? body.system.slice(0, 2000) : "";
  const pasted = typeof body.text === "string" ? body.text.slice(0, 6000) : "";
  const size = messages.reduce((n, m) => n + m.content.length, system.length) + pasted.length;
  if (messages.length === 0 || size > MAX_CHARS + 6000) return fail(400, `Send 1 to ${MAX_MESSAGES} messages, at most ${MAX_CHARS} characters in all.`);
  const image = body.image === undefined ? null : body.image;
  const last = messages.map((m) => m.role).lastIndexOf("user");
  if (image !== null && (last < 0 || typeof image !== "string" || image.length > MAX_IMAGE_CHARS || !IMAGE.test(image))) return fail(400, "Send one PNG, JPEG or WebP picture of at most about 1.5 MB.");
  if (pasted && last < 0) return fail(400, "Send 1 to 20 messages, at most 8000 characters in all.");
  const withText = messages.map((m, i) => (i === last && pasted ? { role: m.role, content: `${m.content}\n\nBill text:\n${pasted}` } : m));
  const sent = withText.map((m, i) => (i === last && image ? { role: m.role, content: [{ type: "image_url", image_url: { url: image } }, { type: "text", text: m.content }] } : m));
  const day = new Date().toISOString().slice(0, 10);
  const before = used.get(data.user.id);
  const n = before && before.day === day ? before.n : 0;
  if (n >= DAILY_LIMIT) return fail(429, `You've used today's ${DAILY_LIMIT} AI answers. Try again tomorrow.`);
  if (site.day !== day) Object.assign(site, { day, n: 0 });
  if (site.n >= SITE_DAILY_LIMIT) return fail(429, "Digna's AI is resting for today: lots of people asked. Try again tomorrow.");
  used.set(data.user.id, { day, n: n + 1 });
  site.n += 1;
  // A request that gets no answer doesn't count against anyone's daily limit.
  const giveBack = () => {
    const now = used.get(data.user.id);
    if (now && now.day === day && now.n > 0) now.n -= 1;
    if (site.day === day && site.n > 0) site.n -= 1;
  };
  // Muse Spark thinks before it answers, and its thinking counts against max_tokens. So it is asked to think briefly
  // (reasoning_effort, as Meta's Model API takes it) and given room for the thinking and the answer; with 800 tokens
  // and no effort set, the thinking used them all and the answer came back empty.
  const res = await fetch("https://api.meta.ai/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_OUTPUT_TOKENS, reasoning_effort: "low", messages: [...(system ? [{ role: "system", content: system }] : []), ...sent] }),
    signal: AbortSignal.timeout(60_000),
  }).catch((e: unknown) => {
    console.error(`[ai] Muse Spark couldn't be reached: ${e instanceof Error ? e.name : "error"}`);
    return null;
  });
  // A timeout, an upstream 429, or any other upstream failure is the same plain retry to the caller; the host's logs
  // keep Meta's own status and words (never the key), so the owner can see why.
  if (!res || !res.ok) {
    if (res) console.error(`[ai] Muse Spark answered HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
    giveBack();
    return fail(503, BUSY);
  }
  const out = (await res.json().catch(() => ({}))) as { choices?: { finish_reason?: string | null; message?: { content?: string | null } }[] };
  const choice = out.choices?.[0];
  const text = (choice?.message?.content ?? "").trim();
  if (!text) {
    // An empty answer is a failure, never a silent "nothing": the screen then says so instead of looking like it worked.
    console.error(`[ai] Muse Spark sent no answer (finish_reason ${choice?.finish_reason ?? "none"})`);
    giveBack();
    return fail(503, BUSY);
  }
  return Response.json({ text });
}
