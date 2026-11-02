import "./styles.css";
import { useEffect, useState } from "react";
import { PayProxyProvider, usePayProxy } from "@/modules/ui/state/PayProxyProvider";
import { getSafeNextPath } from "@/modules/security/safe-redirect";
import { AppShell } from "@/modules/ui/components/AppShell";
import { WelcomeScreen } from "@/modules/ui/screens/WelcomeScreen";
import { AuthScreen, NewPasswordScreen } from "@/modules/ui/screens/AuthScreen";
import { DashboardScreen } from "@/modules/ui/screens/DashboardScreen";
import { CardDetailScreen } from "@/modules/ui/screens/CardDetailScreen";
import { CreateCardScreen } from "@/modules/ui/screens/CreateCardScreen";
import { AddMoneyScreen } from "@/modules/ui/screens/AddMoneyScreen";
import { HowItWorksScreen } from "@/modules/ui/screens/HowItWorksScreen";
import { AssistantScreen } from "@/modules/ui/screens/AssistantScreen";
import { AssistantBubble } from "@/modules/ui/components/AssistantBubble";
import { SettingsScreen } from "@/modules/ui/screens/SettingsScreen";
import { DemoDataScreen } from "@/modules/ui/screens/DemoDataScreen";
import { AlertsScreen } from "@/modules/ui/screens/AlertsScreen";
import { CheckoutScreen } from "@/modules/ui/screens/CheckoutScreen";
import { FeedbackScreen, PrivacyScreen, TermsScreen } from "@/modules/ui/screens/InfoScreens";
import type { AppScreen, BillScanResult, SavedBill } from "@/modules/ui/types";

/** The pages anyone can see; every other page needs an account or the demo. */
const OPEN: AppScreen[] = ["welcome", "auth", "signup", "privacy", "terms", "feedback", "how-it-works"];

function InnerApp() {
  const { screen, setScreen, mode, ready, notice, clearNotice, signInDemo, selectedCardId, selectCard, bills, linkBillCard } = usePayProxy();
  // A bill on Pay a bill that a new card is being made for (Nov 2, 2026): once made, the card is linked to it and Pay a
  // bill opens with that bill ready to pay.
  const [payBillId, setPayBillId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | undefined>(undefined);
  const [bill, setBill] = useState<BillScanResult | null>(null);
  // The money assistant opens over the page from its floating button (Nov 2, 2026), not as a page of its own.
  const [askOpen, setAskOpen] = useState(false);
  // The protected page a guest tried to open: signing in returns there when it is safe, otherwise stays put.
  const [pendingReturn, setPendingReturn] = useState<string | null>(null);
  const isSignedIn = mode !== "guest";

  // Guest guard memory only: remember the attempted page; a voluntary visit back to welcome clears it.
  // Signing in never moves the person: the screen stays exactly where it is unless onSuccess navigates.
  useEffect(() => {
    if (mode !== "guest") return;
    if (!OPEN.includes(screen)) setPendingReturn(screen);
    else if (screen === "welcome") setPendingReturn(null);
  }, [mode, screen]);

  function go(next: AppScreen | string): void {
    // The assistant's old address (the footer link, an old bookmark) opens the panel where you are.
    if (next === "assistant") {
      setQuestion(undefined);
      setAskOpen(true);
      return;
    }
    setAskOpen(false);
    setPayBillId(null);
    clearNotice();
    setBill(null);
    setScreen(next as AppScreen);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }
  // After a sign-in: go to the saved page when it is a safe internal screen, else stay on the current screen.
  function handleAuthSuccess(next: string | null): void {
    const dest = getSafeNextPath(next ?? pendingReturn, screen);
    setPendingReturn(null);
    if (dest && dest !== screen) go(dest as AppScreen);
  }
  function openCard(cardId: string): void {
    const forBill = bill && bills.some((b) => b.id === bill.id) ? bill.id : null;
    if (forBill) {
      void linkBillCard(forBill, cardId).catch(() => undefined);
      go("snap-bill");
      setPayBillId(forBill);
      return;
    }
    selectCard(cardId);
    go("card-detail");
  }
  function makeCardForSaved(b: SavedBill): void {
    makeCardFor({ id: b.id, storeName: b.business, amountCents: b.amountCents, dueDate: b.dueDate ?? "", confidence: "high" });
  }
  function makeCardFor(b: BillScanResult): void {
    go("create-card");
    setBill(b);
  }
  function ask(q: string): void {
    setQuestion(q);
    setAskOpen(true);
  }

  function page() {
    if (screen === "welcome") return <WelcomeScreen onGetStarted={() => go("signup")} onSignIn={() => go("auth")} onTryDemo={signInDemo} onHowItWorks={() => go("how-it-works")} isSignedIn={isSignedIn} onDashboard={() => go("dashboard")} onPayBill={() => go("snap-bill")} />;
    if (screen === "privacy") return <PrivacyScreen />;
    if (screen === "terms") return <TermsScreen />;
    if (screen === "feedback") return <FeedbackScreen />;
    if (screen === "how-it-works") return <HowItWorksScreen />;
    if (!ready) return <p style={{ padding: 24 }}>Loading your account…</p>;
    if (screen === "new-password") return <NewPasswordScreen />;
    if (screen === "auth" || screen === "signup") return <AuthScreen key={screen} startWith={screen === "signup" ? "signup" : "signin"} returnTo={pendingReturn} onSuccess={handleAuthSuccess} />;
    if (mode === "guest" && !OPEN.includes(screen)) return <AuthScreen startWith="signin" returnTo={pendingReturn ?? screen} onSuccess={handleAuthSuccess} />;
    switch (screen) {
      case "card-detail":
        return <CardDetailScreen cardId={selectedCardId ?? ""} onBack={() => go("dashboard")} onAddMoney={() => go("add-money")} />;
      case "create-card":
        return <CreateCardScreen key={bill?.id ?? "new"} bill={bill} onCreated={openCard} onCancel={() => go("dashboard")} />;
      case "add-money":
        return <AddMoneyScreen onDone={() => go("dashboard")} onCancel={() => go("dashboard")} />;
      case "snap-bill":
        // The old bill route now opens Pay a bill: there is only one bill section.
        return <CheckoutScreen key={payBillId ?? "pay"} payBillId={payBillId} onAskAssistant={ask} onCreateCard={() => go("create-card")} onAddMoney={() => go("add-money")} onMakeCard={makeCardFor} onMakeCardForBill={makeCardForSaved} />;
      case "assistant":
        return <AssistantScreen key={question ?? "assistant"} initialPrompt={question} />;
      case "settings":
        return <SettingsScreen onSignOut={() => go("welcome")} onBack={() => go("dashboard")} />;
      case "checkout":
        return <CheckoutScreen payBillId={payBillId} onAskAssistant={ask} onCreateCard={() => go("create-card")} onAddMoney={() => go("add-money")} onMakeCard={makeCardFor} onMakeCardForBill={makeCardForSaved} />;
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
          You're looking at a sample account: nothing is saved.{" "}
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
      <AssistantBubble
        open={askOpen}
        question={question}
        signedIn={isSignedIn}
        onOpen={() => setAskOpen(true)}
        onClose={() => setAskOpen(false)}
        onSignUp={() => go("signup")}
        onTryDemo={() => {
          setAskOpen(false);
          signInDemo();
        }}
      />
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
