CREATE FUNCTION public.set_card_status(p_card_id UUID, p_new_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_owner UUID;
  v_old_status TEXT;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_new_status NOT IN ('active', 'frozen', 'closed') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  SELECT user_id, status INTO v_owner, v_old_status FROM public.virtual_cards WHERE id = p_card_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'card not found';
  END IF;
  IF v_owner != v_user_id THEN
    RAISE EXCEPTION 'not owner';
  END IF;
  IF v_old_status = 'closed' THEN
    RAISE EXCEPTION 'already closed';
  END IF;
  IF NOT ((v_old_status = 'active' AND p_new_status = 'frozen') OR (v_old_status = 'frozen' AND p_new_status = 'active') OR ((v_old_status = 'active' OR v_old_status = 'frozen') AND p_new_status = 'closed')) THEN
    RAISE EXCEPTION 'invalid status transition';
  END IF;
  UPDATE public.virtual_cards SET status = p_new_status WHERE id = p_card_id RETURNING JSONB_BUILD_OBJECT('id', id, 'name', name, 'status', status, 'spending_cap_cents', spending_cap_cents, 'spent_cents', spent_cents, 'end_date', end_date) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.set_card_status(UUID, TEXT) FROM PUBLIC, ANON;
GRANT EXECUTE ON FUNCTION public.set_card_status(UUID, TEXT) TO authenticated;
