import * as React from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { theme, colors, spacing, radii, shadows, typography } from "@/modules/ui/theme";
import { testModeMessage } from "@/modules/ui/data/demoData";

void PayProxyProvider;
void theme;

type NavValue = "dashboard" | "create-card" | "add-money" | "snap-bill" | "assistant" | "settings";

const navItems: Array<{ label: string; value: NavValue }> = [
  { label: "Dashboard", value: "dashboard" },
  { label: "New Card", value: "create-card" },
  { label: "Add Money", value: "add-money" },
  { label: "Snap Bill", value: "snap-bill" },
  { label: "Assistant", value: "assistant" },
  { label: "Settings", value: "settings" },
];

export function AppShell(props: { children: React.ReactNode }) {
  const { children } = props;
  const { user, screen, setScreen } = usePayProxy();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.background,
        fontFamily: typography.fontFamily,
        color: colors.text,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: spacing.md,
          paddingLeft: spacing.lg,
          paddingRight: spacing.lg,
          backgroundColor: colors.background,
        }}
      >
        <span
          style={{
            backgroundColor: colors.primarySoft,
            color: colors.primary,
            borderRadius: radii.pill,
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            padding: `${spacing.md} ${spacing.lg}`,
            border: `1px solid ${colors.border}`,
          }}
        >
          {testModeMessage}
        </span>
      </div>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
          padding: `${spacing.md} ${spacing.lg}`,
        }}
      >
        <span
          style={{
            fontSize: typography.sizeMd,
            fontWeight: typography.weightBold,
            color: colors.text,
            fontFamily: typography.fontFamily,
          }}
        >
          PayProxy
        </span>
        <span
          style={{
            fontSize: typography.sizeSm,
            fontWeight: typography.weightMedium,
            color: colors.primary,
            backgroundColor: colors.primarySoft,
            borderRadius: radii.pill,
            padding: `${spacing.md} ${spacing.lg}`,
          }}
        >
          {testModeMessage}
        </span>
      </header>

      {user ? null : null}

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          padding: `${spacing.lg} ${spacing.md}`,
          backgroundColor: colors.background,
        }}
      >
        {children}
      </main>

      <nav
        aria-label="Primary"
        style={{
          backgroundColor: colors.surface,
          borderTop: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
          padding: spacing.md,
          display: "flex",
          gap: spacing.md,
          overflowX: "auto",
        }}
      >
        {navItems.map((item: { label: string; value: NavValue }) => {
          const active: boolean = screen === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={(): void => setScreen(item.value as never)}
              aria-current={active ? "page" : undefined}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                borderRadius: radii.md,
                border: `1px solid ${active ? colors.primary : colors.border}`,
                backgroundColor: active ? colors.primary : colors.white,
                color: active ? colors.white : colors.textMuted,
                fontFamily: typography.fontFamily,
                fontSize: typography.sizeSm,
                fontWeight: active ? typography.weightBold : typography.weightMedium,
                padding: spacing.md,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
