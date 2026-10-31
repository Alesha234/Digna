import * as React from "react";
import { CardForm } from "@/modules/ui/components/CardForm";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { demoUser, demoBalance, demoCards, demoTransactions } from "@/modules/ui/data/demoData";
import type { BillScanResult } from "@/modules/ui/types";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

void demoUser;
void demoBalance;
void demoCards;
void demoTransactions;
void theme;

type CreateCardScreenProps = {
  /** A bill read on "Pay a bill": the card starts filled in for it. */
  bill?: BillScanResult | null;
  onCreated?: (cardId: string) => void;
  onCancel?: () => void;
};

type CreateInput = {
  name: string;
  capCents: number;
  endDate: string;
};

/** A bill's details as a card: its name (letters, numbers, spaces), its amount as the limit, and a week past the due date. */
function fromBill(bill: BillScanResult | null | undefined): { name: string; cap: string; end: string } {
  if (!bill) return { name: "", cap: "", end: "" };
  const name = bill.storeName.replace(/[^A-Za-z0-9 _-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  const due = bill.dueDate ? new Date(bill.dueDate + "T12:00:00") : new Date();
  const end = new Date(due.getTime() + (bill.dueDate ? 7 : 30) * 86_400_000);
  const floor = new Date(Date.now() + 86_400_000);
  return { name, cap: (bill.amountCents / 100).toFixed(2), end: (end < floor ? floor : end).toISOString().slice(0, 10) };
}

export function CreateCardScreen(props: CreateCardScreenProps) {
  const { onCreated, onCancel } = props;
  const start = fromBill(props.bill);
  const { createCard } = usePayProxy();
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  async function handleSubmit(input: CreateInput): Promise<void> {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const created = await createCard(input);
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
      <style>{`.pp-section{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:${spacing.lg}}.pp-card{background-color:${colors.surface};border:1px solid ${colors.line};border-radius:${radii.card}px;box-shadow:${shadows.soft};padding:${spacing.lg}}.pp-lift{transition:transform 180ms ease,box-shadow 180ms ease}.hover-lift:hover{transform:translateY(-2px)}.pp-btn-mint{background-color:${colors.mint};color:#0E1726;border:none;border-radius:${radii.card}px;padding:${spacing.md} ${spacing.lg};font-family:${typography.body};font-weight:700;cursor:pointer}.pp-btn-mint:hover{background-color:${colors.mintDark};color:#fff}.pp-btn-ghost{background-color:${colors.surface};color:${colors.ink};border:1px solid ${colors.line};border-radius:${radii.card}px;padding:${spacing.md} ${spacing.lg};font-family:${typography.body};font-weight:600;cursor:pointer}:focus-visible{outline:3px solid ${colors.mintDark};outline-offset:2px}@media(min-width:720px){.pp-split{display:grid;grid-template-columns:1fr 1fr;gap:${spacing.xl};align-items:start}}@media(prefers-reduced-motion:reduce){.pp-lift,.hover-lift,.pp-reveal{transition:none!important;transform:none!important;animation:none!important}}`}</style>
      <section className="pp-section" aria-label="Make a new card">
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
              Make a new card
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
              {props.bill
                ? `Filled in from your ${props.bill.storeName} bill. Check it, change anything you like, then make the card.`
                : "Give it a name, like Hotel stay or Cloud bill. Choose its limit: the most it can ever spend. Pick the day it should stop working."}
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
                initialName={start.name}
                initialCapDollars={start.cap}
                initialEndDate={start.end}
                submitLabel="Make card"
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
                  Practice money for now: nothing real is charged.
                </p>
              </div>
            </article>
          </section>
        </RevealOnScroll>
      </section>
    </div>
  );
}
