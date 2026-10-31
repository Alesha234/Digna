import * as React from "react";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";
import type { AppScreen } from "@/modules/ui/types";

void theme;

type NavEntry = { value: AppScreen | string; label: string };

const navEntries: NavEntry[] = [
  { value: "welcome", label: "Welcome" },
  { value: "dashboard", label: "Dashboard" },
  { value: "add-money", label: "Add money" },
  { value: "create-card", label: "Create card" },
  { value: "snap-bill", label: "Snap bill" },
  { value: "assistant", label: "Assistant" },
  { value: "settings", label: "Settings" },
  { value: "styles", label: "Styles" },
  { value: "theme", label: "Theme" },
  { value: "demo-data", label: "Demo data" },
  { value: "provider", label: "Provider" },
  { value: "format", label: "Format" },
  { value: "alerts", label: "Alerts" },
  { value: "app-shell", label: "App shell" },
];

const footerLinkStyle: React.CSSProperties = {
  display: "block",
  background: "transparent",
  border: "0",
  padding: 0,
  margin: 0,
  color: colors.midnightInk,
  fontFamily: typography.body,
  fontSize: "14px",
  lineHeight: "1.9",
  textAlign: "left",
  cursor: "pointer",
  opacity: 0.85,
};

export function AppShell(props: {
  current: string;
  onNavigate: (s: AppScreen | string) => void;
  children: React.ReactNode;
  ledger?: React.ReactNode;
}) {
  const { current, onNavigate, children, ledger } = props;

  return (
    <div
      className="pp-shell"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.page,
        color: colors.ink,
        fontFamily: typography.body,
      }}
    >
      <header
        className="pp-nav-sticky"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.line}`,
          boxShadow: shadows.soft,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px, 320px) 1fr",
            gap: spacing.md,
            alignItems: "center",
            maxWidth: "1120px",
            margin: "0 auto",
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
            <span
              style={{
                fontFamily: typography.heading,
                fontWeight: 700,
                fontSize: "20px",
                letterSpacing: "-0.02em",
                color: colors.ink,
              }}
            >
              PayProxy
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: colors.mint,
                color: colors.midnight,
                borderRadius: radii.pill,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                paddingLeft: spacing.md,
                paddingRight: spacing.md,
                fontFamily: typography.body,
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Test mode
            </span>
          </div>
          <nav aria-label="Primary" style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
            {navEntries.map((entry: NavEntry) => {
              const active: boolean = current === entry.value;
              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={(): void => onNavigate(entry.value)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    borderRadius: radii.pill,
                    border: `1px solid ${active ? colors.mint : colors.line}`,
                    backgroundColor: active ? colors.mint : colors.surface,
                    color: active ? colors.midnight : colors.muted,
                    fontFamily: typography.body,
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    paddingTop: spacing.sm,
                    paddingBottom: spacing.sm,
                    paddingLeft: spacing.md,
                    paddingRight: spacing.md,
                    cursor: "pointer",
                  }}
                >
                  {entry.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <main
          style={{
            width: "100%",
            maxWidth: "1120px",
            margin: "0 auto",
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
            flex: 1,
          }}
        >
          {children}
        </main>
        {ledger ? (
          <section
            className="pp-ledger-band"
            aria-label="Midnight ledger"
            style={{
              backgroundColor: colors.midnight,
              color: colors.midnightInk,
              borderTop: `1px solid ${colors.line}`,
            }}
          >
            <div
              style={{
                maxWidth: "1120px",
                margin: "0 auto",
                paddingTop: spacing.lg,
                paddingBottom: spacing.lg,
                paddingLeft: spacing.lg,
                paddingRight: spacing.lg,
              }}
            >
              {ledger}
            </div>
          </section>
        ) : null}
      </div>

      <footer
        style={{
          backgroundColor: colors.midnight,
          color: colors.midnightInk,
          marginTop: spacing.lg,
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: spacing.lg,
          }}
        >
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0` }}>
              Product
            </h2>
            <button type="button" onClick={(): void => onNavigate("dashboard")} style={footerLinkStyle}>
              Dashboard
            </button>
            <button type="button" onClick={(): void => onNavigate("create-card")} style={footerLinkStyle}>
              Virtual cards
            </button>
            <button type="button" onClick={(): void => onNavigate("add-money")} style={footerLinkStyle}>
              Add money
            </button>
            <button type="button" onClick={(): void => onNavigate("snap-bill")} style={footerLinkStyle}>
              Snap a bill
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0` }}>
              Help
            </h2>
            <button type="button" onClick={(): void => onNavigate("assistant")} style={footerLinkStyle}>
              Assistant
            </button>
            <button type="button" onClick={(): void => onNavigate("alerts")} style={footerLinkStyle}>
              Alerts
            </button>
            <button type="button" onClick={(): void => onNavigate("settings")} style={footerLinkStyle}>
              Settings
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0` }}>
              Test mode
            </h2>
            <p style={{ fontFamily: typography.body, fontSize: "14px", lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
              PayProxy is in test mode. No real money moves here — cards, balances and bills are demos only.
            </p>
            <button type="button" onClick={(): void => onNavigate("demo-data")} style={footerLinkStyle}>
              Explore demo data
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0` }}>
              About
            </h2>
            <p style={{ fontFamily: typography.body, fontSize: "14px", lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
              Calm, capped spending for travel and everyday checkout.
            </p>
            <button type="button" onClick={(): void => onNavigate("welcome")} style={footerLinkStyle}>
              Welcome
            </button>
            <button type="button" onClick={(): void => onNavigate("provider")} style={footerLinkStyle}>
              Provider
            </button>
          </div>
        </div>
        <div
          style={{
            borderTop: `1px solid ${colors.line}`,
            maxWidth: "1120px",
            margin: "0 auto",
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            paddingLeft: spacing.lg,
            paddingRight: spacing.lg,
            display: "flex",
            justifyContent: "space-between",
            gap: spacing.md,
            fontFamily: typography.body,
            fontSize: "12px",
            opacity: 0.8,
          }}
        >
          <span>PayProxy · Test mode · No real money</span>
          <span style={{ borderRadius: radii.card, border: `1px solid ${colors.line}`, padding: `2px ${spacing.sm}` }}>
            Calm shell
          </span>
        </div>
      </footer>
    </div>
  );
}
