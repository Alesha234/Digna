import type { VirtualCard } from "@/modules/ui/types";
import { formatCurrency, formatDate, maskCardNumber } from "@/modules/ui/lib/format";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";
import { SpendingMeter } from "@/modules/ui/components/SpendingMeter";

export function VirtualCardView(props: { card: VirtualCard; selected?: boolean; onOpen: () => void; onFreeze: () => void; onUnfreeze: () => void; onClose: () => void }) {
  const card: VirtualCard = props.card;
  const selected: boolean = props.selected ?? false;
  const onOpen: () => void = props.onOpen;
  const onFreeze: () => void = props.onFreeze;
  const onUnfreeze: () => void = props.onUnfreeze;
  const onClose: () => void = props.onClose;
  void theme;
  const isFrozen: boolean = card.status === "frozen";
  const isClosed: boolean = card.status === "closed";
  const statusLabel: string = card.status === "active" ? "Active" : isFrozen ? "Frozen" : "Closed";

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>): void {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") {
      e.preventDefault();
      onOpen();
    }
  }

  function handleFreezeClick(e: React.MouseEvent<HTMLButtonElement>): void {
    e.stopPropagation();
    if (isFrozen) {
      onUnfreeze();
    } else {
      onFreeze();
    }
  }

  function handleOpenClick(e: React.MouseEvent<HTMLButtonElement>): void {
    e.stopPropagation();
    onOpen();
  }

  function handleCloseClick(e: React.MouseEvent<HTMLButtonElement>): void {
    e.stopPropagation();
    onClose();
  }

  return (
    <article
      className="pp-card pp-lift"
      tabIndex={0}
      role="button"
      aria-label={"Open " + card.name}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      style={{
        backgroundColor: colors.surface,
        color: colors.ink,
        border: "1px solid " + colors.line,
        borderRadius: radii.card,
        boxShadow: selected ? shadows.lift : shadows.soft,
        outline: selected ? "2px solid " + colors.mint : "none",
        outlineOffset: "2px",
        padding: spacing.md,
        fontFamily: typography.body,
        cursor: "pointer",
      }}
    >
      <style>{".pp-card.pp-lift{transition:box-shadow 200ms ease,transform 200ms ease}.pp-card.pp-lift:hover{box-shadow:" + shadows.lift + ";transform:translateY(-2px)}@media (prefers-reduced-motion: reduce){.pp-card.pp-lift,.pp-card.pp-lift:hover{transition:none;transform:none}}"}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm }}>
        <h3 style={{ fontFamily: typography.heading, color: colors.ink, margin: "0", fontSize: "18px", lineHeight: "24px" }}>{card.name}</h3>
        <span
          style={{
            backgroundColor: colors.surface,
            color: colors.muted,
            border: "1px solid " + colors.line,
            borderRadius: radii.pill,
            padding: "2px 10px",
            fontFamily: typography.body,
            fontSize: "12px",
            lineHeight: "18px",
          }}
        >
          {statusLabel}
        </span>
      </div>
      <p style={{ fontFamily: typography.body, color: colors.ink, marginTop: spacing.sm, marginBottom: "0" }}>{maskCardNumber(card.last4)}</p>
      <p style={{ fontFamily: typography.body, color: colors.muted, marginTop: spacing.sm, marginBottom: "0", fontSize: "14px" }}>
        Limit {formatCurrency(card.capCents)} · Stops {formatDate(card.endDate)}
      </p>
      <div style={{ marginTop: spacing.md }}>
        <SpendingMeter spentCents={card.spentCents} capCents={card.capCents} />
      </div>
      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleOpenClick}
          style={{
            backgroundColor: colors.mint,
            color: colors.surface,
            border: "1px solid " + colors.mint,
            borderRadius: radii.pill,
            padding: "8px 14px",
            fontFamily: typography.body,
            cursor: "pointer",
          }}
        >
          Open
        </button>
        {isFrozen ? (
          <button
            type="button"
            aria-label={"Unfreeze " + card.name}
            onClick={handleFreezeClick}
            disabled={isClosed}
            style={{
              backgroundColor: colors.surface,
              color: colors.ink,
              border: "1px solid " + colors.line,
              borderRadius: radii.pill,
              padding: "8px 14px",
              fontFamily: typography.body,
              cursor: "pointer",
            }}
          >
            Unfreeze
          </button>
        ) : (
          <button
            type="button"
            aria-label={"Freeze " + card.name}
            onClick={handleFreezeClick}
            disabled={isClosed}
            style={{
              backgroundColor: colors.surface,
              color: colors.ink,
              border: "1px solid " + colors.line,
              borderRadius: radii.pill,
              padding: "8px 14px",
              fontFamily: typography.body,
              cursor: isClosed ? "not-allowed" : "pointer",
            }}
          >
            Freeze
          </button>
        )}
        <button
          type="button"
          aria-label={"Close " + card.name}
          onClick={handleCloseClick}
          disabled={isClosed}
          style={{
            backgroundColor: colors.surface,
            color: colors.muted,
            border: "1px solid " + colors.line,
            borderRadius: radii.pill,
            padding: "8px 14px",
            fontFamily: typography.body,
            cursor: isClosed ? "not-allowed" : "pointer",
          }}
        >
          Close
        </button>
      </div>
    </article>
  );
}
