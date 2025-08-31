// QA Test Utilities - DOM helpers and common test functions

export interface TestResult {
  id: string;
  name: string;
  pass: boolean;
  notes: string;
  timeMs: number;
}

// ====== CENTRALIZED SELECTOR SYSTEM (A) ======
// CSS.escape() based selector building for bulletproof safety
export function sel(id: string): string {
  return `[data-testid=${CSS.escape(id)}]`;
}

// Thin wrapper functions that only accept test IDs (no raw CSS)
export function q(id: string): Element | null {
  return document.querySelector(sel(id));
}

export function qa(id: string): NodeListOf<Element> {
  return document.querySelectorAll(sel(id));
}

export function exists(id: string): boolean {
  return q(id) !== null;
}

export function visible(id: string): boolean {
  const element = q(id) as HTMLElement;
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}

export function click(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    const element = q(id) as HTMLElement;
    if (element) {
      element.click();
      setTimeout(() => resolve(true), 50);
    } else {
      resolve(false);
    }
  });
}

// ====== LEGACY COMPATIBILITY ======
// Keep byTestId for existing code that hasn't been migrated yet
export function byTestId(id: string): string {
  return sel(id);
}

// Navigation helper
export function goto(path: string): Promise<void> {
  return new Promise((resolve) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    // Small delay to allow React Router to process
    setTimeout(resolve, 100);
  });
}

// ====== LEGACY HELPERS (for backwards compatibility) ======
// These use the new safe selector system internally
export function clickTestIdBySelector(selector: string): Promise<boolean> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.click();
      setTimeout(() => resolve(true), 50);
    } else {
      resolve(false);
    }
  });
}

// Legacy function - use click(id) instead
export function clickTestId(testId: string): Promise<boolean> {
  return click(testId);
}

// Legacy function - use qa(id) instead
export function queryAllTestId(testId: string): NodeListOf<Element> {
  return qa(testId);
}

// Legacy function - use q(id) instead  
export function queryTestId(testId: string): Element | null {
  return q(testId);
}

// ====== BULLETPROOF WAITING (B) ======
// waitForId with built-in CSS.escape safety
export function waitForId(id: string, timeout: number = 2000): Promise<boolean> {
  return waitFor(() => exists(id), timeout);
}

// Bulletproof waitFor with try/catch wrapping 
export function waitFor(
  condition: (() => boolean), 
  timeout: number = 2000
): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      let conditionMet = false;
      
      try {
        conditionMet = condition();
      } catch (error) {
        console.warn('[QA] waitFor condition threw error:', error);
        conditionMet = false;
      }
      
      if (conditionMet) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}

// Legacy compatibility
export function waitForTestId(testId: string, timeout: number = 2000): Promise<boolean> {
  return waitForId(testId, timeout);
}

// Helper to create notes
export function note(message: string): string {
  return message;
}

// ====== NAVIGATION & TEST LIFECYCLE (C) ======
// Enhanced navigation with renamed parameter to avoid shadowing
export function gotoAndWait(path: string, anchorTestId: string, timeout: number = 8000): Promise<boolean> {
  return goto(path).then(() => waitForId(anchorTestId, timeout));
}

// Ensure return to QA page after test (using centralized helper)
export function ensureReturnToQA(): Promise<boolean> {
  const QA_PATH = '/qa';
  if (window.location.pathname !== QA_PATH) {
    return goto(QA_PATH).then(() => waitForTestId('qa-feature-tests-table', 3000));
  }
  return Promise.resolve(true);
}

// Run function and always return to QA
export async function runWithQaReturn<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } finally {
    await ensureReturnToQA();
  }
}

// ====== ENHANCED WINDOW.OPEN STUBBING ======
export let originalWindowOpen: ((url?: string | URL | undefined, target?: string | undefined, features?: string | undefined) => Window | null) | null = null;

export function stubWindowOpen(): void {
  if (!originalWindowOpen) {
    originalWindowOpen = window.open;
    // NOOP implementation - log only, never redirect
    window.open = (url?: string | URL | undefined) => {
      console.debug('[QA] window.open stubbed - NOOP:', url);
      return null;
    };
  }
}

export function restoreWindowOpen(): void {
  if (originalWindowOpen) {
    window.open = originalWindowOpen;
    originalWindowOpen = null;
  }
}

// Timing helper
export function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const start = performance.now();
  return fn().then(result => ({
    result,
    timeMs: Math.round(performance.now() - start)
  }));
}

// Check if URL matches expected path
export function checkUrl(expectedPath: string): boolean {
  const currentPath = window.location.pathname;
  return currentPath === expectedPath || currentPath.startsWith(expectedPath);
}

// Check if element has specific class
export function hasClass(element: Element | null, className: string): boolean {
  return element?.classList.contains(className) ?? false;
}

// Wait for navigation to complete
export function waitForNavigation(expectedPath: string, timeout: number = 2000): Promise<boolean> {
  return waitFor(() => checkUrl(expectedPath), timeout);
}

// Count elements by selector
export function countElements(selector: string): number {
  return document.querySelectorAll(selector).length;
}

// Get text content safely
export function getText(selector: string): string {
  const element = document.querySelector(selector);
  return element?.textContent?.trim() || '';
}

// Check if element is visible
export function isVisible(selector: string): boolean {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}

// Simple form fill helper
export function fillInput(selector: string, value: string): boolean {
  const input = document.querySelector(selector) as HTMLInputElement;
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

// Check if element exists and is clickable
export function isClickable(testId: string): boolean {
  const element = q(testId) as HTMLElement;
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.pointerEvents !== 'none' && 
         !element.hasAttribute('disabled') &&
         visible(testId);
}