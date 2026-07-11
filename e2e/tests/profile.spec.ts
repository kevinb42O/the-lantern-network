import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { ProfilePage } from '../pages/profile.page';
import { getTestCredentials } from '../utils/helpers';

test.describe('Profile', () => {
  let authPage: AuthPage;
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    profilePage = new ProfilePage(page);

    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();

    await profilePage.goto();
  });

  test('profile view loads with user data', async () => {
    await test.step('Verify profile loaded', async () => {
      await profilePage.verifyProfileLoaded();
    });

    await test.step('Get display name', async () => {
      const name = await profilePage.getDisplayName();
      expect(name.length).toBeGreaterThan(0);
    });
  });

  test('stats display correctly', async () => {
    await test.step('Verify stats display', async () => {
      await profilePage.verifyStatsDisplay();
    });

    await test.step('Get helps given', async () => {
      const helps = await profilePage.getHelpsGiven();
      expect(helps).toBeGreaterThanOrEqual(0);
    });

    await test.step('Get reputation', async () => {
      const rep = await profilePage.getReputation();
      expect(rep).toBeGreaterThanOrEqual(0);
    });

    await test.step('Get lanterns', async () => {
      const lanterns = await profilePage.getLanterns();
      expect(lanterns).toBeGreaterThanOrEqual(0);
    });
  });

  test('sign out works', async ({ page }) => {
    await test.step('Sign out from profile', async () => {
      await profilePage.signOut();
    });

    await test.step('Verify redirected to auth page', async () => {
      await page.waitForTimeout(2000);
      const isOnAuthPage = await authPage.isOnAuthPage();
      expect(isOnAuthPage).toBeTruthy();
    });
  });
});
