import { supabase } from "@/lib/supabase";

// Tables: settings, clients, projects, invoices, invoice_items, tasks, reminders, message_log
// View: v_dashboard_metrics

// ============ Settings ============
export async function settings_one() {
  const sb = supabase();
  const { data, error } = await sb
    .from("settings")
    .select("creator_display_name, upi_vpa, default_gst_percent, invoice_prefix")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============ Clients ============
export async function clients_all() {
  const sb = supabase();
  const { data, error } = await sb.from("clients").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function create_client(payload: { name: string; whatsapp: string; email: string; address?: string; gstin?: string; }) {
  const sb = supabase();
  const { data, error } = await sb.from("clients").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Projects ============
export async function projects_all() {
  const sb = supabase();
  const { data, error } = await sb.from("projects").select("*");
  if (error) throw error;
  return data || [];
}

// ============ Invoices ============
export async function invoices_all() {
  const sb = supabase();
  const { data, error } = await sb.from("invoices").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function invoice_by_id(id: string) {
  const sb = supabase();
  const { data, error } = await sb.from("invoices").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
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
  const sb = supabase();
  const { data, error } = await sb.from("invoices").insert(payload).select("*").single();
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
  const sb = supabase();
  const { data, error } = await sb.from("invoices").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function delete_invoice(id: string) {
  const sb = supabase();
  const { error } = await sb.from("invoices").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ============ Invoice Items ============
export async function items_by_invoice(invoice_id: string) {
  const sb = supabase();
  const { data, error } = await sb.from("invoice_items").select("*").eq("invoice_id", invoice_id).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function create_item(payload: { invoice_id: string; title: string; qty: number; rate: number; amount: number; }) {
  const sb = supabase();
  const { data, error } = await sb.from("invoice_items").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function delete_item(id: string) {
  const sb = supabase();
  const { error } = await sb.from("invoice_items").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ============ Tasks ============
export async function tasks_all() {
  const sb = supabase();
  const { data, error } = await sb.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function create_task(payload: { title: string; project_id?: string | null; due_date?: string | null; is_billable: boolean; status: "open" | "done"; linked_invoice_id?: string | null; notes?: string | null; }) {
  const sb = supabase();
  const { data, error } = await sb.from("tasks").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function update_task(id: string, changes: Partial<{ title: string; project_id?: string | null; due_date?: string | null; is_billable: boolean; status: "open" | "done"; linked_invoice_id?: string | null; notes?: string | null; }>) {
  const sb = supabase();
  const { data, error } = await sb.from("tasks").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Reminders ============
export async function reminders_by_invoice(invoice_id: string) {
  const sb = supabase();
  const { data, error } = await sb.from("reminders").select("*").eq("invoice_id", invoice_id).order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function create_reminder(payload: { invoice_id: string; scheduled_at: string; channel: "whatsapp" | "email"; status: "pending" | "sent" | "skipped"; suggested_time?: string | null; }) {
  const sb = supabase();
  const { data, error } = await sb.from("reminders").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function update_reminder(id: string, changes: Partial<{ status: "pending" | "sent" | "skipped"; scheduled_at: string; channel: "whatsapp" | "email"; suggested_time?: string | null; }>) {
  const sb = supabase();
  const { data, error } = await sb.from("reminders").update(changes).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Message Log ============
export async function message_log_recent() {
  const sb = supabase();
  const { data, error } = await sb
    .from("message_log")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function create_message_log(payload: { related_type: "invoice" | "task"; related_id: string; channel: "whatsapp" | "email"; sent_at?: string; template_used: string; outcome: string; }) {
  const sb = supabase();
  const row = { sent_at: new Date().toISOString(), ...payload };
  const { data, error } = await sb.from("message_log").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

// ============ Dashboard View ============
export async function v_dashboard_metrics() {
  const sb = supabase();
  const { data, error } = await sb.from("v_dashboard_metrics").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data || { this_month_paid: 0, overdue_amount: 0, tasks_due_7d: 0 };
}
