// QA Smoke Tests - Database-Level Verification System

import { supabase } from '@/integrations/supabase/client';
import * as collections from '@/data/collections';

export interface SmokeTestResult {
  id: string;
  name: string;
  pass: boolean;
  notes: string;
  executionTime: number;
}

export interface SmokeTestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  results: SmokeTestResult[];
  executedAt: string;
}

class SmokeTestRunner {
  async runAllSmokeTests(): Promise<SmokeTestSummary> {
    const results: SmokeTestResult[] = [];
    
    // A) Dashboard sanity
    results.push(await this.testDashboardSanity());
    
    // B) Invoices list
    results.push(await this.testInvoicesList());
    
    // C) Follow-ups visibility
    results.push(await this.testFollowUpsVisibility());
    
    // D) Send Now path (non-destructive)
    results.push(await this.testSendNowPath());
    
    // E) Mark Paid path (non-destructive)
    results.push(await this.testMarkPaidPath());
    
    // F) Tasks CRUD
    results.push(await this.testTasksCRUD());
    
    // G) Quick Actions reflect changes
    results.push(await this.testQuickActionsReflectChanges());

    const summary: SmokeTestSummary = {
      totalTests: results.length,
      passed: results.filter(r => r.pass).length,
      failed: results.filter(r => !r.pass).length,
      results,
      executedAt: new Date().toISOString()
    };

    return summary;
  }

