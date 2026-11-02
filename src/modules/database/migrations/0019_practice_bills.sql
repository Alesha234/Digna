-- Digna 0019: your practice bills (Nov 2, 2026). A bill or invoice you upload (a screenshot, a photo, a PDF or a Word
-- file) is read by Meta's Muse Spark and kept here, in your own list, until you pay it. You can make a card just for
-- it, then pay it at its own practice checkout with any card in your wallet. Money stays the server's job: a bill is
-- marked paid only by pay_bill, after the same checks as every other checkout. Practice money only. Safe to run more
-- than once.

CREATE TABLE IF NOT EXISTS public.practice_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business TEXT NOT NULL CHECK (char_length(business) BETWEEN 1 AND 80),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 500000),
  due_date DATE,
  file_name TEXT CHECK (file_name IS NULL OR char_length(file_name) <= 160),
  -- Where the uploaded file itself is kept: your own folder in the private bill-photos bucket (0011).
  file_path TEXT CHECK (file_path IS NULL OR char_length(file_path) <= 400),
  file_kind TEXT NOT NULL DEFAULT 'photo' CHECK (file_kind IN ('photo', 'pdf', 'word', 'text')),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  card_id UUID REFERENCES public.virtual_cards(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.practice_bills ADD COLUMN IF NOT EXISTS file_path TEXT CHECK (file_path IS NULL OR char_length(file_path) <= 400);
ALTER TABLE public.practice_bills ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS practice_bills_user_idx ON public.practice_bills (user_id, created_at DESC);
-- People see, add and remove their own bills. A new bill is always unpaid; only pay_bill can mark one paid.
DROP POLICY IF EXISTS practice_bills_select_owner ON public.practice_bills;
CREATE POLICY practice_bills_select_owner ON public.practice_bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS practice_bills_insert_owner ON public.practice_bills;
CREATE POLICY practice_bills_insert_owner ON public.practice_bills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'unpaid' AND paid_at IS NULL AND card_id IS NULL);
DROP POLICY IF EXISTS practice_bills_delete_owner ON public.practice_bills;
CREATE POLICY practice_bills_delete_owner ON public.practice_bills FOR DELETE TO authenticated USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.practice_bills TO authenticated;
REVOKE UPDATE ON public.practice_bills FROM anon, authenticated;

-- The place you pay an uploaded bill: any card works, like most billers. Its name on your history is the bill's own.
CREATE OR REPLACE FUNCTION public.sandbox_merchants() RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT '[
    {"id": "nimbus_cloud", "name": "Nimbus Cloud", "kind": "Cloud service bill", "accepts": ["credit"], "rule": "Credit cards only. Cloud services bill you after you use them, so they want a card that can''t come up empty."},
    {"id": "harborview_hotel", "name": "Harborview Hotel", "kind": "Hotel check-in hold", "accepts": ["credit", "debit"], "rule": "Credit or debit, no prepaid. The hotel puts a hold on money at check-in for damage or extras, and a prepaid card can''t guarantee it."},
    {"id": "roadready_rentals", "name": "RoadReady Car Rental", "kind": "Car rental deposit", "accepts": ["credit"], "rule": "Credit cards only. The rental counter holds a security deposit, and most rental companies only trust a credit card for it."},
    {"id": "streambox", "name": "StreamBox", "kind": "Streaming subscription", "accepts": ["credit", "debit", "prepaid"], "rule": "Any card works here."},
    {"id": "your_bill", "name": "Your bill", "kind": "A bill you added", "accepts": ["credit", "debit", "prepaid"], "rule": "Any card works for a bill you added."}
  ]'::JSONB
$$;
GRANT EXECUTE ON FUNCTION public.sandbox_merchants() TO anon, authenticated;

-- Link a card you made for a bill to it, so the bill shows which card is for it. Both must be yours.
CREATE OR REPLACE FUNCTION public.bill_use_card(p_bill_id UUID, p_card_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.virtual_cards WHERE id = p_card_id AND user_id = v_uid) THEN RAISE EXCEPTION 'Pick one of your Digna cards.'; END IF;
  UPDATE public.practice_bills SET card_id = p_card_id WHERE id = p_bill_id AND user_id = v_uid AND status = 'unpaid';
  IF NOT FOUND THEN RAISE EXCEPTION 'That bill isn''t yours, or it''s already paid.'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.bill_use_card(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bill_use_card(UUID, UUID) TO authenticated;

-- Pay one of your bills with a typed card, through the same checkout as every sample business (its card, expiry,
-- code, limit and wallet checks). The payment is recorded under the bill's own business name; approved, the bill is
-- marked paid. A bill can be paid once.
CREATE OR REPLACE FUNCTION public.pay_bill(p_bill_id UUID, p_number TEXT, p_exp TEXT, p_cvc TEXT, p_name TEXT, p_zip TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_bill public.practice_bills%ROWTYPE;
  v_out JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  SELECT * INTO v_bill FROM public.practice_bills WHERE id = p_bill_id AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pick one of your bills.'; END IF;
  IF v_bill.status = 'paid' THEN RAISE EXCEPTION 'This bill is already paid.'; END IF;
  v_out := public.checkout_pay('your_bill', v_bill.amount_cents, p_number, p_exp, p_cvc, p_name, p_zip);
  -- What this call just recorded (NOW() is the same for the whole call) takes the bill's own name.
  UPDATE public.transactions SET merchant = v_bill.business WHERE user_id = v_uid AND merchant = 'Your bill' AND created_at = NOW();
  UPDATE public.sandbox_payments SET merchant = v_bill.business WHERE user_id = v_uid AND merchant_id = 'your_bill' AND created_at = NOW();
  IF v_out ->> 'result' = 'approved' THEN
    UPDATE public.practice_bills SET status = 'paid', paid_at = NOW(), card_id = COALESCE((v_out ->> 'card_id')::UUID, card_id) WHERE id = v_bill.id;
  END IF;
  RETURN v_out || jsonb_build_object('merchant', v_bill.business, 'bill_id', v_bill.id);
END;
$$;
REVOKE ALL ON FUNCTION public.pay_bill(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_bill(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
