import { useEffect, useState } from "react";
import { LATEST_WHATS_NEW, WHATS_NEW } from "@/modules/ui/data/whatsNew";
import { colors, radii, shadows, typography } from "@/modules/ui/theme";

/**
 * "What's new" (Nov 4, 2026): a quiet, labelled way to tell people about updates. The menu shows a small "New" badge
 * (and the phone Menu button a dot) until the person opens the What's new page; then both go away until the next
 * update. Remembered per device in the browser; if storage is blocked, the badge simply shows.
 */
const SEEN_KEY = "digna-whats-new-seen";
const SEEN_EVENT = "digna-whats-new-seen";

function lastSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

/** True while there's an update this person hasn't opened yet. */
export function useWhatsNewUnseen(): boolean {
  const [unseen, setUnseen] = useState(false);
  useEffect(() => {
    const check = () => setUnseen(Boolean(LATEST_WHATS_NEW) && lastSeen() !== LATEST_WHATS_NEW);
    check();
    window.addEventListener(SEEN_EVENT, check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener(SEEN_EVENT, check);
      window.removeEventListener("storage", check);
    };
  }, []);
  return unseen;
}

/** The small amber "New" badge. Its gentle pulse stops for people who turn motion off. */
export function NewBadge() {
  return (
    <span className="pp-new-badge" aria-hidden="true">
      New
    </span>
  );
}

export function WhatsNewScreen() {
  // Which updates are new to this person, worked out before the page marks them seen.
  const [before, setBefore] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setBefore(lastSeen());
    try {
      window.localStorage.setItem(SEEN_KEY, LATEST_WHATS_NEW);
    } catch {
      /* private window: nothing to remember */
    }
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, []);
  const seenIndex = before ? WHATS_NEW.findIndex((e) => e.id === before) : -1;
  const isNew = (i: number) => before !== undefined && (seenIndex === -1 ? i < 3 : i < seenIndex);

  return (
    <section style={{ maxWidth: 760, margin: "0 auto", fontFamily: typography.body }}>
      <h1 style={{ fontFamily: typography.heading, fontSize: "clamp(28px, 4vw, 38px)", letterSpacing: "-0.02em", margin: "0 0 8px", color: colors.ink }}>What's new on Digna</h1>
      <p style={{ color: colors.muted, margin: "0 0 24px", fontSize: 17, lineHeight: 1.6 }}>Updates to Digna, newest first. Everything still uses practice money while real cards come with a licensed partner.</p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {WHATS_NEW.map((e, i) => (
          <li key={e.id} style={{ background: colors.surface, border: `1px solid ${colors.line}`, borderRadius: radii.card, boxShadow: shadows.soft, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.muted }}>{e.date}</span>
              {isNew(i) && <span className="pp-new-tag">New for you</span>}
            </div>
            <h2 style={{ fontFamily: typography.heading, fontSize: 20, margin: "0 0 6px", color: colors.ink }}>{e.title}</h2>
            <p style={{ margin: 0, color: colors.ink, lineHeight: 1.6, opacity: 0.85 }}>{e.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
