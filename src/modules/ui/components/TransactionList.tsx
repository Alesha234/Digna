import { useState } from "react";
import type { CSSProperties } from "react";
import { EmptyState } from "@/modules/ui/components/EmptyState";
import { formatCurrency, formatDate, formatTxnResult } from "@/modules/ui/lib/format";
import { colors, radii, shadows, spacing, theme, typography } from "@/modules/ui/theme";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import type { SandboxPayment } from "@/modules/ui/lib/sandbox";
import type { CardTransaction, PracticeBillRecord, PracticeReceipt } from "@/modules/ui/types";

/** A stored payment as a practice bill record: approved payments are paid, the rest are kept as past. */
export function paymentToPracticeBill(p: SandboxPayment): PracticeBillRecord {
  const paidAt: string = p.createdAt && p.createdAt.length > 0 ? p.createdAt : new Date(0).toISOString();
  const stamp: number = Date.parse(paidAt);
  const receiptId: string = Number.isFinite(stamp)
    ? `DG-${stamp.toString(36).toUpperCase().slice(-8)}`
    : `DG-${p.id.replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase() || "BILL"}`;
  return {
    id: p.id,
    placeOrBusiness: p.merchant,
    amountCents: p.amountCents,
    dueDate: Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0, 10) : "",
    paidAt,
    receiptId,
    status: p.result === "approved" ? "paid" : "past",
  };
}

/** The practice receipt for a stored practice bill. */
export function paymentToPracticeReceipt(p: SandboxPayment): PracticeReceipt {
  const bill: PracticeBillRecord = paymentToPracticeBill(p);
  return {
    id: bill.id,
    placeOrBusiness: bill.placeOrBusiness,
    amountCents: bill.amountCents,
    dueDate: bill.dueDate,
    paidAt: bill.paidAt,
    receiptId: bill.receiptId,
    status: bill.status,
  };
}

/** The printable words of a practice receipt. Practice money only: no real money moves. */
export function practiceReceiptText(r: PracticeReceipt): string {
  return [
    "Digna practice receipt",
    `Practice receipt: ${r.receiptId}`,
    `Paid to (place or business): ${r.placeOrBusiness}`,
    `Amount: ${formatCurrency(r.amountCents)} in practice money`,
    r.dueDate ? `Due date: ${r.dueDate}` : "Due date: —",
    `Paid at: ${r.paidAt}`,
    `Status: ${r.status}`,
    "Practice money only: no real money moves.",
  ].join("\n");
}

