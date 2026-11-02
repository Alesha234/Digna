import * as React from "react";

/**
 * The Digna moment (Nov 2, 2026): every payment ends with its own short scene, like a jingle you remember. Approved:
 * the card tilts in and taps, a soft knock, two amber rings, a burst of light, the three-note Digna chime and a check
 * mark, the amount left counting down, then "Your money's good here." Declined, with dignity: no buzzer and no red,
 * two quiet notes, the card slides back, and the reason in plain words. The sound is made by the browser (no music
 * files) and only after the person pressed Pay; the switch in the corner turns it off, remembered on this device.
 */
export type Moment = {
  result: "approved" | "declined";
  merchant: string;
  amountCents: number;
  cardName: string;
  last4: string;
  digna: boolean;
  /** What was left on the Digna card before and after this payment, when it was one. */
  leftBefore?: number | null;
  leftAfter?: number | null;
  reason?: string | null;
};

const SOUND_KEY = "digna-sound";
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

let audio: AudioContext | null = null;
function ctx(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audio ??= new AC();
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch {
    return null;
  }
}
/** One soft bell note: a sine with a quiet shimmer above it, a quick start and a gentle fade. */
function bell(freq: number, at: number, len = 0.9, vol = 0.22): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + at;
  for (const [mult, v] of [[1, vol], [2, vol * 0.18], [3, vol * 0.06]] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + len + 0.05);
  }
}
/** The tap on the reader: a short, low, soft knock. */
function knock(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.2);
}
/** The Digna chime: G, C, E rising, then the C an octave up, softly. */
function chime(): void {
  bell(784, 0);
  bell(1047, 0.11);
  bell(1319, 0.22, 1.2);
  bell(2093, 0.36, 1.4, 0.07);
}
/** A decline: two quiet notes stepping down, never a buzzer. */
function softNo(): void {
  bell(659, 0, 0.6, 0.12);
  bell(523, 0.16, 0.9, 0.1);
}

const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + ((i * 37) % 10) / 30;
  const r = 90 + ((i * 53) % 70);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, white: i % 3 === 0 };
});

export function PayMoment(props: { moment: Moment; onClose: () => void }) {
  const m = props.moment;
  const ok = m.result === "approved";
  const [sound, setSound] = React.useState(soundOn);
  const [left, setLeft] = React.useState(m.leftBefore ?? null);
  const close = React.useRef(props.onClose);
  close.current = props.onClose;

  React.useEffect(() => {
    const timers: number[] = [];
    const later = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
    const play = soundOn();
    later(520, () => {
      if (play) knock();
      navigator.vibrate?.(15);
    });
    if (ok) {
      later(700, () => {
        if (play) chime();
        navigator.vibrate?.([25, 40, 60]);
      });
      // The amount left on the Digna card counts down, like a balance settling.
      if (m.leftBefore != null && m.leftAfter != null) {
        const from = m.leftBefore;
        const to = m.leftAfter;
        later(1400, () => {
          const start = performance.now();
          const step = (now: number) => {
            const k = Math.min(1, (now - start) / 900);
            setLeft(from + (to - from) * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      }
    } else later(760, () => play && softNo());
    later(ok ? 4200 : 5200, () => close.current());
    const key = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", key);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("keydown", key);
    };
  }, [ok, m.leftBefore, m.leftAfter]);

  function toggleSound(e: React.MouseEvent): void {
    e.stopPropagation();
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      /* the switch still works for this payment */
    }
  }

  const words = "Your money's good here.".split(" ");
  return (
    <div className="pp-moment" role="status" aria-live="polite" aria-label={ok ? `Approved: ${money(m.amountCents)} at ${m.merchant}` : `Declined: ${m.reason ?? ""}`} onClick={props.onClose}>
      <div className="pp-moment-stage">
        <button type="button" className="pp-moment-sound" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Turn payment sounds off" : "Turn payment sounds on"}>
          {sound ? "♪ Sound on" : "Sound off"}
        </button>
        {ok && (
          <>
            <span className="pp-moment-ring" />
            <span className="pp-moment-ring pp-moment-ring2" />
            {SPARKS.map((s, i) => (
              <i key={i} className="pp-moment-spark" style={{ "--x": `${s.x}px`, "--y": `${s.y}px`, background: s.white ? "#FFFFFF" : undefined } as React.CSSProperties} />
            ))}
          </>
        )}
        <div className={`pp-moment-card ${ok ? "is-ok" : "is-no"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <b>{m.digna ? "Digna" : m.cardName.split(" ")[0]}</b>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{m.digna ? m.cardName.replace(/^Digna card:\s*/, "") : "Example card"}</span>
          </div>
          <div className="pp-moment-chip" />
          <div style={{ letterSpacing: "0.16em", fontSize: 13, opacity: 0.9 }}>•••• {m.last4}</div>
        </div>
        {ok && (
          <div className="pp-moment-check" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <path d="M11 23 L19 31 L34 14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div className={`pp-moment-msg ${ok ? "" : "is-no"}`}>
          <div className="pp-moment-big">{ok ? "Approved" : "Not this card"}</div>
          {ok ? (
            <div className="pp-moment-small">
              {money(m.amountCents)} at {m.merchant}
              {left != null ? (
                <>
                  {" · "}
                  <b>{money(Math.max(0, left))}</b> left on this card
                </>
              ) : (
                ` · ${m.cardName} ···· ${m.last4}`
              )}
              <div className="pp-moment-tag">
                {words.map((w, i) => (
                  <span key={i} className="pp-moment-word" style={{ animationDelay: `${1.7 + i * 0.12}s` }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="pp-moment-small">{m.reason ?? "This card can't be used here."}</div>
          )}
        </div>
        <span className="pp-moment-hint">Practice money · tap to close</span>
      </div>
    </div>
  );
}
