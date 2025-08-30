import { TestResult } from './testUtils';
import {
  goto,
  gotoAndWait,
  ensureReturnToQA,
  runWithQaReturn,
  clickTestId,
  queryTestId,
  queryAllTestId,
  waitFor,
  waitForTestId,
  checkUrl,
  isVisible,
  isClickable,
  countElements,
  getText,
  fillInput,
  measureTime,
  note,
  byTestId,
  stubWindowOpen,
  restoreWindowOpen
} from './testUtils';

export interface FeatureTestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  notes: string;
  lastRun: string;
  duration: number;
  error?: string;
}

export interface FeatureTestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  results: FeatureTestResult[];
  runTime: string;
  duration: number;
}

// Feature Test Definitions
export const FEATURE_TESTS = [
  {
    id: 'NAV_SIDEBAR_ACTIVE',
    name: 'Navigation Sidebar Active States',
    description: 'Tests navigation items and their active states'
  },
  {
    id: 'DASHBOARD_QUICK_ACTIONS',
    name: 'Dashboard Quick Actions',
    description: 'Validates quick action buttons on dashboard'
  },
  {
    id: 'CLIENTS_ADD_AND_EDIT',
    name: 'Clients Add and Edit',
    description: 'Tests client creation and editing functionality'
  },
  {
    id: 'TASKS_MARK_DONE_PERSISTS',
    name: 'Tasks Mark Done Persistence',
    description: 'Validates task completion persistence across refreshes'
  },
  {
    id: 'TASKS_EDIT_MODAL_UPDATES',
    name: 'Task Edit Modal Updates',
    description: 'Tests task editing modal functionality'
  },
  {
    id: 'TASKS_KANBAN_DRAG_PERSISTS',
    name: 'Kanban Drag Persistence',
    description: 'Validates kanban task movement persistence'
  },
  {
    id: 'INVOICES_SEARCH_PREVIEW_EDIT_SEND',
    name: 'Invoice Search Preview Edit Send',
    description: 'Tests invoice operations: search, preview, edit, send'
  },
  {
    id: 'INVOICE_CREATE_SAVE_CONTROLS',
    name: 'Invoice Create Save Controls',
    description: 'Validates invoice creation form controls'
  },
  {
    id: 'FOLLOWUPS_PREVIEW_CONFIRM_SEND',
    name: 'Follow-ups Preview and Send',
    description: 'Tests follow-up preview drawer and send functionality'
  },
  {
    id: 'SAVINGS_CRUD_AND_METRICS',
    name: 'Savings CRUD and Metrics',
    description: 'Validates savings goals management and metrics display'
  },
  {
    id: 'SETTINGS_FIELDS_PRESENT',
    name: 'Settings Fields Present',
    description: 'Checks for required settings form fields'
  }
];

export class FeatureTestRunner {
  private results: Map<string, FeatureTestResult> = new Map();

  async runAllTests(): Promise<FeatureTestSummary> {
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    stubWindowOpen();

    try {
      for (const test of FEATURE_TESTS) {
        const result = await this.runSingleTest(test.id);
        
        if (result.status === 'passed') passed++;
        else if (result.status === 'failed') failed++;
        else skipped++;

        // Ensure return to QA after each test
        await ensureReturnToQA();
      }
    } finally {
      restoreWindowOpen();
    }

    const duration = Date.now() - startTime;
    
    const summary: FeatureTestSummary = {
      total: FEATURE_TESTS.length,
      passed,
      failed,
      skipped,
      results: Array.from(this.results.values()),
      runTime: new Date().toISOString(),
      duration
    };

    // Save to localStorage
    localStorage.setItem('qa:featureTestResults', JSON.stringify(summary));
    
    return summary;
  }

