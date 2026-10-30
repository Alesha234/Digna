import * as React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { PayProxyUser, WalletBalance, VirtualCard, CardTransaction, BillScanResult, AppScreen } from "@/modules/ui/types";
import { demoUser, demoBalance, demoCards, demoTransactions } from "@/modules/ui/data/demoData";

type PayProxyContextValue = {
  user: PayProxyUser | null;
  balance: WalletBalance;
  cards: VirtualCard[];
  transactions: CardTransaction[];
  screen: AppScreen;
  selectedCardId: string | null;
  lastScan: BillScanResult | null;
  signInDemo(): void;
  signOut(): void;
  setScreen(s: AppScreen): void;
  selectCard(id: string | null): void;
  addMoneyCents(cents: number): void;
  createCard(input: { name: string; capCents: number; endDate: string }): VirtualCard;
  freezeCard(id: string): void;
  unfreezeCard(id: string): void;
  closeCard(id: string): void;
  setLastScan(s: BillScanResult | null): void;
};

const PayProxyContext = createContext<PayProxyContextValue | null>(null);

export function usePayProxy(): PayProxyContextValue {
  const ctx = useContext(PayProxyContext);
  if (!ctx) throw new Error("usePayProxy must be used within PayProxyProvider");
  return ctx;
}

function bumpBalance(prev: WalletBalance, cents: number): WalletBalance {
  const rec = prev as unknown as Record<string, unknown>;
  if (typeof rec.availableCents === "number") {
    return { ...prev, availableCents: (rec.availableCents as number) + cents } as WalletBalance;
  }
  if (typeof rec.cents === "number") {
    return { ...prev, cents: (rec.cents as number) + cents } as WalletBalance;
  }
  if (typeof rec.balanceCents === "number") {
    return { ...prev, balanceCents: (rec.balanceCents as number) + cents } as WalletBalance;
  }
  if (typeof rec.totalCents === "number") {
    return { ...prev, totalCents: (rec.totalCents as number) + cents } as WalletBalance;
  }
  return { ...prev } as WalletBalance;
}

function withStatus(card: VirtualCard, status: string): VirtualCard {
  return { ...card, status: status as unknown as VirtualCard["status"] };
}

export function PayProxyProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<PayProxyUser | null>(null);
  const [balance, setBalance] = useState<WalletBalance>(() => ({ ...demoBalance }));
  const [cards, setCards] = useState<VirtualCard[]>(() => [...demoCards]);
  const [transactions] = useState<CardTransaction[]>(() => [...demoTransactions]);
  const [screen, setScreen] = useState<AppScreen>(() => "welcome" as AppScreen);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<BillScanResult | null>(null);

  const value = useMemo<PayProxyContextValue>(() => {
    function signInDemo(): void {
      setUser(demoUser);
    }
    function signOut(): void {
      setUser(null);
      setScreen("welcome" as AppScreen);
    }
    function handleScreen(s: AppScreen): void {
      setScreen(s);
    }
    function selectCard(id: string | null): void {
      setSelectedCardId(id);
    }
    function addMoneyCents(cents: number): void {
      setBalance((prev: WalletBalance) => bumpBalance(prev, cents));
    }
    function createCard(input: { name: string; capCents: number; endDate: string }): VirtualCard {
      const card = {
        id: `card_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        name: input.name,
        capCents: input.capCents,
        endDate: input.endDate,
        last4: String(Math.floor(1000 + Math.random() * 9000)),
        status: "active",
        spentCents: 0,
      } as unknown as VirtualCard;
      setCards((prev: VirtualCard[]) => [...prev, card]);
      return card;
    }
    function freezeCard(id: string): void {
      setCards((prev: VirtualCard[]) => prev.map((c: VirtualCard) => (c.id === id ? withStatus(c, "frozen") : c)));
    }
    function unfreezeCard(id: string): void {
      setCards((prev: VirtualCard[]) => prev.map((c: VirtualCard) => (c.id === id ? withStatus(c, "active") : c)));
    }
    function closeCard(id: string): void {
      setCards((prev: VirtualCard[]) => prev.map((c: VirtualCard) => (c.id === id ? withStatus(c, "closed") : c)));
    }
    function handleLastScan(s: BillScanResult | null): void {
      setLastScan(s);
    }
    return {
      user,
      balance,
      cards,
      transactions,
      screen,
      selectedCardId,
      lastScan,
      signInDemo,
      signOut,
      setScreen: handleScreen,
      selectCard,
      addMoneyCents,
      createCard,
      freezeCard,
      unfreezeCard,
      closeCard,
      setLastScan: handleLastScan,
    };
  }, [user, balance, cards, transactions, screen, selectedCardId, lastScan]);

  return <PayProxyContext.Provider value={value}>{props.children}</PayProxyContext.Provider>;
}
