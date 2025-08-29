// QA Test Utilities - DOM helpers and common test functions

export interface TestResult {
  id: string;
  name: string;
  pass: boolean;
  notes: string;
  timeMs: number;
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

// Click element by data-testid
export function clickTestId(testId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const element = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
    if (element) {
      element.click();
      setTimeout(() => resolve(true), 50);
    } else {
      resolve(false);
    }
  });
}

// Query all elements by data-testid
export function queryAllTestId(testId: string): NodeListOf<Element> {
  return document.querySelectorAll(`[data-testid="${testId}"]`);
}

// Query single element by data-testid
export function queryTestId(testId: string): Element | null {
  return document.querySelector(`[data-testid="${testId}"]`);
}

// Wait for condition or selector
export function waitFor(
  condition: string | (() => boolean), 
  timeout: number = 2000
): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      let conditionMet = false;
      
      if (typeof condition === 'string') {
        // Selector string
        conditionMet = document.querySelector(condition) !== null;
      } else {
        // Function
        try {
          conditionMet = condition();
        } catch {
          conditionMet = false;
        }
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

// Helper to create notes
export function note(message: string): string {
  return message;
}

// Enhanced navigation helper with wait
export function gotoAndWait(path: string, selector: string, timeout: number = 2000): Promise<boolean> {
  return goto(path).then(() => waitFor(selector, timeout));
}

// Ensure return to QA page after test
export function ensureReturnToQA(): Promise<boolean> {
  const QA_PATH = '/qa';
  if (window.location.pathname !== QA_PATH) {
    return goto(QA_PATH).then(() => waitFor('[data-testid="qa-feature-tests-table"]', 3000));
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
  const element = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.pointerEvents !== 'none' && 
         !element.hasAttribute('disabled') &&
         isVisible(`[data-testid="${testId}"]`);
}