import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { CampfirePage } from '../pages/campfire.page';
import { getTestCredentials } from '../utils/helpers';
import { createTestMessage } from '../fixtures/test-data';

test.describe('Campfire/Chat', () => {
  let authPage: AuthPage;
  let campfirePage: CampfirePage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    campfirePage = new CampfirePage(page);

    // Sign in before each test
    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();

    // Navigate to campfire
    await campfirePage.goto();
  });

  test('campfire view loads', async () => {
    await test.step('Verify on campfire view', async () => {
      const isOnCampfire = await campfirePage.isOnCampfireView();
      expect(isOnCampfire).toBeTruthy();
    });

    await test.step('Wait for messages to load', async () => {
      await campfirePage.waitForMessages();
    });
  });

  test('messages display correctly', async () => {
    await test.step('Verify messages display', async () => {
      await campfirePage.verifyMessagesDisplay();
    });

    await test.step('Get message count', async () => {
      const count = await campfirePage.getMessageCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('send message works', async () => {
    const testMessage = createTestMessage('CAMPFIRE');

    await test.step('Send message', async () => {
      await campfirePage.sendMessage(testMessage);
    });

    await test.step('Verify message appears', async () => {
      await campfirePage.verifyMessageExists(testMessage);
    });
  });

  test('real-time message updates work', async () => {
    await test.step('Test realtime updates', async () => {
      await campfirePage.verifyRealtimeUpdates();
    });
  });

  test('can send multiple messages', async () => {
    const messages = [
      createTestMessage('CAMPFIRE'),
      createTestMessage('CAMPFIRE'),
      createTestMessage('CAMPFIRE'),
    ];

    for (const message of messages) {
      await test.step(`Send message: ${message.substring(0, 30)}...`, async () => {
        await campfirePage.sendMessage(message);
        await campfirePage.verifyMessageExists(message);
      });
    }
  });

  test('message input is enabled', async () => {
    await test.step('Verify can send messages', async () => {
      await campfirePage.verifyCanSendMessages();
    });
  });

  test('scroll functionality works', async () => {
    await test.step('Scroll to bottom', async () => {
      await campfirePage.scrollToBottom();
    });

    await test.step('Scroll to top', async () => {
      await campfirePage.scrollToTop();
    });

    await test.step('Scroll back to bottom', async () => {
      await campfirePage.scrollToBottom();
    });
  });
});
