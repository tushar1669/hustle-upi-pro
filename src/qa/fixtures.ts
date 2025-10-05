import { 
  create_client, 
  create_project, 
  create_task, 
  create_invoice, 
  create_reminder, 
  create_savings_goal,
  create_entry,
  clients_all,
  projects_all,
  tasks_all,
  invoices_all,
  savings_goals_all,
  settings_one
} from '@/data/collections';
import { supabase } from '@/integrations/supabase/client';
import { rpcCreateInvoiceWithItems } from '@/lib/invoiceRpc';

// QA Fixtures Helper
// Creates minimal test data with QA: prefix to avoid conflicts and ensure cleanup

export const qaFixtures = {
  async ensureClient() {
    const clients = await clients_all();
    const qaClient = clients.find((c: any) => c.name.startsWith('QA:'));
    
    if (!qaClient) {
      return await create_client({
        name: 'QA: Test Client',
        email: 'qa@test.com',
        whatsapp: '9876543210',
        upi_vpa: 'qatest@upi'
      });
    }
    return qaClient;
  },

  async ensureProject() {
    const projects = await projects_all();
    const qaProject = projects.find((p: any) => p.name.startsWith('QA:'));
    
    if (!qaProject) {
      const client = await this.ensureClient();
      return await create_project({
        name: 'QA: Test Project',
        client_id: client.id,
        is_billable: true
      });
    }
    return qaProject;
  },

  async ensureTask(projectId?: string) {
    const tasks = await tasks_all();
    const qaTask = tasks.find((t: any) => t.title.startsWith('QA:'));
    
    if (!qaTask) {
      const project = projectId ? { id: projectId } : await this.ensureProject();
      return await create_task({
        title: 'QA: Test Task',
        project_id: project.id,
        status: 'open',
        is_billable: true,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    return qaTask;
  },

  async ensureInvoice(clientId?: string, projectId?: string) {
    const invoices = await invoices_all();
    const qaInvoice = invoices.find((i: any) => i.invoice_number.includes('QA'));
    
    if (!qaInvoice) {
      const client = clientId ? { id: clientId } : await this.ensureClient();
      const project = projectId ? { id: projectId } : await this.ensureProject();
      const settings = await settings_one();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user for QA fixtures');
      
      const subtotal = 10000;
      const gstAmount = 1800;
      const totalAmount = subtotal + gstAmount;
      
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      return await rpcCreateInvoiceWithItems({
        owner_id: user.id,
        invoice_prefix: settings?.invoice_prefix || 'QA',
        client_id: client.id,
        project_id: project.id,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        status: 'sent',
        items: [
          { title: 'QA Test Service', qty: 1, rate: 10000, amount: 10000 }
        ]
      });
    }
    return qaInvoice;
  },

  async ensureFollowup(invoiceId?: string) {
    try {
      const invoice = invoiceId ? { id: invoiceId } : await this.ensureInvoice();
      
      // Check if reminder already exists
      const { data: existingReminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('invoice_id', invoice.id)
        .limit(1);
      
      if (existingReminders && existingReminders.length > 0) {
        return existingReminders[0];
      }

      return await create_reminder({
        invoice_id: invoice.id,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        channel: 'whatsapp' as any,
        status: 'pending'
      });
    } catch (error) {
      console.warn('Failed to create QA followup:', error);
      return null;
    }
  },

  async ensureSavingsGoalWithEntries() {
    const goals = await savings_goals_all();
    const qaGoal = goals.find((g: any) => g.title.startsWith('QA:'));
    
    if (!qaGoal) {
      const goal = await create_savings_goal({
        title: 'QA: Test Savings Goal',
        target_amount: 100000,
        target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'general'
      });

      // Add a test entry
      await create_entry({
        goal_id: goal.id,
        amount: 25000,
        note: 'QA: Test entry'
      });

      return goal;
    }
    return qaGoal;
  },

  async resetQaFixtures() {
    try {
      // Delete QA entries in reverse dependency order
      
      // 1. Delete QA savings entries first
      await supabase
        .from('savings_entries')
        .delete()
        .ilike('note', 'QA:%');

      // 2. Delete QA savings goals
      await supabase
        .from('savings_goals')
        .delete()
        .ilike('title', 'QA:%');

      // 3. Delete QA reminders
      const { data: qaInvoices } = await supabase
        .from('invoices')
        .select('id')
        .ilike('invoice_number', '%QA%');
      
      if (qaInvoices && qaInvoices.length > 0) {
        const invoiceIds = qaInvoices.map(i => i.id);
        await supabase
          .from('reminders')
          .delete()
          .in('invoice_id', invoiceIds);
      }

      // 4. Delete QA invoice items
      await supabase
        .from('invoice_items')
        .delete()
        .ilike('description', 'QA:%');

      // 5. Delete QA invoices
      await supabase
        .from('invoices')
        .delete()
        .ilike('invoice_number', '%QA%');

      // 6. Delete QA tasks
      await supabase
        .from('tasks')
        .delete()
        .ilike('title', 'QA:%');

      // 7. Delete QA projects
      await supabase
        .from('projects')
        .delete()
        .ilike('name', 'QA:%');

      // 8. Delete QA clients
      await supabase
        .from('clients')
        .delete()
        .ilike('name', 'QA:%');

      console.log('QA fixtures reset completed');
    } catch (error) {
      console.warn('Some QA fixtures could not be deleted:', error);
    }
  }
};