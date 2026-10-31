import * as React from "react";
import { useState } from "react";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { testModeMessage } from "@/modules/ui/data/demoData";
import { RevealOnScroll } from "@/modules/ui/components/RevealOnScroll";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";

void theme;

function ToggleRow(props: { label: string; hint: string; on: boolean; onFlip: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        borderTop: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          id={`label-${props.label.replace(/\s+/g, "-").toLowerCase()}`}
          style={{ fontFamily: typography.body, fontSize: "14px", fontWeight: 600, color: colors.ink }}
        >
          {props.label}
        </div>
        <div style={{ fontFamily: typography.body, fontSize: "13px", color: colors.muted }}>{props.hint}</div>
      </div>
      <button
        type="button"
        aria-pressed={props.on}
        aria-label={props.label}
        onClick={props.onFlip}
        style={{
          minWidth: "56px",
          height: "30px",
          borderRadius: radii.pill,
          border: `1px solid ${colors.line}`,
          backgroundColor: props.on ? colors.mint : colors.surface,
          color: props.on ? colors.mintDark : colors.muted,
          fontFamily: typography.body,
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {props.on ? "On" : "Off"}
      </button>
    </div>
  );
}

export function SettingsScreen(props: { onSignOut?: () => void; onBack?: () => void }) {
  const proxy = usePayProxy();
  const user = proxy.user;
  const signOut = proxy.signOut;
  const setScreen = proxy.setScreen;
  const [warnNearCap, setWarnNearCap] = useState<boolean>(true);
  const [warnLowBalance, setWarnLowBalance] = useState<boolean>(true);
  const [warnExpiring, setWarnExpiring] = useState<boolean>(true);

  function handleSignOut(): void {
    void signOut();
    if (typeof props.onSignOut === "function") {
      props.onSignOut();
    }
  }

  function handleBack(): void {
    if (typeof props.onBack === "function") {
      props.onBack();
      return;
    }
    setScreen("dashboard");
  }

  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  async function handleDelete(): Promise<void> {
    if (!window.confirm("Delete your Digna account? Your sign-in, wallet, cards and history are removed for good.")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await proxy.deleteAccount();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Couldn't delete the account. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  const page: React.CSSProperties = {
    backgroundColor: colors.page,
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: spacing.lg,
    fontFamily: typography.body,
  };

  const inner: React.CSSProperties = {
    width: "100%",
    maxWidth: "560px",
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
  };

  const card: React.CSSProperties = {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: radii.card,
    boxShadow: shadows.soft,
    padding: spacing.lg,
  };

  const h1: React.CSSProperties = {
    fontFamily: typography.heading,
    fontSize: "24px",
    fontWeight: 700,
    color: colors.ink,
    margin: 0,
  };

  const h2: React.CSSProperties = {
    fontFamily: typography.heading,
    fontSize: "17px",
    fontWeight: 700,
    color: colors.ink,
    margin: 0,
    marginBottom: spacing.md,
  };

  const sub: React.CSSProperties = {
    fontFamily: typography.body,
    fontSize: "14px",
    color: colors.muted,
    margin: 0,
  };

  const body: React.CSSProperties = {
    fontFamily: typography.body,
    fontSize: "14px",
    color: colors.ink,
    margin: 0,
  };

  const primaryBtn: React.CSSProperties = {
    backgroundColor: colors.mint,
    color: colors.ink,
    border: "none",
    borderRadius: radii.pill,
    padding: `${spacing.md} ${spacing.xl}`,
    fontFamily: typography.body,
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const ghostBtn: React.CSSProperties = {
    backgroundColor: colors.surface,
    color: colors.ink,
    border: `1px solid ${colors.line}`,
    borderRadius: radii.pill,
    padding: `${spacing.md} ${spacing.xl}`,
    fontFamily: typography.body,
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={page}>
      <div style={inner}>
        <div>
          <h1 style={h1}>Settings</h1>
          <p style={sub}>A calm review of your profile and preferences.</p>
        </div>

        <RevealOnScroll delayMs={0} className="pp-section-wrap">
          <section aria-label="Account" className="pp-section">
            <h2 style={h2}>Account</h2>
            <div style={card} className="pp-card pp-lift">
              <p style={body}>{user ? user.email : "Signed out"}</p>
              {user ? <p style={sub}>{user.displayName}</p> : null}
              <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.md, flexWrap: "wrap" }}>
                <button type="button" onClick={handleSignOut} aria-label="Sign out" style={primaryBtn}>
                  Sign out
                </button>
                <button type="button" onClick={handleBack} aria-label="Back" style={ghostBtn}>
                  Back
                </button>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={80} className="pp-section-wrap">
          <section aria-label="Notifications" className="pp-section">
            <h2 style={h2}>Notifications</h2>
            <div style={card} className="pp-card pp-lift">
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
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={160} className="pp-section-wrap">
          <section aria-label="Your account and data" className="pp-section">
            <h2 style={h2}>Your account and data</h2>
            <div style={card} className="pp-card pp-lift">
              <p style={body}>{testModeMessage}</p>
              <p style={{ ...sub, marginTop: spacing.md }}>No real money moves.</p>
              {proxy.mode === "live" && (
                <div style={{ marginTop: spacing.md }}>
                  <button type="button" onClick={() => void handleDelete()} disabled={deleting} style={{ ...ghostBtn, color: "#B42318", borderColor: "#F4B4AE" }}>
                    {deleting ? "Deleting…" : "Delete my account"}
                  </button>
                  {deleteError && <p role="alert" style={{ ...sub, color: "#B42318", marginTop: spacing.sm }}>{deleteError}</p>}
                </div>
              )}
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delayMs={240} className="pp-section-wrap">
          <section aria-label="About Digna" className="pp-section">
            <h2 style={h2}>About Digna</h2>
            <div style={card} className="pp-card pp-lift">
              <p style={body}>Digna gives each service that turns your card away its own capped virtual card, paid from your Digna wallet.</p>
              <p style={{ ...sub, marginTop: spacing.md }}>
                Each person sees only their own cards. A sandbox with sample money: not a bank, and not affiliated with Chime, Cash App or any merchant shown.
              </p>
            </div>
          </section>
        </RevealOnScroll>
      </div>
    </div>
  );
}