/** Saves a practice receipt as a text file on the device. */
export function downloadPracticeReceipt(r: PracticeReceipt): void {
  try {
    const blob: Blob = new Blob([practiceReceiptText(r)], { type: "text/plain" });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = `practice-receipt-${r.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* downloading is a convenience only */
  }
}

/** The stored payments when the caller passes none and a wallet is present; undefined with no wallet. */
function useStoredPayments(): SandboxPayment[] | undefined {
  try {
    return usePayProxy().payments;
  } catch {
    return undefined;
  }
}

const btnGhost: CSSProperties = {
  background: "transparent",
  border: `1px solid ${colors.line}`,
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  color: colors.ink,
  fontFamily: typography.body,
};

export function TransactionList(props: { transactions: CardTransaction[]; payments?: SandboxPayment[]; emptyTitle?: string; emptyMessage?: string }) {
  const transactions: CardTransaction[] = props.transactions;
  const emptyTitle: string = props.emptyTitle ?? "No history yet";
  const emptyMessage: string = props.emptyMessage ?? "Charges and declines for this card will appear here with store, amount, date and result.";
  const stored: SandboxPayment[] | undefined = useStoredPayments();
  const payments: SandboxPayment[] | undefined = props.payments ?? stored;
  const bills: PracticeBillRecord[] | undefined = payments?.map(paymentToPracticeBill);
  const [openId, setOpenId] = useState<string | null>(null);
  void theme;

  if (transactions.length === 0 && !payments) {
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
      <style>{`.pp-txn-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:${spacing.sm}}.pp-txn-list .pp-card{background:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;box-shadow:${shadows.soft};padding:${spacing.md};display:flex;flex-direction:column;gap:${spacing.sm};transition:transform 160ms ease,box-shadow 160ms ease}.pp-txn-list .pp-card:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,32,29,0.12)}.pp-txn-row{display:flex;align-items:center;justify-content:space-between;gap:${spacing.sm}}.pp-txn-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-family:${typography.body};font-size:13px;font-weight:700}.pp-txn-badge.is-approved{background:${colors.mint};color:#0E1726}.pp-txn-badge.is-declined{background:transparent;border:1px solid ${colors.line};color:${colors.muted}}@media(prefers-reduced-motion:reduce){.pp-txn-list .pp-card,.pp-txn-list .pp-card:hover{transform:none;transition:none}}`}</style>
      {transactions.length === 0 ? (
        <EmptyState title={emptyTitle} hint={emptyMessage} />
      ) : (
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
      )}
      {bills ? (
        <section aria-label="Past bills and receipts" style={{ marginTop: spacing.lg }}>
          <h2 style={{ fontFamily: typography.heading, fontSize: 18, margin: `0 0 ${spacing.sm} 0`, color: colors.ink }}>
            Past bills and receipts
          </h2>
          {bills.length === 0 ? (
            <EmptyState
              title="No past bills or receipts yet"
              hint="Paid practice bills are kept here with a practice receipt you can view or download. Practice money only."
            />
          ) : (
            <ul className="pp-txn-list" aria-label="Past bills and receipts">
              {bills.map((b: PracticeBillRecord) => {
                const paid: boolean = b.status === "paid";
                const open: boolean = openId === b.id;
                return (
                  <li key={b.id} className="pp-card" style={{ fontFamily: typography.body }}>
                    <div className="pp-txn-row">
                      <h3 style={{ margin: 0, fontFamily: typography.heading, fontSize: 16, color: colors.ink }}>{b.placeOrBusiness}</h3>
                      <span aria-label="amount" style={{ fontFamily: typography.heading, fontSize: 16, color: colors.ink }}>
                        {formatCurrency(b.amountCents)}
                      </span>
                    </div>
                    <div className="pp-txn-row">
                      <span aria-label="date" style={{ fontFamily: typography.body, fontSize: 14, color: colors.muted }}>
                        {formatDate(b.paidAt)}
                      </span>
                      <span aria-label={b.status} className={paid ? "pp-txn-badge is-approved" : "pp-txn-badge is-declined"}>
                        {paid ? "Paid" : "Past"}
                      </span>
                    </div>
                    {paid ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
                        <button
                          type="button"
                          style={btnGhost}
                          aria-expanded={open}
                          onClick={() => setOpenId(open ? null : b.id)}
                        >
                          {open ? "Hide practice receipt" : "View practice receipt"}
                        </button>
                        <button
                          type="button"
                          style={btnGhost}
                          onClick={() =>
                            downloadPracticeReceipt({
                              id: b.id,
                              placeOrBusiness: b.placeOrBusiness,
                              amountCents: b.amountCents,
                              dueDate: b.dueDate,
                              paidAt: b.paidAt,
                              receiptId: b.receiptId,
                              status: b.status,
                            })
                          }
                        >
                          Download practice receipt
                        </button>
                      </div>
                    ) : null}
                    {paid && open ? (
                      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", margin: 0, fontSize: 14, color: colors.ink }}>
                        <dt style={{ color: colors.muted }}>Place or business</dt><dd style={{ margin: 0 }}>{b.placeOrBusiness}</dd>
                        <dt style={{ color: colors.muted }}>Amount</dt><dd style={{ margin: 0 }}>{formatCurrency(b.amountCents)} in practice money</dd>
                        <dt style={{ color: colors.muted }}>Due date</dt><dd style={{ margin: 0 }}>{b.dueDate ? formatDate(b.dueDate) : "—"}</dd>
                        <dt style={{ color: colors.muted }}>Practice receipt</dt><dd style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace" }}>{b.receiptId}</dd>
                      </dl>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
