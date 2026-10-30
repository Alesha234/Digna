CREATE TABLE public.wallets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE, balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0 AND balance_cents <= 100000000), currency CHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets (user_id);
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY wallets_select_owner ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY wallets_insert_owner ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wallets_update_owner ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY wallets_delete_owner ON public.wallets FOR DELETE TO authenticated USING (auth.uid() = user_id);
