// QA Test Harness - Test Runner with Self-Healing

import { QA_TESTS, setQAFixesEnabled, type QATest } from './tests';
import { QALocalStorage, type QATestResult, type QARunHistory } from './localStorage';
import { codeSnapshotManager } from './codeSnapshot';
import { create_message_log } from '@/data/collections';
import { supabase } from '@/integrations/supabase/client';
import { runSanityV2, type SanityV2Summary } from './sanityV2';

export interface TestRunSummary {
  totalTests: number;
  passed: number;
  failed: number;
  fixed: number;
  reverted: number;
  results: QATestResult[];
}

export class QATestRunner {
  private isRunning = false;
  private fixMode = false;

  constructor() {
    this.fixMode = QALocalStorage.getFixMode();
    setQAFixesEnabled(false); // Default to false, only enable in QA context
  }

  setFixMode(enabled: boolean): void {
    this.fixMode = enabled;
    QALocalStorage.setFixMode(enabled);
    setQAFixesEnabled(enabled && this.isRunning);
  }

  getFixMode(): boolean {
    return this.fixMode;
  }

  async runSingleTest(testId: string): Promise<QATestResult> {
    const test = QA_TESTS.find(t => t.id === testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const startTime = Date.now();
    
    try {
      const result = await test.run();
      const testResult: QATestResult = {
        id: test.id,
        name: test.name,
        pass: result.pass,
        notes: result.notes,
        lastRun: new Date().toISOString()
      };

      // Log test result to message_log
      await this.logTestResult(testResult, 'qa_check');

      return testResult;
    } catch (error) {
      const errorResult: QATestResult = {
        id: test.id,
        name: test.name,
        pass: false,
        notes: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastRun: new Date().toISOString()
      };

      await this.logTestResult(errorResult, 'qa_check');
      return errorResult;
    }
  }

  async fixFailedTest(testId: string): Promise<QATestResult> {
    if (!this.fixMode) {
      throw new Error('Fix mode is disabled');
    }

    const test = QA_TESTS.find(t => t.id === testId);
    if (!test?.fix) {
      throw new Error(`No fix available for test: ${testId}`);
    }

    // Enable fixes for this operation
    setQAFixesEnabled(true);

    try {
      // Take snapshot before applying fix (placeholder)
      codeSnapshotManager.takeSnapshot(testId, {
        [`virtual-fix-${testId}`]: 'original-state'
      });

      // Apply the fix
      const fixResult = await test.fix();
      
      if (!fixResult.applied) {
        return {
          id: test.id,
          name: test.name,
          pass: false,
          notes: `Fix not applied: ${fixResult.notes}`,
          lastRun: new Date().toISOString()
        };
      }

      // Log fix application
      await this.logTestResult({
        id: test.id,
        name: test.name,
        pass: true,
        notes: fixResult.notes,
        lastRun: new Date().toISOString(),
        fixApplied: true
      }, 'qa_fix');

      // Re-run the test to verify fix
      const verificationResult = await this.runSingleTest(testId);
      
      if (verificationResult.pass) {
        verificationResult.fixApplied = true;
        return verificationResult;
      } else {
        // Fix didn't work, mark as failed
        return {
          ...verificationResult,
          notes: `Fix applied but test still fails: ${verificationResult.notes}`
        };
      }
    } catch (error) {
      return {
        id: test.id,
        name: test.name,
        pass: false,
        notes: `Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastRun: new Date().toISOString()
      };
    } finally {
      setQAFixesEnabled(false);
    }
  }

  async runAllTests(): Promise<TestRunSummary> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    setQAFixesEnabled(this.fixMode);

    try {
      const results: QATestResult[] = [];
      const previouslyPassed = QALocalStorage.getPassedTestIds();

      // Sort tests by dependencies
      const sortedTests = this.sortTestsByDependencies(QA_TESTS);

      for (const test of sortedTests) {
        const result = await this.runSingleTest(test.id);
        results.push(result);
      }

      // Update passed test IDs
      const currentlyPassed = results.filter(r => r.pass).map(r => r.id);
      QALocalStorage.setPassedTestIds(currentlyPassed);
      
      // Save results
      QALocalStorage.setLastResults(results);

      const summary: TestRunSummary = {
        totalTests: results.length,
        passed: results.filter(r => r.pass).length,
        failed: results.filter(r => !r.pass).length,
        fixed: results.filter(r => r.fixApplied).length,
        reverted: results.filter(r => r.reverted).length,
        results
      };

      // Add to run history
      const historyEntry: QARunHistory = {
        timestamp: new Date().toISOString(),
        totalTests: summary.totalTests,
        passed: summary.passed,
        failed: summary.failed,
        fixed: summary.fixed,
        reverted: summary.reverted,
        summary: `${summary.passed}/${summary.totalTests} passed`
      };
      QALocalStorage.addRunHistory(historyEntry);

      return summary;
    } finally {
      this.isRunning = false;
      setQAFixesEnabled(false);
    }
  }

  async fixFailedTests(): Promise<TestRunSummary> {
    if (!this.fixMode) {
      throw new Error('Fix mode is disabled');
    }

    const lastResults = QALocalStorage.getLastResults();
    const failedTests = lastResults.filter(r => !r.pass);

    if (failedTests.length === 0) {
      throw new Error('No failed tests to fix');
    }

    this.isRunning = true;
    setQAFixesEnabled(true);

    try {
      const previouslyPassed = QALocalStorage.getPassedTestIds();
      const fixResults: QATestResult[] = [];

      for (const failedTest of failedTests) {
        const test = QA_TESTS.find(t => t.id === failedTest.id);
        if (test?.fix) {
          // Apply fix and verify
          const fixResult = await this.fixFailedTest(failedTest.id);
          fixResults.push(fixResult);

          // If fix was applied, re-run all previously passing tests to check for regressions
          if (fixResult.fixApplied && fixResult.pass) {
            const regressionCheckResults = await this.checkForRegressions(previouslyPassed, failedTest.id);
            
            if (regressionCheckResults.hasRegressions) {
              // Revert the fix
              await codeSnapshotManager.revertSnapshot(failedTest.id);
              fixResult.reverted = true;
              fixResult.pass = false;
              fixResult.notes = `Fix reverted due to regressions: ${regressionCheckResults.regressionNotes}`;
              
              // Log reversion
              await this.logTestResult(fixResult, 'qa_fix');
            }
          }
        }
      }

      // Re-run all tests to get final state
      return await this.runAllTests();
    } finally {
      this.isRunning = false;
      setQAFixesEnabled(false);
    }
  }

  private async checkForRegressions(previouslyPassedIds: string[], fixedTestId: string): Promise<{ hasRegressions: boolean; regressionNotes: string }> {
    const regressions: string[] = [];

    for (const testId of previouslyPassedIds) {
      if (testId === fixedTestId) continue; // Skip the test we just fixed

      try {
        const result = await this.runSingleTest(testId);
        if (!result.pass) {
          regressions.push(`${testId}: ${result.notes}`);
        }
      } catch (error) {
        regressions.push(`${testId}: execution error`);
      }
    }

    return {
      hasRegressions: regressions.length > 0,
      regressionNotes: regressions.join('; ')
    };
  }

  private sortTestsByDependencies(tests: QATest[]): QATest[] {
    const sorted: QATest[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (test: QATest) => {
      if (visiting.has(test.id)) {
        throw new Error(`Circular dependency detected in test: ${test.id}`);
      }
      if (visited.has(test.id)) {
        return;
      }

      visiting.add(test.id);

      if (test.dependsOn) {
        for (const depId of test.dependsOn) {
          const depTest = tests.find(t => t.id === depId);
          if (depTest) {
            visit(depTest);
          }
        }
      }

      visiting.delete(test.id);
      visited.add(test.id);
      sorted.push(test);
    };

    for (const test of tests) {
      visit(test);
    }

    return sorted;
  }

  private async logTestResult(result: QATestResult, templateUsed: 'qa_check' | 'qa_fix'): Promise<void> {
    try {
      // Generate a UUID for QA test logging since related_id expects UUID
      const qaLogId = crypto.randomUUID();
      
      const outcome = result.pass ? 'pass' : 'fail';
      await create_message_log({
        related_type: 'qa' as any, // Type assertion since 'qa' isn't in the original type
        related_id: qaLogId, // Use generated UUID instead of test ID string
        channel: 'email' as any, // Dummy channel for QA logs
        template_used: templateUsed,
        outcome: JSON.stringify({
          testId: result.id, // Store actual test ID in outcome
          status: outcome,
          notes: result.notes,
          fixApplied: result.fixApplied,
          reverted: result.reverted
        })
      });
    } catch (error) {
      console.warn('Failed to log QA test result:', error);
    }
  }

  exportResults(): object {
    return {
      currentResults: QALocalStorage.getLastResults(),
      runHistory: QALocalStorage.getRunHistory(),
      passedTestIds: QALocalStorage.getPassedTestIds(),
      fixMode: this.fixMode,
      exportTimestamp: new Date().toISOString()
    };
  }

  getLastResults(): QATestResult[] {
    return QALocalStorage.getLastResults();
  }

  getRunHistory(): QARunHistory[] {
    return QALocalStorage.getRunHistory();
  }

  // New Sanity V2 runner integration
  async runSanityV2({ fix = false }: { fix?: boolean } = {}): Promise<SanityV2Summary> {
    return await runSanityV2({ fix });
  }
}

// Global instance
export const qaTestRunner = new QATestRunner();