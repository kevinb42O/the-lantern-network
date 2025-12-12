import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { AdminPage } from '../pages/admin.page';
import { getTestCredentials } from '../utils/helpers';
import { isAdminEmail } from '../fixtures/test-data';

test.describe('Admin Functions', () => {
  let authPage: AuthPage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    adminPage = new AdminPage(page);

    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();
  });

  test('admin view loads for admin users', async () => {
    const { email } = getTestCredentials();
    // Skip if not admin
    if (!isAdminEmail(email)) {
      test.skip();
    }

    await test.step('Navigate to admin view', async () => {
      await adminPage.goto();
    });

    await test.step('Verify admin panel accessible', async () => {
      await adminPage.verifyAdminViewLoads();
    });
  });

  test('send announcement to everyone works', async () => {
    const { email } = getTestCredentials();
    if (!isAdminEmail(email)) {
      test.skip();
    }

    await test.step('Navigate to admin view', async () => {
      await adminPage.goto();
    });

    await test.step('Send announcement', async () => {
      const announcement = `Test announcement ${Date.now()}`;
      await adminPage.sendAnnouncement(announcement);
    });
  });

  test('statistics view displays correctly', async () => {
    const { email } = getTestCredentials();
    if (!isAdminEmail(email)) {
      test.skip();
    }

    await test.step('Navigate to admin view', async () => {
      await adminPage.goto();
    });

    await test.step('Verify statistics display', async () => {
      await adminPage.verifyStatisticsDisplay();
    });
  });

  test('admin features are accessible', async () => {
    const { email } = getTestCredentials();
    if (!isAdminEmail(email)) {
      test.skip();
    }

    await test.step('Verify admin features', async () => {
      await adminPage.goto();
      await adminPage.verifyAdminFeatures();
    });
  });

  test('non-admin users cannot access admin view', async () => {
    const { email } = getTestCredentials();
    if (isAdminEmail(email)) {
      test.skip();
    }

    await test.step('Try to access admin', async () => {
      const hasAccess = await adminPage.hasAdminAccess();
      expect(hasAccess).toBeFalsy();
    });
  });
});
