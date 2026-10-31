import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * The site's pictures (the landing page and the sample businesses' checkout pages), drawn by Meta's Muse Image with the app owner's own Meta key (META_API_KEY), from the
 * fixed descriptions below and nothing a visitor sends. Each is drawn once and kept (in memory and on the server's
 * disk), so it costs about $0.01 per picture per deploy (Meta's price), not per visitor. Follows Meta's docs:
 * POST /v1/images/generations, base64 WebP back in data[0].b64_json.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RULES =
  "A natural, warm lifestyle photograph for a fintech website. Any people shown are invented adults who look like no real or famous person, in everyday clothes. No company logos, brands or products, and no words, letters or numbers anywhere in the picture.";

const PICTURES: Record<string, { size: string; describe: string }> = {
  hero: { size: "1024x1024", describe: "A smiling young adult at a sunny kitchen table holding a phone, relieved after a payment went through, soft morning light, mint green and navy accents" },
  cloud: { size: "1536x1024", describe: "A focused young developer at a laptop in a cozy apartment in the evening, setting up hosting for their app, a mug of tea beside them" },
  hotel: { size: "1536x1024", describe: "A traveler with a small suitcase at a bright modern hotel front desk, handing over a card to a friendly receptionist" },
  rental: { size: "1536x1024", describe: "Two friends at a car rental counter on a sunny day, one receiving car keys, both smiling" },
  stream: { size: "1536x1024", describe: "A relaxed young adult on a couch at night with a bowl of popcorn, watching a movie on a TV, warm lamp light" },
};

const made = new Map<string, Promise<Uint8Array>>();
const DIR = join(tmpdir(), "payproxy-pictures");

async function draw(name: string): Promise<Uint8Array> {
  const file = join(DIR, `${name}.webp`);
  if (existsSync(file)) return new Uint8Array(await readFile(file));
  const key = process.env.META_API_KEY;
  if (!key) throw new Error("no Meta key");
  const p = PICTURES[name];
  const res = await fetch("https://api.meta.ai/v1/images/generations", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "muse-image-1.0", prompt: `${p.describe}. ${RULES}`, n: 1, size: p.size, output_format: "webp" }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Muse Image answered ${res.status}`);
  const body = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("no picture");
  const bytes = new Uint8Array(Buffer.from(b64, "base64"));
  if (bytes.length < 12 || bytes.length > 4_000_000) throw new Error("bad picture");
  await mkdir(DIR, { recursive: true });
  await writeFile(file, bytes);
  return bytes;
}

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }): Promise<Response> {
  const { name } = await ctx.params;
  if (!Object.hasOwn(PICTURES, name)) return new Response("Not found", { status: 404 });
  let job = made.get(name);
  if (!job) {
    job = draw(name);
    made.set(name, job);
    // A failed drawing can be tried again by the next visitor, not kept as a failure.
    job.catch(() => made.delete(name));
  }
  try {
    const bytes = await job;
    return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=86400" } });
  } catch {
    return new Response("Picture unavailable", { status: 503, headers: { "cache-control": "no-store" } });
  }
}
