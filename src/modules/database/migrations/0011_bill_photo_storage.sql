DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    EXECUTE 'INSERT INTO storage.buckets (id, name, public) VALUES (''bill-photos'',''bill-photos'', false) ON CONFLICT (id) DO NOTHING;';
    EXECUTE 'UPDATE storage.buckets SET public = false WHERE id = ''bill-photos'';';
  END IF;
END
$$;
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "bill_photos_select" ON storage.objects;';
    EXECUTE 'CREATE POLICY "bill_photos_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''bill-photos'' AND auth.uid()::text = (storage.foldername(name))[1]);';
  END IF;
END
$$;
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "bill_photos_insert" ON storage.objects;';
    EXECUTE 'CREATE POLICY "bill_photos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''bill-photos'' AND auth.uid()::text = (storage.foldername(name))[1]);';
  END IF;
END
$$;
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "bill_photos_update" ON storage.objects;';
    EXECUTE 'CREATE POLICY "bill_photos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''bill-photos'' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = ''bill-photos'' AND auth.uid()::text = (storage.foldername(name))[1]);';
  END IF;
END
$$;
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "bill_photos_delete" ON storage.objects;';
    EXECUTE 'CREATE POLICY "bill_photos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''bill-photos'' AND auth.uid()::text = (storage.foldername(name))[1]);';
  END IF;
END
$$;
