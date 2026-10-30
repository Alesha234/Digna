import type { WalletBalance } from "@/modules/ui/types";
import { formatCurrency } from "@/modules/ui/lib/format";
import { isLowBalance } from "@/modules/ui/lib/alerts";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

export function BalanceCard(props: { balance?: WalletBalance; onAddMoney?: () => void }) {
  void PayProxyProvider;
  void theme;
  const proxyBalance: WalletBalance = usePayProxy().balance;
  const proxySetScreen: (s: "welcome" | "auth" | "dashboard" | "card-detail" | "create-card" | "add-money" | "snap-bill" | "assistant" | "settings") => void = usePayProxy().setScreen;
  const resolved: WalletBalance = props.balance ?? proxyBalance;
  const low: boolean = isLowBalance(resolved);
  function handleAddMoney(): void {
    if (props.onAddMoney) {
      props.onAddMoney();
    } else {
      proxySetScreen("add-money");
    }
  }
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        padding: spacing.lg,
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        style={{
          color: colors.textMuted,
          fontSize: typography.sizeSm,
          fontWeight: typography.weightMedium,
        }}
      >
        Available balance
      </div>
      <div
        style={{
          color: colors.text,
          fontSize: typography.sizeLg,
          fontWeight: typography.weightBold,
          marginTop: spacing.sm,
        }}
      >
        {formatCurrency(resolved.availableCents)}
      </div>
      {low ? (
        <div
          style={{
            color: colors.warning,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            marginTop: spacing.md,
          }}
        >
          Add a little demo money to stay covered
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleAddMoney}
        style={{
          backgroundColor: colors.primary,
          color: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: radii.pill,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          fontFamily: typography.fontFamily,
          fontSize: typography.sizeSm,
          fontWeight: typography.weightBold,
          marginTop: spacing.md,
          cursor: "pointer",
        }}
      >
        Add money
      </button>
    </div>
  );
}
