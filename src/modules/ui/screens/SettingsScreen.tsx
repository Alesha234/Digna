import * as React from "react";
import { useState } from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { formatCurrency } from "@/modules/ui/lib/format";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";

void PayProxyProvider;
void colors;
void spacing;
void radii;
void shadows;
void typography;

function ToggleRow(props: { label: string; hint: string; on: boolean; onFlip: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizeSm,
            fontWeight: theme.typography.weightMedium,
            color: theme.colors.text,
          }}
        >
          {props.label}
        </div>
        <div
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.sizeSm,
            color: theme.colors.textMuted,
          }}
        >
          {props.hint}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={props.on}
        aria-label={props.label}
        onClick={props.onFlip}
        style={{
          minWidth: 48,
          height: 28,
          borderRadius: theme.radii.pill,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: props.on ? theme.colors.primary : theme.colors.border,
          color: theme.colors.white,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.sizeSm,
          fontWeight: theme.typography.weightBold,
          cursor: "pointer",
        }}
      >
        {props.on ? "On" : "Off"}
      </button>
    </div>
  );
}

export function SettingsScreen() {
  const { user, balance, setScreen, signOut } = usePayProxy();
  const [warnNearCap, setWarnNearCap] = useState<boolean>(true);
  const [warnLowBalance, setWarnLowBalance] = useState<boolean>(true);
  const [warnExpiring, setWarnExpiring] = useState<boolean>(true);

  const page: React.CSSProperties = {
    backgroundColor: theme.colors.background,
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  };

  const inner: React.CSSProperties = {
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
  };

  const card: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    boxShadow: theme.shadows.soft,
    padding: theme.spacing.lg,
  };

  const innerCard: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  };

  const title: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeLg,
    fontWeight: theme.typography.weightBold,
    color: theme.colors.text,
    margin: 0,
  };

  const sub: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeSm,
    color: theme.colors.textMuted,
    margin: 0,
  };

  const body: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeMd,
    color: theme.colors.text,
    margin: 0,
  };

  const softNote: React.CSSProperties = {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeSm,
    color: theme.colors.text,
  };

  const primaryBtn: React.CSSProperties = {
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    border: "none",
    borderRadius: theme.radii.pill,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeMd,
    fontWeight: theme.typography.weightMedium,
    cursor: "pointer",
  };

  const ghostBtn: React.CSSProperties = {
    backgroundColor: theme.colors.white,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.pill,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeMd,
    fontWeight: theme.typography.weightMedium,
    cursor: "pointer",
  };

  const dangerBtn: React.CSSProperties = {
    backgroundColor: theme.colors.white,
    color: theme.colors.danger,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.pill,
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizeMd,
    fontWeight: theme.typography.weightMedium,
    cursor: "pointer",
  };

  if (!user) {
    return (
      <div style={page}>
        <div style={inner}>
          <div style={card}>
            <h1 style={title}>Settings</h1>
            <p style={sub}>You are signed out.</p>
            <div style={{ marginTop: theme.spacing.md }}>
              <p style={body}>Please sign in to review your profile and preferences.</p>
            </div>
            <div style={{ display: "flex", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <button type="button" style={primaryBtn} onClick={() => setScreen("dashboard")}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shortId = user.id.length > 8 ? user.id.slice(0, 8) + "…" : user.id;

  return (
    <div style={page}>
      <div style={inner}>
        <div>
          <h1 style={title}>Settings</h1>
          <p style={sub}>A calm review of your profile and preferences.</p>
        </div>

        <div style={card}>
          <h2 style={{ ...body, fontWeight: theme.typography.weightBold }}>{user.displayName}</h2>
          <p style={sub}>{user.email}</p>
          <p style={sub}>ID: {shortId}</p>
          <div style={{ ...innerCard, marginTop: theme.spacing.md }}>
            <p style={sub}>Wallet balance</p>
            <p style={{ ...body, fontWeight: theme.typography.weightBold }}>
              {formatCurrency(balance.availableCents, balance.currency)}
            </p>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ ...body, fontWeight: theme.typography.weightBold }}>Preferences</h2>
          <p style={sub}>Gentle reminders, on by default.</p>
          <ToggleRow
            label="Warn near cap"
            hint="Heads up when a card is close to its cap."
            on={warnNearCap}
            onFlip={() => setWarnNearCap((v: boolean) => !v)}
          />
          <ToggleRow
            label="Warn low balance"
            hint="Heads up when wallet balance runs low."
            on={warnLowBalance}
            onFlip={() => setWarnLowBalance((v: boolean) => !v)}
          />
          <ToggleRow
            label="Warn expiring"
            hint="Heads up before a card reaches its end date."
            on={warnExpiring}
            onFlip={() => setWarnExpiring((v: boolean) => !v)}
          />
        </div>

        <div style={card}>
          <h2 style={{ ...body, fontWeight: theme.typography.weightBold }}>Test mode</h2>
          <div style={{ marginTop: theme.spacing.sm }}>
            <p style={softNote}>{testModeMessage} No real money moves.</p>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ ...body, fontWeight: theme.typography.weightBold }}>Privacy</h2>
          <p style={{ ...sub, marginTop: theme.spacing.sm }}>
            Each person sees only their own cards. Demo data resets and nothing leaves this demo.
          </p>
        </div>

        <div style={{ display: "flex", gap: theme.spacing.sm }}>
          <button type="button" style={ghostBtn} onClick={() => setScreen("dashboard")}>
            Back to dashboard
          </button>
          <button type="button" style={dangerBtn} onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
