import { Page, expect } from '@playwright/test';

/**
 * Wait for network to be idle (no pending requests for a short period)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for Supabase realtime events to propagate
 */
export async function waitForRealtimeUpdate(page: Page, delayMs = 1500) {
  await page.waitForTimeout(delayMs);
}

/**
 * Get test credentials from environment
 */
export function getTestCredentials() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  
  if (!email || !password) {
    throw new Error(
      'Test credentials not found. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.'
    );
  }
  
  return { email, password };
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error(
      'Supabase configuration not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
  
  return { url, anonKey };
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 2000, state: 'attached' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for toast message to appear
 */
export async function waitForToast(page: Page, messagePattern?: string | RegExp, timeout = 5000) {
  const toastSelector = '[data-sonner-toast]';
  await page.waitForSelector(toastSelector, { timeout, state: 'visible' });
  
  if (messagePattern) {
    const toast = page.locator(toastSelector);
    if (typeof messagePattern === 'string') {
      await expect(toast).toContainText(messagePattern);
    } else {
      await expect(toast).toContainText(messagePattern);
    }
  }
}

/**
 * Clear all toasts
 */
export async function clearToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]');
  const count = await toasts.count();
  
  for (let i = 0; i < count; i++) {
    const closeButton = toasts.nth(i).locator('button[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}

/**
 * Fill form field and wait for value to be set
 */
export async function fillAndVerify(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await expect(page.locator(selector)).toHaveValue(value);
}

/**
 * Navigate and wait for page to be ready
 */
export async function navigateAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await waitForNetworkIdle(page);
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}

/**
 * Retry an action until it succeeds or timeout
 */
export async function retryUntil<T>(
  action: () => Promise<T>,
  condition: (result: T) => boolean,
  options: { maxAttempts?: number; delayMs?: number } = {}
): Promise<T> {
  const { maxAttempts = 5, delayMs = 1000 } = options;
  
  for (let i = 0; i < maxAttempts; i++) {
    const result = await action();
    if (condition(result)) {
      return result;
    }
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`Retry failed after ${maxAttempts} attempts`);
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await waitForNetworkIdle(page);
}

/**
 * Check if user is on a specific route
 */
export async function isOnRoute(page: Page, route: string): Promise<boolean> {
  const url = page.url();
  return url.includes(route);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}
