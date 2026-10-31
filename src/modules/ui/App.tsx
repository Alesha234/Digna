import "./styles.css";
import { useState } from "react";
import { PayProxyProvider } from "@/modules/ui/state/PayProxyProvider";
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
import { StylesScreen } from "@/modules/ui/screens/StylesScreen";
import { ThemeScreen } from "@/modules/ui/screens/ThemeScreen";
import { DemoDataScreen } from "@/modules/ui/screens/DemoDataScreen";
import { ProviderInfoScreen } from "@/modules/ui/screens/ProviderInfoScreen";
import { FormatScreen } from "@/modules/ui/screens/FormatScreen";
import { AlertsScreen } from "@/modules/ui/screens/AlertsScreen";
import { AppShellScreen } from "@/modules/ui/screens/AppShellScreen";
import type { AppScreen } from "@/modules/ui/types";
import type { BillScanResult } from "@/modules/ui/types";

type ShowcaseScreen = "styles" | "theme" | "demo-data" | "provider" | "format" | "alerts" | "app-shell";
type Screen = AppScreen | ShowcaseScreen;

function InnerApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  function onNavigate(next: AppScreen | string): void {
    setScreen(next as Screen);
  }

  function handleOpenCard(cardId: string): void {
    setSelectedCardId(cardId);
    setScreen("card-detail");
  }

  function handleAddMoney(): void {
    setScreen("add-money");
  }

  function handleCreateCard(): void {
    setScreen("create-card");
  }

  function handleCreated(cardId: string): void {
    setSelectedCardId(cardId);
    setScreen("card-detail");
  }

  function handleMakeCard(_bill: BillScanResult): void {
    setScreen("create-card");
  }

  function handleBackToDashboard(): void {
    setScreen("dashboard");
  }

  function handleGetStarted(): void {
    setScreen("auth");
  }

  function handleSignIn(): void {
    setScreen("auth");
  }

  function handleSignOut(): void {
    setSelectedCardId(null);
    setScreen("welcome");
  }

  function renderScreen() {
    if (screen === "welcome") {
      return <WelcomeScreen onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
    }
    if (screen === "auth") {
      return <AuthScreen />;
    }
    if (screen === "card-detail") {
      return (
        <CardDetailScreen
          cardId={selectedCardId ?? ""}
          onBack={handleBackToDashboard}
          onAddMoney={handleAddMoney}
        />
      );
    }
    if (screen === "create-card") {
      return <CreateCardScreen onCreated={handleCreated} onCancel={handleBackToDashboard} />;
    }
    if (screen === "add-money") {
      return <AddMoneyScreen onDone={handleBackToDashboard} onCancel={handleBackToDashboard} />;
    }
    if (screen === "snap-bill") {
      return <SnapBillScreen onMakeCard={handleMakeCard} onCancel={handleBackToDashboard} />;
    }
    if (screen === "assistant") {
      return <AssistantScreen />;
    }
    if (screen === "settings") {
      return <SettingsScreen onSignOut={handleSignOut} onBack={handleBackToDashboard} />;
    }
    if (screen === "styles") {
      return <StylesScreen />;
    }
    if (screen === "theme") {
      return <ThemeScreen />;
    }
    if (screen === "demo-data") {
      return <DemoDataScreen />;
    }
    if (screen === "provider") {
      return <ProviderInfoScreen />;
    }
    if (screen === "format") {
      return <FormatScreen />;
    }
    if (screen === "alerts") {
      return <AlertsScreen />;
    }
    if (screen === "app-shell") {
      return <AppShellScreen />;
    }
    return (
      <DashboardScreen
        onOpenCard={handleOpenCard}
        onAddMoney={handleAddMoney}
        onCreateCard={handleCreateCard}
      />
    );
  }

  return (
    <AppShell current={screen} onNavigate={onNavigate}>
      <p role="note">Test mode: demo only, no real money moves.</p>
      {renderScreen()}
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
