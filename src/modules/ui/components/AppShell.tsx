import * as React from "react";
import { colors, spacing, radii, shadows, typography, theme } from "@/modules/ui/theme";
import type { AppScreen } from "@/modules/ui/types";
import { usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { Logo } from "@/modules/ui/components/Logo";

void theme;

type NavEntry = { value: AppScreen | string; label: string };

// The pages a visitor uses. The home page is the Digna name at the top left.
// Home keeps the welcome page valid for signed-in people too: it shows once
// signed in and goes straight there, like every entry below goes straight to its page.
const navEntries: NavEntry[] = [
  { value: "welcome", label: "Home" },
  { value: "dashboard", label: "Dashboard" },
  { value: "add-money", label: "Add money" },
  { value: "create-card", label: "New card" },
  { value: "snap-bill", label: "Pay a bill" },
  { value: "alerts", label: "Alerts" },
  { value: "settings", label: "Settings" },
  { value: "how-it-works", label: "How it works" },
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
  const [open, setOpen] = React.useState(false);
  const { mode, signOut } = usePayProxy();

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
        <div className="pp-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
            <button
              type="button"
              onClick={(): void => {
                setOpen(false);
                onNavigate("welcome");
              }}
              aria-label="Digna home"
              style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "inline-flex" }}
            >
              <Logo size={30} />
            </button>
            <span className="pp-test-pill" title="Everything here uses practice money, not real money.">Practice money</span>
          </div>
          <button type="button" className="pp-menu-toggle" aria-expanded={open} aria-controls="pp-nav" onClick={(): void => setOpen(!open)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav id="pp-nav" aria-label="Primary" className={open ? "pp-nav is-open" : "pp-nav"}>
            {navEntries.filter((entry: NavEntry) => mode !== "guest" || entry.value === "snap-bill" || entry.value === "how-it-works").map((entry: NavEntry) => {
              // "Try paying" is now part of Pay a bill: its old address lights up Pay a bill.
              const active: boolean = (current === "checkout" ? "snap-bill" : current) === entry.value;
              return (
                <button
                  key={entry.value}
                  type="button"
                  className={active ? "pp-nav-link is-active" : "pp-nav-link"}
                  onClick={(): void => {
                    setOpen(false);
                    onNavigate(entry.value);
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  {entry.label}
                </button>
              );
            })}
            {mode === "guest" ? (
              <>
                <button type="button" className="pp-nav-link" onClick={(): void => { setOpen(false); onNavigate("auth"); }}>Sign in</button>
                <button type="button" className="pp-nav-link is-active" onClick={(): void => { setOpen(false); onNavigate("signup"); }}>Create account</button>
              </>
            ) : (
              <button type="button" className="pp-nav-link" onClick={(): void => { setOpen(false); void signOut(); }}>
                {mode === "demo" ? "Leave sample account" : "Sign out"}
              </button>
            )}
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
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: spacing.lg,
          }}
        >
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0`, color: "#FFFFFF" }}>
              Product
            </h2>
            <button type="button" onClick={(): void => onNavigate("dashboard")} style={footerLinkStyle}>
              Dashboard
            </button>
            <button type="button" onClick={(): void => onNavigate("create-card")} style={footerLinkStyle}>
              Your cards
            </button>
            <button type="button" onClick={(): void => onNavigate("add-money")} style={footerLinkStyle}>
              Add money
            </button>
            <button type="button" onClick={(): void => onNavigate("snap-bill")} style={footerLinkStyle}>
              Pay a bill
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0`, color: "#FFFFFF" }}>
              Help
            </h2>
            <button type="button" onClick={(): void => onNavigate("how-it-works")} style={footerLinkStyle}>
              How Digna works
            </button>
            <button type="button" onClick={(): void => onNavigate("how-it-works")} style={footerLinkStyle}>
              Why do cards get declined?
            </button>
            <button type="button" onClick={(): void => onNavigate("assistant")} style={footerLinkStyle}>
              Money assistant
            </button>
            <button type="button" onClick={(): void => onNavigate("alerts")} style={footerLinkStyle}>
              Alerts
            </button>
            <button type="button" onClick={(): void => onNavigate("settings")} style={footerLinkStyle}>
              Settings
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0`, color: "#FFFFFF" }}>
              Practice money, for now
            </h2>
            <p style={{ fontFamily: typography.body, fontSize: "14px", lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
              Right now every dollar in Digna is practice money, so you can try everything without risk. Real cards are on the way.
            </p>
            <button type="button" onClick={(): void => onNavigate("demo-data")} style={footerLinkStyle}>
              Look around with a sample account
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: typography.heading, fontSize: "15px", margin: `0 0 ${spacing.sm} 0`, color: "#FFFFFF" }}>
              About
            </h2>
            <p style={{ fontFamily: typography.body, fontSize: "14px", lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
              Cards with limits you choose, so you can pay the places that turn your card away. Your money's good here.
            </p>
            <button type="button" onClick={(): void => onNavigate("welcome")} style={footerLinkStyle}>
              Home
            </button>
            <button type="button" onClick={(): void => onNavigate("feedback")} style={footerLinkStyle}>
              Send feedback
            </button>
            <button type="button" onClick={(): void => onNavigate("privacy")} style={footerLinkStyle}>
              Privacy
            </button>
            <button type="button" onClick={(): void => onNavigate("terms")} style={footerLinkStyle}>
              Terms
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
          <span>© Digna · Practice money for now · Not a bank · Not connected to Chime, Cash App or any business shown</span>
          <span>Practice money</span>
        </div>
      </footer>
    </div>
  );
}
