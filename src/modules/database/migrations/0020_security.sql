-- Digna 0020: tightening before the hackathon (Nov 2, 2026). Every change only takes rights away; nothing the app
-- uses changes. Safe to run more than once.

-- 1. A payment record is written only by the checkout functions (checkout_pay, pay_bill, sandbox_pay), after their
--    checks. record_transaction let a signed-in person write their own "approved" payment directly, skipping the
--    limit and wallet checks; the app never calls it.
DO $$ BEGIN
  IF to_regprocedure('public.record_transaction(uuid,text,bigint,text,text,text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.record_transaction(UUID, TEXT, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 2. Older helpers from Digna's first drafts, if any are still in the database: nobody calls them any more.
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.simulate_transaction(uuid,text,bigint)', 'public.seed_demo_data()', 'public.create_card_from_bill_scan(uuid,text)', 'public.add_money(bigint)'] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', to_regprocedure(f));
    END IF;
  END LOOP;
END $$;

-- 3. Functions that only run as triggers are never called by people directly.
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.check_card_cap_alert()', 'public.check_low_balance_alert()', 'public.credit_wallet_on_deposit()', 'public.debit_wallet_on_approval()', 'public.handle_new_user()', 'public.virtual_card_details()'] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', to_regprocedure(f));
    END IF;
  END LOOP;
END $$;

-- 4. Marking an alert read needs an account.
DO $$ BEGIN
  IF to_regprocedure('public.mark_alert_read(uuid)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.mark_alert_read(UUID) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.mark_alert_read(UUID) TO authenticated;
  END IF;
END $$;

-- 5. No emptying whole tables, and the read-only views stay read-only.
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
DO $$
DECLARE v TEXT;
BEGIN
  FOREACH v IN ARRAY ARRAY['v_wallet_balance', 'v_card_progress', 'v_recent_activity', 'v_unread_warnings'] LOOP
    IF to_regclass('public.' || v) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', v);
    END IF;
  END LOOP;
END $$;

-- 6. The private bill folder takes only bills: pictures, PDFs and Word files, up to 10 MB each.
DO $$ BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    UPDATE storage.buckets SET public = false, file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    WHERE id = 'bill-photos';
  END IF;
END $$;
