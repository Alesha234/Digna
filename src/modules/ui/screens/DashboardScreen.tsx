import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { buildWarnings } from "@/modules/ui/lib/alerts";
import { BalanceCard } from "@/modules/ui/components/BalanceCard";
import { VirtualCardView } from "@/modules/ui/components/VirtualCardView";
import { WarningBanner } from "@/modules/ui/components/WarningBanner";
import { EmptyState } from "@/modules/ui/components/EmptyState";
import { LedgerBand } from "@/modules/ui/components/LedgerBand";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import type { VirtualCard } from "@/modules/ui/types";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

export function DashboardScreen(props: { onOpenCard: (cardId: string) => void; onAddMoney: () => void; onCreateCard: () => void }) {
  const onOpenCard: (cardId: string) => void = props.onOpenCard;
  const onAddMoney: () => void = props.onAddMoney;
  const onCreateCard: () => void = props.onCreateCard;
  const { user, balance, cards, transactions, freezeCard, unfreezeCard, closeCard } = usePayProxy();
  void user;
  void transactions;
  void theme;
  const balanceCents: number = balance.availableCents;
  const warnings = buildWarnings(cards, balance);
  const featured: VirtualCard | undefined = cards.find((c: VirtualCard) => c.status === "active") ?? cards[0];

  function handleWarningAction(w: { cardId?: string }): void {
    if (typeof w.cardId === "string" && w.cardId.length > 0) {
      onOpenCard(w.cardId);
    } else {
      onAddMoney();
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <h1 style={{ fontFamily: typography.heading, color: colors.ink, fontSize: 28, lineHeight: 1.2, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: typography.body, color: colors.muted, fontSize: 14, margin: 0 }}>
            Test mode — sample money only.
          </p>
        </header>

        {featured ? (
          <LedgerBand
            card={featured}
            balanceCents={balanceCents}
            onFreeze={() => freezeCard(featured.id)}
            onUnfreeze={() => unfreezeCard(featured.id)}
            onViewHistory={() => onOpenCard(featured.id)}
          />
        ) : null}

        <BalanceCard balanceCents={balanceCents} onAddMoney={onAddMoney} />

        <WarningBanner warnings={warnings} onAction={(w) => handleWarningAction(w)} />

        <div style={{ display: "flex", gap: spacing.md, flexWrap: "wrap" }}>
          <button
            type="button"
            className="pp-btn-mint"
            onClick={onAddMoney}
            style={{
              flex: "1 1 160px",
              backgroundColor: colors.mint,
              color: colors.midnight,
              border: `1px solid ${colors.mint}`,
              borderRadius: radii.pill,
              padding: `${spacing.md} ${spacing.lg}`,
              fontFamily: typography.body,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Add money
          </button>
          <button
            type="button"
            className="pp-btn-mint"
            onClick={onCreateCard}
            style={{
              flex: "1 1 160px",
              backgroundColor: colors.surface,
              color: colors.ink,
              border: `1px solid ${colors.line}`,
              borderRadius: radii.pill,
              padding: `${spacing.md} ${spacing.lg}`,
              fontFamily: typography.body,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            New card
          </button>
        </div>

        <section aria-label="Cards" style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <h2 style={{ fontFamily: typography.heading, color: colors.ink, fontSize: 20, margin: 0 }}>
            Cards
          </h2>
          {cards.length === 0 ? (
            <div
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: radii.card,
                boxShadow: shadows.soft,
                padding: spacing.lg,
              }}
            >
              <EmptyState
                title="No cards yet"
                hint="Create a capped card to spend safely."
                actionLabel="New card"
                onAction={onCreateCard}
              />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: spacing.md,
              }}
            >
              {cards.map((card: VirtualCard) => (
                <RevealOnScroll key={card.id}>
                  <VirtualCardView
                    card={card}
                    selected={false}
                    onOpen={() => onOpenCard(card.id)}
                    onFreeze={() => freezeCard(card.id)}
                    onUnfreeze={() => unfreezeCard(card.id)}
                    onClose={() => closeCard(card.id)}
                  />
                </RevealOnScroll>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
