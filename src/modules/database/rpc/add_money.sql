CREATE OR REPLACE FUNCTION public.add_money(p_amount_cents BIGINT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_deposit_id UUID;
  v_new_balance BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_amount_cents > 500000 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;
  INSERT INTO public.wallets (user_id, balance_cents) VALUES (v_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance_cents INTO v_new_balance FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  INSERT INTO public.deposits (user_id, amount_cents, status) VALUES (v_user_id, p_amount_cents, 'completed') RETURNING id INTO v_deposit_id;
  SELECT balance_cents INTO v_new_balance FROM public.wallets WHERE user_id = v_user_id;
  RETURN jsonb_build_object('deposit_id', v_deposit_id, 'amount_cents', p_amount_cents, 'balance_cents', v_new_balance);
END;
$$;
REVOKE ALL ON FUNCTION public.add_money(BIGINT) FROM PUBLIC, ANON;
GRANT EXECUTE ON FUNCTION public.add_money(BIGINT) TO authenticated;
