-- Phase 1: Enable Row Level Security (RLS) on all tables for demo app
-- Since this is a demo app, we'll allow public access to all tables for now

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo app (allow all operations)
-- In production, these would be more restrictive based on user authentication

-- Settings policies (public read)
CREATE POLICY "Allow read access to settings" ON public.settings
FOR SELECT USING (true);

CREATE POLICY "Allow insert access to settings" ON public.settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to settings" ON public.settings
FOR UPDATE USING (true);

-- Clients policies (full access)
CREATE POLICY "Allow all access to clients" ON public.clients
FOR ALL USING (true);

-- Projects policies (full access)
CREATE POLICY "Allow all access to projects" ON public.projects
FOR ALL USING (true);

-- Invoices policies (full access)
CREATE POLICY "Allow all access to invoices" ON public.invoices
FOR ALL USING (true);

-- Invoice items policies (full access)
CREATE POLICY "Allow all access to invoice_items" ON public.invoice_items
FOR ALL USING (true);

-- Tasks policies (full access)
CREATE POLICY "Allow all access to tasks" ON public.tasks
FOR ALL USING (true);

-- Reminders policies (full access)
CREATE POLICY "Allow all access to reminders" ON public.reminders
FOR ALL USING (true);

-- Message log policies (full access)
CREATE POLICY "Allow all access to message_log" ON public.message_log
FOR ALL USING (true);