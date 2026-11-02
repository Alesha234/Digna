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
  const firstName: string = typeof user?.displayName === "string" && user.displayName.length > 0 ? user.displayName.split(" ")[0] : "there";

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
        className="pp-dash-stack"
        style={{
          width: "100%",
          maxWidth: 720,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <style>{`@media (max-width: 560px){.pp-dash-cards{grid-template-columns:1fr !important;}}`}</style>
        <header style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
            <p style={{ fontFamily: typography.body, color: colors.muted, fontSize: 14, margin: 0 }}>
              Welcome back, {firstName}
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: radii.pill,
                padding: "4px 10px",
                background: colors.primarySoft,
                color: colors.mintDark,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Practice money
            </span>
          </div>
          <h1 style={{ fontFamily: typography.heading, color: colors.ink, fontSize: 28, lineHeight: 1.2, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: typography.body, color: colors.muted, fontSize: 14, margin: 0 }}>
            Practice money for now: nothing real is charged.
          </p>
        </header>

        <BalanceCard balanceCents={balanceCents} onAddMoney={onAddMoney} onCreateCard={onCreateCard} />

        <WarningBanner warnings={warnings} onAction={(w) => handleWarningAction(w)} />

        {featured ? (
          <div style={{ position: "relative", zIndex: 2, marginBottom: -18 }}>
            <VirtualCardView
              card={featured}
              selected={false}
              tone="dark"
              onOpen={() => onOpenCard(featured.id)}
              onFreeze={() => freezeCard(featured.id)}
              onUnfreeze={() => unfreezeCard(featured.id)}
              onClose={() => closeCard(featured.id)}
            />
          </div>
        ) : null}

        <section aria-label="Cards" style={{ display: "flex", flexDirection: "column", gap: spacing.md, paddingTop: featured ? 34 : 0 }}>
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
                hint="Make a card for one thing, like a hotel stay or a cloud bill, with a limit you choose."
                actionLabel="New card"
                onAction={onCreateCard}
              />
            </div>
          ) : (
            <div
              className="pp-dash-cards"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
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

        {featured ? (
          <LedgerBand
            card={featured}
            balanceCents={balanceCents}
            onFreeze={() => freezeCard(featured.id)}
            onUnfreeze={() => unfreezeCard(featured.id)}
            onViewHistory={() => onOpenCard(featured.id)}
          />
        ) : null}

      </div>
    </div>
  );
}
