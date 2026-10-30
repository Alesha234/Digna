CREATE TABLE public.virtual_cards (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 60), last4 CHAR(4) NOT NULL CHECK (last4 ~ '^[0-9]{4}$'), spending_cap_cents BIGINT NOT NULL CHECK (spending_cap_cents > 0 AND spending_cap_cents <= 100000000), spent_cents BIGINT NOT NULL DEFAULT 0 CHECK (spent_cents >= 0 AND spent_cents <= 100000000), end_date DATE NOT NULL CHECK (end_date > CURRENT_DATE), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','closed')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
CREATE INDEX virtual_cards_user_id_idx ON public.virtual_cards (user_id);
CREATE INDEX virtual_cards_status_idx ON public.virtual_cards (status);
CREATE INDEX virtual_cards_end_date_idx ON public.virtual_cards (end_date);
CREATE TRIGGER virtual_cards_updated_at BEFORE UPDATE ON public.virtual_cards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE POLICY virtual_cards_select_owner ON public.virtual_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY virtual_cards_insert_owner ON public.virtual_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY virtual_cards_update_owner ON public.virtual_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY virtual_cards_delete_owner ON public.virtual_cards FOR DELETE TO authenticated USING (auth.uid() = user_id);
