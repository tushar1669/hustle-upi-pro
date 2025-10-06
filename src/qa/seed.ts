// Full Demo Seeder - Creates comprehensive test data for HustleHub
// Uses RPC for invoices, ensures FK-safe deletion, all data prefixed with "QA:"

import { supabase } from "@/integrations/supabase/client";
import { rpcCreateInvoiceWithItems } from "@/lib/invoiceRpc";

export interface SeedSummary {
  clients: number;
  projects: number;
  tasks: number;
  invoices: number;
  items: number;
  reminders: number;
  goals: number;
  entries: number;
  logs: number;
}

export interface ResetSummary {
  ok: boolean;
  tablesCleared: string[];
  error?: string;
}

/**
 * Seed full demo data with predictable structure for QA tests
 */
export async function seedFullDemo(): Promise<SeedSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user for seeding');

  // 1. Ensure Settings Row
  const { data: existingSettings } = await supabase
    .from('settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!existingSettings) {
    await supabase.from('settings').insert({
      invoice_prefix: 'HH',
      default_gst_percent: 18,
      creator_display_name: 'HustleHub Demo',
      company_name: 'HustleHub Pvt Ltd',
      company_address: '123 Demo Street, Mumbai, MH 400001',
      upi_vpa: 'demo@upi',
      footer_message: 'Thank you for your business!',
      owner_id: user.id
    });
  }

  // 2. Create 3 Clients (varying email/WhatsApp)
  const { data: clientAlpha } = await supabase
    .from('clients')
    .upsert({
      name: 'QA: Alpha Co',
      email: 'alpha@qa.test',
      whatsapp: '9876543210',
      address: '456 Alpha Lane, Delhi',
      owner_id: user.id
    }, { onConflict: 'name', ignoreDuplicates: false })
    .select()
    .single();

  const { data: clientBravo } = await supabase
    .from('clients')
    .upsert({
      name: 'QA: Bravo LLP',
      email: null,
      whatsapp: '9876543211',
      address: '789 Bravo Road, Bangalore',
      owner_id: user.id
    }, { onConflict: 'name', ignoreDuplicates: false })
    .select()
    .single();

  const { data: clientCharlie } = await supabase
    .from('clients')
    .upsert({
      name: 'QA: Charlie Pvt',
      email: 'charlie@qa.test',
      whatsapp: null,
      address: '321 Charlie Street, Chennai',
      owner_id: user.id
    }, { onConflict: 'name', ignoreDuplicates: false })
    .select()
    .single();

  if (!clientAlpha || !clientBravo || !clientCharlie) {
    throw new Error('Failed to create clients');
  }

  // 3. Create 2 Projects with FK to clients
  const { data: projectAlpha } = await supabase
    .from('projects')
    .upsert({
      name: 'QA: Alpha P1',
      client_id: clientAlpha.id,
      is_billable: true,
      owner_id: user.id
    }, { onConflict: 'name', ignoreDuplicates: false })
    .select()
    .single();

  const { data: projectBravo } = await supabase
    .from('projects')
    .upsert({
      name: 'QA: Bravo P1',
      client_id: clientBravo.id,
      is_billable: true,
      owner_id: user.id
    }, { onConflict: 'name', ignoreDuplicates: false })
    .select()
    .single();

  if (!projectAlpha || !projectBravo) {
    throw new Error('Failed to create projects');
  }

  // 4. Create 5 Tasks (mixed status, FK to projects)
  const today = new Date();
  const tasks = [
    {
      title: 'QA: Task Alpha A',
      project_id: projectAlpha.id,
      status: 'open' as const,
      due_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_billable: true,
      owner_id: user.id
    },
    {
      title: 'QA: Task Alpha B',
      project_id: projectAlpha.id,
      status: 'open' as const,
      due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_billable: false,
      owner_id: user.id
    },
    {
      title: 'QA: Task Bravo A',
      project_id: projectBravo.id,
      status: 'open' as const,
      due_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_billable: true,
      owner_id: user.id
    },
    {
      title: 'QA: Task Done',
      project_id: projectAlpha.id,
      status: 'done' as const,
      due_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_billable: true,
      owner_id: user.id
    },
    {
      title: 'QA: Standalone Task',
      project_id: null,
      status: 'open' as const,
      due_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_billable: false,
      owner_id: user.id
    }
  ];

  await supabase.from('tasks').upsert(tasks, { onConflict: 'title', ignoreDuplicates: false });

  // 5. Create 4 Invoices using RPC (DRAFT, SENT, OVERDUE, PAID)
  const draftInvoice = await rpcCreateInvoiceWithItems({
    owner_id: user.id,
    invoice_prefix: 'HH',
    client_id: clientCharlie.id,
    project_id: null,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 5000,
    gst_amount: 900,
    total_amount: 5900,
    status: 'draft',
    items: [
      { title: 'QA: Service A', qty: 1, rate: 5000, amount: 5000 }
    ]
  });

  const sentInvoice = await rpcCreateInvoiceWithItems({
    owner_id: user.id,
    invoice_prefix: 'HH',
    client_id: clientAlpha.id,
    project_id: projectAlpha.id,
    issue_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 10000,
    gst_amount: 1800,
    total_amount: 11800,
    status: 'sent',
    items: [
      { title: 'QA: Consulting', qty: 2, rate: 5000, amount: 10000 }
    ]
  });

  const overdueInvoice = await rpcCreateInvoiceWithItems({
    owner_id: user.id,
    invoice_prefix: 'HH',
    client_id: clientAlpha.id,
    project_id: projectAlpha.id,
    issue_date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 15000,
    gst_amount: 2700,
    total_amount: 17700,
    status: 'sent',
    items: [
      { title: 'QA: Design Work', qty: 3, rate: 5000, amount: 15000 }
    ]
  });

  const paidInvoice = await rpcCreateInvoiceWithItems({
    owner_id: user.id,
    invoice_prefix: 'HH',
    client_id: clientBravo.id,
    project_id: projectBravo.id,
    issue_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(today.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 8000,
    gst_amount: 1440,
    total_amount: 9440,
    status: 'paid',
    items: [
      { title: 'QA: Dev Sprint', qty: 1, rate: 8000, amount: 8000 }
    ]
  });

  // Update paid invoice with paid_at
  await supabase
    .from('invoices')
    .update({ 
      paid_at: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() 
    })
    .eq('id', paidInvoice.id);

  // 6. Create 3 Reminders for SENT + OVERDUE invoices
  const reminders = [
    {
      invoice_id: sentInvoice.id,
      scheduled_at: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'whatsapp' as const,
      status: 'pending' as const,
      owner_id: user.id
    },
    {
      invoice_id: overdueInvoice.id,
      scheduled_at: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'email' as const,
      status: 'pending' as const,
      owner_id: user.id
    },
    {
      invoice_id: overdueInvoice.id,
      scheduled_at: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'whatsapp' as const,
      status: 'pending' as const,
      owner_id: user.id
    }
  ];

  await supabase.from('reminders').upsert(reminders, { onConflict: 'invoice_id,scheduled_at', ignoreDuplicates: false });

  // 7. Create 1 Savings Goal + 3 Entries
  const { data: goal } = await supabase
    .from('savings_goals')
    .upsert({
      title: 'QA: Emergency Fund',
      target_amount: 100000,
      target_date: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'emergency',
      owner_id: user.id
    }, { onConflict: 'title', ignoreDuplicates: false })
    .select()
    .single();

  if (goal) {
    const entries = [
      {
        goal_id: goal.id,
        amount: 25000,
        note: 'QA: Initial deposit',
        created_at: new Date().toISOString(),
        owner_id: user.id
      },
      {
        goal_id: goal.id,
        amount: 10000,
        note: 'QA: Feb contribution',
        created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        owner_id: user.id
      },
      {
        goal_id: goal.id,
        amount: 5000,
        note: 'QA: Jan contribution',
        created_at: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        owner_id: user.id
      }
    ];

    await supabase.from('savings_entries').upsert(entries, { onConflict: 'goal_id,created_at', ignoreDuplicates: false });
  }

  // 8. Create 2 Message Log rows
  const logs = [
    {
      related_type: 'invoice' as const,
      related_id: draftInvoice.id,
      channel: 'whatsapp' as const,
      template_used: 'draft_created',
      outcome: 'created',
      sent_at: new Date().toISOString(),
      owner_id: user.id
    },
    {
      related_type: 'invoice' as const,
      related_id: sentInvoice.id,
      channel: 'email' as const,
      template_used: 'invoice_sent',
      outcome: 'sent',
      sent_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      owner_id: user.id
    }
  ];

  await supabase.from('message_log').upsert(logs, { ignoreDuplicates: false });

  // Return counts
  const counts = await getQaCounts();
  return counts;
}

