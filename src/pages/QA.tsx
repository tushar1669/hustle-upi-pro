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
import { smokeTestRunner, type SmokeTestSummary } from '@/qa/smokeTests';
import { featureTestRunner, FEATURE_TESTS, type FeatureTestResult, type FeatureTestSummary } from '@/qa/featureTests';

// Import Supabase and collections for demo data
import { supabase } from '@/integrations/supabase/client';
import * as collections from '@/data/collections';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '@/hooks/useCache';

export default function QA() {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixMode, setFixMode] = useState(qaTestRunner.getFixMode());
  const [results, setResults] = useState<QATestResult[]>([]);
  const [summary, setSummary] = useState<TestRunSummary | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string>('');
  
  // Test Runner State
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRunningSmokeTests, setIsRunningSmokeTests] = useState(false);
  const [smokeTestResults, setSmokeTestResults] = useState<SmokeTestSummary | null>(null);
  const [testRunnerStatus, setTestRunnerStatus] = useState<string>('Ready');
  
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

  // Feature Tests State
  const [isRunningFeatureTests, setIsRunningFeatureTests] = useState(false);
  const [featureTestResults, setFeatureTestResults] = useState<FeatureTestResult[]>([]);
  const [featureTestSummary, setFeatureTestSummary] = useState<FeatureTestSummary | null>(null);

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
    
    // Load smoke test results if available
    const savedSmokeResults = localStorage.getItem('qa:smokeTestResults');
    if (savedSmokeResults) {
      try {
        setSmokeTestResults(JSON.parse(savedSmokeResults));
      } catch {}
    }
    
    // Load feature test results if available
    const savedFeatureResults = featureTestRunner.getLastResults();
    setFeatureTestResults(savedFeatureResults);
    if (savedFeatureResults.length > 0) {
      const featureSummary = featureTestRunner.exportResults();
      setFeatureTestSummary(featureSummary);
    }
  }, []);

  const loadDemoDataCounts = async () => {
    try {
      // Use the correct supabase import
      
      // Count QA entities
      const [clientsRes, projectsRes, invoicesRes, itemsRes, tasksRes, remindersRes, logsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }).or('name.eq.Acme Studios,name.eq.Bright Ideas,name.eq.Creative Minds,name.eq.QA Co'),
        supabase.from('projects').select('id', { count: 'exact' }).eq('name', 'Website Revamp'),
        supabase.from('invoices').select('id', { count: 'exact' }).or('invoice_number.like.QA-%,invoice_number.like.HH-%'),
        supabase.from('invoice_items').select('id', { count: 'exact' }).in('title', ['UI Design Sprint', 'Brand Kit', 'Content Pack']),
        supabase.from('tasks').select('id', { count: 'exact' }).or('title.eq.Send assets to Acme,title.eq.Bright Ideas review call,title.eq.Portfolio refresh'),
        supabase.from('reminders').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('message_log').select('id', { count: 'exact' }).eq('related_type', 'qa').limit(10)
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

  // Feature Tests Handlers
  const handleRunFeatureTests = async () => {
    setIsRunningFeatureTests(true);
    setTestRunnerStatus('Running Feature Tests...');
    
    try {
      const featureSummary = await featureTestRunner.runAllTests();
      setFeatureTestResults(featureSummary.results);
      setFeatureTestSummary(featureSummary);
      
      toast({
        title: 'Feature Tests Completed',
        description: `${featureSummary.passed}/${featureSummary.total} feature tests passed`,
        variant: featureSummary.failed > 0 ? 'destructive' : 'default'
      });
      
      setTestRunnerStatus('Feature tests completed');
    } catch (error) {
      setTestRunnerStatus('Feature tests failed');
      toast({
        title: 'Feature Tests Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsRunningFeatureTests(false);
      setTimeout(() => setTestRunnerStatus('Ready'), 2000);
    }
  };

  const handleRunSingleFeatureTest = async (testId: string) => {
    try {
      const result = await featureTestRunner.runSingleTest(testId);
      setFeatureTestResults(prev => prev.map(r => r.id === testId ? result : r));
      
      toast({
        title: `${result.status === 'passed' ? 'Test Passed' : result.status === 'failed' ? 'Test Failed' : 'Test Skipped'}`,
        description: result.notes || `${result.name} ${result.status}`,
        variant: result.status === 'failed' ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Feature Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleExportCombinedReport = () => {
    const qaResults = qaTestRunner.exportResults();
    const featureResults = featureTestRunner.exportResults();
    
    const combinedExport = {
      timestamp: new Date().toISOString(),
      qaTests: qaResults,
      featureTests: featureResults,
      smokeTests: smokeTestResults || null,
      summary: {
        qaTestsPassed: results.filter(r => r.pass).length,
        qaTestsFailed: results.filter(r => !r.pass).length,
        qaTestsTotal: results.length,
        featureTestsPassed: featureTestResults.filter(r => r.status === 'passed').length,
        featureTestsFailed: featureTestResults.filter(r => r.status === 'failed').length,
        featureTestsSkipped: featureTestResults.filter(r => r.status === 'skipped').length,
        featureTestsTotal: featureTestResults.length,
        smokeTestsPassed: smokeTestResults?.passed || 0,
        smokeTestsFailed: smokeTestResults?.failed || 0,
        smokeTestsTotal: smokeTestResults?.totalTests || 0
      },
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(combinedExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hustlehub-combined-qa-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Combined Report Exported',
      description: 'Complete QA, Feature, and Smoke test report downloaded successfully'
    });
  };

  // Test Runner Functions
  const handleSeedIfNeeded = async () => {
    setIsSeeding(true);
    setTestRunnerStatus('Checking for demo data...');
    
    try {
      // Check if QA data already exists
      const { data: qaInvoices, error } = await supabase
        .from('invoices')
        .select('id')
        .or('invoice_number.like.QA-%,invoice_number.like.HH-%');

      if (error) throw error;

      if (qaInvoices && qaInvoices.length > 0) {
        setTestRunnerStatus('Demo data already exists');
        toast({
          title: 'Demo Data Already Exists',
          description: `Found ${qaInvoices.length} QA invoices, skipping seed operation`,
          variant: 'default'
        });
        return;
      }

      setTestRunnerStatus('Seeding demo data...');
      await populateDemoData();
      setTestRunnerStatus('Seeding completed');
      
      // Invalidate all caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SETTINGS }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLIENTS }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES }),
        queryClient.invalidateQueries({ queryKey: ['invoice_items'] }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD })
      ]);

    } catch (error) {
      setTestRunnerStatus('Seeding failed');
      toast({
        title: 'Seeding Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setTestRunnerStatus('Ready'), 2000);
    }
  };

  const handleRunAllQATests = async () => {
    setTestRunnerStatus('Running QA tests...');
    qaTestRunner.setFixMode(false); // Force fix mode OFF for this run
    await handleRunAllTests();
    setTestRunnerStatus('QA tests completed');
    setTimeout(() => setTestRunnerStatus('Ready'), 2000);
  };

  const handleRunSmokeTests = async () => {
    setIsRunningSmokeTests(true);
    setTestRunnerStatus('Running smoke tests...');
    
    try {
      const smokeResults = await smokeTestRunner.runAllSmokeTests();
      setSmokeTestResults(smokeResults);
      
      // Save to localStorage
      localStorage.setItem('qa:smokeTestResults', JSON.stringify(smokeResults));
      
      toast({
        title: 'Smoke Tests Completed',
        description: `${smokeResults.passed}/${smokeResults.totalTests} smoke tests passed`,
        variant: smokeResults.failed > 0 ? 'destructive' : 'default'
      });
      
      setTestRunnerStatus('Smoke tests completed');
    } catch (error) {
      setTestRunnerStatus('Smoke tests failed');
      toast({
        title: 'Smoke Tests Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsRunningSmokeTests(false);
      setTimeout(() => setTestRunnerStatus('Ready'), 2000);
    }
  };

  const handleExportFullReport = () => {
    const qaResults = qaTestRunner.exportResults();
    const exportData = {
      timestamp: new Date().toISOString(),
      qaTests: qaResults,
      smokeTests: smokeTestResults || null,
      summary: {
        qaTestsPassed: results.filter(r => r.pass).length,
        qaTestsFailed: results.filter(r => !r.pass).length,
        qaTestsTotal: results.length,
        smokeTestsPassed: smokeTestResults?.passed || 0,
        smokeTestsFailed: smokeTestResults?.failed || 0,
        smokeTestsTotal: smokeTestResults?.totalTests || 0
      },
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hustlehub-qa-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Full Report Exported',
      description: 'Complete QA and smoke test report downloaded successfully'
    });
  };

  const populateDemoData = async () => {
    setIsPopulating(true);
    toast({ title: "🚀 Starting demo data population..." });
    
    try {
      let createdCounts = { settings: 0, clients: 0, projects: 0, invoices: 0, items: 0, reminders: 0, tasks: 0, logs: 0 };
      
      // Test connection first
      const { error: testError } = await supabase.from('clients').select('count', { count: 'exact' }).limit(1);
      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      // 1. Ensure settings exist (idempotent)
      const { data: existingSettings } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (!existingSettings) {
        const { error: settingsError } = await supabase.from('settings').insert({
          creator_display_name: 'HustleHub Demo',
          upi_vpa: 'demo@upi',
          default_gst_percent: 18,
          invoice_prefix: 'HH'
        });
        if (settingsError) throw new Error(`Settings creation failed: ${settingsError.message}`);
        createdCounts.settings = 1;
      }

      // 2. Create clients (idempotent by name)
      const clientsToCreate = [
        { name: 'Acme Studios', whatsapp: '+1234567890', email: 'contact@acmestudios.com', upi_vpa: 'acmestudios@upi' },
        { name: 'Bright Ideas', whatsapp: '+1234567891', email: 'hello@brightideas.com', upi_vpa: 'bright@upi' },
        { name: 'Creative Minds', whatsapp: '+1234567892', email: 'info@creativeminds.com', upi_vpa: null },
        { name: 'QA Co', whatsapp: '+1234567893', email: 'test@qaco.com', upi_vpa: 'qaco@upi' }
      ];

      const clients = [];
      for (const clientData of clientsToCreate) {
        const { data: existing } = await supabase.from('clients').select('*').eq('name', clientData.name).maybeSingle();
        if (!existing) {
          const { data: newClient, error } = await supabase.from('clients').insert(clientData).select('*').single();
          if (error) throw new Error(`Client creation failed for ${clientData.name}: ${error.message}`);
          clients.push(newClient);
          createdCounts.clients++;
        } else {
          clients.push(existing);
        }
      }

      const acmeClient = clients.find(c => c.name === 'Acme Studios');

      // 3. Create project for Acme Studios (idempotent)
      let project = null;
      if (acmeClient) {
        const { data: existingProject } = await supabase.from('projects').select('*').eq('name', 'Website Revamp').eq('client_id', acmeClient.id).maybeSingle();
        if (!existingProject) {
          const { data: newProject, error } = await supabase.from('projects').insert({
            client_id: acmeClient.id,
            name: 'Website Revamp',
            is_billable: true
          }).select('*').single();
          if (error) throw new Error(`Project creation failed: ${error.message}`);
          project = newProject;
          createdCounts.projects = 1;
        } else {
          project = existingProject;
        }
      }

      // 4. Create QA invoices (idempotent by invoice_number)
      // Get settings to use correct invoice prefix
      const { data: settings } = await supabase.from('settings').select('invoice_prefix').limit(1).maybeSingle();
      const prefix = settings?.invoice_prefix || 'HH';
      
      const invoicesToCreate = [
        {
          invoice_number: `${prefix}-2025-1001`,
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
          invoice_number: `${prefix}-2025-1002`,
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
          invoice_number: `${prefix}-2025-1003`,
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

      const invoices = [];
      for (const invoiceData of invoicesToCreate) {
        const { data: existing } = await supabase.from('invoices').select('*').eq('invoice_number', invoiceData.invoice_number).maybeSingle();
        if (!existing && invoiceData.client_id) {
          const { data: newInvoice, error } = await supabase.from('invoices').insert(invoiceData).select('*').single();
          if (error) throw new Error(`Invoice creation failed for ${invoiceData.invoice_number}: ${error.message}`);
          invoices.push(newInvoice);
          createdCounts.invoices++;
        } else if (existing) {
          invoices.push(existing);
        }
      }

      // 5. Create invoice items (idempotent)
      const itemsToCreate = [
        { title: 'UI Design Sprint', amount: 25000 },
        { title: 'Brand Kit', amount: 18000 },
        { title: 'Content Pack', amount: 10000 }
      ];

      for (let i = 0; i < invoices.length && i < itemsToCreate.length; i++) {
        const invoice = invoices[i];
        const itemData = itemsToCreate[i];
        
        const { data: existingItem } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).eq('title', itemData.title).maybeSingle();
        if (!existingItem) {
          const { error } = await supabase.from('invoice_items').insert({
            invoice_id: invoice.id,
            title: itemData.title,
            qty: 1,
            rate: itemData.amount,
            amount: itemData.amount
          });
          if (error) throw new Error(`Invoice item creation failed: ${error.message}`);
          createdCounts.items++;
        }
      }

      // 6. Create reminders for sent/overdue invoices (idempotent)
      const sentInvoice = invoices.find(inv => inv.invoice_number === `${prefix}-2025-1002`);
      const overdueInvoice = invoices.find(inv => inv.invoice_number === `${prefix}-2025-1003`);
      
      for (const invoice of [sentInvoice, overdueInvoice].filter(Boolean)) {
        // Fix: Schedule reminders from issue_date, not current time
        const issueDate = new Date(invoice.issue_date);
        const reminderDates = [3, 7, 14].map(days => new Date(issueDate.getTime() + days * 24 * 60 * 60 * 1000));
        
        for (const reminderDate of reminderDates) {
          const scheduledAt = reminderDate.toISOString();
          const { data: existing } = await supabase.from('reminders').select('*')
            .eq('invoice_id', invoice.id)
            .gte('scheduled_at', new Date(reminderDate.getTime() - 2 * 60 * 60 * 1000).toISOString())
            .lte('scheduled_at', new Date(reminderDate.getTime() + 2 * 60 * 60 * 1000).toISOString())
            .maybeSingle();
            
          if (!existing) {
            const { error } = await supabase.from('reminders').insert({
              invoice_id: invoice.id,
              scheduled_at: scheduledAt,
              channel: 'whatsapp',
              status: 'pending'
            });
            if (error) throw new Error(`Reminder creation failed: ${error.message}`);
            createdCounts.reminders++;
          }
        }
      }

      // 7. Create demo tasks (idempotent by title)
      const tasksToCreate = [
        { title: 'Send assets to Acme', due_date: new Date().toISOString().split('T')[0], is_billable: true, status: 'open' as const },
        { title: 'Bright Ideas review call', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_billable: false, status: 'open' as const },
        { title: 'Portfolio refresh', due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_billable: false, status: 'open' as const }
      ];

      for (const taskData of tasksToCreate) {
        const { data: existing } = await supabase.from('tasks').select('*').eq('title', taskData.title).maybeSingle();
        if (!existing) {
          const { data: newTask, error } = await supabase.from('tasks').insert({
            ...taskData,
            project_id: project?.id || null
          }).select('*').single();
          if (error) throw new Error(`Task creation failed for ${taskData.title}: ${error.message}`);
          createdCounts.tasks++;
          
          // Log task creation
          await supabase.from('message_log').insert({
            related_type: 'task',
            related_id: newTask.id,
            channel: 'whatsapp',
            template_used: 'task_created',
            outcome: 'ok',
            notes: `QA seeded task: ${taskData.title}`
          });
          createdCounts.logs++;
        }
      }

      // 8. Create additional message log entries
      const logEntries = [
        { related_type: 'invoice' as const, related_id: invoices[0]?.id, template_used: 'invoice_draft', outcome: 'ok' },
        { related_type: 'invoice' as const, related_id: invoices[1]?.id, template_used: 'invoice_sent', outcome: 'ok' },
        { related_type: 'invoice' as const, related_id: invoices[0]?.id, template_used: 'invoice_paid', outcome: 'ok' }
      ];

      for (const logData of logEntries.filter(log => log.related_id)) {
        await supabase.from('message_log').insert({
          ...logData,
          channel: 'whatsapp' as const
        });
        createdCounts.logs++;
      }

      // Invalidate all React Query caches
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES });
      await queryClient.invalidateQueries({ queryKey: ['invoice_items'] });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLIENTS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });

      await loadDemoDataCounts();
      
      toast({ 
        title: "✅ Demo data populated successfully!", 
        description: `Created: ${Object.entries(createdCounts).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(', ')}` 
      });

      // Auto-run QA tests after successful population
      setTimeout(() => {
        handleRunAllTests();
      }, 1000);

    } catch (error: any) {
      console.error('Demo data population error:', error);
      toast({ title: "❌ Error populating demo data", description: error.message, variant: "destructive" });
    } finally {
      setIsPopulating(false);
    }
  };

  const resetDemoData = async () => {
    setIsResetting(true);
    toast({ title: "🧹 Starting demo data cleanup..." });
    
    try {
      let deletedCounts = { invoices: 0, items: 0, reminders: 0, tasks: 0, clients: 0, logs: 0 };
      
      // 1. Get QA invoice IDs first (for cascade operations)
      const { data: qaInvoices } = await supabase.from('invoices').select('id').or('invoice_number.like.QA-%,invoice_number.like.HH-%');
      const qaInvoiceIds = qaInvoices?.map(inv => inv.id) || [];
      
      // 2. Delete reminders for QA invoices
      if (qaInvoiceIds.length > 0) {
        const { count: reminderCount } = await supabase.from('reminders')
          .delete({ count: 'exact' })
          .in('invoice_id', qaInvoiceIds);
        deletedCounts.reminders = reminderCount || 0;
      }
      
      // 3. Delete invoice items for QA invoices  
      if (qaInvoiceIds.length > 0) {
        const { count: itemCount } = await supabase.from('invoice_items')
          .delete({ count: 'exact' })
          .in('invoice_id', qaInvoiceIds);
        deletedCounts.items = itemCount || 0;
      }
      
      // 4. Delete invoices with QA- or HH- prefix (both old and new format)
      const { count: invoiceCount } = await supabase.from('invoices')
        .delete({ count: 'exact' })
        .or('invoice_number.like.QA-%,invoice_number.like.HH-%');
      deletedCounts.invoices = invoiceCount || 0;
      
      // 5. Delete specific QA tasks (by title)
      const qaTaskTitles = ['Send assets to Acme', 'Bright Ideas review call', 'Portfolio refresh'];
      const { count: taskCount } = await supabase.from('tasks')
        .delete({ count: 'exact' })
        .in('title', qaTaskTitles);
      deletedCounts.tasks = taskCount || 0;
      
      // 6. Delete QA Co client only (preserve Acme, Bright Ideas, Creative Minds)
      const { count: clientCount } = await supabase.from('clients')
        .delete({ count: 'exact' })
        .eq('name', 'QA Co');
      deletedCounts.clients = clientCount || 0;
      
      // 7. Delete QA-related message logs
      const { count: logCount } = await supabase.from('message_log')
        .delete({ count: 'exact' })
        .or('template_used.eq.task_created,template_used.eq.invoice_draft,template_used.eq.invoice_sent');
      deletedCounts.logs = logCount || 0;

      // Invalidate all React Query caches
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES });
      await queryClient.invalidateQueries({ queryKey: ['invoice_items'] });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLIENTS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });

      await loadDemoDataCounts();
      
      toast({ 
        title: "✅ Demo data reset successfully!", 
        description: `Deleted: ${Object.entries(deletedCounts).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(', ')}` 
      });
    } catch (error: any) {
      console.error('Demo data reset error:', error);
      toast({ title: "❌ Error resetting demo data", description: error.message, variant: "destructive" });
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

        {/* Test Runner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Runner
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Automated testing suite with seeding, QA tests, smoke tests, and reporting
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  onClick={handleSeedIfNeeded} 
                  disabled={isSeeding || isRunning || isRunningSmokeTests}
                  variant="secondary"
                >
                  {isSeeding ? 'Seeding...' : 'Seed If Needed'}
                </Button>
                
                <Button 
                  onClick={handleRunAllQATests} 
                  disabled={isRunning || isSeeding || isRunningSmokeTests}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isRunning ? 'Running...' : 'Run All QA Tests'}
                </Button>
                
                <Button 
                  onClick={handleRunSmokeTests} 
                  disabled={isRunningSmokeTests || isSeeding || isRunning}
                  variant="outline"
                >
                  {isRunningSmokeTests ? 'Running...' : 'Run Smoke Tests'}
                </Button>
                
                <Button 
                  onClick={handleExportFullReport} 
                  disabled={!results.length && !smokeTestResults}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Report
                </Button>
              </div>

              {/* Status Line */}
              <div className="text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-4">
                  <span>Status: {testRunnerStatus}</span>
                  {lastRunTime && <span>Last run: {lastRunTime}</span>}
                  {results.length > 0 && (
                    <>
                      <span>Passed: {results.filter(r => r.pass).length}</span>
                      <span>Failed: {results.filter(r => !r.pass).length}</span>
                    </>
                  )}
                  {smokeTestResults && (
                    <>
                      <span>Smoke: {smokeTestResults.passed}/{smokeTestResults.totalTests}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Tests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Feature Tests
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              MVP Must-Have Feature Validation — Authentication, Settings, Sharing, Follow-ups, Clients, Performance
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  onClick={handleRunFeatureTests} 
                  disabled={isRunningFeatureTests || isSeeding || isRunning || isRunningSmokeTests}
                  className="bg-accent hover:bg-accent/90"
                >
                  {isRunningFeatureTests ? 'Running...' : 'Run Feature Tests'}
                </Button>
                
                <Button 
                  onClick={handleExportCombinedReport} 
                  disabled={!results.length && !smokeTestResults && !featureTestResults.length}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Combined Report
                </Button>
              </div>

              {/* Feature Test Summary Cards */}
              {featureTestSummary && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-success/10 rounded">
                    <div className="text-xl font-bold text-success">{featureTestSummary.passed}</div>
                    <div className="text-xs text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded">
                    <div className="text-xl font-bold text-destructive">{featureTestSummary.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded">
                    <div className="text-xl font-bold text-warning">{featureTestSummary.skipped}</div>
                    <div className="text-xs text-muted-foreground">Skipped</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded">
                    <div className="text-xl font-bold text-primary">{featureTestSummary.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              )}

              {/* Feature Tests Table */}
              {featureTestResults.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                        <TableHead>Last Run</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {FEATURE_TESTS.map(test => {
                        const result = featureTestResults.find(r => r.id === test.id);
                        return (
                          <TableRow key={test.id}>
                            <TableCell className="font-mono text-sm">{test.id}</TableCell>
                            <TableCell className="font-medium">{test.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {result?.status === 'passed' && <CheckCircle className="h-4 w-4 text-success" />}
                                {result?.status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive" />}
                                {result?.status === 'skipped' && <Clock className="h-4 w-4 text-warning" />}
                                {!result && <Clock className="h-4 w-4 text-muted-foreground" />}
                                
                                {result?.status === 'passed' && <Badge variant="secondary">✅</Badge>}
                                {result?.status === 'failed' && <Badge variant="destructive">❌</Badge>}
                                {result?.status === 'skipped' && <Badge variant="outline">⏭️</Badge>}
                                {!result && <Badge variant="outline">Not Run</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate text-sm text-muted-foreground" title={result?.notes}>
                                {result?.notes || test.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRunSingleFeatureTest(test.id)}
                                disabled={isRunningFeatureTests || isSeeding || isRunning || isRunningSmokeTests}
                              >
                                Run
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {result?.lastRun ? new Date(result.lastRun).toLocaleString() : 'Never'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Feature Tests Info */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                <p>• Feature tests validate MVP must-have functionality before production</p>
                <p>• Tests are non-destructive and clean up after themselves</p>
                <p>• Skipped tests indicate features not yet implemented</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Smoke Tests Results */}
        {smokeTestResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Smoke Test Results
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Database-level validation tests - {smokeTestResults.passed}/{smokeTestResults.totalTests} passed
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {smokeTestResults.results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border ${
                      result.pass ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.pass ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium text-sm">{result.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{result.notes}</p>
                    <div className="text-xs text-muted-foreground">
                      {result.executionTime}ms
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Executed at: {new Date(smokeTestResults.executedAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}

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