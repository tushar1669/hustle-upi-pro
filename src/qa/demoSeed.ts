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

    return getDemoDataCounts();
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