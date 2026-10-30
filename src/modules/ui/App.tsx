import "./styles.css";
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

function InnerApp() {
  const { user, screen } = usePayProxy();

  if (!user) {
    if (screen === "auth") {
      return <AuthScreen />;
    }
    return <WelcomeScreen />;
  }

  if (screen === "card-detail") {
    return (
      <AppShell>
        <div>Test mode: demo only, no real money moves.</div>
        <CardDetailScreen />
      </AppShell>
    );
  }

  if (screen === "create-card") {
    return (
      <AppShell>
        <div>Test mode: demo only, no real money moves.</div>
        <CreateCardScreen />
      </AppShell>
    );
  }

  if (screen === "add-money") {
    return (
      <AppShell>
        <div>Test mode: demo only, no real money moves.</div>
        <AddMoneyScreen />
      </AppShell>
    );
  }

  if (screen === "snap-bill") {
    return (
      <AppShell>
        <div>Test mode: demo only, no real money moves.</div>
        <SnapBillScreen />
      </AppShell>
    );
  }

  if (screen === "assistant") {
    return (
      <AppShell>
        <div>Test mode: demo only, no real money moves.</div>
        <AssistantScreen />
      </AppShell>
    );
  }

  if (screen === "settings") {
    return (
      <AppShell>
        <div>Test mode: demo only, no real money moves.</div>
        <SettingsScreen />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div>Test mode: demo only, no real money moves.</div>
      <DashboardScreen />
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
