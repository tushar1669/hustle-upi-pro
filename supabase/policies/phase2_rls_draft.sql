-- Phase 2 RLS Draft Policies (DO NOT EXECUTE YET)
-- These policies will be applied when authentication is implemented

-- Enable RLS on all tables
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;

-- Settings policies (user-specific settings)
-- CREATE POLICY "owner_can_all_settings" ON settings
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Clients policies
-- CREATE POLICY "owner_can_all_clients" ON clients
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Projects policies
-- CREATE POLICY "owner_can_all_projects" ON projects
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Invoices policies
-- CREATE POLICY "owner_can_all_invoices" ON invoices
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Invoice items policies
-- CREATE POLICY "owner_can_all_invoice_items" ON invoice_items
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Tasks policies
-- CREATE POLICY "owner_can_all_tasks" ON tasks
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Reminders policies
-- CREATE POLICY "owner_can_all_reminders" ON reminders
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Message log policies
-- CREATE POLICY "owner_can_all_message_log" ON message_log
--   FOR ALL USING (auth.uid() = owner_id)
--   WITH CHECK (auth.uid() = owner_id);

-- Demo/Public Data Policy (Optional)
-- If keeping a public demo dataset, create policies like:
-- CREATE POLICY "allow_demo_data" ON clients
--   FOR SELECT USING (owner_id IS NULL OR owner_id = 'demo-user-uuid');

-- Notes for implementation:
-- 1. Ensure all tables have owner_id columns
-- 2. Update insert operations to set owner_id = auth.uid()
-- 3. Test policies thoroughly before applying to production
-- 4. Consider migration strategy for existing data