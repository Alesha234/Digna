import { demoBalance, demoCards, demoTransactions, demoUser, practiceBills, testModeMessage } from "@/modules/ui/data/demoData";
import { formatCurrency, formatDate } from "@/modules/ui/lib/format";
import { downloadPracticeBillPdf, openPracticeBillPdf } from "@/modules/ui/lib/practicePdf";
import { TransactionList } from "@/modules/ui/components/TransactionList";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function DemoDataScreen() {
  void theme;
  return (
    <>
      <style>{`.pp-demo-page{background:${colors.page};color:${colors.ink};font-family:${typography.body}}.pp-hero{background:${colors.surface};border-bottom:1px solid ${colors.line};padding:${spacing.xl} ${spacing.md}}.pp-eyebrow{display:inline-block;background:${colors.mint};color:#0E1726;font-family:${typography.body};font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;border-radius:999px;padding:4px 12px}.pp-hero h1{font-family:${typography.heading};font-size:32px;line-height:1.1;margin:${spacing.md} 0 ${spacing.md} 0}.pp-hero p{font-family:${typography.body};color:${colors.muted};font-size:16px;margin:0;max-width:56ch}.pp-demo-wrap{max-width:960px;margin:0 auto;padding:${spacing.lg} ${spacing.md} ${spacing.xl} ${spacing.md};display:flex;flex-direction:column;gap:${spacing.lg}}.pp-demo-grid{display:grid;grid-template-columns:1fr;gap:${spacing.md}}.pp-card{background:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;box-shadow:${shadows.soft};padding:${spacing.lg}}.pp-lift{transition:transform 160ms ease,box-shadow 160ms ease}.pp-lift:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(16,32,29,0.12)}.pp-card h2,.pp-card h3{font-family:${typography.heading};margin:0 0 ${spacing.md} 0}.pp-section-label{font-family:${typography.body};font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted};margin:0 0 ${spacing.md} 0}.pp-meta{font-family:${typography.body};font-size:14px;color:${colors.muted};margin:4px 0}.pp-meta strong{color:${colors.ink}}.pp-cards-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:${spacing.md}}.pp-status{display:inline-block;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:700;background:${colors.page};border:1px solid ${colors.line};color:${colors.ink}}.pp-status.is-active{background:${colors.mint};border-color:${colors.mint};color:#0E1726}@media(min-width:640px){.pp-demo-grid{grid-template-columns:1fr 1fr}.pp-cards-list{grid-template-columns:1fr 1fr}}.pp-card:focus-visible,.pp-lift:focus-visible{outline:2px solid ${colors.mint};outline-offset:2px}@media(prefers-reduced-motion:reduce){.pp-lift,.pp-lift:hover{transform:none;transition:none}}`}</style>
      <div className="pp-demo-page">
        <section className="pp-hero" aria-labelledby="demo-hero-heading">
          <span className="pp-eyebrow">Practice money</span>
          <h1 id="demo-hero-heading">A sample account</h1>
          <p>A made-up person, with made-up cards and practice money, so you can see how Digna looks before making your own account.</p>
        </section>
        <div className="pp-demo-wrap">
          <RevealOnScroll>
            <div className="pp-demo-grid">
              <article className="pp-card pp-lift" aria-labelledby="demo-user-heading" tabIndex={0}>
                <p className="pp-section-label">Sample person</p>
                <h2 id="demo-user-heading">{demoUser.displayName}</h2>
                <p className="pp-meta"><strong>Email: </strong>{demoUser.email}</p>
                <p className="pp-meta"><strong>ID: </strong>{demoUser.id}</p>
              </article>
              <article className="pp-card pp-lift" aria-labelledby="demo-wallet-heading" tabIndex={0}>
                <p className="pp-section-label">Sample wallet</p>
                <h2 id="demo-wallet-heading">{formatCurrency(demoBalance.availableCents)}</h2>
                <p className="pp-meta">Updated {formatDate(demoBalance.updatedAt)}</p>
                <p className="pp-meta">{demoBalance.currency}</p>
                <p className="pp-meta"><strong>{testModeMessage}</strong> No real money moves.</p>
              </article>
            </div>
          </RevealOnScroll>
          <RevealOnScroll>
            <section aria-labelledby="demo-cards-heading">
              <p className="pp-section-label">Sample cards</p>
              <h2 id="demo-cards-heading" style={{ fontFamily: typography.heading, margin: `0 0 ${spacing.md} 0` }}>Cards</h2>
              <ul className="pp-cards-list">
                {demoCards.map((card) => (
                  <li key={card.id} className="pp-card pp-lift" tabIndex={0}>
                    <h3>{card.name}</h3>
                    <p className="pp-meta">•••• {card.last4}</p>
                    <p className="pp-meta"><strong>Cap: </strong>{formatCurrency(card.capCents)}</p>
                    <p className="pp-meta"><strong>Spent: </strong>{formatCurrency(card.spentCents)}</p>
                    <p className="pp-meta"><strong>Ends: </strong>{formatDate(card.endDate)}</p>
                    <p className="pp-meta"><span className={card.status === "active" ? "pp-status is-active" : "pp-status"}>{card.status}</span></p>
                  </li>
                ))}
              </ul>
            </section>
          </RevealOnScroll>
          <RevealOnScroll>
            <section className="pp-card" aria-labelledby="demo-bills-heading">
              <p className="pp-section-label">Practice bills</p>
              <h2 id="demo-bills-heading">Practice bills</h2>
              <p className="pp-meta">Made-up bills you can preview or keep as a PDF. Practice money only: no real money moves.</p>
              <ul className="pp-cards-list">
                {practiceBills.map((bill) => (
                  <li key={bill.id} className="pp-card pp-lift" tabIndex={0}>
                    <h3>{bill.storeName}</h3>
                    <p className="pp-meta"><strong>Amount: </strong>{formatCurrency(bill.amountCents)} in practice money</p>
                    <p className="pp-meta"><strong>Due: </strong>{bill.dueDate}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        style={{ background: colors.mint, color: "#0E1726", border: 0, borderRadius: 999, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: typography.body }}
                        onClick={() => openPracticeBillPdf({ business: bill.storeName, amountCents: bill.amountCents, date: bill.dueDate, receiptId: bill.id })}
                      >
                        Open preview
                      </button>
                      <button
                        type="button"
                        style={{ background: "transparent", border: `1px solid ${colors.line}`, borderRadius: 999, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", color: colors.ink, fontFamily: typography.body }}
                        onClick={() => downloadPracticeBillPdf({ business: bill.storeName, amountCents: bill.amountCents, date: bill.dueDate, receiptId: bill.id })}
                      >
                        Download PDF
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </RevealOnScroll>
          <RevealOnScroll>
            <section className="pp-card" aria-labelledby="demo-history-heading">
              <p className="pp-section-label">Sample history</p>
              <h2 id="demo-history-heading">History</h2>
              <TransactionList transactions={demoTransactions} emptyTitle="No demo history" emptyMessage="Demo charges will appear here." />
            </section>
          </RevealOnScroll>
        </div>
      </div>
    </>
  );
}
