export type CardStatus = 'active' | 'frozen' | 'closed';
export type TxnResult = 'charge' | 'decline';
export type AlertKind = 'near_cap' | 'low_balance' | 'expiring';
export type BillScanStatus = 'uploaded' | 'extracted' | 'confirmed' | 'failed';
export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}
export interface WalletRow {
  user_id: string;
  balance_cents: number;
  low_threshold_cents: number;
  updated_at: string;
}
export interface VirtualCardRow {
  id: string;
  user_id: string;
  name: string;
  last4: string;
  status: CardStatus;
  cap_cents: number;
  spent_cents: number;
  end_date: string;
  created_at: string;
  closed_at: string | null;
}
export interface TxnRow {
  id: string;
  user_id: string;
  card_id: string;
  store_name: string;
  amount_cents: number;
  result: TxnResult;
  decline_reason: string | null;
  created_at: string;
}
export interface BillScanRow {
  id: string;
  user_id: string;
  photo_path: string;
  merchant: string | null;
  amount_cents: number | null;
  due_date: string | null;
  status: BillScanStatus;
  created_at: string;
}
export interface AssistantMessageRow {
  id: string;
  user_id: string;
  transaction_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
export interface AlertRow {
  id: string;
  user_id: string;
  card_id: string | null;
  kind: AlertKind;
  message: string;
  acknowledged: boolean;
  created_at: string;
}
export interface Database {
  Tables: {
    profiles: {
      Row: ProfileRow;
      Insert: Omit<ProfileRow, 'id' | 'created_at'> & Partial<Pick<ProfileRow, 'id' | 'created_at'>>;
      Update: Partial<ProfileRow>;
    };
    wallets: {
      Row: WalletRow;
      Insert: Omit<WalletRow, 'updated_at'> & Partial<Pick<WalletRow, 'updated_at'>>;
      Update: Partial<WalletRow>;
    };
    virtual_cards: {
      Row: VirtualCardRow;
      Insert: Omit<VirtualCardRow, 'id' | 'created_at' | 'closed_at'> & Partial<Pick<VirtualCardRow, 'id' | 'created_at' | 'closed_at'>>;
      Update: Partial<VirtualCardRow>;
    };
    transactions: {
      Row: TxnRow;
      Insert: Omit<TxnRow, 'id' | 'created_at' | 'decline_reason'> & Partial<Pick<TxnRow, 'id' | 'created_at' | 'decline_reason'>>;
      Update: Partial<TxnRow>;
    };
    bill_scans: {
      Row: BillScanRow;
      Insert: Omit<BillScanRow, 'id' | 'created_at'> & Partial<Pick<BillScanRow, 'id' | 'created_at'>>;
      Update: Partial<BillScanRow>;
    };
    assistant_messages: {
      Row: AssistantMessageRow;
      Insert: Omit<AssistantMessageRow, 'id' | 'created_at' | 'transaction_id'> & Partial<Pick<AssistantMessageRow, 'id' | 'created_at' | 'transaction_id'>>;
      Update: Partial<AssistantMessageRow>;
    };
    alerts: {
      Row: AlertRow;
      Insert: Omit<AlertRow, 'id' | 'created_at' | 'card_id'> & Partial<Pick<AlertRow, 'id' | 'created_at' | 'card_id'>>;
      Update: Partial<AlertRow>;
    };
  };
  Functions: {
    deposit_money: {
      Args: { p_amount_cents: number };
      Returns: number;
    };
    seed_demo: {
      Args: Record<string, never>;
      Returns: string;
    };
  };
}
