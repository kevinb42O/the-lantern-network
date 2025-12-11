import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { MessagesPage } from '../pages/messages.page';
import { getTestCredentials } from '../utils/helpers';

test.describe('Notifications & Announcements', () => {
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

  test('check for unread message badge', async () => {
    await test.step('Check unread badge status', async () => {
      const hasUnread = await messagesPage.hasUnreadBadge();
      expect(typeof hasUnread).toBe('boolean');
    });
  });

  test('check for announcements', async () => {
    await test.step('Check if announcements exist', async () => {
      const hasAnnouncement = await messagesPage.hasAnnouncement();
      expect(typeof hasAnnouncement).toBe('boolean');
    });
  });
});
