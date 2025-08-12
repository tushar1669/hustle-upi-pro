// QA Test Harness - Main QA Page

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  Settings, 
  Download, 
  Home, 
  FileText, 
  Users, 
  CheckSquare, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench
} from 'lucide-react';

// Import QA system components
import { qaTestRunner } from '@/qa/testRunner';
import { QA_TESTS } from '@/qa/tests';
import type { QATestResult } from '@/qa/localStorage';
import type { TestRunSummary } from '@/qa/testRunner';

// Import Supabase and collections for demo data
import { supabase } from '@/lib/supabase';
import * as collections from '@/data/collections';

export default function QA() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixMode, setFixMode] = useState(qaTestRunner.getFixMode());
  const [results, setResults] = useState<QATestResult[]>([]);
  const [summary, setSummary] = useState<TestRunSummary | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string>('');
  
  // Demo Data Management State
  const [isPopulating, setIsPopulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [demoDataCounts, setDemoDataCounts] = useState({
    clients: 0,
    projects: 0,
    invoices: 0,
    items: 0,
    tasks: 0,
    reminders: 0,
    logs: 0
  });

  useEffect(() => {
    // Load initial results
    const savedResults = qaTestRunner.getLastResults();
    setResults(savedResults);
    
    if (savedResults.length > 0) {
      const lastRun = Math.max(...savedResults.map(r => new Date(r.lastRun).getTime()));
      setLastRunTime(new Date(lastRun).toLocaleString());
    }
    
    // Load demo data counts
    loadDemoDataCounts();
  }, []);

  const loadDemoDataCounts = async () => {
    try {
      const sb = supabase();
      
      // Count QA entities
      const [clientsRes, projectsRes, invoicesRes, itemsRes, tasksRes, remindersRes, logsRes] = await Promise.all([
        sb.from('clients').select('id', { count: 'exact' }).or('name.eq.Acme Studios,name.eq.Bright Ideas,name.eq.Creative Minds,name.eq.QA Co'),
        sb.from('projects').select('id', { count: 'exact' }).eq('name', 'Website Revamp'),
        sb.from('invoices').select('id', { count: 'exact' }).like('invoice_number', 'QA-%'),
        sb.from('invoice_items').select('id', { count: 'exact' }).in('title', ['UI Design Sprint', 'Brand Kit', 'Content Pack']),
        sb.from('tasks').select('id', { count: 'exact' }).or('title.eq.Send assets to Acme,title.eq.Bright Ideas review call,title.eq.Portfolio refresh'),
        sb.from('reminders').select('id', { count: 'exact' }).eq('status', 'pending'),
        sb.from('message_log').select('id', { count: 'exact' }).eq('related_type', 'qa').limit(10)
      ]);
      
      setDemoDataCounts({
        clients: clientsRes.count || 0,
        projects: projectsRes.count || 0,
        invoices: invoicesRes.count || 0,
        items: itemsRes.count || 0,
        tasks: tasksRes.count || 0,
        reminders: remindersRes.count || 0,
        logs: logsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading demo data counts:', error);
    }
  };

  const handleRunAllTests = async () => {
    setIsRunning(true);
    try {
      const testSummary = await qaTestRunner.runAllTests();
      setResults(testSummary.results);
      setSummary(testSummary);
      setLastRunTime(new Date().toLocaleString());
      
      toast({
        title: 'Tests Completed',
        description: `${testSummary.passed}/${testSummary.totalTests} tests passed`,
        variant: testSummary.failed > 0 ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Test Run Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFixFailed = async () => {
    if (!fixMode) {
      toast({
        title: 'Fix Mode Disabled',
        description: 'Enable Fix Mode to apply automated fixes',
        variant: 'destructive'
      });
      return;
    }

    setIsFixing(true);
    try {
      const testSummary = await qaTestRunner.fixFailedTests();
      setResults(testSummary.results);
      setSummary(testSummary);
      setLastRunTime(new Date().toLocaleString());
      
      toast({
        title: 'Fixes Applied',
        description: `${testSummary.fixed} fixes applied, ${testSummary.reverted} reverted`,
        variant: testSummary.reverted > 0 ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Fix Application Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleRunSingleTest = async (testId: string) => {
    try {
      const result = await qaTestRunner.runSingleTest(testId);
      setResults(prev => prev.map(r => r.id === testId ? result : r));
      
      toast({
        title: `Test ${result.pass ? 'Passed' : 'Failed'}`,
        description: result.notes || `${result.name} ${result.pass ? 'completed successfully' : 'failed'}`,
        variant: result.pass ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleFixSingleTest = async (testId: string) => {
    if (!fixMode) {
      toast({
        title: 'Fix Mode Disabled',
        description: 'Enable Fix Mode to apply automated fixes',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await qaTestRunner.fixFailedTest(testId);
      setResults(prev => prev.map(r => r.id === testId ? result : r));
      
      toast({
        title: result.fixApplied ? 'Fix Applied' : 'Fix Failed',
        description: result.notes || `${result.name} fix ${result.fixApplied ? 'applied successfully' : 'failed'}`,
        variant: result.fixApplied ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Fix Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleToggleFixMode = (enabled: boolean) => {
    setFixMode(enabled);
    qaTestRunner.setFixMode(enabled);
    
      toast({
        title: `Fix Mode ${enabled ? 'Enabled' : 'Disabled'}`,
        description: enabled ? 'Automated fixes will be applied to failing tests' : 'Tests will run in read-only mode'
      });
  };

  const handleExportReport = () => {
    const exportData = qaTestRunner.exportResults();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report Exported',
      description: 'QA test report downloaded successfully'
    });
  };

  const populateDemoData = async () => {
    setIsPopulating(true);
    try {
      const sb = supabase();
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Ensure settings exist
      const existingSettings = await collections.settings_one();
      if (!existingSettings) {
        await sb.from('settings').insert({
          creator_display_name: 'HustleHub Demo',
          upi_vpa: 'demo@upi',
          default_gst_percent: 18,
          invoice_prefix: 'HH'
        });
      }

      // 2. Create clients (idempotent)
      const clientsToCreate = [
        { name: 'Acme Studios', whatsapp: '+1234567890', email: 'contact@acmestudios.com', upi_vpa: 'acmestudios@upi' },
        { name: 'Bright Ideas', whatsapp: '+1234567891', email: 'hello@brightideas.com', upi_vpa: 'bright@upi' },
        { name: 'Creative Minds', whatsapp: '+1234567892', email: 'info@creativeminds.com', upi_vpa: null },
        { name: 'QA Co', whatsapp: '+1234567893', email: 'test@qaco.com', upi_vpa: 'qaco@upi' }
      ];

      const createdClients = [];
      for (const clientData of clientsToCreate) {
        const { data: existing } = await sb.from('clients').select('*').eq('name', clientData.name).single();
        if (!existing) {
          const { data: newClient } = await sb.from('clients').insert(clientData).select('*').single();
          createdClients.push(newClient);
        } else {
          createdClients.push(existing);
        }
      }

      const acmeClient = createdClients.find(c => c.name === 'Acme Studios');

      // 3. Create project for Acme Studios
      const { data: existingProject } = await sb.from('projects').select('*').eq('name', 'Website Revamp').single();
      let project = existingProject;
      if (!existingProject && acmeClient) {
        const { data: newProject } = await sb.from('projects').insert({
          client_id: acmeClient.id,
          name: 'Website Revamp',
          is_billable: true
        }).select('*').single();
        project = newProject;
      }

      // 4. Create invoices (check by invoice_number)
      const invoicesToCreate = [
        {
          invoice_number: 'QA-2025-1001',
          client_id: acmeClient?.id,
          project_id: project?.id,
          issue_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 25000,
          gst_amount: 4500,
          total_amount: 29500,
          status: 'paid' as const,
          paid_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          utr_reference: 'UTR-QA-1'
        },
        {
          invoice_number: 'QA-2025-1002',
          client_id: acmeClient?.id,
          project_id: project?.id,
          issue_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 18000,
          gst_amount: 3240,
          total_amount: 21240,
          status: 'sent' as const
        },
        {
          invoice_number: 'QA-2025-1003',
          client_id: acmeClient?.id,
          project_id: project?.id,
          issue_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 10000,
          gst_amount: 1800,
          total_amount: 11800,
          status: 'overdue' as const
        }
      ];

      const createdInvoices = [];
      for (const invoiceData of invoicesToCreate) {
        const { data: existing } = await sb.from('invoices').select('*').eq('invoice_number', invoiceData.invoice_number).single();
        if (!existing && invoiceData.client_id) {
          const { data: newInvoice, error } = await sb.from('invoices').insert(invoiceData).select('*').single();
          if (error) throw error;
          createdInvoices.push(newInvoice);
        } else if (existing) {
          createdInvoices.push(existing);
        }
      }

      // 5. Create invoice items
      const itemsToCreate = [
        { title: 'UI Design Sprint', amount: 25000 },
        { title: 'Brand Kit', amount: 18000 },
        { title: 'Content Pack', amount: 10000 }
      ];

      for (let i = 0; i < createdInvoices.length && i < itemsToCreate.length; i++) {
        const invoice = createdInvoices[i];
        const itemData = itemsToCreate[i];
        
        const { data: existingItem } = await sb.from('invoice_items').select('*').eq('invoice_id', invoice.id).eq('title', itemData.title).single();
        if (!existingItem) {
          await sb.from('invoice_items').insert({
            invoice_id: invoice.id,
            title: itemData.title,
            qty: 1,
            rate: itemData.amount,
            amount: itemData.amount
          });
        }
      }

      // 6. Create reminders for sent/overdue invoices
      const sentInvoice = createdInvoices.find(inv => inv.invoice_number === 'QA-2025-1002');
      const overdueInvoice = createdInvoices.find(inv => inv.invoice_number === 'QA-2025-1003');
      
      for (const invoice of [sentInvoice, overdueInvoice].filter(Boolean)) {
        const { data: existingReminders } = await sb.from('reminders').select('*').eq('invoice_id', invoice.id).eq('status', 'pending');
        const existingCount = existingReminders?.length || 0;
        
        if (existingCount < 3) {
          const reminderDates = [3, 7, 14].slice(existingCount);
          for (const days of reminderDates) {
            await sb.from('reminders').insert({
              invoice_id: invoice.id,
              scheduled_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
              channel: 'whatsapp' as const,
              status: 'pending' as const
            });
          }
        }
      }

      // 7. Create tasks
      const tasksToCreate = [
        { title: 'Send assets to Acme', due_date: today, is_billable: true, status: 'open' as const },
        { title: 'Bright Ideas review call', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_billable: false, status: 'open' as const },
        { title: 'Portfolio refresh', due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_billable: false, status: 'open' as const }
      ];

      for (const taskData of tasksToCreate) {
        const { data: existing } = await sb.from('tasks').select('*').eq('title', taskData.title).single();
        if (!existing) {
          await sb.from('tasks').insert(taskData);
        }
      }

      // 8. Create sample message log entries
      const logEntries = [
        { related_type: 'qa' as const, related_id: 'demo', template_used: 'invoice_draft', outcome: 'created', channel: 'whatsapp' as const },
        { related_type: 'qa' as const, related_id: 'demo', template_used: 'invoice_sent', outcome: 'delivered', channel: 'email' as const },
        { related_type: 'qa' as const, related_id: 'demo', template_used: 'reminder_sent', outcome: 'delivered', channel: 'whatsapp' as const },
        { related_type: 'qa' as const, related_id: 'demo', template_used: 'invoice_paid', outcome: 'confirmed', channel: 'email' as const },
        { related_type: 'qa' as const, related_id: 'demo', template_used: 'task_created', outcome: 'logged', channel: 'whatsapp' as const }
      ];

      for (const logEntry of logEntries) {
        await sb.from('message_log').insert(logEntry);
      }

      // 9. Log the seeding operation
      await sb.from('message_log').insert({
        related_type: 'qa' as const,
        related_id: 'seeder',
        template_used: 'qa_seed',
        outcome: 'applied',
        channel: 'whatsapp' as const
      });

      // Reload counts
      await loadDemoDataCounts();

      // Auto-run tests after successful population
      setTimeout(() => {
        handleRunAllTests();
      }, 1000);

      toast({
        title: 'Demo Data Populated',
        description: 'Successfully created demo clients, invoices, tasks, and reminders'
      });

    } catch (error) {
      console.error('Error populating demo data:', error);
      toast({
        title: 'Population Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const resetDemoData = async () => {
    setIsResetting(true);
    try {
      const sb = supabase();

      // Delete QA invoices and their related data (cascades)
      await sb.from('invoices').delete().like('invoice_number', 'QA-%');

      // Delete QA clients
      await sb.from('clients').delete().or('name.eq.Acme Studios,name.eq.Bright Ideas,name.eq.Creative Minds,name.eq.QA Co');

      // Delete QA projects
      await sb.from('projects').delete().eq('name', 'Website Revamp');

      // Delete QA tasks
      await sb.from('tasks').delete().or('title.eq.Send assets to Acme,title.eq.Bright Ideas review call,title.eq.Portfolio refresh');

      // Delete QA message logs
      await sb.from('message_log').delete().eq('related_type', 'qa');

      // Log the reset operation
      await sb.from('message_log').insert({
        related_type: 'qa' as const,
        related_id: 'seeder',
        template_used: 'qa_reset',
        outcome: 'applied',
        channel: 'whatsapp' as const
      });

      // Reload counts
      await loadDemoDataCounts();

      toast({
        title: 'Demo Data Reset',
        description: 'Successfully removed all QA test data'
      });

    } catch (error) {
      console.error('Error resetting demo data:', error);
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusIcon = (result: QATestResult) => {
    if (result.fixApplied) return <Wrench className="h-4 w-4 text-primary" />;
    if (result.reverted) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (result.pass) return <CheckCircle className="h-4 w-4 text-success" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (result: QATestResult) => {
    if (result.reverted) return <Badge variant="destructive">Reverted</Badge>;
    if (result.fixApplied) return <Badge variant="default">Fixed</Badge>;
    if (result.pass) return <Badge variant="secondary">✅</Badge>;
    return <Badge variant="destructive">❌</Badge>;
  };

  const failedCount = results.filter(r => !r.pass).length;
  const passedCount = results.filter(r => r.pass).length;
  const fixedCount = results.filter(r => r.fixApplied).length;
  const revertedCount = results.filter(r => r.reverted).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">HustleHub QA — Automated Health Check</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive test suite with self-healing capabilities
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Navigation */}
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/invoices">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Invoices
                </Button>
              </Link>
              <Link to="/follow-ups">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Follow-ups
                </Button>
              </Link>
              <Link to="/tasks">
                <Button variant="outline" size="sm">
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Tasks
                </Button>
              </Link>
              <Link to="/clients">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-1" />
                  Clients
                </Button>
              </Link>
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-2 border-l pl-3">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={fixMode} 
                  onCheckedChange={handleToggleFixMode}
                />
                <span className="text-sm font-medium">Fix Mode</span>
              </div>
              
              <Button 
                onClick={handleRunAllTests} 
                disabled={isRunning || isFixing}
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" />
                {isRunning ? 'Running...' : 'Run All Tests'}
              </Button>
              
              <Button 
                onClick={handleFixFailed} 
                disabled={isRunning || isFixing || !fixMode || failedCount === 0}
                variant="secondary"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-1" />
                {isFixing ? 'Fixing...' : 'Fix Failed'}
              </Button>
              
              <Button 
                onClick={handleExportReport} 
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-success">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{passedCount}</div>
              <p className="text-xs text-muted-foreground">Tests passing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{failedCount}</div>
              <p className="text-xs text-muted-foreground">Tests failing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary">Fixed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{fixedCount}</div>
              <p className="text-xs text-muted-foreground">Auto-fixed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-warning">Reverted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{revertedCount}</div>
              <p className="text-xs text-muted-foreground">Fixes reverted</p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Management Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Demo Data Management
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Populate or reset test data for comprehensive QA testing
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={populateDemoData} 
                  disabled={isPopulating || isResetting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isPopulating ? 'Populating...' : 'Populate Demo Data'}
                </Button>
                
                <Button 
                  onClick={resetDemoData} 
                  disabled={isPopulating || isResetting}
                  variant="destructive"
                >
                  {isResetting ? 'Resetting...' : 'Reset Demo Data'}
                </Button>
              </div>

              {/* Status Counts */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{demoDataCounts.clients}</div>
                  <div className="text-xs text-muted-foreground">QA Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{demoDataCounts.invoices}</div>
                  <div className="text-xs text-muted-foreground">QA Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{demoDataCounts.tasks}</div>
                  <div className="text-xs text-muted-foreground">QA Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{demoDataCounts.reminders}</div>
                  <div className="text-xs text-muted-foreground">Pending Reminders</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-xs text-muted-foreground">
                <p>• Populate creates idempotent test data (clients, invoices, tasks, reminders)</p>
                <p>• Reset safely removes only QA-prefixed entities</p>
                <p>• Auto-runs test suite after successful population</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Results</CardTitle>
              {lastRunTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last run: {lastRunTime}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Last Run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {QA_TESTS.map(test => {
                  const result = results.find(r => r.id === test.id);
                  return (
                    <TableRow key={test.id}>
                      <TableCell className="font-mono text-sm">{test.id}</TableCell>
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result ? getStatusIcon(result) : <Clock className="h-4 w-4 text-muted-foreground" />}
                          {result ? getStatusBadge(result) : <Badge variant="outline">Not Run</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm text-muted-foreground" title={result?.notes}>
                          {result?.notes || 'No notes available'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRunSingleTest(test.id)}
                            disabled={isRunning || isFixing}
                          >
                            Run
                          </Button>
                          {test.fix && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleFixSingleTest(test.id)}
                              disabled={isRunning || isFixing || !fixMode || result?.pass}
                            >
                              Fix
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result?.lastRun ? new Date(result.lastRun).toLocaleString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary Banner */}
        {summary && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Last Run Summary</h3>
                <p className="text-muted-foreground">
                  {summary.passed} of {summary.totalTests} tests passed
                  {summary.fixed > 0 && `, ${summary.fixed} automatically fixed`}
                  {summary.reverted > 0 && `, ${summary.reverted} fixes reverted due to regressions`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}