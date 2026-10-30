CREATE TABLE public.user_settings (user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, email_notifications BOOLEAN NOT NULL DEFAULT TRUE, low_balance_threshold_cents BIGINT NOT NULL DEFAULT 1000 CHECK (low_balance_threshold_cents >= 0 AND low_balance_threshold_cents <= 100000000), near_cap_percent INTEGER NOT NULL DEFAULT 80 CHECK (near_cap_percent >= 1 AND near_cap_percent <= 100), currency CHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'), test_mode BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_select_owner ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY user_settings_insert_owner ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_settings_update_owner ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_settings_delete_owner ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