/**
 * Reset all QA data in FK-safe order
 */
export async function resetQaFixtures(): Promise<ResetSummary> {
  try {
    const tablesCleared: string[] = [];

    // Delete in FK-safe order (children first)
    
    // 1. Savings Entries
    await supabase.from('savings_entries').delete().ilike('note', 'QA:%');
    tablesCleared.push('savings_entries');

    // 2. Savings Goals
    await supabase.from('savings_goals').delete().ilike('title', 'QA:%');
    tablesCleared.push('savings_goals');

    // 3. Message Log (find by invoice prefix)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .like('invoice_number', 'HH-%');
    
    if (invoices && invoices.length > 0) {
      const invoiceIds = invoices.map(i => i.id);
      await supabase
        .from('message_log')
        .delete()
        .eq('related_type', 'invoice')
        .in('related_id', invoiceIds);
      tablesCleared.push('message_log');
    }

    // 4. Reminders
    if (invoices && invoices.length > 0) {
      const invoiceIds = invoices.map(i => i.id);
      await supabase.from('reminders').delete().in('invoice_id', invoiceIds);
      tablesCleared.push('reminders');
    }

    // 5. Invoice Items
    if (invoices && invoices.length > 0) {
      const invoiceIds = invoices.map(i => i.id);
      await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
      tablesCleared.push('invoice_items');
    }

    // 6. Invoices
    await supabase.from('invoices').delete().like('invoice_number', 'HH-%');
    tablesCleared.push('invoices');

    // 7. Tasks
    await supabase.from('tasks').delete().ilike('title', 'QA:%');
    tablesCleared.push('tasks');

    // 8. Projects
    await supabase.from('projects').delete().ilike('name', 'QA:%');
    tablesCleared.push('projects');

    // 9. Clients
    await supabase.from('clients').delete().ilike('name', 'QA:%');
    tablesCleared.push('clients');

    return {
      ok: true,
      tablesCleared
    };
  } catch (error: any) {
    return {
      ok: false,
      tablesCleared: [],
      error: error.message || 'Unknown error during reset'
    };
  }
}

