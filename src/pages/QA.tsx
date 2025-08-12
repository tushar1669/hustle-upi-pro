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

export default function QA() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixMode, setFixMode] = useState(qaTestRunner.getFixMode());
  const [results, setResults] = useState<QATestResult[]>([]);
  const [summary, setSummary] = useState<TestRunSummary | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string>('');

  useEffect(() => {
    // Load initial results
    const savedResults = qaTestRunner.getLastResults();
    setResults(savedResults);
    
    if (savedResults.length > 0) {
      const lastRun = Math.max(...savedResults.map(r => new Date(r.lastRun).getTime()));
      setLastRunTime(new Date(lastRun).toLocaleString());
    }
  }, []);

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