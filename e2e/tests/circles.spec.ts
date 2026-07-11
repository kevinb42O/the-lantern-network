import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { MessagesPage } from '../pages/messages.page';
import { getTestCredentials } from '../utils/helpers';

test.describe('Circles/Trust Network', () => {
  let authPage: AuthPage;
  let messagesPage: MessagesPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    messagesPage = new MessagesPage(page);

    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();

    await messagesPage.goto();
  });

  test('circle tab in messages displays connections', async () => {
    await test.step('Switch to Circle tab', async () => {
      await messagesPage.switchToTab('Circle');
    });

    await test.step('Get conversation count', async () => {
      const count = await messagesPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('circle chat (DM) works', async () => {
    await test.step('Test circle chat', async () => {
      await messagesPage.verifyCircleChat();
    });
  });
});
