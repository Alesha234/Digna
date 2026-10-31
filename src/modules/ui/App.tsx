import "./styles.css";
import { useState } from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { AppShell } from "@/modules/ui/components/AppShell";
import { WelcomeScreen } from "@/modules/ui/screens/WelcomeScreen";
import { AuthScreen } from "@/modules/ui/screens/AuthScreen";
import { DashboardScreen } from "@/modules/ui/screens/DashboardScreen";
import { CardDetailScreen } from "@/modules/ui/screens/CardDetailScreen";
import { CreateCardScreen } from "@/modules/ui/screens/CreateCardScreen";
import { AddMoneyScreen } from "@/modules/ui/screens/AddMoneyScreen";
import { SnapBillScreen } from "@/modules/ui/screens/SnapBillScreen";
import { AssistantScreen } from "@/modules/ui/screens/AssistantScreen";
import { SettingsScreen } from "@/modules/ui/screens/SettingsScreen";
import { DemoDataScreen } from "@/modules/ui/screens/DemoDataScreen";
import { AlertsScreen } from "@/modules/ui/screens/AlertsScreen";
import { CheckoutScreen } from "@/modules/ui/screens/CheckoutScreen";
import type { AppScreen } from "@/modules/ui/types";

/** The pages anyone can see; every other page needs an account or the demo. */
const OPEN: AppScreen[] = ["welcome", "auth", "signup"];

function InnerApp() {
  const { screen, setScreen, mode, ready, notice, clearNotice, signInDemo, selectedCardId, selectCard } = usePayProxy();
  const [question, setQuestion] = useState<string | undefined>(undefined);

  function go(next: AppScreen | string): void {
    clearNotice();
    setScreen(next as AppScreen);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }
  function openCard(cardId: string): void {
    selectCard(cardId);
    go("card-detail");
  }
  function ask(q: string): void {
    setQuestion(q);
    go("assistant");
  }

  function page() {
    if (screen === "welcome") return <WelcomeScreen onGetStarted={() => go("signup")} onSignIn={() => go("auth")} onTryDemo={signInDemo} />;
    if (!ready) return <p style={{ padding: 24 }}>Loading your account…</p>;
    if (screen === "auth" || screen === "signup") return <AuthScreen key={screen} startWith={screen === "signup" ? "signup" : "signin"} />;
    if (mode === "guest" && !OPEN.includes(screen)) return <AuthScreen startWith="signin" />;
    switch (screen) {
      case "card-detail":
        return <CardDetailScreen cardId={selectedCardId ?? ""} onBack={() => go("dashboard")} onAddMoney={() => go("add-money")} />;
      case "create-card":
        return <CreateCardScreen onCreated={openCard} onCancel={() => go("dashboard")} />;
      case "add-money":
        return <AddMoneyScreen onDone={() => go("dashboard")} onCancel={() => go("dashboard")} />;
      case "snap-bill":
        return <SnapBillScreen onMakeCard={() => go("create-card")} onCancel={() => go("dashboard")} />;
      case "assistant":
        return <AssistantScreen key={question ?? "assistant"} initialPrompt={question} />;
      case "settings":
        return <SettingsScreen onSignOut={() => go("welcome")} onBack={() => go("dashboard")} />;
      case "checkout":
        return <CheckoutScreen onAskAssistant={ask} onCreateCard={() => go("create-card")} />;
      case "alerts":
        return <AlertsScreen />;
      case "demo-data":
        return <DemoDataScreen />;
      default:
        return <DashboardScreen onOpenCard={openCard} onAddMoney={() => go("add-money")} onCreateCard={() => go("create-card")} />;
    }
  }

  return (
    <AppShell current={screen} onNavigate={go}>
      {mode === "demo" && screen !== "welcome" && (
        <p role="note" style={{ background: "#FFF6E5", border: "1px solid #F5D08A", borderRadius: 10, padding: "10px 14px", margin: "0 0 16px", fontSize: 14 }}>
          You're in the demo: nothing is saved.{" "}
          <button type="button" onClick={() => go("signup")} style={{ background: "transparent", border: 0, padding: 0, fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontSize: 14 }}>
            Create a free account
          </button>{" "}
          to keep your cards and ask the AI.
        </p>
      )}
      {notice && (
        <p role="alert" style={{ background: "#FFF5F4", border: "1px solid #F4B4AE", borderRadius: 10, padding: "10px 14px", margin: "0 0 16px", fontSize: 14, color: "#B42318" }}>
          {notice}
        </p>
      )}
      {page()}
    </AppShell>
  );
}

export default function App() {
  return (
    <PayProxyProvider>
      <InnerApp />
    </PayProxyProvider>
  );
}
