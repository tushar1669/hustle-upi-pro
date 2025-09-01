import { supabase } from '@/integrations/supabase/client';

export interface SeedSummary {
  clients: number;
  projects: number;
  invoices: number;
  items: number;
  tasks: number;
  reminders: number;
  logs: number;
}

// ====== DETERMINISTIC DEMO DATA (E) ======
export async function ensureDemoData(): Promise<SeedSummary> {
  console.log('[QA] Ensuring demo data with guaranteed minimums...');
  
  try {
    // 1. Settings
    await supabase.from('settings').upsert({
      upi_vpa: 'qa-tester@upi',
      creator_display_name: 'QA Tester', 
      invoice_prefix: 'QA',
      default_gst_percent: 18
    });

    // 2. Clients ≥3
    const qaClients = [
      { name: 'qa: Alice', whatsapp: '+919876543210', email: 'alice@qa.test' },
      { name: 'qa: Bob', whatsapp: '+919876543211', email: 'bob@qa.test' },
      { name: 'qa: Charlie', whatsapp: '+919876543212', email: 'charlie@qa.test' }
    ];

    for (const client of qaClients) {
      await supabase.from('clients').upsert(client, { onConflict: 'name' });
    }

    const { data: clients } = await supabase.from('clients').select('id, name').like('name', 'qa:%');
    if (!clients || clients.length < 3) throw new Error('Failed to ensure minimum client count');

    // 3. Tasks ≥4 (3 open, 1 done)
    const qaTasks = [
      { title: 'qa: Open Task 1', status: 'open' as const, client_id: clients[0].id },
      { title: 'qa: Open Task 2', status: 'open' as const, client_id: clients[1].id },
      { title: 'qa: Open Task 3', status: 'open' as const, client_id: clients[2].id },
      { title: 'qa: Completed Task', status: 'done' as const, client_id: clients[0].id }
    ];

    for (const task of qaTasks) {
      await supabase.from('tasks').upsert(task, { onConflict: 'title' });
    }

    // 4. Projects (minimal, only as needed)
    const qaProject = { name: 'qa: Demo Project', client_id: clients[0].id };
    await supabase.from('projects').upsert(qaProject, { onConflict: 'name' });
    const { data: projects } = await supabase.from('projects').select('id').like('name', 'qa:%');

    // 5. Invoices ≥4 (2 sent, 1 draft, 1 overdue)
    const qaInvoices = [
      {
        invoice_number: 'QA-2025-0001',
        client_id: clients[0].id,
        project_id: projects?.[0]?.id,
        status: 'sent' as const,
        issue_date: '2025-01-01',
        due_date: '2025-01-15',
        subtotal: 5000,
        gst_amount: 900,
        total_amount: 5900
      },
      {
        invoice_number: 'QA-2025-0002',
        client_id: clients[1].id,
        project_id: projects?.[0]?.id,
        status: 'sent' as const,
        issue_date: '2025-01-02',
        due_date: '2025-01-16',
        subtotal: 7500,
        gst_amount: 1350,
        total_amount: 8850
      },
      {
        invoice_number: 'QA-2025-0003',
        client_id: clients[2].id,
        project_id: projects?.[0]?.id,
        status: 'draft' as const,
        issue_date: '2025-01-03',
        due_date: '2025-01-17',
        subtotal: 3000,
        gst_amount: 540,
        total_amount: 3540
      },
      {
        invoice_number: 'QA-2025-0004',
        client_id: clients[0].id,
        project_id: projects?.[0]?.id,
        status: 'overdue' as const,
        issue_date: '2024-12-15',
        due_date: '2024-12-30',
        subtotal: 10000,
        gst_amount: 1800,
        total_amount: 11800
      }
    ];

    for (const invoice of qaInvoices) {
      await supabase.from('invoices').upsert(invoice, { onConflict: 'invoice_number' });
    }

    const { data: invoices } = await supabase.from('invoices').select('id, invoice_number').like('invoice_number', 'QA-%');
    if (!invoices || invoices.length < 4) throw new Error('Failed to ensure minimum invoice count');

    // 6. Invoice Items (at least one per invoice)
    for (const invoice of invoices) {
      await supabase.from('invoice_items').upsert({
        invoice_id: invoice.id,
        title: `qa: Demo Item for ${invoice.invoice_number}`,
        qty: 1,
        rate: 5000,
        amount: 5000
      }, { onConflict: 'invoice_id,title' });
    }

    // 7. Reminders ≥2 (attached to sent invoices)
    const sentInvoices = invoices.filter(inv => inv.invoice_number.includes('0001') || inv.invoice_number.includes('0002'));
    for (const [i, invoice] of sentInvoices.entries()) {
      await supabase.from('reminders').upsert({
        invoice_id: invoice.id,
        scheduled_at: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'whatsapp' as const,
        status: 'pending' as const
      }, { onConflict: 'invoice_id,scheduled_at' });
    }

    // 8. Savings Goals ≥2
    const qaSavingsGoals = [
      {
        title: 'qa: Emergency Fund',
        target_amount: 100000,
        saved_amount: 25000,
        target_date: '2025-12-31',
        type: 'emergency'
      },
      {
        title: 'qa: Business Growth',
        target_amount: 500000,
        saved_amount: 150000,
        target_date: '2025-06-30',
        type: 'business'
      }
    ];

    // Note: savings_goals table may not exist in current schema
    // for (const goal of qaSavingsGoals) {
    //   await supabase.from('savings_goals').upsert(goal, { onConflict: 'title' });
    // }

    // 9. In-place fix: Ensure at least 3 open tasks
    const { data: allTasks } = await supabase.from('tasks').select('id, status, title').like('title', 'qa:%');
    const openTasks = allTasks?.filter(t => t.status === 'open') || [];
    if (openTasks.length < 3) {
      // Re-open a done task if needed
      const doneTasks = allTasks?.filter(t => t.status === 'done') || [];
      if (doneTasks.length > 0) {
        await supabase.from('tasks').update({ status: 'open' }).eq('id', doneTasks[0].id);
      }
    }

    const counts = await getDemoDataCounts();
    console.log('[QA] Demo data counts:', counts);
    return counts;
  } catch (error) {
    console.error('[QA] Failed to ensure demo data:', error);
    throw error;
  }
}

async function getDemoDataCounts(): Promise<SeedSummary> {
  const [clientsRes, projectsRes, invoicesRes, itemsRes, tasksRes, remindersRes, logsRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }),
    supabase.from('invoice_items').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }),
    supabase.from('reminders').select('id', { count: 'exact', head: true }),
    supabase.from('message_log').select('id', { count: 'exact', head: true })
  ]);

  return {
    clients: clientsRes.count || 0,
    projects: projectsRes.count || 0,
    invoices: invoicesRes.count || 0,
    items: itemsRes.count || 0,
    tasks: tasksRes.count || 0,
    reminders: remindersRes.count || 0,
    logs: logsRes.count || 0
  };
}

// Original seedDemoData for backwards compatibility  
export async function seedDemoData(): Promise<SeedSummary> {
  await supabase.from('settings').upsert({});
  
  const { count: clientCount } = await supabase.from('clients').select('id', { count: 'exact', head: true });
  
  if ((clientCount || 0) < 2) {
    await supabase.from('clients').insert([
      { name: 'Acme Corp', whatsapp: '+919876543210', email: 'hello@acme.com' },
      { name: 'Widget Ltd', whatsapp: '+919876543211', email: 'contact@widget.com' }
    ]);
  }

  return getDemoDataCounts();
}