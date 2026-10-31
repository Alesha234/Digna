-- Digna 0018: a checkout that feels real. Every Digna card gets its own practice card number, expiry and security
-- code (shown only to its owner), and the sample businesses' checkout pages take a typed card: a Digna card, or one
-- of the practice wallet's sample everyday cards. Practice money only; none of these numbers work anywhere else.
-- Safe to run more than once.

ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS card_number TEXT;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS exp_month SMALLINT;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS exp_year SMALLINT;
ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS cvc TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS virtual_cards_card_number_key ON public.virtual_cards (card_number) WHERE card_number IS NOT NULL;

-- 1. A new practice card number: 16 digits starting 400000, with a correct check digit, never used before.
CREATE OR REPLACE FUNCTION public.digna_card_number() RETURNS TEXT LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE
  v_body TEXT;
  v_sum INT;
  v_d INT;
  v_i INT;
  v_try INT := 0;
BEGIN
  LOOP
    v_try := v_try + 1;
    v_body := '400000' || lpad((floor(random() * 1000000000))::BIGINT::TEXT, 9, '0');
    v_sum := 0;
    -- Luhn: from the right of the 15-digit body, double every first, third, fifth... digit.
    FOR v_i IN 0 .. 14 LOOP
      v_d := substr(v_body, 15 - v_i, 1)::INT;
      IF v_i % 2 = 0 THEN
        v_d := v_d * 2;
        IF v_d > 9 THEN v_d := v_d - 9; END IF;
      END IF;
      v_sum := v_sum + v_d;
    END LOOP;
    v_body := v_body || ((10 - v_sum % 10) % 10)::TEXT;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.virtual_cards WHERE card_number = v_body) OR v_try > 20;
  END LOOP;
  RETURN v_body;
END;
$$;
REVOKE ALL ON FUNCTION public.digna_card_number() FROM PUBLIC, anon, authenticated;

-- 2. Every new card gets its details as it's made; it expires the month its end date falls in.
CREATE OR REPLACE FUNCTION public.virtual_card_details() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.card_number IS NULL THEN NEW.card_number := public.digna_card_number(); END IF;
  NEW.last4 := right(NEW.card_number, 4);
  NEW.exp_month := extract(month FROM NEW.end_date)::SMALLINT;
  NEW.exp_year := (extract(year FROM NEW.end_date)::INT % 100)::SMALLINT;
  IF NEW.cvc IS NULL THEN NEW.cvc := lpad((floor(random() * 1000))::INT::TEXT, 3, '0'); END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_virtual_card_details ON public.virtual_cards;
CREATE TRIGGER trg_virtual_card_details BEFORE INSERT ON public.virtual_cards FOR EACH ROW EXECUTE FUNCTION public.virtual_card_details();

-- Cards made before this file get details too (cards already past their end date can't be used, so they're left).
UPDATE public.virtual_cards SET
  card_number = public.digna_card_number(),
  cvc = lpad((floor(random() * 1000))::INT::TEXT, 3, '0'),
  exp_month = extract(month FROM end_date)::SMALLINT,
  exp_year = (extract(year FROM end_date)::INT % 100)::SMALLINT
WHERE card_number IS NULL AND end_date > CURRENT_DATE;
UPDATE public.virtual_cards SET last4 = right(card_number, 4) WHERE card_number IS NOT NULL AND last4 <> right(card_number, 4) AND end_date > CURRENT_DATE;

-- 3. The practice wallet: sample everyday cards anyone can type in at a sample checkout. These are payment
--    companies' published test numbers, so they can never charge a real account.
CREATE OR REPLACE FUNCTION public.practice_wallet() RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT '[
    {"method": "chime_debit", "label": "Chime debit card (sample)", "kind": "debit", "number": "4000056655665556", "exp": "12/29", "cvc": "123"},
    {"method": "cash_app_card", "label": "Cash App Card (sample)", "kind": "debit", "number": "5200828282828210", "exp": "08/29", "cvc": "456"},
    {"method": "prepaid_card", "label": "Prepaid card (sample)", "kind": "prepaid", "number": "5105105105105100", "exp": "04/28", "cvc": "789"},
    {"method": "chime_credit_builder", "label": "Chime Credit Builder (sample)", "kind": "credit", "number": "4242424242424242", "exp": "10/30", "cvc": "321"}
  ]'::JSONB
$$;
GRANT EXECUTE ON FUNCTION public.practice_wallet() TO anon, authenticated;

