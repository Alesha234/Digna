CREATE OR REPLACE FUNCTION check_card_cap_alert() RETURNS TRIGGER AS $$
DECLARE
  v_card_id BIGINT;
  v_user_id UUID;
  v_cap BIGINT;
  v_spent BIGINT;
  v_sev TEXT;
BEGIN
  IF TG_TABLE_NAME = 'transactions' THEN
    v_card_id := NEW.card_id;
    v_user_id := NEW.user_id;
  ELSE
    v_card_id := NEW.id;
    v_user_id := NEW.user_id;
  END IF;
  IF v_card_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND v_user_id != auth.uid() THEN
    RETURN NEW;
  END IF;
  SELECT spending_cap_cents, spent_cents INTO v_cap, v_spent FROM virtual_cards WHERE id = v_card_id;
  IF v_cap IS NULL OR v_cap <= 0 THEN
    RETURN NEW;
  END IF;
  IF v_spent < (v_cap * 0.8) THEN
    RETURN NEW;
  END IF;
  IF v_spent >= (v_cap * 0.95) THEN
    v_sev := 'critical';
  ELSE
    v_sev := 'warning';
  END IF;
  INSERT INTO alerts (user_id, card_id, alert_type, severity, title, message, dedupe_key) VALUES (v_user_id, v_card_id, 'near_cap', v_sev, 'NEAR_CAP', 'CARD_NEAR_CAP', v_user_id || ':near_cap:' || v_card_id || ':' || CURRENT_DATE) ON CONFLICT (dedupe_key) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION check_low_balance_alert() RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := NEW.user_id;
  IF auth.uid() IS NOT NULL AND v_user_id != auth.uid() THEN
    RETURN NEW;
  END IF;
  IF NEW.balance_cents IS NULL OR NEW.balance_cents >= 1000 THEN
    RETURN NEW;
  END IF;
  INSERT INTO alerts (user_id, card_id, alert_type, severity, title, message, dedupe_key) VALUES (v_user_id, NULL, 'low_balance', 'warning', 'LOW_BALANCE', 'WALLET_LOW_BALANCE', v_user_id || ':low_balance:' || CURRENT_DATE) ON CONFLICT (dedupe_key) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION check_card_cap_alert() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_card_cap_alert() TO authenticated;
REVOKE ALL ON FUNCTION check_low_balance_alert() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_low_balance_alert() TO authenticated;
CREATE TRIGGER trg_alert_cap_txn AFTER INSERT OR UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION check_card_cap_alert();
CREATE TRIGGER trg_alert_cap_card AFTER UPDATE OF spent_cents ON virtual_cards FOR EACH ROW EXECUTE FUNCTION check_card_cap_alert();
CREATE TRIGGER trg_alert_balance AFTER UPDATE OF balance_cents ON wallets FOR EACH ROW EXECUTE FUNCTION check_low_balance_alert();
