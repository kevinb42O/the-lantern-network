import { test } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { FlaresPage } from '../pages/flares.page';
import { getTestCredentials } from '../utils/helpers';
import { createTestStory } from '../fixtures/test-data';

test.describe('Stories', () => {
  let authPage: AuthPage;
  let flaresPage: FlaresPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    flaresPage = new FlaresPage(page);

    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();

    await flaresPage.goto();
  });

  test('stories tab displays in flares view', async () => {
    await test.step('Switch to Stories tab', async () => {
      await flaresPage.switchToTab('Stories');
    });
  });

  test('create story works', async () => {
    const storyContent = createTestStory();

    await test.step('Create story', async () => {
      await flaresPage.createStory(storyContent);
    });

    await test.step('Switch to stories tab to verify', async () => {
      await flaresPage.switchToTab('Stories');
    });
  });
});
