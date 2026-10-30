import * as React from "react";
import { useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { parseDollarsInputToCents, validateAddMoneyCents } from "@/modules/ui/lib/validation";
import { formatCurrency } from "@/modules/ui/lib/format";
import { theme } from "@/modules/ui/theme";

function getBalanceCents(balance: unknown): number {
  const rec = balance as Record<string, unknown>;
  if (typeof rec.availableCents === "number") return rec.availableCents as number;
  if (typeof rec.cents === "number") return rec.cents as number;
  if (typeof rec.balanceCents === "number") return rec.balanceCents as number;
  if (typeof rec.totalCents === "number") return rec.totalCents as number;
  return 0;
}

type ScreenParam = Parameters<ReturnType<typeof usePayProxy>["setScreen"]>[0];

function toScreen(value: string): ScreenParam {
  return value as unknown as ScreenParam;
}

export function AddMoneyScreen() {
  const { balance, addMoneyCents, setScreen } = usePayProxy();
  const [amountDollars, setAmountDollars] = useState<string>("");
  const [addedCents, setAddedCents] = useState<number | null>(null);

  const cents: number | null = parseDollarsInputToCents(amountDollars);
  const error: string | null = cents === null ? "Enter an amount like 25.00" : validateAddMoneyCents(cents);
  const balanceCents: number = getBalanceCents(balance);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setAmountDollars(e.target.value);
    setAddedCents(null);
  }

  function handleChip(value: string): void {
    setAmountDollars(value);
    setAddedCents(null);
  }

  function handleAdd(): void {
    if (cents === null) return;
    const validationError: string | null = validateAddMoneyCents(cents);
    if (validationError !== null) return;
    addMoneyCents(cents);
    setAddedCents(cents);
  }

  function goDashboard(): void {
    setScreen(toScreen("dashboard"));
  }

  function goCreateCard(): void {
    setScreen(toScreen("create-card"));
  }

  const chips: string[] = ["10", "25", "50"];

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.fontFamily,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: theme.spacing.lg,
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <button
          type="button"
          onClick={goDashboard}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizeSm,
            fontWeight: theme.typography.weightMedium,
            marginBottom: theme.spacing.md,
            padding: 0,
          }}
        >
          {"\u2190 Back to dashboard"}
        </button>

        <div
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.lg,
            boxShadow: theme.shadows.soft,
            padding: theme.spacing.lg,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.sizeLg,
              fontWeight: theme.typography.weightBold,
            }}
          >
            Add money
          </h1>
          <p
            style={{
              margin: 0,
              marginTop: theme.spacing.sm,
              color: theme.colors.textMuted,
              fontSize: theme.typography.sizeSm,
              fontWeight: theme.typography.weightMedium,
            }}
          >
            Current balance: {formatCurrency(balanceCents)}
          </p>
          <p
            style={{
              margin: 0,
              marginTop: theme.spacing.sm,
              color: theme.colors.textMuted,
              fontSize: theme.typography.sizeSm,
            }}
          >
            Test mode: sample money, no real money moves.
          </p>

          {addedCents !== null && error === null ? (
            <div
              role="status"
              style={{
                marginTop: theme.spacing.md,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: theme.colors.success,
                  fontSize: theme.typography.sizeMd,
                  fontWeight: theme.typography.weightBold,
                }}
              >
                Added {formatCurrency(addedCents)} - new balance {formatCurrency(balanceCents)}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: theme.spacing.sm,
                  marginTop: theme.spacing.md,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={goDashboard}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.white,
                    border: "none",
                    borderRadius: theme.radii.pill,
                    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    fontSize: theme.typography.sizeSm,
                    fontWeight: theme.typography.weightBold,
                    cursor: "pointer",
                  }}
                >
                  Back to dashboard
                </button>
                <button
                  type="button"
                  onClick={goCreateCard}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.primary,
                    border: `1px solid ${theme.colors.primary}`,
                    borderRadius: theme.radii.pill,
                    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    fontSize: theme.typography.sizeSm,
                    fontWeight: theme.typography.weightBold,
                    cursor: "pointer",
                  }}
                >
                  Create card
                </button>
              </div>
            </div>
          ) : null}

          <label
            htmlFor="add-money-amount"
            style={{
              display: "block",
              marginTop: theme.spacing.md,
              color: theme.colors.text,
              fontSize: theme.typography.sizeSm,
              fontWeight: theme.typography.weightMedium,
            }}
          >
            Amount (USD)
          </label>
          <input
            id="add-money-amount"
            inputMode="decimal"
            placeholder="25.00"
            value={amountDollars}
            onChange={handleChange}
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: theme.spacing.sm,
              border: `1px solid ${error ? theme.colors.danger : theme.colors.border}`,
              borderRadius: theme.radii.md,
              padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.sizeMd,
              color: theme.colors.text,
              backgroundColor: theme.colors.white,
            }}
          />

          <div
            style={{
              display: "flex",
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
            }}
          >
            {chips.map((c: string) => (
              <button
                key={c}
                type="button"
                onClick={function onChip(): void {
                  handleChip(c);
                }}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.pill,
                  padding: `${theme.spacing.sm}px 0`,
                  fontSize: theme.typography.sizeSm,
                  fontWeight: theme.typography.weightMedium,
                  cursor: "pointer",
                }}
              >
                ${c}
              </button>
            ))}
          </div>

          {error !== null && amountDollars !== "" ? (
            <p
              role="alert"
              style={{
                margin: 0,
                marginTop: theme.spacing.sm,
                color: theme.colors.danger,
                fontSize: theme.typography.sizeSm,
              }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAdd}
            disabled={error !== null}
            style={{
              width: "100%",
              marginTop: theme.spacing.md,
              backgroundColor: error !== null ? theme.colors.border : theme.colors.primary,
              color: theme.colors.white,
              border: "none",
              borderRadius: theme.radii.pill,
              padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
              fontSize: theme.typography.sizeMd,
              fontWeight: theme.typography.weightBold,
              cursor: error !== null ? "not-allowed" : "pointer",
              opacity: error !== null ? 0.7 : 1,
            }}
          >
            Add money
          </button>

          <button
            type="button"
            onClick={goDashboard}
            style={{
              width: "100%",
              marginTop: theme.spacing.sm,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: theme.colors.textMuted,
              fontSize: theme.typography.sizeSm,
              fontWeight: theme.typography.weightMedium,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
