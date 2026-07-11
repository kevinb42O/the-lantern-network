import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle, waitForRealtimeUpdate } from '../utils/helpers';

export class CampfirePage {
  constructor(private page: Page) {}

  /**
   * Navigate to campfire view
   */
  async goto() {
    const campfireNav = this.page.locator(SELECTORS.NAV_CAMPFIRE).first();
    
    try {
      await campfireNav.click({ timeout: 5000 });
    } catch {
      await this.page.goto('/#campfire');
    }
    
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the campfire view
   */
  async isOnCampfireView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('campfire');
  }

  /**
   * Wait for messages to load
   */
  async waitForMessages(timeout = 10000) {
    try {
      await this.page.waitForSelector(SELECTORS.MESSAGE_ITEM, { timeout, state: 'visible' });
    } catch {
      // No messages yet, that's okay
    }
  }

  /**
   * Get count of visible messages
   */
  async getMessageCount(): Promise<number> {
    const messages = this.page.locator(SELECTORS.MESSAGE_ITEM);
    return await messages.count();
  }

  /**
   * Send a message
   */
  async sendMessage(content: string) {
    const messageInput = this.page.locator(SELECTORS.MESSAGE_INPUT).first();
    await messageInput.fill(content);
    
    const sendButton = this.page.locator(SELECTORS.SEND_MESSAGE_BUTTON).first();
    await sendButton.click();
    
    // Wait for message to appear
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Find message by content
   */
  async findMessageByContent(content: string) {
    const message = this.page.locator(SELECTORS.MESSAGE_ITEM, { hasText: content }).first();
    return message;
  }

  /**
   * Verify message exists
   */
  async verifyMessageExists(content: string) {
    const message = await this.findMessageByContent(content);
    await expect(message).toBeVisible();
  }

  /**
   * Check if message has admin badge
   */
  async hasAdminBadge(messageContent: string): Promise<boolean> {
    const message = await this.findMessageByContent(messageContent);
    const badge = message.locator('[class*="badge"]:has-text("Admin"), [class*="badge"]:has-text("Mod")');
    
    try {
      await badge.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Report a message
   */
  async reportMessage(messageContent: string) {
    const message = await this.findMessageByContent(messageContent);
    
    // Try to find report button (could be in a menu)
    const moreButton = message.locator('button[aria-label*="more" i], button[aria-label*="menu" i]').first();
    
    try {
      if (await moreButton.isVisible({ timeout: 2000 })) {
        await moreButton.click();
      }
    } catch {
      // No menu button
    }
    
    // Find and click report button
    const reportButton = this.page.locator('button:has-text("Report")').first();
    await reportButton.click();
    
    // Confirm if needed
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
    try {
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } catch {
      // No confirmation needed
    }
    
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify messages display correctly
   */
  async verifyMessagesDisplay() {
    const messages = this.page.locator(SELECTORS.MESSAGE_ITEM);
    const count = await messages.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check first message has content
    const firstMessage = messages.first();
    const hasText = (await firstMessage.textContent())?.length || 0;
    expect(hasText).toBeGreaterThan(0);
  }

  /**
   * Check for real-time updates (send message and verify it appears)
   */
  async verifyRealtimeUpdates() {
    const initialCount = await this.getMessageCount();
    const testMessage = `Test realtime - ${Date.now()}`;
    
    await this.sendMessage(testMessage);
    
    // Wait for realtime update
    await waitForRealtimeUpdate(this.page);
    
    const newCount = await this.getMessageCount();
    expect(newCount).toBeGreaterThan(initialCount);
    
    await this.verifyMessageExists(testMessage);
  }

  /**
   * Scroll to bottom of messages
   */
  async scrollToBottom() {
    // Try to find the last message and scroll to it
    const messages = this.page.locator(SELECTORS.MESSAGE_ITEM);
    const count = await messages.count();
    
    if (count > 0) {
      const lastMessage = messages.last();
      await lastMessage.scrollIntoViewIfNeeded();
    }
  }

  /**
   * Scroll to top of messages
   */
  async scrollToTop() {
    // Try to find the first message and scroll to it
    const messages = this.page.locator(SELECTORS.MESSAGE_ITEM);
    const count = await messages.count();
    
    if (count > 0) {
      const firstMessage = messages.first();
      await firstMessage.scrollIntoViewIfNeeded();
    }
  }

  /**
   * Get sender name from message
   */
  async getMessageSender(messageContent: string): Promise<string> {
    const message = await this.findMessageByContent(messageContent);
    const sender = message.locator('[class*="sender"], [class*="author"], [class*="name"]').first();
    return await sender.textContent() || '';
  }

  /**
   * Get timestamp from message
   */
  async getMessageTimestamp(messageContent: string): Promise<string> {
    const message = await this.findMessageByContent(messageContent);
    const timestamp = message.locator('[class*="time"], time').first();
    return await timestamp.textContent() || '';
  }

  /**
   * Verify message input is enabled
   */
  async verifyCanSendMessages() {
    const messageInput = this.page.locator(SELECTORS.MESSAGE_INPUT).first();
    await expect(messageInput).toBeEnabled();
    
    const sendButton = this.page.locator(SELECTORS.SEND_MESSAGE_BUTTON).first();
    await expect(sendButton).toBeEnabled();
  }
}
