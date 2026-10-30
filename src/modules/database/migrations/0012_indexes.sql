CREATE INDEX IF NOT EXISTS idx_cards_dashboard ON virtual_cards (user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_txns_card_history ON transactions (card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txns_user_recent ON transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits (user_id, created_at DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts (user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_scans_user ON bill_scans (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON assistant_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON assistant_messages (conversation_id, created_at);
