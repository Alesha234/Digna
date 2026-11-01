export type PayProxyUser = {
  id: string;
  email: string;
  displayName: string;
};

export type WalletBalance = {
  availableCents: number;
  currency: string;
  updatedAt: string;
};

export type VirtualCard = {
  id: string;
  userId: string;
  name: string;
  last4: string;
  capCents: number;
  spentCents: number;
  status: 'active' | 'frozen' | 'closed';
  endDate: string;
  createdAt: string;
  /** Practice card details, shown only to the card's owner (a real card would come from the card partner). */
  cardNumber?: string;
  exp?: string;
  cvc?: string;
};

export type CardTransaction = {
  id: string;
  cardId: string;
  storeName: string;
  amountCents: number;
  occurredAt: string;
  result: 'approved' | 'declined';
  reason?: string;
};

export type BillScanResult = {
  id: string;
  storeName: string;
  amountCents: number;
  dueDate: string;
  confidence: 'high' | 'medium' | 'low';
};

export type AppWarning = {
  id: string;
  kind: 'near-cap' | 'low-balance' | 'expiring';
  title: string;
  message: string;
  cardId?: string;
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};

export type AppScreen = 'welcome' | 'auth' | 'signup' | 'dashboard' | 'card-detail' | 'create-card' | 'add-money' | 'snap-bill' | 'assistant' | 'settings' | 'checkout' | 'alerts' | 'demo-data' | 'privacy' | 'terms' | 'feedback' | 'new-password' | 'how-it-works';

export type ComingSoonPlace = {
  id: string;
  name: string;
  kind: 'hotel' | 'flight' | 'retailer';
  blurb: string;
  comingSoon: boolean;
};