/**
 * Get counts of all QA data
 */
async function getQaCounts(): Promise<SeedSummary> {
  const [
    clientsRes,
    projectsRes,
    tasksRes,
    invoicesRes,
    itemsRes,
    remindersRes,
    goalsRes,
    entriesRes,
    logsRes
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact' }).ilike('name', 'QA:%'),
    supabase.from('projects').select('id', { count: 'exact' }).ilike('name', 'QA:%'),
    supabase.from('tasks').select('id', { count: 'exact' }).ilike('title', 'QA:%'),
    supabase.from('invoices').select('id', { count: 'exact' }).like('invoice_number', 'HH-%'),
    supabase.from('invoice_items').select('id', { count: 'exact' }).ilike('title', 'QA:%'),
    supabase.from('reminders').select('id', { count: 'exact' }),
    supabase.from('savings_goals').select('id', { count: 'exact' }).ilike('title', 'QA:%'),
    supabase.from('savings_entries').select('id', { count: 'exact' }).ilike('note', 'QA:%'),
    supabase.from('message_log').select('id', { count: 'exact' }).ilike('template_used', '%created%')
  ]);

  return {
    clients: clientsRes.count || 0,
    projects: projectsRes.count || 0,
    tasks: tasksRes.count || 0,
    invoices: invoicesRes.count || 0,
    items: itemsRes.count || 0,
    reminders: remindersRes.count || 0,
    goals: goalsRes.count || 0,
    entries: entriesRes.count || 0,
    logs: logsRes.count || 0
  };
}
