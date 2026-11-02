import { dailyGate, fail, metaKey, signedInUser } from "../_lib/guard";
import { boxesIn, type Box } from "../_lib/boxes";

/**
 * Finding the bill in a messy photo (Nov 2, 2026): Meta's SAM 3.1 looks for "bill" (then "receipt") in the picture
 * and answers with boxes; the largest is sent back, so the app can crop to it before Muse Spark reads it. Signed-in
 * people only; the picture is never kept.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_CHARS = 2_000_000;
const IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const PER_PERSON = 20;
const PER_SITE = Math.max(1, Number(process.env.FIND_BILL_SITE_DAILY_LIMIT) || 300);

async function ask(key: string, image: string, word: string): Promise<Box[] | null> {
  const res = await fetch("https://api.meta.ai/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({ model: "sam-3.1", stream: true, input: [{ type: "message", role: "user", content: [{ type: "input_text", text: word }, { type: "input_image", image_url: image }] }] }),
    signal: AbortSignal.timeout(45_000),
  }).catch((e: unknown) => {
    console.error(`[find-bill] SAM 3.1 couldn't be reached: ${e instanceof Error ? e.name : "error"}`);
    return null;
  });
  if (!res || !res.ok) {
    if (res) console.error(`[find-bill] SAM 3.1 answered HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
    return null;
  }
  let text = "";
  for (const line of (await res.text()).split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const ev = JSON.parse(line.slice(6)) as { type?: string; delta?: unknown };
      if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") text += ev.delta;
    } catch {
      /* a keep-alive or the end marker */
    }
  }
  return boxesIn(text);
}

export async function POST(req: Request): Promise<Response> {
  const user = await signedInUser(req);
  if (!user) return fail(401, "Sign in first.");
  const key = metaKey();
  if (!key) return fail(503, "Finding the bill isn't available right now.");
  let body: { image?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "Send JSON.");
  }
  const image = typeof body.image === "string" ? body.image : "";
  if (image.length > MAX_IMAGE_CHARS || !IMAGE.test(image)) return fail(400, "Send one PNG, JPEG or WebP picture of at most about 1.5 MB.");
  const gate = dailyGate("find-bill", user.id, PER_PERSON, PER_SITE);
  if ("refusal" in gate) return gate.refusal;
  let boxes = await ask(key, image, "bill");
  if (boxes !== null && boxes.length === 0) boxes = await ask(key, image, "receipt");
  if (boxes === null) {
    gate.giveBack();
    return fail(503, "SAM 3.1 is busy. Reading the whole photo instead.");
  }
  const largest = boxes.sort((a, b) => (b.x2 - b.x1) * (b.y2 - b.y1) - (a.x2 - a.x1) * (a.y2 - a.y1))[0] ?? null;
  return Response.json({ box: largest });
}
