import * as React from "react";
import { useRef, useState } from "react";
import { BalanceCard } from "@/modules/ui/components/BalanceCard";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { formatCurrency } from "@/modules/ui/lib/format";
import { validateAddMoneyCents } from "@/modules/ui/lib/validation";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

void theme;

function getBalanceCents(balance: unknown): number {
  const rec = balance as Record<string, unknown>;
  if (typeof rec.availableCents === "number") return rec.availableCents as number;
  if (typeof rec.balanceCents === "number") return rec.balanceCents as number;
  if (typeof rec.cents === "number") return rec.cents as number;
  if (typeof rec.totalCents === "number") return rec.totalCents as number;
  return 0;
}

function parseDollarsToCents(value: string): number | null {
  const trimmed: string = value.trim();
  if (trimmed === "") return null;
  const parsed: number = parseFloat(trimmed.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export function AddMoneyScreen(props: { onDone?: () => void; onCancel?: () => void }) {
  const { onDone, onCancel } = props;
  const { balance, addMoneyCents } = usePayProxy();
  const balanceCents: number = getBalanceCents(balance);
  const [amount, setAmount] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [addedCents, setAddedCents] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cents: number | null = parseDollarsToCents(amount);
  const validationError: string | null =
    cents === null
      ? touched && amount.trim() !== ""
        ? "Enter an amount like 25.00"
        : touched && amount.trim() === ""
          ? "Enter an amount like 25.00"
          : null
      : validateAddMoneyCents(cents);
  const showError: boolean = touched && validationError !== null;
  const newBalanceCents: number = addedCents !== null ? balanceCents : balanceCents;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setAmount(e.target.value);
    setServerError(null);
    if (addedCents !== null) setAddedCents(null);
  }

  function handlePick(value: string): void {
    setAmount(value);
    setTouched(true);
    setServerError(null);
    setAddedCents(null);
    inputRef.current?.focus();
  }

  function handleFocusBalance(): void {
    inputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    const next: number | null = parseDollarsToCents(amount);
    const err: string | null =
      next === null ? "Enter an amount like 25.00" : validateAddMoneyCents(next);
    if (err !== null || next === null) return;
    setSubmitting(true);
    try {
      await addMoneyCents(next);
      setAddedCents(next);
    } catch (err2: unknown) {
      const msg: string = err2 instanceof Error && err2.message ? err2.message : "Something went wrong. Try again.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDone(): void {
    if (onDone) onDone();
  }

  function handleCancel(): void {
    if (onCancel) onCancel();
  }

  const picks: string[] = ["10", "25", "50"];

  return (
    <RevealOnScroll>
      <div
        style={{
          backgroundColor: colors.page,
          fontFamily: typography.body,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        <style>{`.pp-card{transition:transform 160ms ease,box-shadow 160ms ease;}.pp-lift:hover{transform:translateY(-2px);box-shadow:${shadows.soft},0 12px 32px rgba(16,32,29,0.12);}.pp-btn-mint{transition:transform 160ms ease,filter 160ms ease;background-color:${colors.mint} !important;}.pp-btn-mint:hover:not(:disabled){filter:brightness(1.04);transform:translateY(-1px);background-color:${colors.mintDark} !important;}.pp-btn-mint:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid ${colors.ink};outline-offset:2px;}@media (prefers-reduced-motion: reduce){.pp-card,.pp-btn-mint{transition:none !important;transform:none !important;}}`}</style>
        <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: spacing.lg }}>
          <BalanceCard balanceCents={balanceCents} onAddMoney={handleFocusBalance} />
          <section
            className="pp-card pp-lift"
            aria-labelledby="add-money-title"
            style={{
              backgroundColor: colors.surface,
              color: colors.ink,
              border: `1px solid ${colors.line}`,
              borderRadius: radii.card,
              boxShadow: shadows.soft,
              padding: spacing.lg,
              fontFamily: typography.body,
            }}
          >
            <h1
              id="add-money-title"
              style={{
                margin: 0,
                fontFamily: typography.heading,
                fontSize: "24px",
                lineHeight: 1.2,
                color: colors.ink,
              }}
            >
              Add money
            </h1>
            <p style={{ margin: 0, marginTop: spacing.sm, color: colors.muted, fontSize: "14px" }}>
              Current balance: {formatCurrency(balanceCents)}
            </p>
            <p style={{ margin: 0, marginTop: spacing.sm, color: colors.muted, fontSize: "14px" }}>
              {testModeMessage}
            </p>
            {addedCents !== null ? (
              <section
                className="pp-card"
                aria-label="Top-up confirmation"
                style={{
                  marginTop: spacing.lg,
                  backgroundColor: colors.page,
                  border: `1px solid ${colors.line}`,
                  borderRadius: radii.card,
                  padding: spacing.md,
                }}
              >
                <p style={{ margin: 0, color: colors.ink, fontWeight: 700 }}>
                  Added {formatCurrency(addedCents)} — new balance {formatCurrency(newBalanceCents)}
                </p>
                <button
                  type="button"
                  className="pp-btn-mint"
                  onClick={handleDone}
                  style={{
                    width: "100%",
                    marginTop: spacing.md,
                    backgroundColor: colors.mint,
                    color: "#0E1726",
                    border: `1px solid ${colors.mint}`,
                    borderRadius: radii.pill,
                    padding: `${spacing.md} ${spacing.xl}`,
                    fontFamily: typography.body,
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </section>
            ) : null}
            <form onSubmit={handleSubmit} noValidate style={{ marginTop: spacing.lg }}>
              <label
                htmlFor="add-money-amount"
                style={{ display: "block", fontSize: "14px", fontWeight: 600, color: colors.ink }}
              >
                Amount in USD
              </label>
              <input
                ref={inputRef}
                id="add-money-amount"
                name="amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="25.00"
                value={amount}
                onChange={handleChange}
                onBlur={function onBlur(): void {
                  setTouched(true);
                }}
                aria-invalid={showError}
                aria-describedby={showError ? "add-money-error" : "add-money-hint"}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: spacing.sm,
                  border: `1px solid ${showError ? "#B3261E" : colors.line}`,
                  borderRadius: radii.card,
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontFamily: typography.body,
                  fontSize: "16px",
                  color: colors.ink,
                  backgroundColor: colors.surface,
                }}
              />
              <p id="add-money-hint" style={{ margin: 0, marginTop: spacing.sm, color: colors.muted, fontSize: "13px" }}>
                Enter $1 to $5,000.
              </p>
              <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }} role="group" aria-label="Quick amounts">
                {picks.map(function renderPick(v: string) {
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={function onPick(): void {
                        handlePick(v);
                      }}
                      aria-label={`Set amount $${v}`}
                      style={{
                        flex: 1,
                        backgroundColor: colors.page,
                        color: colors.ink,
                        border: `1px solid ${colors.line}`,
                        borderRadius: radii.pill,
                        padding: `${spacing.sm} 0`,
                        fontFamily: typography.body,
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ${v}
                    </button>
                  );
                })}
              </div>
              {showError ? (
                <p id="add-money-error" role="alert" style={{ margin: 0, marginTop: spacing.sm, color: "#B3261E", fontSize: "14px" }}>
                  {validationError}
                </p>
              ) : null}
              {serverError !== null ? (
                <p role="alert" style={{ margin: 0, marginTop: spacing.sm, color: "#B3261E", fontSize: "14px" }}>
                  {serverError}
                </p>
              ) : null}
              <button
                type="submit"
                className="pp-btn-mint"
                disabled={submitting}
                style={{
                  width: "100%",
                  marginTop: spacing.md,
                  backgroundColor: colors.mint,
                  color: "#0E1726",
                  border: `1px solid ${colors.mint}`,
                  borderRadius: radii.pill,
                  padding: `${spacing.md} ${spacing.xl}`,
                  fontFamily: typography.body,
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Adding…" : "Add money"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  width: "100%",
                  marginTop: spacing.sm,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: colors.muted,
                  fontFamily: typography.body,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </form>
          </section>
        </div>
      </div>
    </RevealOnScroll>
  );
}
