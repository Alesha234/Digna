-- Digna sandbox: every account, card and payment here uses sample money only. No real card, bank or payment
-- network is ever contacted. Run once in Supabase's SQL Editor, after 0001-0016 and the rpc files.

-- 1. The earlier money triggers and functions named columns these tables don't have (merchant_name, status,
--    wallet_id on transactions, a BIGINT card id), so the first payment would have failed. They are replaced below.
DROP TRIGGER IF EXISTS trg_txn_debit ON public.transactions;
DROP TRIGGER IF EXISTS trg_deposit_credit ON public.deposits;
DROP TRIGGER IF EXISTS trg_alert_cap_txn ON public.transactions;
DROP TRIGGER IF EXISTS trg_alert_cap_card ON public.virtual_cards;
DROP TRIGGER IF EXISTS trg_alert_balance ON public.wallets;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.simulate_transaction(UUID, TEXT, BIGINT);
DROP FUNCTION IF EXISTS public.add_money(BIGINT);

-- 2. Every try at a sandbox checkout, with any kind of card: what was paid, where, with what, and what happened.
CREATE TABLE IF NOT EXISTS public.sandbox_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL CHECK (char_length(merchant_id) BETWEEN 1 AND 40),
  merchant TEXT NOT NULL CHECK (char_length(merchant) BETWEEN 1 AND 80),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 500000),
  method TEXT NOT NULL CHECK (method IN ('payproxy', 'chime_debit', 'cash_app_card', 'prepaid_card', 'chime_credit_builder')),
  card_id UUID REFERENCES public.virtual_cards(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('approved', 'declined')),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.sandbox_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS sandbox_payments_user_idx ON public.sandbox_payments (user_id, created_at DESC);
DROP POLICY IF EXISTS sandbox_payments_select_owner ON public.sandbox_payments;
CREATE POLICY sandbox_payments_select_owner ON public.sandbox_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- People read their own rows; every change goes through the functions below.
REVOKE INSERT, UPDATE, DELETE ON public.wallets, public.deposits, public.virtual_cards, public.transactions, public.sandbox_payments FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.wallets, public.deposits, public.virtual_cards, public.transactions, public.sandbox_payments TO authenticated;

