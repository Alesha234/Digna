import { dailyGate, fail, metaKey, signedInUser } from "../_lib/guard";

/**
 * Talking to Digna (Nov 2, 2026): a short recording from the money assistant's mic, written down by Meta's Muse Voice
 * Transcribe, for signed-in people only. The browser sends a mono 16 kHz WAV; the text comes back for the person to
 * check before they press Send. The audio is never kept.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** About 60 seconds of 16 kHz mono 16-bit audio, as base64. */
const MAX_AUDIO_CHARS = 2_800_000;
const PER_PERSON = 40;
const PER_SITE = Math.max(1, Number(process.env.VOICE_SITE_DAILY_LIMIT) || 600);

export async function POST(req: Request): Promise<Response> {
  const user = await signedInUser(req);
  if (!user) return fail(401, "Make a free account to talk to Digna.");
  const key = metaKey();
  if (!key) {
    console.error("[voice] not set on the host: META_API_KEY");
    return fail(503, "Talking to Digna isn't available right now. Type your question instead.");
  }
  let body: { audio?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "Send JSON.");
  }
  const audio = typeof body.audio === "string" ? body.audio : "";
  if (audio.length < 100 || audio.length > MAX_AUDIO_CHARS || !/^[A-Za-z0-9+/]+=*$/.test(audio)) return fail(400, "Send one recording of up to 60 seconds.");
  const gate = dailyGate("voice", user.id, PER_PERSON, PER_SITE);
  if ("refusal" in gate) return gate.refusal;

  const form = new FormData();
  form.append("request", new Blob([JSON.stringify({ model: "muse-voice-transcribe-1.0", audioEncoding: "WAV", mode: "PUSH_TO_TALK" })], { type: "application/json" }));
  form.append("audio", new Blob([Buffer.from(audio, "base64")], { type: "audio/wav" }), "speech.wav");
  const res = await fetch("https://api.meta.ai/v1/asr/transcribe", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(45_000) }).catch((e: unknown) => {
    console.error(`[voice] Muse Voice Transcribe couldn't be reached: ${e instanceof Error ? e.name : "error"}`);
    return null;
  });
  if (!res || !res.ok) {
    if (res) console.error(`[voice] Muse Voice Transcribe answered HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
    gate.giveBack();
    return fail(503, "Couldn't write down what you said just now. Try again, or type it.");
  }
  const out = (await res.json().catch(() => ({}))) as { transcript?: unknown; text?: unknown };
  const text = (typeof out.transcript === "string" ? out.transcript : typeof out.text === "string" ? out.text : "").trim();
  if (!text) {
    gate.giveBack();
    return fail(422, "I didn't catch that. Try again a little closer to the mic.");
  }
  return Response.json({ text: text.slice(0, 1000) });
}
