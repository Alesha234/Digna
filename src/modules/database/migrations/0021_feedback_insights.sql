-- Digna 0021: feedback insights (Nov 4, 2026). A private Feedback dashboard for the owner, and public survey totals
-- (counts only, never notes or emails) for the README's live chart. Safe to run more than once.
--
-- After running this file, make yourself the owner (type your own email between the quotes):
--   INSERT INTO public.app_owners (user_id) SELECT id FROM auth.users WHERE email = 'you@example.com' ON CONFLICT DO NOTHING;

-- 1. Who may open the Feedback dashboard. Nobody can read or change this list through the app; the owner adds
--    themselves once in the SQL Editor (above).
CREATE TABLE IF NOT EXISTS public.app_owners (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.app_owners ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_owners FROM anon, authenticated;

-- 2. Is the signed-in person the owner? (Shows the dashboard link in Settings.)
CREATE OR REPLACE FUNCTION public.am_i_owner() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_owners WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.am_i_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.am_i_owner() TO authenticated;

-- 3. Every feedback message and survey answer, newest first: the owner only.
CREATE OR REPLACE FUNCTION public.owner_feedback(p_limit INT DEFAULT 500)
RETURNS TABLE (id UUID, created_at TIMESTAMPTZ, page TEXT, message TEXT, email TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_owners o WHERE o.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the Digna owner can see feedback.';
  END IF;
  RETURN QUERY
    SELECT f.id, f.created_at, f.page, f.message, f.email
    FROM public.feedback f
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 500), 1), 2000);
END;
$$;
REVOKE ALL ON FUNCTION public.owner_feedback(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_feedback(INT) TO authenticated;

-- 4. Survey totals for everyone: how many people picked each answer. Only counts leave the database. The questions
--    and answers here must match src/modules/ui/components/QuickSurvey.tsx word for word, because each survey answer
--    is saved as a line "<question> <answer>".
CREATE OR REPLACE FUNCTION public.survey_summary() RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH q(survey, ord, question, options) AS (
    VALUES
      ('home', 1, 'Has a card ever been declined when you had the money?', ARRAY['Yes', 'No']),
      ('home', 2, 'Where does it happen most?', ARRAY['Hotels', 'Car rentals', 'Online services', 'Somewhere else']),
      ('home', 3, 'How easy is Digna to understand?', ARRAY['Very easy', 'Easy', 'Okay', 'Confusing']),
      ('home', 4, 'Would you use a Bill Card for real?', ARRAY['Yes', 'Maybe', 'No']),
      ('after-pay', 1, 'How easy was that?', ARRAY['Very easy', 'Easy', 'Okay', 'Hard']),
      ('after-pay', 2, 'Did Digna make it clear why your card was approved or declined?', ARRAY['Yes, clearly', 'Sort of', 'No']),
      ('after-pay', 3, 'How did it feel to use?', ARRAY['Calm and in control', 'Fine', 'Stressful']),
      ('after-pay', 4, 'Would you use a Bill Card for real?', ARRAY['Yes', 'Maybe', 'No'])
  ),
  lines AS (
    SELECT substr(f.page, 8) AS survey, btrim(l) AS line
    FROM public.feedback f, LATERAL regexp_split_to_table(f.message, E'\n') AS l
    WHERE f.page IN ('survey-home', 'survey-after-pay')
  ),
  answers AS (
    SELECT q.survey, q.question, substr(lines.line, char_length(q.question) + 2) AS answer
    FROM q JOIN lines ON lines.survey = q.survey AND left(lines.line, char_length(q.question) + 1) = q.question || ' '
  ),
  counts AS (
    SELECT q.survey, q.ord, q.question, o.opt, o.opt_ord,
           (SELECT count(*) FROM answers a WHERE a.survey = q.survey AND a.question = q.question AND a.answer = o.opt) AS n
    FROM q, LATERAL unnest(q.options) WITH ORDINALITY AS o(opt, opt_ord)
  ),
  grouped AS (
    SELECT survey, ord, question, jsonb_agg(jsonb_build_object('option', opt, 'count', n) ORDER BY opt_ord) AS answers
    FROM counts GROUP BY survey, ord, question
  )
  SELECT jsonb_build_object(
    'updated_at', NOW(),
    'responses', jsonb_build_object(
      'home', (SELECT count(*) FROM public.feedback WHERE page = 'survey-home'),
      'after-pay', (SELECT count(*) FROM public.feedback WHERE page = 'survey-after-pay')
    ),
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('survey', survey, 'question', question, 'answers', answers) ORDER BY survey DESC, ord) FROM grouped), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.survey_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.survey_summary() TO anon, authenticated;
