-- Hardening Pack C: Ownership RLS + Invoice Status Model + FK Safety
-- Step 1: Add owner_id columns (nullable first for safety)
ALTER TABLE public.clients     ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.projects    ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.tasks       ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.invoices    ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.reminders   ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.message_log ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Step 2: Backfill existing rows to the latest user (only where null)
WITH me AS (SELECT id AS owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1)
UPDATE public.clients SET owner_id = me.owner_id FROM me WHERE clients.owner_id IS NULL;

WITH me AS (SELECT id AS owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1)
UPDATE public.projects SET owner_id = me.owner_id FROM me WHERE projects.owner_id IS NULL;

WITH me AS (SELECT id AS owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1)
UPDATE public.tasks SET owner_id = me.owner_id FROM me WHERE tasks.owner_id IS NULL;

WITH me AS (SELECT id AS owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1)
UPDATE public.invoices SET owner_id = me.owner_id FROM me WHERE invoices.owner_id IS NULL;

WITH me AS (SELECT id AS owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1)
UPDATE public.reminders SET owner_id = me.owner_id FROM me WHERE reminders.owner_id IS NULL;

WITH me AS (SELECT id AS owner_id FROM auth.users ORDER BY created_at DESC LIMIT 1)
UPDATE public.message_log SET owner_id = me.owner_id FROM me WHERE message_log.owner_id IS NULL;

-- Step 3: Enforce NOT NULL + DEFAULT for new rows
ALTER TABLE public.clients     ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.projects    ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.tasks       ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.invoices    ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.reminders   ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.message_log ALTER COLUMN owner_id SET NOT NULL;

ALTER TABLE public.clients     ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.projects    ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.tasks       ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.invoices    ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.reminders   ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.message_log ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- Step 4: Invoice status model (add paid_at column)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Step 5: Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access to message_log" ON public.message_log;

-- Step 6: Create owner-only RLS policies
-- Clients
CREATE POLICY c_read_own   ON public.clients   FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY c_insert_own ON public.clients   FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY c_update_own ON public.clients   FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY c_delete_own ON public.clients   FOR DELETE USING (owner_id = auth.uid());

-- Projects
CREATE POLICY p_read_own   ON public.projects  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY p_insert_own ON public.projects  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY p_update_own ON public.projects  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY p_delete_own ON public.projects  FOR DELETE USING (owner_id = auth.uid());

-- Tasks
CREATE POLICY t_read_own   ON public.tasks     FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY t_insert_own ON public.tasks     FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY t_update_own ON public.tasks     FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY t_delete_own ON public.tasks     FOR DELETE USING (owner_id = auth.uid());

-- Invoices
CREATE POLICY i_read_own   ON public.invoices  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY i_insert_own ON public.invoices  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY i_update_own ON public.invoices  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY i_delete_own ON public.invoices  FOR DELETE USING (owner_id = auth.uid());

-- Reminders
CREATE POLICY r_read_own   ON public.reminders FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY r_insert_own ON public.reminders FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY r_update_own ON public.reminders FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY r_delete_own ON public.reminders FOR DELETE USING (owner_id = auth.uid());

-- Message log
CREATE POLICY ml_read_own   ON public.message_log FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY ml_insert_own ON public.message_log FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY ml_update_own ON public.message_log FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ml_delete_own ON public.message_log FOR DELETE USING (owner_id = auth.uid());

-- Step 7: Enable RLS (COMMENTED OUT - run after QA with signed-in user)
-- ALTER TABLE public.clients     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.invoices    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reminders   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;