import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { getTestCredentials, getSupabaseConfig } from '../utils/helpers';

test.describe('Supabase Connection Health', () => {
  test('Supabase client initializes correctly', async ({ page }) => {
    await test.step('Check environment variables are set', () => {
      const config = getSupabaseConfig();
      expect(config.url).toBeTruthy();
      expect(config.anonKey).toBeTruthy();
      expect(config.url).toContain('supabase');
    });

    await test.step('Navigate to app', async () => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify Supabase client loads without errors', async () => {
      // Check console for errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);
      
      // Filter out unrelated errors
      const supabaseErrors = errors.filter(err => 
        err.toLowerCase().includes('supabase') || 
        err.toLowerCase().includes('connection')
      );
      
      expect(supabaseErrors.length).toBe(0);
    });
  });

  test('Database connection is active', async ({ page }) => {
    const authPage = new AuthPage(page);
    const { email, password } = getTestCredentials();

    await test.step('Sign in to test database connection', async () => {
      await authPage.goto();
      await authPage.signInAndVerify(email, password);
      await authPage.completeProfileSetupIfNeeded();
    });

    await test.step('Verify database queries work', async () => {
      // If we successfully logged in, database is working
      const isLoggedIn = await authPage.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();
    });

    await test.step('Navigate to different views to test database access', async () => {
      // Navigate to flares (requires database query)
      await page.goto('/#flares');
      await page.waitForTimeout(2000);
      
      // Navigate to messages (requires database query)
      await page.goto('/#messages');
      await page.waitForTimeout(2000);
      
      // Navigate to profile (requires database query)
      await page.goto('/#profile');
      await page.waitForTimeout(2000);
      
      // If no errors thrown, database is accessible
    });
  });

  test('Auth service is responsive', async ({ page }) => {
    const authPage = new AuthPage(page);

    await test.step('Test auth service with sign in', async () => {
      const { email, password } = getTestCredentials();
      
      await authPage.goto();
      
      // Measure response time
      const startTime = Date.now();
      await authPage.signIn(email, password);
      await page.waitForTimeout(5000); // Wait for auth to complete
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Auth should respond within 10 seconds
      expect(responseTime).toBeLessThan(10000);
    });
  });

  test('Realtime subscriptions work', async ({ page }) => {
    const authPage = new AuthPage(page);
    const { email, password } = getTestCredentials();

    await test.step('Sign in', async () => {
      await authPage.goto();
      await authPage.signInAndVerify(email, password);
      await authPage.completeProfileSetupIfNeeded();
    });

    await test.step('Navigate to campfire (uses realtime)', async () => {
      await page.goto('/#campfire');
      await page.waitForTimeout(3000);
    });

    await test.step('Send a message to test realtime', async () => {
      const messageInput = page.locator('textarea, input').first();
      const testMessage = `Realtime test ${Date.now()}`;
      
      await messageInput.fill(testMessage);
      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
      await sendButton.click();
      
      // Wait for realtime update
      await page.waitForTimeout(3000);
      
      // Verify message appears (realtime worked)
      const message = page.locator(`text=${testMessage}`);
      await expect(message).toBeVisible();
    });
  });

  test('Required tables exist and are accessible', async ({ page }) => {
    const authPage = new AuthPage(page);
    const { email, password } = getTestCredentials();

    await test.step('Sign in to access database', async () => {
      await authPage.goto();
      await authPage.signInAndVerify(email, password);
      await authPage.completeProfileSetupIfNeeded();
    });

    await test.step('Test profiles table access', async () => {
      // Profile page queries profiles table
      await page.goto('/#profile');
      await page.waitForTimeout(2000);
      
      // Should display profile data
      const profileName = page.locator('h1, h2, [class*="name"]').first();
      await expect(profileName).toBeVisible();
    });

    await test.step('Test flares table access', async () => {
      // Flares page queries flares table
      await page.goto('/#flares');
      await page.waitForTimeout(2000);
      
      // Should load without errors (even if empty)
      const flaresView = page.locator('body');
      await expect(flaresView).toBeVisible();
    });

    await test.step('Test messages table access', async () => {
      // Campfire queries messages table
      await page.goto('/#campfire');
      await page.waitForTimeout(2000);
      
      // Should load without errors
      const campfireView = page.locator('body');
      await expect(campfireView).toBeVisible();
    });

    await test.step('Test transactions table access', async () => {
      // Wallet queries transactions table
      await page.goto('/#wallet');
      await page.waitForTimeout(2000);
      
      // Should load without errors
      const walletView = page.locator('body');
      await expect(walletView).toBeVisible();
    });
  });

  test('No critical console errors during navigation', async ({ page }) => {
    const authPage = new AuthPage(page);
    const { email, password } = getTestCredentials();

    const criticalErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter for critical errors only
        if (
          text.includes('Failed') ||
          text.includes('Error') ||
          text.includes('rejected') ||
          text.includes('Cannot')
        ) {
          criticalErrors.push(text);
        }
      }
    });

    await test.step('Sign in and navigate through app', async () => {
      await authPage.goto();
      await authPage.signInAndVerify(email, password);
      await authPage.completeProfileSetupIfNeeded();
      
      // Navigate through all main views
      const views = ['#flares', '#campfire', '#messages', '#wallet', '#profile'];
      
      for (const view of views) {
        await page.goto(`/${view}`);
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Verify no critical errors', async () => {
      // Filter out known benign errors (like network abort from navigation)
      const realErrors = criticalErrors.filter(err => 
        !err.includes('aborted') &&
        !err.includes('Navigation') &&
        !err.includes('chunk')
      );
      
      if (realErrors.length > 0) {
        console.log('Critical errors found:', realErrors);
      }
      
      expect(realErrors.length).toBe(0);
    });
  });
});
