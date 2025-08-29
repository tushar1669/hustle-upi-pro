import { supabase } from "@/integrations/supabase/client";
import {
  clients_all, create_message_log, create_invoice,
  create_item, update_invoice, create_task,
  create_reminder, settings_one
} from "@/data/collections";

export interface SeedSummary {
  clients: number;
  projects: number;
  invoices: number;
  items: number;
  tasks: number;
  reminders: number;
  logs: number;
}

export async function seedDemoData(): Promise<SeedSummary> {
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

  // Ensure at least one open task with mark-done capability
  await create_task({
    title: "Prepare Project Proposal",
    due_date: new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0],
    status: "open",
    is_billable: false
  });

  // Create additional open task for testing
  await create_task({
    title: "Review QA Test Data",
    due_date: new Date(Date.now() + 1 * 864e5).toISOString().split('T')[0],
    status: "open",
    is_billable: true
  });

  // Ensure reminders exist for follow-ups testing
  const { data: sentInvoices } = await supabase.from("invoices").select("id").eq("status", "sent");
  if (sentInvoices && sentInvoices.length > 0) {
    for (const sentInvoice of sentInvoices.slice(0, 2)) {
      // Check if reminder already exists for this invoice
      const { data: existingReminder } = await supabase
        .from("reminders")
        .select("id")
        .eq("invoice_id", sentInvoice.id)
        .eq("status", "pending")
        .single();
      
      if (!existingReminder) {
        await create_reminder({
          invoice_id: sentInvoice.id,
          scheduled_at: new Date(Date.now() + 864e5).toISOString(),
          channel: "whatsapp",
          status: "pending"
        });
      }
    }
  }

  await create_message_log({
    related_type: "task", 
    related_id: crypto.randomUUID(),
    channel: "email", 
    template_used: "qa_seed", 
    outcome: "seeded"
  });

  // Generate additional deterministic demo data for consistent testing
  const demoClients = [
    { name: "Acme Studios", email: "hello@acme.com", whatsapp: "+91-9876543210", gstin: "29ABCDE1234F1Z1" },
    { name: "Bright Ideas", email: "contact@brightideas.co", whatsapp: "+91-9876543211", gstin: "29ABCDE1234F1Z2" }
  ];

  for (const clientData of demoClients) {
    const existingClient = await supabase
      .from('clients')
      .select('id')
      .eq('name', clientData.name)
      .single();
    
    if (!existingClient.data) {
      await supabase.from('clients').insert(clientData);
    }
  }

  // Create additional demo invoices with specific patterns for testing
  const allClientsAfterSeed = await clients_all();
  if (allClientsAfterSeed.length >= 2) {
    const clientB = allClientsAfterSeed[1];
    
    // Create a "sent" invoice that's overdue for testing follow-ups
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 5); // 5 days overdue
    
    const { data: overdueInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', 'QA-2025-OVERDUE')
      .single();
    
    if (!overdueInvoice) {
      const overdue = await create_invoice({
        invoice_number: "QA-2025-OVERDUE",
        client_id: clientB.id,
        issue_date: new Date(Date.now() - 10 * 864e5).toISOString().split('T')[0], // 10 days ago
        due_date: overdueDate.toISOString().split('T')[0],
        subtotal: 50000,
        gst_amount: 9000,
        total_amount: 59000,
        status: "sent"
      });
      
      await create_item({ 
        invoice_id: overdue.id, 
        title: "UI Design Sprint", 
        qty: 2, 
        rate: 25000, 
        amount: 50000 
      });
      
      // Create multiple reminders for the overdue invoice
      await create_reminder({
        invoice_id: overdue.id,
        scheduled_at: new Date(Date.now() + 1 * 864e5).toISOString(), // 1 day from now (more immediate for testing)
        channel: "whatsapp",
        status: "pending"
      });
      
      await create_reminder({
        invoice_id: overdue.id,
        scheduled_at: new Date(Date.now() + 3 * 864e5).toISOString(), // 3 days from now
        channel: "whatsapp", 
        status: "pending"
      });
    }
  }

  // Create additional demo tasks with mixed statuses
  const demoTasks = [
    {
      title: "Send assets to Acme",
      due_date: new Date(Date.now() + 1 * 864e5).toISOString().split('T')[0], // tomorrow
      status: "open" as const,
      is_billable: false
    },
    {
      title: "Bright Ideas review call", 
      due_date: new Date(Date.now() + 3 * 864e5).toISOString().split('T')[0], // 3 days
      status: "open" as const,
      is_billable: true
    },
    {
      title: "Portfolio refresh",
      due_date: new Date(Date.now() - 1 * 864e5).toISOString().split('T')[0], // yesterday
      status: "done" as const,
      is_billable: false
    }
  ];

  for (const taskData of demoTasks) {
    const existingTask = await supabase
      .from('tasks')
      .select('id')
      .eq('title', taskData.title)
      .single();
    
    if (!existingTask.data) {
      await create_task(taskData);
    }
  }

  // Count final results
  const finalCounts = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('projects').select('id', { count: 'exact' }),
    supabase.from('invoices').select('id', { count: 'exact' }),
    supabase.from('invoice_items').select('id', { count: 'exact' }),
    supabase.from('tasks').select('id', { count: 'exact' }),
    supabase.from('reminders').select('id', { count: 'exact' }),
    supabase.from('message_log').select('id', { count: 'exact' }).eq('template_used', 'qa_seed')
  ]);

  return {
    clients: finalCounts[0].count || 0,
    projects: finalCounts[1].count || 0,
    invoices: finalCounts[2].count || 0,
    items: finalCounts[3].count || 0,
    tasks: finalCounts[4].count || 0,
    reminders: finalCounts[5].count || 0,
    logs: finalCounts[6].count || 0
  };
}