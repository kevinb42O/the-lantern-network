import { test } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { MessagesPage } from '../pages/messages.page';
import { getTestCredentials } from '../utils/helpers';

test.describe('Messaging', () => {
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

  test('messages view loads with tabs', async () => {
    await test.step('Verify tabs exist', async () => {
      await messagesPage.verifyTabsExist();
    });
  });

  test('can switch between tabs', async () => {
    await test.step('Switch to Chats tab', async () => {
      await messagesPage.switchToTab('Chats');
    });

    await test.step('Switch to Circle tab', async () => {
      await messagesPage.switchToTab('Circle');
    });

    await test.step('Switch to Requests tab', async () => {
      await messagesPage.switchToTab('Requests');
    });
  });

  test('help request conversations display', async () => {
    await test.step('Verify help request conversations', async () => {
      await messagesPage.verifyHelpRequestConversations();
    });
  });
});
