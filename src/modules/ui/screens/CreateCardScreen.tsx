import * as React from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { CardForm } from "@/modules/ui/components/CardForm";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { theme, colors, spacing, radii, typography } from "@/modules/ui/theme";

void PayProxyProvider;
void colors;
void spacing;
void radii;
void typography;

export function CreateCardScreen() {
  const { createCard, selectCard, setScreen, lastScan, setLastScan } = usePayProxy();

  function handleSubmit(input: { name: string; capCents: number; endDate: string }): void {
    const created = createCard(input);
    selectCard(created.id);
    setScreen("card-detail");
  }

  function handleClear(): void {
    setLastScan(null);
  }

  function handleCancel(): void {
    setScreen("dashboard");
  }

  const initialName = lastScan ? lastScan.storeName : undefined;
  const initialCapDollars = lastScan ? (lastScan.amountCents / 100).toFixed(2) : undefined;
  const initialEndDate = lastScan ? lastScan.dueDate : undefined;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          margin: 0,
          marginBottom: theme.spacing.sm,
          color: theme.colors.text,
          fontSize: theme.typography.sizeLg,
          fontWeight: theme.typography.weightBold,
        }}
      >
        Create a card
      </h1>
      <p
        style={{
          margin: 0,
          marginBottom: theme.spacing.md,
          color: theme.colors.textMuted,
          fontSize: theme.typography.sizeSm,
          lineHeight: 1.5,
        }}
      >
        Give it a name, set a spending cap and an end date.
      </p>

      {lastScan ? (
        <div
          style={{
            backgroundColor: theme.colors.primarySoft,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.sm,
          }}
        >
          <p
            style={{
              margin: 0,
              color: theme.colors.text,
              fontSize: theme.typography.sizeSm,
              fontWeight: theme.typography.weightMedium,
            }}
          >
            From bill scan: {lastScan.storeName}
          </p>
          <button
            type="button"
            onClick={handleClear}
            style={{
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.white,
              color: theme.colors.primary,
              borderRadius: theme.radii.md,
              padding: "6px 12px",
              fontSize: theme.typography.sizeSm,
              fontWeight: theme.typography.weightMedium,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        </div>
      ) : null}

      <div
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.md,
        }}
      >
        <CardForm
          initialName={initialName}
          initialCapDollars={initialCapDollars}
          initialEndDate={initialEndDate}
          submitLabel="Create card"
          onSubmit={handleSubmit}
        />
      </div>

      <div
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii.md,
          padding: theme.spacing.md,
          marginTop: theme.spacing.md,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing.sm,
        }}
      >
        <p
          style={{
            margin: 0,
            color: theme.colors.textMuted,
            fontSize: theme.typography.sizeSm,
          }}
        >
          {testModeMessage}
        </p>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.white,
            color: theme.colors.text,
            borderRadius: theme.radii.md,
            padding: "8px 14px",
            fontSize: theme.typography.sizeMd,
            fontWeight: theme.typography.weightMedium,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
