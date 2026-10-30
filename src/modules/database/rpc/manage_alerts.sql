CREATE OR REPLACE FUNCTION public.list_alerts() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT AUTHENTICATED' USING ERRCODE = '28000';
  END IF;
  SELECT COALESCE(JSONB_AGG(s.obj ORDER BY s.created DESC), '[]'::JSONB) INTO v_result
  FROM (
    SELECT JSONB_BUILD_OBJECT('id', a.id, 'card_id', a.card_id, 'kind', a.kind, 'message', a.message, 'is_read', a.is_read, 'created_at', a.created_at) AS obj, a.created_at AS created
    FROM public.alerts AS a
    WHERE a.user_id = v_uid AND a.is_dismissed = FALSE
    ORDER BY a.created_at DESC
    LIMIT 50
  ) AS s;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.list_alerts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_alerts() TO authenticated;
CREATE OR REPLACE FUNCTION public.acknowledge_alert(p_alert_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID;
  v_row public.alerts%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT AUTHENTICATED' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_row FROM public.alerts WHERE id = p_alert_id;
  IF NOT FOUND OR v_row.user_id != v_uid THEN
    RAISE EXCEPTION 'ALERT NOT FOUND' USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.alerts SET is_read = TRUE WHERE id = p_alert_id RETURNING * INTO v_row;
  RETURN TO_JSONB(v_row);
END;
$$;
REVOKE ALL ON FUNCTION public.acknowledge_alert(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_alert(UUID) TO authenticated;
CREATE OR REPLACE FUNCTION public.dismiss_alert(p_alert_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID;
  v_row public.alerts%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT AUTHENTICATED' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_row FROM public.alerts WHERE id = p_alert_id;
  IF NOT FOUND OR v_row.user_id != v_uid THEN
    RAISE EXCEPTION 'ALERT NOT FOUND' USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.alerts SET is_dismissed = TRUE WHERE id = p_alert_id RETURNING * INTO v_row;
  RETURN JSONB_BUILD_OBJECT('id', v_row.id, 'is_dismissed', v_row.is_dismissed);
END;
$$;
REVOKE ALL ON FUNCTION public.dismiss_alert(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dismiss_alert(UUID) TO authenticated;
