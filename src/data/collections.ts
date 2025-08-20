import { supabase } from "@/integrations/supabase/client";

// Tables: settings, clients, projects, invoices, invoice_items, tasks, reminders, message_log
// View: v_dashboard_metrics

// ============ Settings ============
export interface SettingsData {
  creator_display_name: string;
  company_name: string | null;
  gstin: string | null;
  company_address: string | null;
  footer_message: string | null;
  logo_url: string | null;
  upi_vpa: string;
  default_gst_percent: number;
  invoice_prefix: string;
}

export async function settings_one(): Promise<SettingsData | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("creator_display_name, company_name, gstin, company_address, footer_message, logo_url, upi_vpa, default_gst_percent, invoice_prefix")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============ Clients ============
export async function clients_all() {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, created_at, whatsapp, email, gstin, upi_vpa, address, suggested_hour")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function client_detail(id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function create_client(payload: { name: string; whatsapp: string; email: string; address?: string; gstin?: string; upi_vpa?: string; }) {
  const { data, error } = await supabase.from("clients").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Projects ============
export async function projects_all() {
  const { data, error } = await supabase.from("projects").select("*");
  if (error) throw error;
  return data || [];
}

export async function create_project(payload: { client_id: string; name: string; is_billable: boolean; }) {
  const { data, error } = await supabase.from("projects").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Invoices ============
export async function invoices_all() {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_id, total_amount, status, issue_date, due_date, created_at, paid_date")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function invoice_detail(id: string) {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function invoice_by_id(id: string) {
  return invoice_detail(id);
}

export async function create_invoice(payload: {
  invoice_number: string;
  client_id: string;
  project_id?: string | null;
  issue_date: string; // ISO
  due_date: string; // ISO
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "overdue" | "paid";
  notes?: string | null;
}) {
  const { data, error } = await supabase.from("invoices").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function update_invoice(id: string, changes: Partial<{
  invoice_number: string;
  client_id: string;
  project_id?: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "overdue" | "paid";
  notes?: string | null;
  paid_date?: string | null;
  utr_reference?: string | null;
}>) {
  const { data, error } = await supabase.from("invoices").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function delete_invoice(id: string) {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ============ Invoice Items ============
export async function items_by_invoice(invoice_id: string) {
  const { data, error } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoice_id).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function create_item(payload: { invoice_id: string; title: string; qty: number; rate: number; amount: number; }) {
  const { data, error } = await supabase.from("invoice_items").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function delete_item(id: string) {
  const { error } = await supabase.from("invoice_items").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ============ Tasks ============
export async function tasks_all() {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, client_id, project_id, due_date, status, is_billable, created_at, linked_invoice_id, notes")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function task_detail(id: string) {
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function create_task(payload: { title: string; project_id?: string | null; due_date?: string | null; is_billable: boolean; status: "open" | "done"; linked_invoice_id?: string | null; notes?: string | null; }) {
  const { data, error } = await supabase.from("tasks").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function update_task(id: string, changes: Partial<{ title: string; project_id?: string | null; due_date?: string | null; is_billable: boolean; status: "open" | "done"; linked_invoice_id?: string | null; notes?: string | null; }>) {
  const { data, error } = await supabase.from("tasks").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function delete_task(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ============ Reminders ============
export async function reminders_all() {
  const { data, error } = await supabase
    .from("reminders")
    .select(`
      id, invoice_id, scheduled_at, channel, status,
      invoices!inner(
        id, invoice_number, total_amount, due_date, 
        clients!inner(id, name)
      )
    `)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function reminders_by_invoice(invoice_id: string) {
  const { data, error } = await supabase.from("reminders").select("*").eq("invoice_id", invoice_id).order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function create_reminder(payload: { invoice_id: string; scheduled_at: string; channel: "whatsapp" | "email"; status: "pending" | "sent" | "skipped"; suggested_time?: string | null; }) {
  const { data, error } = await supabase.from("reminders").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function update_reminder(id: string, changes: Partial<{ status: "pending" | "sent" | "skipped"; scheduled_at: string; channel: "whatsapp" | "email"; suggested_time?: string | null; }>) {
  const { data, error } = await supabase.from("reminders").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function reminders_update_status(id: string, status: "pending" | "sent" | "skipped", sent_at?: string) {
  const changes: any = { status };
  if (sent_at) changes.sent_at = sent_at;
  
  const { data, error } = await supabase.from("reminders").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function reminders_by_filters(filters: {
  status?: ("pending" | "sent" | "skipped")[];
  channel?: ("whatsapp" | "email")[];
  when?: string;
  client?: string;
}) {
  let query = supabase
    .from("reminders")
    .select(`
      id, invoice_id, scheduled_at, channel, status,
      invoices!inner(
        id, invoice_number, total_amount, due_date, status,
        clients!inner(id, name)
      )
    `);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }
  if (filters.channel && filters.channel.length > 0) {
    query = query.in("channel", filters.channel);
  }
  if (filters.when) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filters.when) {
      case "today":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query = query
          .gte("scheduled_at", today.toISOString())
          .lt("scheduled_at", tomorrow.toISOString());
        break;
      case "next_7_days":
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        query = query
          .gte("scheduled_at", today.toISOString())
          .lt("scheduled_at", nextWeek.toISOString());
        break;
      case "overdue":
        query = query.lt("scheduled_at", today.toISOString());
        break;
      // "all" or default - no date filter
    }
  }

  if (filters.client) {
    // Search by client name (case insensitive)
    query = query.ilike("invoices.clients.name", `%${filters.client}%`);
  }

  query = query.order("scheduled_at", { ascending: true });
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function bulk_update_reminders(ids: string[], changes: Partial<{ status: "pending" | "sent" | "skipped"; scheduled_at: string; }>) {
  const { data, error } = await supabase
    .from("reminders")
    .update(changes)
    .in("id", ids)
    .select("*");
  if (error) throw error;
  return data || [];
}

export async function reminder_reschedule(id: string, scheduled_at: string) {
  const { data, error } = await supabase.from("reminders").update({ scheduled_at, status: "pending" }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Message Log ============
export async function message_log_recent() {
  const { data, error } = await supabase
    .from("message_log")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function create_message_log(payload: { related_type: "invoice" | "task"; related_id: string; channel: "whatsapp" | "email"; sent_at?: string; template_used: string; outcome: string; }) {
  const row = { sent_at: new Date().toISOString(), ...payload };
  const { data, error } = await supabase.from("message_log").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function message_log_insert(payload: { related_type: "invoice" | "task"; related_id: string; channel: "whatsapp" | "email"; sent_at?: string; template_used: string; outcome: string; }) {
  return create_message_log(payload);
}

// ============ Dashboard View ============
export async function v_dashboard_metrics() {
  const { data, error } = await supabase.from("v_dashboard_metrics").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data || { this_month_paid: 0, overdue_amount: 0, tasks_due_7d: 0 };
}