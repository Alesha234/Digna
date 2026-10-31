/**
 * PayProxy's mark: a card standing in for another (the proxy), with a spending-cap meter on the front card.
 * Navy and mint, drawn as vector shapes so it stays sharp at every size.
 */
export function LogoMark({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="48" height="48" rx="12" fill="#0C1F2E" />
      <rect x="10" y="12" width="23" height="16" rx="3.5" fill="none" stroke="#7CF2D2" strokeWidth="2" opacity="0.6" />
      <rect x="15" y="19" width="23" height="16" rx="3.5" fill="#0EC49A" />
      <rect x="19" y="22.5" width="5.5" height="4.2" rx="1.1" fill="#0C1F2E" opacity="0.8" />
      <rect x="19" y="30" width="15" height="2.4" rx="1.2" fill="#0C1F2E" opacity="0.28" />
      <rect x="19" y="30" width="9.5" height="2.4" rx="1.2" fill="#0C1F2E" />
    </svg>
  );
}

/** The mark with the PayProxy name beside it. */
export function Logo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: Math.round(size * 0.72), letterSpacing: "-0.02em", color: light ? "#FFFFFF" : "#10201D" }}>
        Pay<span style={{ color: light ? "#7CF2D2" : "#0A8F8A" }}>Proxy</span>
      </span>
    </span>
  );
}
