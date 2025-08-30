// QA Test Harness - Streamlined QA Hub v2

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  Download, 
  Database,
  RotateCcw,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  SkipForward
} from 'lucide-react';

// Import QA system components
import { qaTestRunner } from '@/qa/testRunner';
import { FEATURE_TESTS, type FeatureTestResult, type FeatureTestSummary } from '@/qa/featureTests';
import { seedDemoData, type SeedSummary } from '@/qa/demoSeed';
import { resetDemo, type ResetSummary } from '@/qa/resetDemo';

// Import Supabase for demo data counts
import { supabase } from '@/integrations/supabase/client';

export default function QA() {
  // Feature Tests State
  const [isRunningFeatureTests, setIsRunningFeatureTests] = useState(false);
  const [featureTestResults, setFeatureTestResults] = useState<FeatureTestResult[]>([]);
  const [featureTestSummary, setFeatureTestSummary] = useState<FeatureTestSummary | null>(null);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  
  // Demo Data Management State
  const [isPopulating, setIsPopulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastPopulateTime, setLastPopulateTime] = useState<string>('');
  const [lastResetTime, setLastResetTime] = useState<string>('');
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
    // Load feature test results if available
    const savedFeatureResults = qaTestRunner.getFeatureTestResults();
    setFeatureTestResults(savedFeatureResults);
    
    // Load demo data counts
    loadDemoDataCounts();
    
    // Load last run times from localStorage
    const lastPopulate = localStorage.getItem('qa:lastPopulateTime');
    const lastReset = localStorage.getItem('qa:lastResetTime');
    if (lastPopulate) setLastPopulateTime(lastPopulate);
    if (lastReset) setLastResetTime(lastReset);
  }, []);

  const loadDemoDataCounts = async () => {
    try {
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

  // Demo Data Management Functions
  const handlePopulateDemoData = async () => {
    setIsPopulating(true);
    try {
      const summary = await seedDemoData();
      await loadDemoDataCounts();
      
      const currentTime = new Date().toLocaleString();
      setLastPopulateTime(currentTime);
      localStorage.setItem('qa:lastPopulateTime', currentTime);
      
      toast({
        title: 'Demo Data Populated',
        description: `Created: ${summary.clients} clients, ${summary.invoices} invoices, ${summary.tasks} tasks`,
      });
    } catch (error) {
      toast({
        title: 'Population Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const resetResult = await resetDemo();
      if (resetResult.ok) {
        const summary = await seedDemoData();
        await loadDemoDataCounts();
        
        const currentTime = new Date().toLocaleString();
        setLastResetTime(currentTime);
        localStorage.setItem('qa:lastResetTime', currentTime);
        
        toast({
          title: 'Demo Reset Complete',
          description: `Cleared ${resetResult.tablesCleared.length} tables and re-seeded fresh data`,
        });
      } else {
        throw new Error(resetResult.error || 'Reset failed');
      }
    } catch (error) {
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Feature Tests Handlers
  const handleRunAllFeatureTests = async () => {
    setIsRunningFeatureTests(true);
    
    try {
      const featureSummary = await qaTestRunner.runAllFeatureTests();
      setFeatureTestResults(featureSummary.results);
      setFeatureTestSummary(featureSummary);
      
      toast({
        title: 'Feature Tests Completed',
        description: `${featureSummary.passed}/${featureSummary.total} feature tests passed`,
        variant: featureSummary.failed > 0 ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Feature Tests Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsRunningFeatureTests(false);
    }
  };

  const handleRunSingleFeatureTest = async (testId: string) => {
    setRunningTestId(testId);
    
    try {
      const result = await qaTestRunner.runSingleFeatureTest(testId);
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
    } finally {
      setRunningTestId(null);
    }
  };

  const handleExportReport = () => {
    const exportData = {
      executedAt: new Date().toISOString(),
      featureTests: featureTestSummary,
      demoCounts: demoDataCounts,
      summary: {
        featureTestsPassed: featureTestResults.filter(r => r.status === 'passed').length,
        featureTestsFailed: featureTestResults.filter(r => r.status === 'failed').length,
        featureTestsSkipped: featureTestResults.filter(r => r.status === 'skipped').length,
        featureTestsTotal: featureTestResults.length
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
      title: 'QA Report Exported',
      description: 'Complete system test report downloaded successfully'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <SkipForward className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      skipped: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'passed' ? 'Passed' : status === 'failed' ? 'Failed' : status === 'skipped' ? 'Skipped' : 'Not run'}
      </Badge>
    );
  };

  // Get test result for a specific test ID
  const getTestResult = (testId: string) => {
    return featureTestResults.find(r => r.id === testId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QA Hub v2</h1>
          <p className="text-muted-foreground">Streamlined testing with one-click feature tests</p>
        </div>
        <Button onClick={handleExportReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Header Actions - Single Row */}
      <div className="flex gap-4">
        <Button 
          onClick={handlePopulateDemoData}
          disabled={isPopulating}
          data-testid="qa-populate-demo"
          className="flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          {isPopulating ? 'Populating...' : 'Populate Demo Data'}
        </Button>
        
        <Button 
          onClick={handleResetDemo}
          disabled={isResetting}
          data-testid="qa-reset-demo"
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {isResetting ? 'Resetting...' : 'Reset Demo'}
        </Button>
        
        <Button 
          onClick={handleRunAllFeatureTests}
          disabled={isRunningFeatureTests}
          data-testid="qa-run-all-feature-tests"
          className="flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          {isRunningFeatureTests ? 'Running Tests...' : 'Run Feature Tests'}
        </Button>
      </div>

      {/* Last Run Times */}
      <div className="text-sm text-muted-foreground space-y-1">
        {lastPopulateTime && <div>Last populate: {lastPopulateTime}</div>}
        {lastResetTime && <div>Last reset: {lastResetTime}</div>}
        {featureTestSummary && <div>Last test run: {new Date(featureTestSummary.runTime).toLocaleString()}</div>}
      </div>

      {/* Demo Data Counts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Demo Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{demoDataCounts.clients}</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{demoDataCounts.invoices}</div>
              <div className="text-sm text-muted-foreground">Invoices</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{demoDataCounts.tasks}</div>
              <div className="text-sm text-muted-foreground">Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{demoDataCounts.reminders}</div>
              <div className="text-sm text-muted-foreground">Reminders</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Tests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Feature Tests
            {featureTestSummary && (
              <Badge variant="outline">
                {featureTestSummary.passed}/{featureTestSummary.total} passed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="qa-feature-tests-table">
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURE_TESTS.map((test) => {
                const result = getTestResult(test.id);
                const isRunning = runningTestId === test.id;
                
                return (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-muted-foreground">{test.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result?.status || 'not-run')}
                        {getStatusBadge(result?.status || 'not-run')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {result?.duration ? `${result.duration}ms` : '-'}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {result?.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunSingleFeatureTest(test.id)}
                        disabled={isRunning || isRunningFeatureTests}
                        data-testid={`qa-run-test-${test.id}`}
                        className="flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        {isRunning ? 'Running' : 'Run'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}