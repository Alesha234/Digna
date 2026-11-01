import { createClient } from "@supabase/supabase-js";

/** The app's one AI step: Muse Spark on Meta's Model API, with the app owner's key, for signed-in users only. Takes system/messages plus an optional bill image or pasted bill text, and returns the model's text unchanged. */
const MODEL = "muse-spark-1.3";
const MAX_CHARS = 8000;
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
  const key = process.env.META_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !url || !anon) return fail(503, "Muse Spark couldn't answer right now. The app will show a practice money explanation instead.");
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
  const res = await fetch("https://api.meta.ai/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 800, messages: [...(system ? [{ role: "system", content: system }] : []), ...sent] }),
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!res || !res.ok) return fail(502, "The AI couldn't answer right now. Try again in a moment.");
  const out = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return Response.json({ text: out.choices?.[0]?.message?.content ?? "" });
}
