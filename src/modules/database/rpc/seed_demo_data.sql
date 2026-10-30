CREATE FUNCTION public.seed_demo_data() RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $FUNC$
DECLARE
  v_uid UUID := auth.uid();
  v_balance INT;
  v_card1 UUID;
  v_card2 UUID;
  v_card3 UUID;
  v_tx1 UUID;
  v_tx2 UUID;
  v_tx3 UUID;
  v_cards JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  IF EXISTS (SELECT 1 FROM public.virtual_cards WHERE user_id = v_uid) THEN
    SELECT balance_cents INTO v_balance FROM public.wallets WHERE user_id = v_uid;
    SELECT COALESCE(JSONB_AGG(id), '[]'::JSONB) INTO v_cards FROM public.virtual_cards WHERE user_id = v_uid;
    RETURN JSONB_BUILD_OBJECT('seeded', FALSE, 'balance_cents', COALESCE(v_balance, 0), 'cards', COALESCE(v_cards, '[]'::JSONB));
  END IF;

  INSERT INTO public.wallets (user_id, balance_cents)
  VALUES (v_uid, 25000)
  ON CONFLICT (user_id) DO UPDATE SET balance_cents = 25000;

  INSERT INTO public.virtual_cards (user_id, name, limit_cents, expires_on, status, last4, spent_cents)
  VALUES (v_uid, 'Google Cloud', 10000, CURRENT_DATE + 180, 'active', LPAD(((FLOOR(RANDOM() * 9000) + 1000)::INT)::TEXT, 4, '0'), 0)
  RETURNING id INTO v_card1;

  INSERT INTO public.virtual_cards (user_id, name, limit_cents, expires_on, status, last4, spent_cents)
  VALUES (v_uid, 'Hotel trip', 50000, CURRENT_DATE + 90, 'active', LPAD(((FLOOR(RANDOM() * 9000) + 1000)::INT)::TEXT, 4, '0'), 0)
  RETURNING id INTO v_card2;

  INSERT INTO public.virtual_cards (user_id, name, limit_cents, expires_on, status, last4, spent_cents)
  VALUES (v_uid, 'Subscriptions', 5000, CURRENT_DATE + 365, 'frozen', LPAD(((FLOOR(RANDOM() * 9000) + 1000)::INT)::TEXT, 4, '0'), 0)
  RETURNING id INTO v_card3;

  INSERT INTO public.transactions (user_id, card_id, amount_cents, status)
  VALUES (v_uid, v_card1, 1500, 'approved')
  RETURNING id INTO v_tx1;

  INSERT INTO public.transactions (user_id, card_id, amount_cents, status)
  VALUES (v_uid, v_card1, 2500, 'approved')
  RETURNING id INTO v_tx2;

  INSERT INTO public.transactions (user_id, card_id, amount_cents, status, decline_reason)
  VALUES (v_uid, v_card1, 20000, 'declined', 'over_cap')
  RETURNING id INTO v_tx3;

  UPDATE public.virtual_cards SET spent_cents = 4000 WHERE id = v_card1 AND user_id = v_uid;

  UPDATE public.wallets SET balance_cents = 25000 - 4000 WHERE user_id = v_uid;

  INSERT INTO public.alerts (user_id, card_id, kind, message)
  VALUES (v_uid, v_card1, 'near_cap', 'Google Cloud is approaching its cap.');

  INSERT INTO public.alerts (user_id, card_id, kind, message)
  VALUES (v_uid, v_card2, 'low_balance', 'Demo info: top up wallet before your hotel trip.');

  SELECT balance_cents INTO v_balance FROM public.wallets WHERE user_id = v_uid;

  RETURN JSONB_BUILD_OBJECT('seeded', TRUE, 'balance_cents', v_balance, 'cards', JSONB_BUILD_ARRAY(v_card1, v_card2, v_card3), 'transactions', JSONB_BUILD_ARRAY(v_tx1, v_tx2, v_tx3));
END;
$FUNC$;
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM PUBLIC, ANON;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
