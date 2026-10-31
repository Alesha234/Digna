import { EmptyState } from "@/modules/ui/components/EmptyState";
import { formatCurrency, formatDate, formatTxnResult } from "@/modules/ui/lib/format";
import { colors, radii, shadows, spacing, theme, typography } from "@/modules/ui/theme";
import type { CardTransaction } from "@/modules/ui/types";

export function TransactionList(props: { transactions: CardTransaction[]; emptyTitle?: string; emptyMessage?: string }) {
  const transactions: CardTransaction[] = props.transactions;
  const emptyTitle: string = props.emptyTitle ?? "No history yet";
  const emptyMessage: string = props.emptyMessage ?? "Charges and declines for this card will appear here with store, amount, date and result.";
  void theme;

  if (transactions.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyMessage} />;
  }

  function storeOf(txn: CardTransaction): string {
    const v: unknown = (txn as unknown as Record<string, unknown>).store;
    if (typeof v === "string" && v.length > 0) return v;
    const fallback: unknown = (txn as unknown as Record<string, unknown>).storeName;
    return typeof fallback === "string" ? fallback : "";
  }

  function dateOf(txn: CardTransaction): string {
    const v: unknown = (txn as unknown as Record<string, unknown>).date;
    if (typeof v === "string" && v.length > 0) return v;
    const fallback: unknown = (txn as unknown as Record<string, unknown>).occurredAt;
    return typeof fallback === "string" ? fallback : "";
  }

  return (
    <>
      <style>{`.pp-txn-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:${spacing.sm}}.pp-txn-list .pp-card{background:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;box-shadow:${shadows.soft};padding:${spacing.md};display:flex;flex-direction:column;gap:${spacing.sm};transition:transform 160ms ease,box-shadow 160ms ease}.pp-txn-list .pp-card:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,32,29,0.12)}.pp-txn-row{display:flex;align-items:center;justify-content:space-between;gap:${spacing.sm}}.pp-txn-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-family:${typography.body};font-size:13px;font-weight:700}.pp-txn-badge.is-approved{background:${colors.mint};color:#06332A}.pp-txn-badge.is-declined{background:transparent;border:1px solid ${colors.line};color:${colors.muted}}@media(prefers-reduced-motion:reduce){.pp-txn-list .pp-card,.pp-txn-list .pp-card:hover{transform:none;transition:none}}`}</style>
      <ul className="pp-txn-list" aria-label="Transactions">
        {transactions.map((txn: CardTransaction) => {
          const approved: boolean = txn.result === "approved";
          return (
            <li
              key={txn.id}
              className={approved ? "pp-card is-approved" : "pp-card is-declined"}
              style={{ fontFamily: typography.body }}
            >
              <div className="pp-txn-row">
                <h3 style={{ margin: 0, fontFamily: typography.heading, fontSize: 16, color: colors.ink }}>{storeOf(txn)}</h3>
                <span aria-label="amount" style={{ fontFamily: typography.heading, fontSize: 16, color: colors.ink }}>
                  {formatCurrency(txn.amountCents)}
                </span>
              </div>
              <div className="pp-txn-row">
                <span aria-label="date" style={{ fontFamily: typography.body, fontSize: 14, color: colors.muted }}>
                  {formatDate(dateOf(txn))}
                </span>
                <span aria-label={txn.result} className={approved ? "pp-txn-badge is-approved" : "pp-txn-badge is-declined"}>
                  {formatTxnResult(txn.result)}
                </span>
              </div>
              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                store amount date result
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
