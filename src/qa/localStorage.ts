// QA Test Harness - LocalStorage Utilities

export interface QATestResult {
  id: string;
  name: string;
  pass: boolean;
  notes?: string;
  lastRun: string;
  fixApplied?: boolean;
  reverted?: boolean;
}

export interface QARunHistory {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  fixed: number;
  reverted: number;
  summary: string;
}

export interface QALocalStorage {
  lastResults: QATestResult[];
  passedTestIds: string[];
  fixMode: boolean;
  runHistory: QARunHistory[];
}

const QA_STORAGE_KEYS = {
  LAST_RESULTS: 'qa:lastResults',
  PASSED_TEST_IDS: 'qa:passedTestIds',
  FIX_MODE: 'qa:fixMode',
  RUN_HISTORY: 'qa:runHistory'
} as const;

export class QALocalStorage {
  static getLastResults(): QATestResult[] {
    try {
      const stored = localStorage.getItem(QA_STORAGE_KEYS.LAST_RESULTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static setLastResults(results: QATestResult[]): void {
    try {
      localStorage.setItem(QA_STORAGE_KEYS.LAST_RESULTS, JSON.stringify(results));
    } catch (error) {
      console.warn('Failed to save QA test results:', error);
    }
  }

  static getPassedTestIds(): string[] {
    try {
      const stored = localStorage.getItem(QA_STORAGE_KEYS.PASSED_TEST_IDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static setPassedTestIds(ids: string[]): void {
    try {
      localStorage.setItem(QA_STORAGE_KEYS.PASSED_TEST_IDS, JSON.stringify(ids));
    } catch (error) {
      console.warn('Failed to save passed test IDs:', error);
    }
  }

  static getFixMode(): boolean {
    try {
      const stored = localStorage.getItem(QA_STORAGE_KEYS.FIX_MODE);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }

  static setFixMode(enabled: boolean): void {
    try {
      localStorage.setItem(QA_STORAGE_KEYS.FIX_MODE, JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save fix mode setting:', error);
    }
  }

  static getRunHistory(): QARunHistory[] {
    try {
      const stored = localStorage.getItem(QA_STORAGE_KEYS.RUN_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addRunHistory(entry: QARunHistory): void {
    try {
      const history = this.getRunHistory();
      history.unshift(entry); // Add to beginning
      // Keep only last 50 entries
      const trimmedHistory = history.slice(0, 50);
      localStorage.setItem(QA_STORAGE_KEYS.RUN_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.warn('Failed to save QA run history:', error);
    }
  }

  static exportData(): QALocalStorage {
    return {
      lastResults: this.getLastResults(),
      passedTestIds: this.getPassedTestIds(),
      fixMode: this.getFixMode(),
      runHistory: this.getRunHistory()
    };
  }

  static clearAll(): void {
    try {
      Object.values(QA_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear QA localStorage:', error);
    }
  }
}