-- 4. Pay at a sample business's checkout with a typed card. The card is matched to the person's own Digna cards or
--    the practice wallet; a wrong expiry or security code is declined like a real checkout would; then the same
--    rules as sandbox_pay decide (the place's card types, the card's limit, the wallet).
CREATE OR REPLACE FUNCTION public.checkout_pay(p_merchant_id TEXT, p_amount_cents BIGINT, p_number TEXT, p_exp TEXT, p_cvc TEXT, p_name TEXT, p_zip TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_digits TEXT := regexp_replace(COALESCE(p_number, ''), '\D', '', 'g');
  v_exp TEXT := regexp_replace(COALESCE(p_exp, ''), '\s', '', 'g');
  v_cvc TEXT := regexp_replace(COALESCE(p_cvc, ''), '\D', '', 'g');
  v_merchant JSONB;
  v_card public.virtual_cards%ROWTYPE;
  v_sample JSONB;
  v_method TEXT;
  v_out JSONB;
  v_bad TEXT := 'The expiry date or security code doesn''t match this card. Check them and try again.';
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_amount_cents > 500000 THEN RAISE EXCEPTION 'Pay between $0.01 and $5,000.'; END IF;
  SELECT m INTO v_merchant FROM jsonb_array_elements(public.sandbox_merchants()) AS m WHERE m ->> 'id' = p_merchant_id;
  IF v_merchant IS NULL THEN RAISE EXCEPTION 'Pick one of the places to pay.'; END IF;
  IF char_length(trim(COALESCE(p_name, ''))) < 2 THEN RAISE EXCEPTION 'Enter the name on the card.'; END IF;
  IF char_length(v_digits) NOT BETWEEN 13 AND 19 THEN RAISE EXCEPTION 'That card number looks incomplete. Check it and try again.'; END IF;
  IF v_exp !~ '^(0[1-9]|1[0-2])/[0-9]{2}$' THEN RAISE EXCEPTION 'Enter the expiry date as MM/YY.'; END IF;
  IF v_cvc !~ '^[0-9]{3,4}$' THEN RAISE EXCEPTION 'Enter the 3-digit security code from the card.'; END IF;
  IF COALESCE(p_zip, '') !~ '^[0-9]{5}$' THEN RAISE EXCEPTION 'Enter a 5-digit ZIP code.'; END IF;

  SELECT * INTO v_card FROM public.virtual_cards WHERE user_id = v_uid AND card_number = v_digits;
  IF FOUND THEN
    IF v_exp <> lpad(v_card.exp_month::TEXT, 2, '0') || '/' || lpad(v_card.exp_year::TEXT, 2, '0') OR v_cvc <> v_card.cvc THEN
      INSERT INTO public.transactions (user_id, card_id, merchant, amount_cents, result, decline_code, decline_reason)
      VALUES (v_uid, v_card.id, v_merchant ->> 'name', p_amount_cents, 'declined', 'other', v_bad);
      INSERT INTO public.sandbox_payments (user_id, merchant_id, merchant, amount_cents, method, card_id, result, reason)
      VALUES (v_uid, p_merchant_id, v_merchant ->> 'name', p_amount_cents, 'payproxy', v_card.id, 'declined', v_bad);
      v_out := jsonb_build_object('result', 'declined', 'reason', v_bad, 'code', 'card_details', 'merchant', v_merchant ->> 'name');
    ELSE
      v_out := public.sandbox_pay(p_merchant_id, p_amount_cents, 'payproxy', v_card.id);
    END IF;
    RETURN v_out || jsonb_build_object('method', 'payproxy', 'card_id', v_card.id, 'card_name', v_card.name, 'last4', v_card.last4);
  END IF;

  SELECT s INTO v_sample FROM jsonb_array_elements(public.practice_wallet()) AS s WHERE s ->> 'number' = v_digits;
  IF v_sample IS NULL THEN
    RAISE EXCEPTION 'This card number isn''t one of your Digna cards or a practice wallet card. Copy one from your wallet and try again.';
  END IF;
  v_method := v_sample ->> 'method';
  IF v_exp <> v_sample ->> 'exp' OR v_cvc <> v_sample ->> 'cvc' THEN
    INSERT INTO public.sandbox_payments (user_id, merchant_id, merchant, amount_cents, method, card_id, result, reason)
    VALUES (v_uid, p_merchant_id, v_merchant ->> 'name', p_amount_cents, v_method, NULL, 'declined', v_bad);
    v_out := jsonb_build_object('result', 'declined', 'reason', v_bad, 'code', 'card_details', 'merchant', v_merchant ->> 'name');
  ELSE
    v_out := public.sandbox_pay(p_merchant_id, p_amount_cents, v_method, NULL);
  END IF;
  RETURN v_out || jsonb_build_object('method', v_method, 'card_id', NULL, 'card_name', v_sample ->> 'label', 'last4', right(v_digits, 4));
END;
$$;
REVOKE ALL ON FUNCTION public.checkout_pay(TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_pay(TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
