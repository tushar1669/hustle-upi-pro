import { supabase } from "@/integrations/supabase/client";
import {
  clients_all, create_message_log, create_invoice,
  create_item, update_invoice, create_task,
  create_reminder, settings_one
} from "@/data/collections";

export async function seedDemoData() {
  const settings = await settings_one().catch(() => null);
  if (!settings) {
    await supabase.from("settings").insert({
      creator_display_name: "HustleHub Demo",
      invoice_prefix: "HH-2025-",
      default_gst_percent: 18,
      upi_vpa: "demo@upi",
      company_name: "HustleHub Demo Co.",
      company_address: "Bengaluru, KA",
      gstin: "29ABCDE1234F1Z5",
      footer_message: "Thank you for your business!"
    });
  }

  const clients = await clients_all();
  const needClients = Math.max(0, 2 - clients.length);
  for (let i = 0; i < needClients; i++) {
    await supabase.from("clients").insert({ 
      name: `Demo Client ${i + 1}`, 
      email: null, 
      whatsapp: null, 
      address: null, 
      gstin: null 
    });
  }
  const allClients = await clients_all();
  const clientA = allClients[0];

  const { data: existingInvoices } = await supabase.from("invoices").select("id,status").limit(5);
  const needDraft = !existingInvoices?.some((i: any) => i.status === "draft");
  const needSent = !existingInvoices?.some((i: any) => i.status === "sent");
  const needPaid = !existingInvoices?.some((i: any) => i.status === "paid");

  if (needDraft) {
    const draft = await create_invoice({
      invoice_number: "HH-2025-DEMO-1",
      client_id: clientA.id, 
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0],
      subtotal: 25000,
      gst_amount: 4500,
      total_amount: 29500,
      status: "draft"
    });
    await create_item({ invoice_id: draft.id, title: "Design Sprint", qty: 1, rate: 25000, amount: 25000 });
  }

  if (needSent) {
    const sent = await create_invoice({
      invoice_number: "HH-2025-DEMO-2",
      client_id: clientA.id, 
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 3 * 864e5).toISOString().split('T')[0],
      subtotal: 85000,
      gst_amount: 15300,
      total_amount: 100300,
      status: "sent"
    });
    await create_item({ invoice_id: sent.id, title: "Brand Kit", qty: 1, rate: 85000, amount: 85000 });
  }

  if (needPaid) {
    const paid = await create_invoice({
      invoice_number: "HH-2025-DEMO-3",
      client_id: clientA.id, 
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      subtotal: 12712,
      gst_amount: 2288,
      total_amount: 15000,
      status: "paid"
    });
    await create_item({ invoice_id: paid.id, title: "Landing Page", qty: 1, rate: 12712, amount: 12712 });
    await update_invoice(paid.id, { paid_date: new Date().toISOString().split('T')[0], utr_reference: "UTR-DEMO-001" });
  }

  await create_task({
    title: "Prepare Project Proposal",
    due_date: new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0],
    status: "open",
    is_billable: false
  });

  const { data: aSent } = await supabase.from("invoices").select("id").eq("status", "sent").limit(1);
  if (aSent?.[0]) {
    await create_reminder({
      invoice_id: aSent[0].id,
      scheduled_at: new Date(Date.now() + 864e5).toISOString(),
      channel: "whatsapp",
      status: "pending"
    });
  }

  await create_message_log({
    related_type: "task", 
    related_id: crypto.randomUUID(),
    channel: "email", 
    template_used: "qa_seed", 
    outcome: "seeded"
  });

  return { ok: true };
}