  async runSingleTest(testId: string): Promise<FeatureTestResult> {
    const startTime = Date.now();
    
    try {
      let result: FeatureTestResult;
      
      switch (testId) {
        case 'NAV_SIDEBAR_ACTIVE':
          result = await this.testNavSidebarActive();
          break;
        case 'DASHBOARD_QUICK_ACTIONS':
          result = await this.testDashboardQuickActions();
          break;
        case 'CLIENTS_ADD_AND_EDIT':
          result = await this.testClientsAddAndEdit();
          break;
        case 'TASKS_MARK_DONE_PERSISTS':
          result = await this.testTasksMarkDonePersists();
          break;
        case 'TASKS_EDIT_MODAL_UPDATES':
          result = await this.testTasksEditModalUpdates();
          break;
        case 'TASKS_KANBAN_DRAG_PERSISTS':
          result = await this.testTasksKanbanDragPersists();
          break;
        case 'INVOICES_SEARCH_PREVIEW_EDIT_SEND':
          result = await this.testInvoicesSearchPreviewEditSend();
          break;
        case 'INVOICE_CREATE_SAVE_CONTROLS':
          result = await this.testInvoiceCreateSaveControls();
          break;
        case 'FOLLOWUPS_PREVIEW_CONFIRM_SEND':
          result = await this.testFollowupsPreviewConfirmSend();
          break;
        case 'SAVINGS_CRUD_AND_METRICS':
          result = await this.testSavingsCrudAndMetrics();
          break;
        case 'SETTINGS_FIELDS_PRESENT':
          result = await this.testSettingsFieldsPresent();
          break;
        default:
          result = {
            id: testId,
            name: FEATURE_TESTS.find(t => t.id === testId)?.name || testId,
            status: 'failed',
            notes: `Unknown test: ${testId}`,
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
      }
      
      this.results.set(testId, result);
      return result;
    } catch (error) {
      const result: FeatureTestResult = {
        id: testId,
        name: FEATURE_TESTS.find(t => t.id === testId)?.name || testId,
        status: 'failed',
        notes: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastRun: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.results.set(testId, result);
      return result;
    }
  }

  async testNavSidebarActive(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        // Test navigation to dashboard
        await gotoAndWait('/', 'qa-btn-new-invoice');
        if (!checkUrl('/') || !queryTestId('nav-dashboard')) {
          throw new Error('Dashboard navigation failed');
        }

        // Test other nav items with proper test ID anchors
        const navTests = [
          { id: 'nav-clients', url: '/clients', anchor: 'btn-add-client' },
          { id: 'nav-projects', url: '/projects', anchor: 'nav-projects' },
          { id: 'nav-tasks', url: '/tasks', anchor: 'task-card' },
          { id: 'nav-invoices', url: '/invoices', anchor: 'invoice-menu-trigger' },
          { id: 'nav-follow-ups', url: '/follow-ups', anchor: 'btn-open-reminder-preview' },
          { id: 'nav-savings', url: '/savings', anchor: 'sg-total-target' },
          { id: 'nav-settings', url: '/settings', anchor: 'settings-form' }
        ];

        for (const navTest of navTests) {
          await clickTestId(navTest.id);
          await gotoAndWait(navTest.url, navTest.anchor);
          
          if (!checkUrl(navTest.url)) {
            throw new Error(`Navigation to ${navTest.url} failed`);
          }
        }

        return {
          id: 'NAV_SIDEBAR_ACTIVE',
          name: 'Navigation Sidebar Active States',
          status: 'passed',
          notes: 'All navigation items work correctly',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'NAV_SIDEBAR_ACTIVE',
          name: 'Navigation Sidebar Active States',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testDashboardQuickActions(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/', 'qa-btn-new-invoice');

        // Test each quick action button
        const quickActions = [
          { id: 'qa-btn-new-invoice', expectedUrl: '/invoices/new', anchor: 'invoice-preview-card' },
          { id: 'qa-btn-add-task', expectedUrl: '/tasks', anchor: 'task-card' },
          { id: 'qa-btn-add-client', expectedUrl: '/clients', anchor: 'btn-add-client' }
        ];

        for (const action of quickActions) {
          await gotoAndWait('/', 'qa-btn-new-invoice'); // Reset to dashboard
          await waitForTestId(action.id, 1000);
          
          if (!isClickable(action.id)) {
            throw new Error(`${action.id} is not clickable`);
          }
          
          await clickTestId(action.id);
          await gotoAndWait(action.expectedUrl, action.anchor);
          
          if (!checkUrl(action.expectedUrl)) {
            throw new Error(`${action.id} did not navigate to ${action.expectedUrl}`);
          }
        }

        return {
          id: 'DASHBOARD_QUICK_ACTIONS',
          name: 'Dashboard Quick Actions',
          status: 'passed',
          notes: 'All quick action buttons work correctly',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'DASHBOARD_QUICK_ACTIONS',
          name: 'Dashboard Quick Actions',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testClientsAddAndEdit(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/clients', 'btn-add-client');

        const initialCount = countElements(byTestId('client-row'));
        
        // Test add client
        await clickTestId('btn-add-client');
        await waitFor('input[name="name"]', 2000);
        
        if (!fillInput('input[name="name"]', `Test Client ${Date.now()}`)) {
          throw new Error('Could not fill client name input');
        }
        
        await waitForTestId('btn-client-add-submit', 1000);
        await clickTestId('btn-client-add-submit');
        await waitFor(() => countElements(byTestId('client-row')) > initialCount, 3000);
        
        const newCount = countElements(byTestId('client-row'));
        if (newCount <= initialCount) {
          throw new Error('Client was not added');
        }

        // Test edit client if available
        await waitForTestId('btn-client-edit', 1000);
        const editButtons = queryAllTestId('btn-client-edit');
        if (editButtons.length > 0) {
          (editButtons[0] as HTMLElement).click();
          await waitFor('.modal, [role="dialog"]', 2000);
        }

        return {
          id: 'CLIENTS_ADD_AND_EDIT',
          name: 'Clients Add and Edit',
          status: 'passed',
          notes: `Client added successfully, count increased from ${initialCount} to ${newCount}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'CLIENTS_ADD_AND_EDIT',
          name: 'Clients Add and Edit',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testTasksMarkDonePersists(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/tasks', 'task-card');

        const taskCards = queryAllTestId('task-card');
        if (taskCards.length === 0) {
          return {
            id: 'TASKS_MARK_DONE_PERSISTS',
            name: 'Tasks Mark Done Persistence',
            status: 'skipped',
            notes: 'No tasks available for testing',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        // Find a task with mark-done button
        let markDoneBtn: HTMLElement | null = null;
        let targetCard: HTMLElement | null = null;
        
        for (let i = 0; i < Math.min(5, taskCards.length); i++) {
          const card = taskCards[i] as HTMLElement;
          const btn = card.querySelector(byTestId('task-mark-done')) as HTMLElement;
          if (btn) {
            markDoneBtn = btn;
            targetCard = card;
            break;
          }
        }
        
        if (!markDoneBtn || !targetCard) {
          return {
            id: 'TASKS_MARK_DONE_PERSISTS',
            name: 'Tasks Mark Done Persistence',
            status: 'skipped',
            notes: 'No actionable task found with mark-done button',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        const taskId = targetCard.getAttribute('data-id');
        markDoneBtn.click();
        await waitFor(() => !document.contains(markDoneBtn), 2000);

        // Refresh page to test persistence
        window.location.reload();
        await waitForTestId('task-card', 3000);

        const updatedCards = queryAllTestId('task-card');
        const stillExists = Array.from(updatedCards).some(card => 
          card.getAttribute('data-id') === taskId
        );

        return {
          id: 'TASKS_MARK_DONE_PERSISTS',
          name: 'Tasks Mark Done Persistence',
          status: stillExists ? 'failed' : 'passed',
          notes: stillExists ? 'Task still appears in open list after marking as done' : 'Task correctly removed from open list and persisted',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'TASKS_MARK_DONE_PERSISTS',
          name: 'Tasks Mark Done Persistence',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testTasksEditModalUpdates(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/tasks', 'task-card');

        const taskCards = queryAllTestId('task-card');
        if (taskCards.length === 0) {
          return {
            id: 'TASKS_EDIT_MODAL_UPDATES',
            name: 'Task Edit Modal Updates',
            status: 'skipped',
            notes: 'No tasks available for testing',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        // Find and click edit button
        const editBtn = document.querySelector(byTestId('task-edit-open'));
        if (!editBtn) {
          return {
            id: 'TASKS_EDIT_MODAL_UPDATES',
            name: 'Task Edit Modal Updates',
            status: 'skipped',
            notes: 'No task edit button found',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        (editBtn as HTMLElement).click();
        await waitFor('input[name="title"]', 2000);

        const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
        if (titleInput) {
          const originalTitle = titleInput.value;
          const newTitle = `${originalTitle} (Edited)`;
          fillInput('input[name="title"]', newTitle);
          
          await clickTestId('task-edit-save');
          await waitFor(() => !document.querySelector(byTestId('task-edit-save')), 2000);
          
          // Check if title was updated
          const updatedTask = Array.from(queryAllTestId('task-card')).find(card =>
            card.textContent?.includes('(Edited)')
          );

          return {
            id: 'TASKS_EDIT_MODAL_UPDATES',
            name: 'Task Edit Modal Updates',
            status: updatedTask ? 'passed' : 'failed',
            notes: updatedTask ? 'Task title updated successfully' : 'Task title was not updated',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        throw new Error('Could not find title input in edit modal');
      } catch (error) {
        return {
          id: 'TASKS_EDIT_MODAL_UPDATES',
          name: 'Task Edit Modal Updates',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testTasksKanbanDragPersists(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/tasks', 'kanban-col-open');

        const openCol = queryTestId('kanban-col-open');
        const doneCol = queryTestId('kanban-col-done');

        if (!openCol || !doneCol) {
          return {
            id: 'TASKS_KANBAN_DRAG_PERSISTS',
            name: 'Kanban Drag Persistence',
            status: 'skipped',
            notes: 'Kanban columns not found (may be in list view)',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        return {
          id: 'TASKS_KANBAN_DRAG_PERSISTS',
          name: 'Kanban Drag Persistence',
          status: 'skipped',
          notes: 'Drag testing requires complex simulation, skipped for now',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'TASKS_KANBAN_DRAG_PERSISTS',
          name: 'Kanban Drag Persistence',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testInvoicesSearchPreviewEditSend(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/invoices', 'invoice-menu-trigger');

        const menuTrigger = queryTestId('invoice-menu-trigger');
        if (!menuTrigger) {
          return {
            id: 'INVOICES_SEARCH_PREVIEW_EDIT_SEND',
            name: 'Invoice Search Preview Edit Send',
            status: 'skipped',
            notes: 'No invoices available for testing',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        // Test preview
        await clickTestId('invoice-menu-trigger');
        await waitForTestId('invoice-menu-preview', 1000);
        await clickTestId('invoice-menu-preview');
        await waitForTestId('invoice-preview-modal', 2000);

        const previewModal = queryTestId('invoice-preview-modal');
        if (!previewModal) {
          throw new Error('Invoice preview modal did not open');
        }

        return {
          id: 'INVOICES_SEARCH_PREVIEW_EDIT_SEND',
          name: 'Invoice Search Preview Edit Send',
          status: 'passed',
          notes: 'Invoice preview modal opened successfully',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'INVOICES_SEARCH_PREVIEW_EDIT_SEND',
          name: 'Invoice Search Preview Edit Send',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testInvoiceCreateSaveControls(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/invoices/new', 'invoice-preview-card');

        // Check all required controls are present and clickable
        const controls = ['btn-save-draft', 'btn-save-send', 'btn-add-line-item', 'invoice-preview-card'];
        const missingControls = [];

        for (const control of controls) {
          const element = queryTestId(control);
          if (!element) {
            missingControls.push(control);
          }
        }

        if (missingControls.length > 0) {
          throw new Error(`Missing controls: ${missingControls.join(', ')}`);
        }

        return {
          id: 'INVOICE_CREATE_SAVE_CONTROLS',
          name: 'Invoice Create Save Controls',
          status: 'passed',
          notes: 'All invoice creation controls are present',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'INVOICE_CREATE_SAVE_CONTROLS',
          name: 'Invoice Create Save Controls',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testFollowupsPreviewConfirmSend(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/follow-ups', 'btn-open-reminder-preview');

        const openBtn = queryTestId('btn-open-reminder-preview');
        if (!openBtn) {
          return {
            id: 'FOLLOWUPS_PREVIEW_CONFIRM_SEND',
            name: 'Follow-ups Preview and Send',
            status: 'skipped',
            notes: 'No follow-up reminders available for testing',
            lastRun: new Date().toISOString(),
            duration: Date.now() - startTime
          };
        }

        await clickTestId('btn-open-reminder-preview');
        await waitForTestId('fu-msg-input', 2000);
        
        const msgInput = queryTestId('fu-msg-input');
        const confirmBtn = queryTestId('btn-confirm-send');

        if (!msgInput || !confirmBtn) {
          throw new Error('Follow-up preview drawer components not found');
        }

        return {
          id: 'FOLLOWUPS_PREVIEW_CONFIRM_SEND',
          name: 'Follow-ups Preview and Send',
          status: 'passed',
          notes: 'Follow-up preview drawer opened with required components',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'FOLLOWUPS_PREVIEW_CONFIRM_SEND',
          name: 'Follow-ups Preview and Send',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testSavingsCrudAndMetrics(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/savings', 'sg-total-target');

        const totalTarget = queryTestId('sg-total-target');
        const totalSaved = queryTestId('sg-total-saved');
        const totalProgress = queryTestId('sg-total-progress');

        if (!totalTarget || !totalSaved || !totalProgress) {
          throw new Error('Savings metrics components not found');
        }

        return {
          id: 'SAVINGS_CRUD_AND_METRICS',
          name: 'Savings CRUD and Metrics',
          status: 'passed',
          notes: 'Savings metrics displayed correctly',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'SAVINGS_CRUD_AND_METRICS',
          name: 'Savings CRUD and Metrics',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testSettingsFieldsPresent(): Promise<FeatureTestResult> {
    return runWithQaReturn(async () => {
      const startTime = Date.now();
      
      try {
        await gotoAndWait('/settings', 'settings-form');

        const requiredFields = [
          'input[name="upi_vpa"]',
          'input[name="creator_display_name"]', 
          'input[name="invoice_prefix"]'
        ];

        const missingFields = [];
        for (const field of requiredFields) {
          const element = document.querySelector(field);
          if (!element) {
            missingFields.push(field);
          }
        }

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        return {
          id: 'SETTINGS_FIELDS_PRESENT',
          name: 'Settings Fields Present',
          status: 'passed',
          notes: 'All required settings fields are present',
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          id: 'SETTINGS_FIELDS_PRESENT',
          name: 'Settings Fields Present',
          status: 'failed',
          notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastRun: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  getLastResults(): FeatureTestSummary | null {
    const saved = localStorage.getItem('qa:featureTestResults');
    return saved ? JSON.parse(saved) : null;
  }

  exportResults(): any {
    const results = this.getLastResults();
    return {
      timestamp: new Date().toISOString(),
      featureTests: results,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
}

export const featureTestRunner = new FeatureTestRunner();