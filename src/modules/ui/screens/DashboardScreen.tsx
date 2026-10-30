import * as React from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { BalanceCard } from "@/modules/ui/components/BalanceCard";
import { VirtualCardView } from "@/modules/ui/components/VirtualCardView";
import { WarningBanner } from "@/modules/ui/components/WarningBanner";
import { EmptyState } from "@/modules/ui/components/EmptyState";
import { buildWarnings } from "@/modules/ui/lib/alerts";
import { formatCurrency } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

export function DashboardScreen() {
  void PayProxyProvider;
  void theme;
  const { user, balance, cards, transactions, setScreen, selectCard } = usePayProxy();
  const warnings = buildWarnings(cards, balance);

  function handleAddMoney(): void {
    setScreen("add-money");
  }

  function handleOpen(id: string): void {
    selectCard(id);
    setScreen("card-detail");
  }

  function handleWarningAction(cardId: string | undefined): void {
    if (typeof cardId === "string" && cardId.length > 0) {
      selectCard(cardId);
      setScreen("card-detail");
    } else {
      setScreen("add-money");
    }
  }

  function handleCreateCard(): void {
    setScreen("create-card");
  }

  const greeting: string = user ? `Hi, ${(user as unknown as Record<string, unknown>).name as string}` : "Hi there";

  return (
    <div
      style={{
        backgroundColor: colors.background,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: colors.background,
          padding: spacing.lg,
          paddingBottom: spacing.lg,
        }}
      >
        <div
          style={{
            color: colors.text,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
            marginBottom: spacing.sm,
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            color: colors.textMuted,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            marginBottom: spacing.md,
          }}
        >
          Capped cards for safe spending
        </div>

        <BalanceCard {...({ onAddMoney: handleAddMoney } as any)} />

        <div style={{ marginTop: spacing.md, display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {warnings.map((w: { id: string; title: string; message: string; cardId?: string }) => (
            <WarningBanner
              {...({
                warning: w,
                title: w.title,
                message: w.message,
                actionLabel: w.cardId ? "View card" : "Add money",
                onAction: () => handleWarningAction(w.cardId),
                onPress: () => handleWarningAction(w.cardId),
              } as any)}
              key={w.id}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.lg,
            padding: spacing.md,
          }}
        >
          <div style={{ display: "flex", gap: spacing.sm }}>
            <button
              type="button"
              onClick={() => setScreen("create-card")}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                color: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.pill,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                cursor: "pointer",
              }}
            >
              New Card
            </button>
            <button
              type="button"
              onClick={() => setScreen("add-money")}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.pill,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                cursor: "pointer",
              }}
            >
              Add Money
            </button>
            <button
              type="button"
              onClick={() => setScreen("snap-bill")}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.pill,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                cursor: "pointer",
              }}
            >
              Snap Bill
            </button>
            <button
              type="button"
              onClick={() => setScreen("assistant")}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: radii.pill,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
                cursor: "pointer",
              }}
            >
              Assistant
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: spacing.lg,
            color: colors.text,
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
          }}
        >
          Your cards
        </div>

        <div style={{ marginTop: spacing.md }}>
          {cards.length === 0 ? (
            <EmptyState
              {...({
                title: "No cards yet",
                hint: "Create a capped card for Google Cloud or your hotel trip",
                message: "Create a capped card for Google Cloud or your hotel trip",
                description: "Create a capped card for Google Cloud or your hotel trip",
                actionLabel: "Create card",
                actionText: "Create card",
                onAction: handleCreateCard,
                onPress: handleCreateCard,
              } as any)}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              {cards.map((c: { id: string }) => (
                <VirtualCardView
                  {...({
                    card: c,
                    virtualCard: c,
                    onOpen: (id: string) => handleOpen(typeof id === "string" && id.length > 0 ? id : c.id),
                    onPress: () => handleOpen(c.id),
                    onSelect: () => handleOpen(c.id),
                  } as any)}
                  key={c.id}
                />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: spacing.lg,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            padding: spacing.md,
          }}
        >
          <div
            style={{
              color: colors.text,
              fontSize: typography.sizeSm,
              fontWeight: typography.weightBold,
              marginBottom: spacing.sm,
            }}
          >
            Recent activity
          </div>
          {transactions.length === 0 ? (
            <div
              style={{
                color: colors.textMuted,
                fontSize: typography.sizeSm,
                fontWeight: typography.weightMedium,
              }}
            >
              No transactions yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
              {transactions.slice(0, 5).map((t: unknown) => {
                const rec = t as Record<string, unknown>;
                const key: string = typeof rec.id === "string" ? (rec.id as string) : String(Math.random());
                const cents: number = typeof rec.amountCents === "number" ? (rec.amountCents as number) : 0;
                const label: string =
                  typeof rec.merchant === "string"
                    ? (rec.merchant as string)
                    : typeof rec.name === "string"
                      ? (rec.name as string)
                      : "Transaction";
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: colors.text,
                      fontSize: typography.sizeSm,
                      fontWeight: typography.weightMedium,
                    }}
                  >
                    <span>{label}</span>
                    <span>{formatCurrency(cents)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
