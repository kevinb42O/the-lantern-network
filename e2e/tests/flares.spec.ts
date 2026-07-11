import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { FlaresPage } from '../pages/flares.page';
import { getTestCredentials } from '../utils/helpers';
import { createTestFlare, FLARE_CATEGORIES } from '../fixtures/test-data';

test.describe('Flares Functionality', () => {
  let authPage: AuthPage;
  let flaresPage: FlaresPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    flaresPage = new FlaresPage(page);

    // Sign in before each test
    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();

    // Navigate to flares
    await flaresPage.goto();
  });

  test('flares view loads and displays existing flares', async () => {
    await test.step('Verify on flares view', async () => {
      const isOnFlares = await flaresPage.isOnFlaresView();
      expect(isOnFlares).toBeTruthy();
    });

    await test.step('Wait for flares to load', async () => {
      await flaresPage.waitForFlares();
    });

    await test.step('Get flare count', async () => {
      const count = await flaresPage.getFlareCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('create new flare (request type) works', async () => {
    const testFlare = createTestFlare('request');

    await test.step('Create request flare', async () => {
      await flaresPage.createFlare({
        title: testFlare.title,
        description: testFlare.description,
        category: testFlare.category,
        type: 'request',
      });
    });

    await test.step('Verify flare was created', async () => {
      await flaresPage.verifyFlareExists(testFlare.title);
    });
  });

  test('create new flare (offer type) works', async () => {
    const testFlare = createTestFlare('offer');

    await test.step('Create offer flare', async () => {
      await flaresPage.createFlare({
        title: testFlare.title,
        description: testFlare.description,
        category: testFlare.category,
        type: 'offer',
      });
    });

    await test.step('Verify flare was created', async () => {
      await flaresPage.verifyFlareExists(testFlare.title);
    });
  });

  test('circle-only flare visibility works correctly', async () => {
    const testFlare = createTestFlare('request', ' (Circle Only)');

    await test.step('Create circle-only flare', async () => {
      await flaresPage.createFlare({
        title: testFlare.title,
        description: testFlare.description,
        category: testFlare.category,
        type: 'request',
        circleOnly: true,
      });
    });

    await test.step('Verify flare was created', async () => {
      await flaresPage.verifyFlareExists(testFlare.title);
    });

    // Note: Full verification of circle-only visibility would require
    // a second user account to test that non-circle members can't see it
  });

  test('filter tabs work', async () => {
    await test.step('Verify filter tabs exist', async () => {
      await flaresPage.verifyFilterTabs();
    });

    await test.step('Switch to Requests tab', async () => {
      await flaresPage.switchToTab('Requests');
    });

    await test.step('Switch to Offers tab', async () => {
      await flaresPage.switchToTab('Offers');
    });

    await test.step('Switch to Stories tab', async () => {
      await flaresPage.switchToTab('Stories');
    });

    await test.step('Switch back to All tab', async () => {
      await flaresPage.switchToTab('All');
    });
  });

  test('flare cards display correct information', async () => {
    const testFlare = createTestFlare('request', ' (Info Test)');

    await test.step('Create test flare', async () => {
      await flaresPage.createFlare({
        title: testFlare.title,
        description: testFlare.description,
        category: testFlare.category,
        type: 'request',
      });
    });

    await test.step('Verify flare card info', async () => {
      await flaresPage.verifyFlareCardInfo(testFlare.title);
    });
  });

  test('can create flares with different categories', async () => {
    const categories = [
      FLARE_CATEGORIES.MECHANICAL,
      FLARE_CATEGORIES.FOOD,
      FLARE_CATEGORIES.TALK,
      FLARE_CATEGORIES.OTHER,
    ];

    for (const category of categories) {
      await test.step(`Create flare with ${category} category`, async () => {
        const testFlare = createTestFlare('request', ` (${category})`);
        
        await flaresPage.createFlare({
          title: testFlare.title,
          description: testFlare.description,
          category: category,
          type: 'request',
        });

        await flaresPage.verifyFlareExists(testFlare.title);
      });
    }
  });
});
