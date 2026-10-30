CREATE OR REPLACE FUNCTION credit_wallet_on_deposit() RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
IF auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
RAISE EXCEPTION 'not owner';
END IF;
UPDATE wallets SET balance_cents = balance_cents + NEW.amount_cents WHERE id = NEW.wallet_id;
END IF;
RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION debit_wallet_on_approval() RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE
v_cap BIGINT;
v_spent BIGINT;
v_cstatus TEXT;
v_end DATE;
v_bal BIGINT;
BEGIN
IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
IF auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
RAISE EXCEPTION 'not owner';
END IF;
SELECT spending_cap_cents, spent_cents, status, end_date INTO v_cap, v_spent, v_cstatus, v_end FROM virtual_cards WHERE id = NEW.card_id;
IF NOT FOUND THEN
RAISE EXCEPTION 'card not found';
END IF;
IF v_cstatus <> 'active' THEN
RAISE EXCEPTION 'card not active';
END IF;
IF v_end IS NOT NULL AND v_end < CURRENT_DATE THEN
RAISE EXCEPTION 'card expired';
END IF;
IF v_spent + NEW.amount_cents > v_cap THEN
RAISE EXCEPTION 'spending cap exceeded';
END IF;
SELECT balance_cents INTO v_bal FROM wallets WHERE id = NEW.wallet_id;
IF NOT FOUND THEN
RAISE EXCEPTION 'wallet not found';
END IF;
IF v_bal < NEW.amount_cents THEN
RAISE EXCEPTION 'insufficient balance';
END IF;
UPDATE wallets SET balance_cents = balance_cents - NEW.amount_cents WHERE id = NEW.wallet_id;
UPDATE virtual_cards SET spent_cents = spent_cents + NEW.amount_cents WHERE id = NEW.card_id;
END IF;
RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION credit_wallet_on_deposit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION credit_wallet_on_deposit() TO authenticated;
REVOKE ALL ON FUNCTION debit_wallet_on_approval() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION debit_wallet_on_approval() TO authenticated;
DROP TRIGGER IF EXISTS trg_deposit_credit ON deposits;
CREATE TRIGGER trg_deposit_credit AFTER INSERT OR UPDATE ON deposits FOR EACH ROW EXECUTE FUNCTION credit_wallet_on_deposit();
DROP TRIGGER IF EXISTS trg_txn_debit ON transactions;
CREATE TRIGGER trg_txn_debit AFTER INSERT OR UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION debit_wallet_on_approval();
DROP POLICY IF EXISTS transactions_select_own ON transactions;
CREATE POLICY transactions_select_own ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
