-- PR-1: Enable RLS on savings tables (policies already exist)
ALTER TABLE public.savings_goals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_entries ENABLE ROW LEVEL SECURITY;

-- Safety: confirm owner-only policies exist (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='savings_goals' AND policyname='sg_read_own'
  ) THEN
    CREATE POLICY sg_read_own   ON public.savings_goals   FOR SELECT USING (owner_id = auth.uid());
    CREATE POLICY sg_insert_own ON public.savings_goals   FOR INSERT WITH CHECK (owner_id = auth.uid());
    CREATE POLICY sg_update_own ON public.savings_goals   FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
    CREATE POLICY sg_delete_own ON public.savings_goals   FOR DELETE USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='savings_entries' AND policyname='se_read_own'
  ) THEN
    CREATE POLICY se_read_own   ON public.savings_entries FOR SELECT USING (owner_id = auth.uid());
    CREATE POLICY se_insert_own ON public.savings_entries FOR INSERT WITH CHECK (owner_id = auth.uid());
    CREATE POLICY se_update_own ON public.savings_entries FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
    CREATE POLICY se_delete_own ON public.savings_entries FOR DELETE USING (owner_id = auth.uid());
  END IF;
END $$;