/**
 * Recording for "talk to Digna" (Nov 2, 2026): the microphone at 16 kHz, kept as mono 16-bit PCM and wrapped as a WAV
 * file in the browser (a 44-byte header), ready for Meta's Muse Voice Transcribe. Nothing leaves the browser until the
 * person stops and the recording is sent.
 */
export const VOICE_MAX_SECONDS = 60;
const RATE = 16000;

export type Recorder = { stop: () => Promise<string>; cancel: () => void };

/** Starts recording; stop() gives back the WAV as base64. Throws in plain words when the mic is blocked or missing. */
export async function startRecording(): Promise<Recorder> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't use a microphone. Type your question instead.");
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch {
    throw new Error("Your microphone is blocked. Click the lock or mic icon next to the web address, allow the microphone for digna.dev, then try again.");
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC({ sampleRate: RATE });
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(node);
  node.connect(ctx.destination);
  const end = () => {
    node.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
  return {
    cancel: end,
    async stop() {
      end();
      return toWavBase64(chunks, ctx.sampleRate);
    },
  };
}

function toWavBase64(chunks: Float32Array[], rate: number): string {
  const length = chunks.reduce((n, c) => n + c.length, 0);
  const max = rate * VOICE_MAX_SECONDS;
  const samples = Math.min(length, max);
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const text = (at: number, s: string) => [...s].forEach((ch, i) => v.setUint8(at + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  v.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, samples * 2, true);
  let at = 44;
  let written = 0;
  for (const c of chunks) {
    for (let i = 0; i < c.length && written < samples; i++, written++, at += 2) {
      const s = Math.max(-1, Math.min(1, c[i]));
      v.setInt16(at, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
