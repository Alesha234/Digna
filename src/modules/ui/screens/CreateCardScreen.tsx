import * as React from "react";
import { CardForm } from "@/modules/ui/components/CardForm";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { demoUser, demoBalance, demoCards, demoTransactions } from "@/modules/ui/data/demoData";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

void demoUser;
void demoBalance;
void demoCards;
void demoTransactions;
void theme;

type CreateCardScreenProps = {
  onCreated?: (cardId: string) => void;
  onCancel?: () => void;
};

type CreateInput = {
  name: string;
  capCents: number;
  endDate: string;
};

export function CreateCardScreen(props: CreateCardScreenProps) {
  const { onCreated, onCancel } = props;
  const { createCard } = usePayProxy();
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  function handleSubmit(input: CreateInput): void {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const created = createCard(input);
      setIsSubmitting(false);
      if (onCreated) {
        onCreated(created.id);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const message: string = err instanceof Error && err.message ? err.message : "Could not create the card. Try again.";
      setServerError(message);
    }
  }

  function handleCancel(): void {
    if (onCancel) {
      onCancel();
    }
  }

  function handleCancelKeyDown(e: React.KeyboardEvent<HTMLButtonElement>): void {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCancel();
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.page,
        minHeight: "100vh",
        padding: spacing.lg,
        fontFamily: typography.body,
        color: colors.ink,
        boxSizing: "border-box",
      }}
    >
      <style>{`.pp-section{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:${spacing.lg}}.pp-card{background-color:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;box-shadow:${shadows.soft};padding:${spacing.lg}}.pp-lift{transition:transform 180ms ease,box-shadow 180ms ease}.hover-lift:hover{transform:translateY(-2px)}.pp-btn-mint{background-color:${colors.mint};color:#06332A;border:none;border-radius:${radii.card}px;padding:${spacing.md} ${spacing.lg};font-family:${typography.body};font-weight:700;cursor:pointer}.pp-btn-mint:hover{background-color:${colors.mintDark};color:#fff}.pp-btn-ghost{background-color:${colors.surface};color:${colors.ink};border:1px solid ${colors.line};border-radius:${radii.card}px;padding:${spacing.md} ${spacing.lg};font-family:${typography.body};font-weight:600;cursor:pointer}:focus-visible{outline:3px solid ${colors.mintDark};outline-offset:2px}@media(min-width:720px){.pp-split{display:grid;grid-template-columns:1fr 1fr;gap:${spacing.xl};align-items:start}}@media(prefers-reduced-motion:reduce){.pp-lift,.hover-lift,.pp-reveal{transition:none!important;transform:none!important;animation:none!important}}`}</style>
      <section className="pp-section" aria-label="Create virtual card">
        <RevealOnScroll delayMs={0}>
          <header
            className="pp-card pp-lift hover-lift"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.line}`,
              borderRadius: radii.card,
              boxShadow: shadows.soft,
              padding: spacing.lg,
            }}
          >
            <h1
              style={{
                margin: 0,
                marginBottom: spacing.md,
                fontFamily: typography.heading,
                color: colors.ink,
                fontSize: "28px",
                lineHeight: 1.2,
              }}
            >
              Create virtual card
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: typography.body,
                color: colors.muted,
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Give it a name like Google Cloud, set a spending cap, and pick an end date YYYY-MM-DD.
            </p>
          </header>
        </RevealOnScroll>
        <RevealOnScroll delayMs={80}>
          <section className="pp-section" aria-label="New card details">
            <article
              className="pp-card pp-lift hover-lift"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.line}`,
                borderRadius: radii.card,
                boxShadow: shadows.soft,
                padding: spacing.lg,
              }}
            >
              <CardForm
                initialName=""
                initialCapDollars=""
                initialEndDate=""
                submitLabel="Create card"
                isSubmitting={isSubmitting}
                serverError={serverError}
                onSubmit={handleSubmit}
              />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: spacing.md,
                  marginTop: spacing.lg,
                }}
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  onKeyDown={handleCancelKeyDown}
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.ink,
                    border: `1px solid ${colors.line}`,
                    borderRadius: radii.card,
                    padding: `${spacing.md} ${spacing.lg}`,
                    fontFamily: typography.body,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <p
                  style={{
                    margin: 0,
                    fontFamily: typography.body,
                    fontSize: "13px",
                    color: colors.muted,
                  }}
                >
                  Test mode: No real money moves.
                </p>
              </div>
            </article>
          </section>
        </RevealOnScroll>
      </section>
    </div>
  );
}
