-- Schema Migration for HustleHub MVP Multi-User Support
-- Add owner_id columns to all tables for user-specific data access
-- Add logo_url and share_url columns for new features

-- Add owner_id columns (nullable for now to prevent breaking existing data)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE message_log ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Add new feature columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS share_url text;

-- Create unique index on settings per user (each user gets one settings row)
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_owner_id ON settings(owner_id);

-- Create performance indexes for user-specific queries
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_id ON invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_owner_id ON invoice_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_reminders_owner_id ON reminders(owner_id);
CREATE INDEX IF NOT EXISTS idx_message_log_owner_id ON message_log(owner_id);

-- Storage buckets for file uploads (create manually if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true) ON CONFLICT DO NOTHING;

-- Prepare RLS policies (commented out - will enable after data migration)
-- Enable RLS on all tables
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;

-- User-specific RLS policies (commented out - will enable after owner_id population)
-- Settings policies
-- CREATE POLICY "Users can view their own settings" ON settings FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own settings" ON settings FOR UPDATE USING (auth.uid() = owner_id);

-- Clients policies
-- CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = owner_id);

-- Projects policies
-- CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Invoices policies
-- CREATE POLICY "Users can view their own invoices" ON invoices FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own invoices" ON invoices FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own invoices" ON invoices FOR DELETE USING (auth.uid() = owner_id);

-- Invoice items policies
-- CREATE POLICY "Users can view their own invoice items" ON invoice_items FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own invoice items" ON invoice_items FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own invoice items" ON invoice_items FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own invoice items" ON invoice_items FOR DELETE USING (auth.uid() = owner_id);

-- Tasks policies
-- CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = owner_id);

-- Reminders policies
-- CREATE POLICY "Users can view their own reminders" ON reminders FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own reminders" ON reminders FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own reminders" ON reminders FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own reminders" ON reminders FOR DELETE USING (auth.uid() = owner_id);

-- Message log policies
-- CREATE POLICY "Users can view their own message log" ON message_log FOR SELECT USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can create their own message log" ON message_log FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- CREATE POLICY "Users can update their own message log" ON message_log FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own message log" ON message_log FOR DELETE USING (auth.uid() = owner_id);