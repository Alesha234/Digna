CREATE FUNCTION PUBLIC.simulate_transaction(p_card_id UUID, p_merchant_name TEXT, p_amount_cents BIGINT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
DECLARE
  v_uid UUID;
  v_merchant TEXT;
  v_card_user UUID;
  v_card_status TEXT;
  v_end DATE;
  v_spent BIGINT;
  v_cap BIGINT;
  v_balance BIGINT;
  v_remaining BIGINT;
  v_status TEXT;
  v_reason TEXT;
  v_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'not authenticated';
  END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_amount_cents > 500000 THEN
    RAISE EXCEPTION USING MESSAGE = 'invalid amount';
  END IF;
  v_merchant := TRIM(p_merchant_name);
  IF v_merchant IS NULL OR CHAR_LENGTH(v_merchant) < 1 OR CHAR_LENGTH(v_merchant) > 80 THEN
    RAISE EXCEPTION USING MESSAGE = 'invalid merchant';
  END IF;
  SELECT user_id, status, end_date, spent_cents, spending_cap_cents INTO v_card_user, v_card_status, v_end, v_spent, v_cap FROM virtual_cards WHERE id = p_card_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING MESSAGE = 'card not found';
  END IF;
  IF v_card_user IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION USING MESSAGE = 'not card owner';
  END IF;
  SELECT balance_cents INTO v_balance FROM wallets WHERE user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING MESSAGE = 'wallet not found';
  END IF;
  IF v_card_status = 'frozen' THEN
    v_status := 'declined';
    v_reason := 'frozen';
  ELSIF v_card_status = 'closed' THEN
    v_status := 'declined';
    v_reason := 'closed';
  ELSIF v_end < CURRENT_DATE THEN
    v_status := 'declined';
    v_reason := 'expired';
  ELSIF (v_spent + p_amount_cents) > v_cap THEN
    v_status := 'declined';
    v_reason := 'over_cap';
  ELSIF v_balance < p_amount_cents THEN
    v_status := 'declined';
    v_reason := 'insufficient_balance';
  ELSE
    v_status := 'approved';
    v_reason := NULL;
  END IF;
  IF v_status = 'approved' THEN
    v_remaining := v_cap - (v_spent + p_amount_cents);
    v_balance := v_balance - p_amount_cents;
  ELSE
    v_remaining := v_cap - v_spent;
  END IF;
  v_id := gen_random_uuid();
  INSERT INTO transactions (id, user_id, card_id, merchant_name, amount_cents, status, decline_reason, created_at) VALUES (v_id, v_uid, p_card_id, v_merchant, p_amount_cents, v_status, v_reason, NOW());
  IF v_status = 'approved' THEN
    UPDATE virtual_cards SET spent_cents = spent_cents + p_amount_cents WHERE id = p_card_id;
    UPDATE wallets SET balance_cents = balance_cents - p_amount_cents WHERE user_id = v_uid;
  END IF;
  RETURN jsonb_build_object('transaction_id', v_id, 'result', v_status, 'decline_reason', v_reason, 'remaining_cap_cents', v_remaining, 'balance_cents', v_balance);
END;
$func$;
REVOKE ALL ON FUNCTION PUBLIC.simulate_transaction(UUID, TEXT, BIGINT) FROM PUBLIC, ANON;
GRANT EXECUTE ON FUNCTION PUBLIC.simulate_transaction(UUID, TEXT, BIGINT) TO authenticated;