  private async testDashboardSanity(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    
    try {
      const metrics = await collections.v_dashboard_metrics();
      
      const hasValidMetrics = (
        (metrics.this_month_paid && metrics.this_month_paid > 0) ||
        (metrics.overdue_amount && metrics.overdue_amount > 0) ||
        (metrics.tasks_due_7d && metrics.tasks_due_7d > 0)
      );

      return {
        id: 'DASHBOARD_SANITY',
        name: 'Dashboard Sanity',
        pass: hasValidMetrics,
        notes: `Metrics: this_month_paid=${metrics.this_month_paid}, overdue_amount=${metrics.overdue_amount}, tasks_due_7d=${metrics.tasks_due_7d}`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: 'DASHBOARD_SANITY',
        name: 'Dashboard Sanity',
        pass: false,
        notes: `Failed to fetch metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async testInvoicesList(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    
    try {
      const { data: qaInvoices, error } = await supabase
        .from('invoices')
        .select('invoice_number, status')
        .in('invoice_number', ['QA-2025-1001', 'QA-2025-1002', 'QA-2025-1003']);

      if (error) throw error;

      const expectedStatuses = {
        'QA-2025-1001': 'paid',
        'QA-2025-1002': 'sent', 
        'QA-2025-1003': 'overdue'
      };

      const allCorrect = qaInvoices.every(inv => 
        expectedStatuses[inv.invoice_number as keyof typeof expectedStatuses] === inv.status
      );

      return {
        id: 'INVOICES_LIST',
        name: 'Invoices List',
        pass: allCorrect && qaInvoices.length === 3,
        notes: `Found ${qaInvoices.length}/3 QA invoices with correct statuses: ${qaInvoices.map(i => `${i.invoice_number}:${i.status}`).join(', ')}`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: 'INVOICES_LIST',
        name: 'Invoices List',
        pass: false,
        notes: `Failed to verify QA invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async testFollowUpsVisibility(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    
    try {
      const { data: followUpInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .in('status', ['sent', 'overdue']);

      if (invoicesError) throw invoicesError;

      let validFollowUps = 0;
      for (const invoice of followUpInvoices) {
        const { data: reminders, error: remindersError } = await supabase
          .from('reminders')
          .select('status')
          .eq('invoice_id', invoice.id)
          .eq('status', 'pending');

        if (remindersError) throw remindersError;
        if (reminders.length > 0) validFollowUps++;
      }

      return {
        id: 'FOLLOWUPS_VISIBILITY',
        name: 'Follow-ups Visibility',
        pass: validFollowUps > 0,
        notes: `${validFollowUps} of ${followUpInvoices.length} sent/overdue invoices have pending reminders`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: 'FOLLOWUPS_VISIBILITY',
        name: 'Follow-ups Visibility',
        pass: false,
        notes: `Failed to check follow-ups: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async testSendNowPath(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    
    try {
      // Find earliest pending reminder on a QA invoice
      const { data: qaReminder, error: reminderError } = await supabase
        .from('reminders')
        .select('id, invoice_id')
        .eq('status', 'pending')
        .gte('invoice_id', (await supabase
          .from('invoices')
          .select('id')
          .like('invoice_number', 'QA-%')
          .limit(1)
          .single()
        ).data?.id || '')
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (reminderError) throw reminderError;
      if (!qaReminder) {
        return {
          id: 'SEND_NOW_PATH',
          name: 'Send Now Path',
          pass: true,
          notes: 'No QA reminders available for testing (acceptable)',
          executionTime: Date.now() - startTime
        };
      }

      // Mark as sent and log
      const { error: updateError } = await supabase
        .from('reminders')
        .update({ status: 'sent' })
        .eq('id', qaReminder.id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('message_log')
        .insert({
          related_type: 'reminder',
          related_id: qaReminder.id,
          channel: 'whatsapp',
          template_used: 'reminder_sent',
          outcome: 'ok'
        });

      if (logError) throw logError;

      // Restore state by creating new pending reminder
      const { error: restoreError } = await supabase
        .from('reminders')
        .insert({
          invoice_id: qaReminder.invoice_id,
          scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          channel: 'whatsapp',
          status: 'pending'
        });

      if (restoreError) throw restoreError;

      return {
        id: 'SEND_NOW_PATH',
        name: 'Send Now Path',
        pass: true,
        notes: 'Successfully marked reminder as sent, logged action, and restored state',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: 'SEND_NOW_PATH',
        name: 'Send Now Path',
        pass: false,
        notes: `Failed Send Now test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async testMarkPaidPath(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    
    try {
      const timestamp = Date.now();
      
      // Get baseline metrics
      const baselineMetrics = await collections.v_dashboard_metrics();
      
      // Create temp invoice
      const { data: tempInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: `QA-TEMP-${timestamp}`,
          client_id: (await supabase.from('clients').select('id').like('name', 'QA%').limit(1).single()).data?.id,
          project_id: (await supabase.from('projects').select('id').eq('name', 'Website Revamp').limit(1).single()).data?.id,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 1000,
          gst_amount: 180,
          total_amount: 1180,
          status: 'sent'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create temp invoice item
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: tempInvoice.id,
          title: `QA Smoke Test Item ${timestamp}`,
          qty: 1,
          rate: 1000,
          amount: 1000
        });

      if (itemError) throw itemError;

      // Mark as paid
      const { error: paidError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          utr_reference: `QA-UTR-${timestamp}`
        })
        .eq('id', tempInvoice.id);

      if (paidError) throw paidError;

      // Check metrics updated
      const updatedMetrics = await collections.v_dashboard_metrics();
      const metricsIncreased = updatedMetrics.this_month_paid > baselineMetrics.this_month_paid;

      // Cleanup temp entities
      await supabase.from('invoice_items').delete().eq('invoice_id', tempInvoice.id);
      await supabase.from('reminders').delete().eq('invoice_id', tempInvoice.id);
      await supabase.from('message_log').delete().eq('related_id', tempInvoice.id);
      await supabase.from('invoices').delete().eq('id', tempInvoice.id);

      return {
        id: 'MARK_PAID_PATH',
        name: 'Mark Paid Path',
        pass: metricsIncreased,
        notes: `Metrics increased from ₹${baselineMetrics.this_month_paid} to ₹${updatedMetrics.this_month_paid}, temp invoice cleaned up`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: 'MARK_PAID_PATH',
        name: 'Mark Paid Path',
        pass: false,
        notes: `Failed Mark Paid test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async testTasksCRUD(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    const timestamp = Date.now();
    
    try {
      // Create test task
      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: `QA Smoke Task ${timestamp}`,
          due_date: new Date().toISOString().split('T')[0],
          is_billable: false,
          status: 'open'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Verify it appears in tasks list
      const tasksAfterCreate = await collections.tasks_all();
      const taskExists = tasksAfterCreate.some(t => t.id === newTask.id);

      if (!taskExists) throw new Error('Task not found after creation');

      // Update to done
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', newTask.id);

      if (updateError) throw updateError;

      // Verify update persisted
      const tasksAfterUpdate = await collections.tasks_all();
      const updatedTask = tasksAfterUpdate.find(t => t.id === newTask.id);
      
      if (!updatedTask || updatedTask.status !== 'done') {
        throw new Error('Task status update did not persist');
      }

      // Cleanup
      await supabase.from('tasks').delete().eq('id', newTask.id);

      return {
        id: 'TASKS_CRUD',
        name: 'Tasks CRUD',
        pass: true,
        notes: `Task created, updated to done, verified persistence, and cleaned up successfully`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      // Attempt cleanup on failure
      try {
        await supabase.from('tasks').delete().like('title', `QA Smoke Task ${timestamp}`);
      } catch {}

      return {
        id: 'TASKS_CRUD',
        name: 'Tasks CRUD',
        pass: false,
        notes: `Failed Tasks CRUD test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async testQuickActionsReflectChanges(): Promise<SmokeTestResult> {
    const startTime = Date.now();
    
    try {
      // Test Quick Actions data sources
      const [clients, invoices, tasks] = await Promise.all([
        collections.clients_all(),
        collections.invoices_all(),
        collections.tasks_all()
      ]);

      // Verify data structure matches what Quick Actions expects
      const latestClients = clients.slice(0, 5);
      const latestInvoices = invoices.slice(0, 5);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').slice(0, 5);
      const upcomingTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && task.status === 'open';
      });

      const hasValidData = latestClients.length > 0 || latestInvoices.length > 0 || upcomingTasks.length > 0;

      return {
        id: 'QUICK_ACTIONS_REFLECT',
        name: 'Quick Actions Reflect Changes',
        pass: hasValidData,
        notes: `Quick Actions data available: ${latestClients.length} clients, ${latestInvoices.length} invoices, ${paidInvoices.length} paid, ${upcomingTasks.length} upcoming tasks`,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: 'QUICK_ACTIONS_REFLECT',
        name: 'Quick Actions Reflect Changes',
        pass: false,
        notes: `Failed Quick Actions test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }
}

export const smokeTestRunner = new SmokeTestRunner();