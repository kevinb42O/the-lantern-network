import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { getTestCredentials } from '../utils/helpers';

test.describe('Authentication Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test('login page loads correctly', async () => {
    await test.step('Verify auth page elements', async () => {
      const isOnAuthPage = await authPage.isOnAuthPage();
      expect(isOnAuthPage).toBeTruthy();
    });

    await test.step('Verify logo is displayed', async () => {
      const hasLogo = await authPage.hasLogo();
      expect(hasLogo).toBeTruthy();
    });

    await test.step('Verify heading text', async () => {
      await authPage.verifyHeading('The Lantern Network');
    });
  });

  test('login with valid credentials succeeds', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await test.step('Fill in credentials and sign in', async () => {
      await authPage.signIn(email, password);
    });

    await test.step('Wait for login to complete', async () => {
      // Wait for redirect and profile setup
      await authPage.waitForProfileSetupOrHome(30000);
    });

    await test.step('Complete profile setup if needed', async () => {
      await authPage.completeProfileSetupIfNeeded();
    });

    await test.step('Verify user is logged in', async () => {
      await page.waitForTimeout(2000);
      const isLoggedIn = await authPage.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();
    });
  });

  test('login with invalid credentials shows error', async () => {
    await test.step('Try to sign in with invalid credentials', async () => {
      await authPage.signIn('invalid@example.com', 'wrongpassword');
    });

    await test.step('Verify error message is displayed', async () => {
      const hasError = await authPage.hasErrorMessage();
      expect(hasError).toBeTruthy();
    });

    await test.step('Verify error message content', async () => {
      const errorMessage = await authPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
      expect(errorMessage.toLowerCase()).toContain('invalid');
    });
  });

  test('logout functionality works', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await test.step('Sign in first', async () => {
      await authPage.signInAndVerify(email, password);
      await authPage.completeProfileSetupIfNeeded();
    });

    await test.step('Navigate to profile/settings to find sign out', async () => {
      // Try to navigate to profile where sign out usually is
      await page.goto('/#profile');
      await page.waitForTimeout(2000);
    });

    await test.step('Sign out', async () => {
      await authPage.signOut();
    });

    await test.step('Verify returned to auth page', async () => {
      await page.waitForTimeout(2000);
      const isOnAuthPage = await authPage.isOnAuthPage();
      expect(isOnAuthPage).toBeTruthy();
    });
  });

  test('session persistence works', async ({ page }) => {
    const { email, password } = getTestCredentials();

    await test.step('Sign in', async () => {
      await authPage.signInAndVerify(email, password);
      await authPage.completeProfileSetupIfNeeded();
    });

    await test.step('Refresh the page', async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
    });

    await test.step('Verify still logged in', async () => {
      const isLoggedIn = await authPage.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();
    });
  });

  test('can switch between sign in and sign up modes', async () => {
    await test.step('Verify on sign in mode initially', async () => {
      await authPage.verifyHeading('Welcome Back');
    });

    await test.step('Switch to sign up mode', async () => {
      await authPage.switchToSignUp();
      await authPage.verifyHeading('Join the Network');
    });
  });

  test('can switch to magic link mode', async () => {
    await test.step('Switch to magic link mode', async () => {
      await authPage.switchToMagicLink();
    });

    await test.step('Verify magic link heading', async () => {
      await authPage.verifyHeading('Magic Link');
    });
  });
});
