CREATE OR REPLACE FUNCTION public.create_card_from_bill_scan(p_scan_id UUID, p_card_name TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_scan public.bill_scans%ROWTYPE;
  v_name TEXT;
  v_card_id UUID;
  v_cap INT;
  v_end DATE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_scan_id IS NULL THEN
    RAISE EXCEPTION 'scan id required';
  END IF;
  SELECT * INTO v_scan FROM public.bill_scans WHERE id = p_scan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'scan not found';
  END IF;
  IF v_scan.user_id != v_uid THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF v_scan.status != 'completed' THEN
    RAISE EXCEPTION 'scan not completed';
  END IF;
  IF v_scan.converted_card_id IS NOT NULL THEN
    RAISE EXCEPTION 'scan already used';
  END IF;
  IF v_scan.extracted_amount_cents IS NULL OR v_scan.extracted_amount_cents <= 0 OR v_scan.extracted_amount_cents > 1000000 THEN
    RAISE EXCEPTION 'invalid extracted amount';
  END IF;
  IF v_scan.extracted_due_date IS NULL OR v_scan.extracted_due_date <= CURRENT_DATE OR v_scan.extracted_due_date > (CURRENT_DATE + 730) THEN
    RAISE EXCEPTION 'invalid extracted due date';
  END IF;
  v_name := NULLIF(TRIM(COALESCE(p_card_name, '')), '');
  IF v_name IS NULL THEN
    v_name := NULLIF(TRIM(COALESCE(v_scan.extracted_merchant, '')), '');
  END IF;
  IF v_name IS NULL THEN
    v_name := 'Bill card';
  END IF;
  IF CHAR_LENGTH(v_name) < 1 OR CHAR_LENGTH(v_name) > 60 THEN
    RAISE EXCEPTION 'invalid card name';
  END IF;
  v_cap := v_scan.extracted_amount_cents;
  v_end := v_scan.extracted_due_date;
  INSERT INTO public.virtual_cards (user_id, name, spending_cap_cents, spent_cents, status, end_date, last4)
  VALUES (v_uid, v_name, v_cap, 0, 'active', v_end, LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'))
  RETURNING id INTO v_card_id;
  UPDATE public.bill_scans SET converted_card_id = v_card_id WHERE id = p_scan_id;
  RETURN JSONB_BUILD_OBJECT('id', v_card_id, 'name', v_name, 'spending_cap_cents', v_cap, 'end_date', v_end, 'status', 'active');
END;
$$;
REVOKE ALL ON FUNCTION public.create_card_from_bill_scan(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_card_from_bill_scan(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_card_from_bill_scan(UUID, TEXT) TO authenticated;
