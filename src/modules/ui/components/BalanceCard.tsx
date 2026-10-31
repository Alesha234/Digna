import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";
import { formatCurrency } from "@/modules/ui/lib/format";
import type { PayProxyUser, WalletBalance, VirtualCard, CardTransaction } from "@/modules/ui/types";

type BalanceTypeRefs = PayProxyUser | WalletBalance | VirtualCard | CardTransaction;

void theme;
const _balanceTypeGuard: BalanceTypeRefs | null = null;
void _balanceTypeGuard;

export function BalanceCard(props: { balanceCents: number; onAddMoney: () => void }) {
  const { balanceCents, onAddMoney } = props as { balanceCents: number; onAddMoney: () => void };
  return (
    <section
      className="pp-card"
      aria-label="Digna balance"
      style={{
        width: "100%",
        maxWidth: "100%",
        backgroundColor: colors.surface,
        color: colors.ink,
        border: `1px solid ${colors.line}`,
        borderRadius: radii.card,
        boxShadow: shadows.soft,
        padding: spacing.lg,
        fontFamily: typography.body,
        transition: "transform 160ms ease, box-shadow 160ms ease",
      }}
    >
      <style>{`.pp-card:hover{transform:translateY(-2px);box-shadow:${shadows.soft}, 0 12px 32px rgba(16,32,29,0.12);}@media (prefers-reduced-motion: reduce){.pp-card,.pp-btn-mint{transition:none !important;transform:none !important;}}.pp-btn-mint{transition:transform 160ms ease, filter 160ms ease;}.pp-btn-mint:hover{filter:brightness(1.04);transform:translateY(-1px);}.pp-btn-mint:focus-visible{outline:2px solid ${colors.ink};outline-offset:2px;}`}</style>
      <div
        style={{
          color: colors.muted,
          fontFamily: typography.body,
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        Digna balance
      </div>
      <div
        style={{
          color: colors.ink,
          fontFamily: typography.heading,
          fontSize: "34px",
          lineHeight: 1.1,
          fontWeight: 700,
          marginTop: spacing.md,
        }}
      >
        {formatCurrency(balanceCents)}
      </div>
      <div
        style={{
          color: colors.muted,
          fontFamily: typography.body,
          fontSize: "14px",
          marginTop: spacing.md,
        }}
      >
        Practice money
      </div>
      <button
        type="button"
        className="pp-btn-mint"
        aria-label="Add money"
        onClick={onAddMoney}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          backgroundColor: colors.mint,
          color: "#0E1726",
          border: `1px solid ${colors.mint}`,
          borderRadius: 999,
          padding: `${spacing.md} ${spacing.lg}`,
          fontFamily: typography.body,
          fontSize: "15px",
          fontWeight: 700,
          marginTop: spacing.lg,
          cursor: "pointer",
        }}
      >
        Add money
      </button>
    </section>
  );
}
