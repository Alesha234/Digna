-- Migration 0010: user warnings (alerts)
-- Dedupe key format: {user_id}:{alert_type}:{card_id or wallet}:{date or threshold}
CREATE TABLE alerts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, card_id UUID NULL REFERENCES virtual_cards(id) ON DELETE CASCADE, alert_type TEXT NOT NULL CHECK (alert_type IN ('near_cap', 'low_balance', 'card_expiring', 'decline_spike')), severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')), title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120), message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000), is_read BOOLEAN NOT NULL DEFAULT FALSE, dedupe_key TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), read_at TIMESTAMPTZ NULL, UNIQUE (dedupe_key)); ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN alerts.dedupe_key IS 'Format: {user_id}:{alert_type}:{card_id or wallet}:{date or threshold}';
CREATE POLICY alerts_owner_all ON alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON alerts TO authenticated;
CREATE FUNCTION mark_alert_read(p_alert_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE alerts SET is_read = TRUE, read_at = now() WHERE id = p_alert_id AND user_id = auth.uid(); END; $$;
REVOKE ALL ON FUNCTION mark_alert_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_alert_read(UUID) TO authenticated;
