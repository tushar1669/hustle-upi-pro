-- PR-2: Server-side invoice creation with atomic numbering
-- Unique per-owner invoice number constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uq_invoices_owner_invoice_number'
  ) THEN
    CREATE UNIQUE INDEX uq_invoices_owner_invoice_number ON public.invoices (owner_id, invoice_number);
  END IF;
END $$;

-- PR-3: Migrate paid_date to paid_at and drop legacy column
-- Drop and recreate view to use paid_at instead of paid_date
DROP VIEW IF EXISTS public.v_dashboard_metrics;

-- Migrate any legacy values forward
UPDATE public.invoices
   SET paid_at = COALESCE(paid_at, (paid_date)::timestamp AT TIME ZONE 'UTC')
 WHERE paid_date IS NOT NULL AND paid_at IS NULL;

-- Now safe to drop the legacy column
ALTER TABLE public.invoices DROP COLUMN IF EXISTS paid_date;

-- Recreate view with paid_at
CREATE VIEW public.v_dashboard_metrics AS
SELECT
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'sent' AND i.due_date < CURRENT_DATE), 0) AS overdue_amount,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'paid' AND DATE_TRUNC('month', i.paid_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS this_month_paid,
  COUNT(t.id) FILTER (WHERE t.status = 'open' AND t.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')) AS tasks_due_7d
FROM public.invoices i
FULL OUTER JOIN public.tasks t ON FALSE;

-- PR-4: Explicit foreign keys with proper delete behavior
DO $$
BEGIN
  -- invoice_items → invoices (CASCADE)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type='FOREIGN KEY' AND table_name='invoice_items' AND constraint_name='fk_invoice_items_invoice'
  ) THEN
    ALTER TABLE public.invoice_items
      ADD CONSTRAINT fk_invoice_items_invoice
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
  END IF;

  -- reminders → invoices (CASCADE)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type='FOREIGN KEY' AND table_name='reminders' AND constraint_name='fk_reminders_invoice'
  ) THEN
    ALTER TABLE public.reminders
      ADD CONSTRAINT fk_reminders_invoice
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
  END IF;

  -- tasks → projects (RESTRICT)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type='FOREIGN KEY' AND table_name='tasks' AND constraint_name='fk_tasks_project'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT fk_tasks_project
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;
  END IF;

  -- projects → clients (RESTRICT)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type='FOREIGN KEY' AND table_name='projects' AND constraint_name='fk_projects_client'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT fk_projects_client
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;
  END IF;

  -- savings_entries → savings_goals (CASCADE)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type='FOREIGN KEY' AND table_name='savings_entries' AND constraint_name='fk_savings_entries_goal'
  ) THEN
    ALTER TABLE public.savings_entries
      ADD CONSTRAINT fk_savings_entries_goal
      FOREIGN KEY (goal_id) REFERENCES public.savings_goals(id) ON DELETE CASCADE;
  END IF;
END $$;