-- 3. A new account: its profile, settings and wallet, with $250 of sample money the first time.
CREATE OR REPLACE FUNCTION public.ensure_my_account() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := COALESCE(auth.jwt() ->> 'email', '');
  v_wallet UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (v_uid, CASE WHEN char_length(v_email) >= 5 THEN left(v_email, 320) ELSE v_uid::TEXT || '@sandbox.local' END, left(split_part(v_email, '@', 1), 80))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_settings (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.wallets (user_id, balance_cents) VALUES (v_uid, 25000) ON CONFLICT (user_id) DO NOTHING RETURNING id INTO v_wallet;
  IF v_wallet IS NOT NULL THEN
    INSERT INTO public.deposits (user_id, wallet_id, amount_cents, source) VALUES (v_uid, v_wallet, 25000, 'other');
  END IF;
  RETURN jsonb_build_object('new_account', v_wallet IS NOT NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_account() TO authenticated;

-- 4. Add sample money to the wallet, up to $5,000 at a time.
CREATE OR REPLACE FUNCTION public.add_money(p_amount_cents BIGINT, p_source TEXT DEFAULT 'other') RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_wallet UUID;
  v_balance BIGINT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_amount_cents > 500000 THEN RAISE EXCEPTION 'Add between $0.01 and $5,000 at a time.'; END IF;
  IF p_source NOT IN ('cash_app', 'chime', 'prepaid', 'other') THEN RAISE EXCEPTION 'Pick where the money comes from.'; END IF;
  SELECT id, balance_cents INTO v_wallet, v_balance FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
  IF v_wallet IS NULL THEN RAISE EXCEPTION 'Your wallet isn''t set up yet. Sign in again.'; END IF;
  IF v_balance + p_amount_cents > 100000000 THEN RAISE EXCEPTION 'That would put more than $1,000,000 in your wallet.'; END IF;
  UPDATE public.wallets SET balance_cents = balance_cents + p_amount_cents WHERE id = v_wallet RETURNING balance_cents INTO v_balance;
  INSERT INTO public.deposits (user_id, wallet_id, amount_cents, source) VALUES (v_uid, v_wallet, p_amount_cents, p_source);
  RETURN jsonb_build_object('balance_cents', v_balance);
END;
$$;
REVOKE ALL ON FUNCTION public.add_money(BIGINT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_money(BIGINT, TEXT) TO authenticated;

-- 5. The sandbox merchants and what each accepts, as many real checkouts do: some take only credit cards.
--    Digna's virtual cards run as credit cards, paid from the wallet's sample money and held to their caps.
CREATE OR REPLACE FUNCTION public.sandbox_merchants() RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT '[
    {"id": "nimbus_cloud", "name": "Nimbus Cloud", "kind": "Cloud service bill", "accepts": ["credit"], "rule": "Credit cards only. Cloud services bill you after you use them, so they want a card that can''t come up empty."},
    {"id": "harborview_hotel", "name": "Harborview Hotel", "kind": "Hotel check-in hold", "accepts": ["credit", "debit"], "rule": "Credit or debit, no prepaid. The hotel puts a hold on money at check-in for damage or extras, and a prepaid card can''t guarantee it."},
    {"id": "roadready_rentals", "name": "RoadReady Car Rental", "kind": "Car rental deposit", "accepts": ["credit"], "rule": "Credit cards only. The rental counter holds a security deposit, and most rental companies only trust a credit card for it."},
    {"id": "streambox", "name": "StreamBox", "kind": "Streaming subscription", "accepts": ["credit", "debit", "prepaid"], "rule": "Any card works here."}
  ]'::JSONB
$$;
GRANT EXECUTE ON FUNCTION public.sandbox_merchants() TO anon, authenticated;

-- 6. Pay at a sandbox merchant. Outside cards (sample Chime debit, Cash App Card, prepaid, Chime Credit Builder) are
--    checked against the merchant's rule only. A Digna card must also be the person's, active, not expired, under
--    its cap, and covered by the wallet; an approved payment comes off the wallet and counts toward the cap.
CREATE OR REPLACE FUNCTION public.sandbox_pay(p_merchant_id TEXT, p_amount_cents BIGINT, p_method TEXT, p_card_id UUID DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_merchant JSONB;
  v_kind TEXT;
  v_card public.virtual_cards%ROWTYPE;
  v_balance BIGINT;
  v_result TEXT := 'approved';
  v_code TEXT;
  v_reason TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_amount_cents > 500000 THEN RAISE EXCEPTION 'Pay between $0.01 and $5,000.'; END IF;
  SELECT m INTO v_merchant FROM jsonb_array_elements(public.sandbox_merchants()) AS m WHERE m ->> 'id' = p_merchant_id;
  IF v_merchant IS NULL THEN RAISE EXCEPTION 'Pick one of the places to pay.'; END IF;
  v_kind := CASE p_method WHEN 'payproxy' THEN 'credit' WHEN 'chime_credit_builder' THEN 'credit' WHEN 'chime_debit' THEN 'debit' WHEN 'cash_app_card' THEN 'debit' WHEN 'prepaid_card' THEN 'prepaid' END;
  IF v_kind IS NULL THEN RAISE EXCEPTION 'Pick a card to pay with.'; END IF;

  IF p_method = 'payproxy' THEN
    SELECT * INTO v_card FROM public.virtual_cards WHERE id = p_card_id AND user_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pick one of your Digna cards.'; END IF;
    SELECT balance_cents INTO v_balance FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF v_card.status = 'frozen' THEN v_result := 'declined'; v_code := 'frozen'; v_reason := 'This card is paused. Turn it back on to pay.';
    ELSIF v_card.status = 'closed' THEN v_result := 'declined'; v_code := 'closed'; v_reason := 'This card is closed, so it can''t be used again. Make a new one.';
    ELSIF v_card.end_date < CURRENT_DATE THEN v_result := 'declined'; v_code := 'expired'; v_reason := 'This card has passed the day you set for it to stop.';
    ELSIF v_card.spent_cents + p_amount_cents > v_card.spending_cap_cents THEN v_result := 'declined'; v_code := 'over_cap';
      v_reason := format('This is more than the card''s limit allows: $%s left of $%s.', to_char((v_card.spending_cap_cents - v_card.spent_cents) / 100.0, 'FM999999990.00'), to_char(v_card.spending_cap_cents / 100.0, 'FM999999990.00'));
    ELSIF COALESCE(v_balance, 0) < p_amount_cents THEN v_result := 'declined'; v_code := 'insufficient_balance'; v_reason := 'There isn''t enough money in your wallet for this. Add money first.';
    END IF;
  ELSE
    p_card_id := NULL;
  END IF;

  IF v_result = 'approved' AND NOT (v_merchant -> 'accepts') ? v_kind THEN
    v_result := 'declined'; v_code := 'other';
    v_reason := format('%s doesn''t take %s cards. %s', v_merchant ->> 'name', v_kind, v_merchant ->> 'rule');
  END IF;

  IF p_method = 'payproxy' THEN
    INSERT INTO public.transactions (user_id, card_id, merchant, amount_cents, result, decline_code, decline_reason)
    VALUES (v_uid, p_card_id, v_merchant ->> 'name', p_amount_cents, v_result, v_code, v_reason);
    IF v_result = 'approved' THEN
      UPDATE public.virtual_cards SET spent_cents = spent_cents + p_amount_cents WHERE id = p_card_id;
      UPDATE public.wallets SET balance_cents = balance_cents - p_amount_cents WHERE user_id = v_uid;
    END IF;
  END IF;
  INSERT INTO public.sandbox_payments (user_id, merchant_id, merchant, amount_cents, method, card_id, result, reason)
  VALUES (v_uid, p_merchant_id, v_merchant ->> 'name', p_amount_cents, p_method, p_card_id, v_result, v_reason);
  RETURN jsonb_build_object('result', v_result, 'reason', v_reason, 'code', v_code, 'merchant', v_merchant ->> 'name');
END;
$$;
REVOKE ALL ON FUNCTION public.sandbox_pay(TEXT, BIGINT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sandbox_pay(TEXT, BIGINT, TEXT, UUID) TO authenticated;

-- 7. Delete my account: the person's sign-in and, through the tables' ON DELETE CASCADE, everything of theirs.
CREATE OR REPLACE FUNCTION public.delete_my_account() RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  DELETE FROM public.profiles WHERE id = v_uid;
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- 8. Feedback from the people trying Digna, read by the owner in Supabase's Table Editor. Anyone may send some
--    (signed in or not), at most 10 a day per person; nobody can read anyone's through the app.
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT CHECK (email IS NULL OR char_length(email) <= 320),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  page TEXT CHECK (page IS NULL OR char_length(page) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.send_feedback(p_message TEXT, p_email TEXT DEFAULT NULL, p_page TEXT DEFAULT NULL) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_message TEXT := btrim(COALESCE(p_message, ''));
BEGIN
  IF char_length(v_message) < 1 OR char_length(v_message) > 2000 THEN RAISE EXCEPTION 'Write between 1 and 2,000 characters.'; END IF;
  IF v_uid IS NOT NULL AND (SELECT count(*) FROM public.feedback WHERE user_id = v_uid AND created_at > NOW() - INTERVAL '1 day') >= 10 THEN
    RAISE EXCEPTION 'Thanks! You''ve sent a lot today. Try again tomorrow.';
  END IF;
  IF v_uid IS NULL AND (SELECT count(*) FROM public.feedback WHERE user_id IS NULL AND created_at > NOW() - INTERVAL '1 hour') >= 30 THEN
    RAISE EXCEPTION 'Lots of feedback just now. Try again in a little while.';
  END IF;
  INSERT INTO public.feedback (user_id, email, message, page)
  VALUES (v_uid, NULLIF(left(btrim(COALESCE(p_email, auth.jwt() ->> 'email', '')), 320), ''), v_message, left(p_page, 40));
END;
$$;
REVOKE ALL ON FUNCTION public.send_feedback(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_feedback(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 9. Change a card's limit: down at any time (never below what it has already spent), and up only as far as the wallet
--    really covers. At most $10,000.
CREATE OR REPLACE FUNCTION public.set_card_limit(p_card_id UUID, p_cap_cents BIGINT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_card public.virtual_cards%ROWTYPE;
  v_balance BIGINT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  SELECT balance_cents INTO v_balance FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
  SELECT * INTO v_card FROM public.virtual_cards WHERE id = p_card_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pick one of your cards.'; END IF;
  IF v_card.status = 'closed' THEN RAISE EXCEPTION 'This card is closed. Make a new one instead.'; END IF;
  IF p_cap_cents IS NULL OR p_cap_cents > 1000000 THEN RAISE EXCEPTION 'A card''s limit can be at most $10,000.'; END IF;
  IF p_cap_cents < GREATEST(v_card.spent_cents, 1) THEN
    RAISE EXCEPTION 'The limit can''t be lower than what this card has already spent ($%).', to_char(v_card.spent_cents / 100.0, 'FM999999990.00');
  END IF;
  -- A limit can only go up when the money is really there: what's left on the card can't be more than the wallet holds.
  IF p_cap_cents > v_card.spending_cap_cents AND p_cap_cents - v_card.spent_cents > COALESCE(v_balance, 0) THEN
    RAISE EXCEPTION 'You have $% in your wallet, so this card''s limit can go up to $%. Add money first to raise it more.',
      to_char(COALESCE(v_balance, 0) / 100.0, 'FM999999990.00'),
      to_char(GREATEST(v_card.spending_cap_cents, v_card.spent_cents + COALESCE(v_balance, 0)) / 100.0, 'FM999999990.00');
  END IF;
  UPDATE public.virtual_cards SET spending_cap_cents = p_cap_cents WHERE id = p_card_id;
  RETURN jsonb_build_object('id', p_card_id, 'spending_cap_cents', p_cap_cents, 'spent_cents', v_card.spent_cents);
END;
$$;
REVOKE ALL ON FUNCTION public.set_card_limit(UUID, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_card_limit(UUID, BIGINT) TO authenticated;
