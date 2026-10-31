/**
 * Digna's mark: a bold D (for dignity) with an amber card tucked into its curve: the card that gets you through.
 * Ink and amber, drawn as vector shapes so it stays sharp at every size.
 */
export function LogoMark({ size = 32, dark = false, title }: { size?: number; dark?: boolean; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d="M14 10h16a22 22 0 0 1 0 44H14z" fill={dark ? "#FFFFFF" : "#0E1726"} />
      <rect x="26" y="26" width="26" height="17" rx="5" fill="#FFB020" />
      <rect x="31" y="30.5" width="6.5" height="4.5" rx="1.3" fill="#0E1726" opacity="0.85" />
    </svg>
  );
}

/** The wordmark: "digna" with an amber dot on the i, the one spot of warmth in the name. */
export function Wordmark({ size = 24, dark = false }: { size?: number; dark?: boolean }) {
  const ink = dark ? "#FFFFFF" : "#0E1726";
  return (
    <span aria-label="Digna" role="img" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: size, letterSpacing: "-0.035em", color: ink, lineHeight: 1, display: "inline-block" }}>
      <span aria-hidden="true">
        d
        <span style={{ position: "relative", display: "inline-block" }}>
          ı
          <span style={{ position: "absolute", left: "50%", top: "0.06em", width: "0.2em", height: "0.2em", transform: "translateX(-50%)", borderRadius: "50%", background: "#FFB020" }} />
        </span>
        gna
      </span>
    </span>
  );
}

/** The mark with the Digna name beside it. */
export function Logo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.3) }}>
      <LogoMark size={size} dark={light} />
      <Wordmark size={Math.round(size * 0.8)} dark={light} />
    </span>
  );
}
