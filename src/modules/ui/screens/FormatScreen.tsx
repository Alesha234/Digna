import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { formatCurrency, formatDate, formatPercent, formatCapUsage, formatTxnResult, maskCardNumber } from "@/modules/ui/lib/format";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function FormatScreen() {
  const amount = formatCurrency(2599);
  const secondAmount = formatCurrency(8420);
  const txnDate = formatDate("2026-06-15");
  const secondDate = formatDate("2026-06-14");
  const masked = maskCardNumber("4242");
  const maskedSecond = maskCardNumber("8310");
  const approvedLabel = formatTxnResult("approved");
  const declinedLabel = formatTxnResult("declined");
  const capUsage = formatCapUsage(18500, 50000);
  const capUsageSecond = formatCapUsage(4200, 10000);
  const pctUsed = formatPercent(18500, 50000);
  const pctSecond = formatPercent(4200, 10000);
  const storeTotal = formatCurrency(26919);
  void theme;

  return (
    <div
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
        minHeight: "100%",
      }}
    >
      <style>{`
        .pp-hero{background:${colors.surface};border-bottom:1px solid ${colors.line};padding:${spacing.xl} ${spacing.md};}
        .pp-hero-inner{max-width:960px;margin:0 auto;}
        .pp-eyebrow{display:inline-block;font-family:${typography.heading};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0E1726;background:${colors.mint};border-radius:${radii.pill}px;padding:6px 14px;font-weight:700;}
        .pp-hero h1{font-family:${typography.heading};font-size:clamp(32px,5vw,52px);line-height:1.05;margin:${spacing.md} 0 ${spacing.sm} 0;letter-spacing:-0.02em;}
        .pp-hero p{color:${colors.muted};font-size:17px;line-height:1.6;margin:0;max-width:60ch;}
        .pp-section{max-width:960px;margin:0 auto;padding:${spacing.xl} ${spacing.md};}
        .pp-section h2{font-family:${typography.heading};font-size:24px;margin:0 0 4px 0;}
        .pp-section-sub{color:${colors.muted};margin:0 0 ${spacing.lg} 0;line-height:1.6;}
        .pp-grid{display:grid;gap:${spacing.md};grid-template-columns:1fr;}
        @media(min-width:720px){.pp-grid{grid-template-columns:1fr 1fr;}.pp-hero{padding:${spacing.xl} ${spacing.lg};}}
        .pp-card{background:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;box-shadow:${shadows.soft};padding:${spacing.lg};}
        .pp-lift{transition:transform 160ms ease,box-shadow 160ms ease;}
        .pp-lift:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(16,32,29,0.12);}
        .pp-lift:focus-within{transform:translateY(-3px);}
        .pp-card h3{font-family:${typography.heading};font-size:16px;margin:0 0 8px 0;}
        .pp-card dl{margin:0;display:grid;gap:8px;}
        .pp-card dt{font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${colors.muted};}
        .pp-card dd{margin:0;font-weight:700;}
        .pp-badge{display:inline-block;border-radius:${radii.pill}px;padding:4px 12px;font-size:13px;font-weight:700;border:1px solid ${colors.line};}
        .is-approved{background:#E6F7F0;color:#0E1726;border-color:#BDE8D9;}
        .is-declined{background:#FDECEC;color:#7A1F1F;border-color:#F5C6C6;}
        .pp-next{color:${colors.muted};font-weight:400;line-height:1.55;}
        .pp-bar{height:8px;border-radius:${radii.pill}px;background:${colors.line};overflow:hidden;}
        .pp-bar-fill{height:100%;background:${colors.mint};border-radius:${radii.pill}px;}
        .pp-reveal{opacity:0;transform:translateY(12px);transition:opacity 220ms ease,transform 220ms ease;}
        .pp-reveal.is-visible{opacity:1;transform:none;}
        @media(prefers-reduced-motion:reduce){.pp-reveal{opacity:1;transform:none;transition:none;}.pp-lift{transition:none;}.pp-lift:hover{transform:none;}}
      `}</style>

      <section className="pp-hero" aria-labelledby="format-title">
        <div className="pp-hero-inner">
          <RevealOnScroll delayMs={0}>
            <span className="pp-eyebrow">Clear Mint</span>
            <h1 id="format-title">Format</h1>
            <p>Consistent USD amounts, dates and cap usage across Digna. Every number, date and balance on this page is formatted the same way.</p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="pp-section" aria-labelledby="amounts-heading">
        <RevealOnScroll delayMs={0}>
          <h2 id="amounts-heading">Amounts with store and date</h2>
          <p className="pp-section-sub">Store charges read the same everywhere: amount, card and date.</p>
        </RevealOnScroll>
        <div className="pp-grid">
          <RevealOnScroll delayMs={0}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Hotel charge details">
              <h3>Hotel charge</h3>
              <dl>
                <div><dt>Amount</dt><dd>{amount}</dd></div>
                <div><dt>Date</dt><dd>{txnDate}</dd></div>
                <div><dt>Card</dt><dd>{masked}</dd></div>
              </dl>
            </article>
          </RevealOnScroll>
          <RevealOnScroll delayMs={80}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Rental charge details">
              <h3>Rental charge</h3>
              <dl>
                <div><dt>Amount</dt><dd>{secondAmount}</dd></div>
                <div><dt>Date</dt><dd>{secondDate}</dd></div>
                <div><dt>Card</dt><dd>{maskedSecond}</dd></div>
                <div><dt>Trip total</dt><dd>{storeTotal}</dd></div>
              </dl>
            </article>
          </RevealOnScroll>
        </div>
      </section>

      <section className="pp-section" aria-labelledby="declines-heading">
        <RevealOnScroll delayMs={0}>
          <h2 id="declines-heading">Explained declines</h2>
          <p className="pp-section-sub">Every result uses plain words and a clear next step.</p>
        </RevealOnScroll>
        <div className="pp-grid">
          <RevealOnScroll delayMs={0}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Approved payment">
              <h3>Hotel hold</h3>
              <p><span className="pp-badge is-approved">{approvedLabel}</span></p>
              <p><strong>{amount}</strong> on <strong>{masked}</strong></p>
              <p className="pp-next">Next step: you are all set. The hold releases automatically at checkout.</p>
            </article>
          </RevealOnScroll>
          <RevealOnScroll delayMs={80}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Declined payment">
              <h3>Rental deposit</h3>
              <p><span className="pp-badge is-declined">{declinedLabel}</span></p>
              <p><strong>{secondAmount}</strong> on <strong>{maskedSecond}</strong></p>
              <p className="pp-next">Next step: over your daily cap. Raise the cap or use another card to try again.</p>
            </article>
          </RevealOnScroll>
        </div>
      </section>

      <section className="pp-section" aria-labelledby="caps-heading">
        <RevealOnScroll delayMs={0}>
          <h2 id="caps-heading">Caps and balances</h2>
          <p className="pp-section-sub">Spent versus cap, shown the same way on every control.</p>
        </RevealOnScroll>
        <div className="pp-grid">
          <RevealOnScroll delayMs={0}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Travel cap usage">
              <h3>Travel cap</h3>
              <dl>
                <div><dt>Usage</dt><dd>{capUsage}</dd></div>
                <div><dt>Used</dt><dd>{pctUsed}</dd></div>
              </dl>
              <div className="pp-bar" role="progressbar" aria-valuenow={37} aria-valuemin={0} aria-valuemax={100} aria-label="Travel cap used">
                <div className="pp-bar-fill" style={{ width: pctUsed }} />
              </div>
            </article>
          </RevealOnScroll>
          <RevealOnScroll delayMs={80}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Dining cap usage">
              <h3>Dining cap</h3>
              <dl>
                <div><dt>Usage</dt><dd>{capUsageSecond}</dd></div>
                <div><dt>Used</dt><dd>{pctSecond}</dd></div>
              </dl>
              <div className="pp-bar" role="progressbar" aria-valuenow={42} aria-valuemin={0} aria-valuemax={100} aria-label="Dining cap used">
                <div className="pp-bar-fill" style={{ width: pctSecond }} />
              </div>
            </article>
          </RevealOnScroll>
          <RevealOnScroll delayMs={160}>
            <article className="pp-card pp-lift" tabIndex={0} aria-label="Cap note">
              <h3>Calm by default</h3>
              <p className="pp-next">Caps pause spending quietly. No fees, no surprises. Adjust anytime before your next charge on {txnDate}.</p>
            </article>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
