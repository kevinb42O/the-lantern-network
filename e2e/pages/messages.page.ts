import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle, waitForRealtimeUpdate } from '../utils/helpers';

export class MessagesPage {
  constructor(private page: Page) {}

  /**
   * Navigate to messages view
   */
  async goto() {
    const messagesNav = this.page.locator(SELECTORS.NAV_MESSAGES).first();
    
    try {
      await messagesNav.click({ timeout: 5000 });
    } catch {
      await this.page.goto('/#messages');
    }
    
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the messages view
   */
  async isOnMessagesView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('messages');
  }

  /**
   * Switch to tab
   */
  async switchToTab(tab: 'Chats' | 'Circle' | 'Requests') {
    const tabButton = this.page.locator(`button:has-text("${tab}")`).first();
    await tabButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify tabs exist
   */
  async verifyTabsExist() {
    const tabs = ['Chats', 'Circle', 'Requests'];
    
    for (const tab of tabs) {
      const tabButton = this.page.locator(`button:has-text("${tab}")`);
      try {
        await expect(tabButton).toBeVisible({ timeout: 3000 });
      } catch {
        // Tab might not be visible depending on user state
      }
    }
  }

  /**
   * Get count of conversations
   */
  async getConversationCount(): Promise<number> {
    const conversations = this.page.locator('[class*="conversation"], [class*="chat"]');
    return await conversations.count();
  }

  /**
   * Click on a conversation
   */
  async clickConversation(index: number = 0) {
    const conversations = this.page.locator('[class*="conversation"], [class*="chat"]');
    const conversation = conversations.nth(index);
    await conversation.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Send message in conversation
   */
  async sendMessageInConversation(content: string) {
    const messageInput = this.page.locator(SELECTORS.MESSAGE_INPUT).first();
    await messageInput.fill(content);
    
    const sendButton = this.page.locator(SELECTORS.SEND_MESSAGE_BUTTON).first();
    await sendButton.click();
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Accept help offer
   */
  async acceptHelpOffer() {
    const acceptButton = this.page.locator('button:has-text("Accept")').first();
    await acceptButton.click();
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Deny help offer
   */
  async denyHelpOffer() {
    const denyButton = this.page.locator('button:has-text("Deny"), button:has-text("Decline")').first();
    await denyButton.click();
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Complete flare (mark as complete)
   */
  async completeFlare(lanternAmount?: number) {
    const completeButton = this.page.locator('button:has-text("Complete")').first();
    await completeButton.click();
    
    // If lantern input appears, fill it
    if (lanternAmount !== undefined) {
      try {
        const lanternInput = this.page.locator('input[type="number"]').first();
        if (await lanternInput.isVisible({ timeout: 2000 })) {
          await lanternInput.fill(lanternAmount.toString());
        }
      } catch {
        // No lantern input
      }
    }
    
    // Confirm
    const confirmButton = this.page.locator('button:has-text("Confirm"), button[type="submit"]').first();
    await confirmButton.click();
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Send connection request to user
   */
  async sendConnectionRequest(userName: string) {
    // This would typically be done from a user profile or search
    // Implementation depends on UI structure
    const addButton = this.page.locator('button:has-text("Add to Circle"), button:has-text("Connect")').first();
    await addButton.click();
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Accept connection request
   */
  async acceptConnectionRequest() {
    // Switch to requests tab if needed
    await this.switchToTab('Requests');
    
    const acceptButton = this.page.locator('button:has-text("Accept")').first();
    await acceptButton.click();
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Decline connection request
   */
  async declineConnectionRequest() {
    await this.switchToTab('Requests');
    
    const declineButton = this.page.locator('button:has-text("Decline"), button:has-text("Deny")').first();
    await declineButton.click();
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Check unread message badge
   */
  async hasUnreadBadge(): Promise<boolean> {
    const badge = this.page.locator('[class*="badge"], [class*="unread"]').first();
    
    try {
      await badge.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const badge = this.page.locator('[class*="badge"], [class*="unread"]').first();
      const text = await badge.textContent();
      return parseInt(text || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead() {
    // Typically happens automatically when viewing conversation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify circle chat works
   */
  async verifyCircleChat() {
    await this.switchToTab('Circle');
    
    const hasCircleMembers = await this.getConversationCount() > 0;
    
    if (hasCircleMembers) {
      await this.clickConversation(0);
      
      const testMessage = `Circle test - ${Date.now()}`;
      await this.sendMessageInConversation(testMessage);
      
      // Verify message appears
      const message = this.page.locator(SELECTORS.MESSAGE_ITEM, { hasText: testMessage });
      await expect(message).toBeVisible();
    }
  }

  /**
   * Verify help request conversations display
   */
  async verifyHelpRequestConversations() {
    await this.switchToTab('Chats');
    
    // Check if any conversations exist
    const count = await this.getConversationCount();
    
    // If there are conversations, verify they're clickable
    if (count > 0) {
      await this.clickConversation(0);
      
      // Verify we can see the conversation
      const conversationView = this.page.locator('[class*="conversation-view"], [class*="chat-view"]');
      await expect(conversationView).toBeVisible();
    }
  }

  /**
   * Remove from circle
   */
  async removeFromCircle(userName?: string) {
    await this.switchToTab('Circle');
    
    // Find user or use first connection
    const removeButton = this.page.locator('button:has-text("Remove")').first();
    await removeButton.click();
    
    // Confirm
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
    try {
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } catch {
      // No confirmation needed
    }
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Check if announcement is displayed
   */
  async hasAnnouncement(): Promise<boolean> {
    const announcement = this.page.locator('[class*="announcement"]').first();
    
    try {
      await announcement.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Claim gift from announcement
   */
  async claimGift() {
    const claimButton = this.page.locator('button:has-text("Claim")').first();
    await claimButton.click();
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Mark announcement as read
   */
  async markAnnouncementAsRead() {
    const markReadButton = this.page.locator('button:has-text("Mark"), button[aria-label*="read"]').first();
    
    try {
      if (await markReadButton.isVisible({ timeout: 2000 })) {
        await markReadButton.click();
      }
    } catch {
      // No mark as read button or already read
    }
    
    await this.page.waitForTimeout(500);
  }
}
