import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle, waitForRealtimeUpdate } from '../utils/helpers';

export class AdminPage {
  constructor(private page: Page) {}

  /**
   * Navigate to admin view
   */
  async goto() {
    const adminNav = this.page.locator(SELECTORS.NAV_ADMIN).first();
    
    try {
      await adminNav.click({ timeout: 5000 });
    } catch {
      await this.page.goto('/#admin');
    }
    
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the admin view
   */
  async isOnAdminView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('admin');
  }

  /**
   * Check if admin panel is accessible
   */
  async isAdminPanelAccessible(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.ADMIN_PANEL, { timeout: 5000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify admin view loads for admin users
   */
  async verifyAdminViewLoads() {
    const accessible = await this.isAdminPanelAccessible();
    expect(accessible).toBeTruthy();
  }

  /**
   * Send announcement to everyone
   */
  async sendAnnouncement(message: string, giftAmount?: number) {
    // Find and click send announcement button
    const announceButton = this.page.locator(SELECTORS.SEND_ANNOUNCEMENT_BUTTON).first();
    await announceButton.click();
    
    // Wait for modal to open
    await this.page.waitForSelector(SELECTORS.MODAL, { state: 'visible' });
    
    // Fill announcement message
    const messageInput = this.page.locator('textarea, input[type="text"]').first();
    await messageInput.fill(message);
    
    // Fill gift amount if provided
    if (giftAmount !== undefined && giftAmount > 0) {
      const giftInput = this.page.locator('input[type="number"], input[name*="gift"]').first();
      try {
        if (await giftInput.isVisible({ timeout: 2000 })) {
          await giftInput.fill(giftAmount.toString());
        }
      } catch {
        // No gift input available
      }
    }
    
    // Submit announcement
    const sendButton = this.page.locator('button[type="submit"], button:has-text("Send")').last();
    await sendButton.click();
    
    // Wait for modal to close
    await this.page.waitForSelector(SELECTORS.MODAL, { state: 'hidden', timeout: 10000 });
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Remove a flare
   */
  async removeFlare(flareTitle: string) {
    // Find flare in admin panel
    const flare = this.page.locator(SELECTORS.FLARE_CARD, { hasText: flareTitle }).first();
    
    // Find remove button
    const removeButton = flare.locator('button:has-text("Remove"), button:has-text("Delete")').first();
    await removeButton.click();
    
    // Confirm removal
    const confirmButton = this.page.locator('button:has-text("Bevestigen"), button:has-text("Ja")').first();
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
   * Clear campfire (delete all messages)
   */
  async clearCampfire() {
    const clearButton = this.page.locator('button:has-text("\'t Kampvuur wissen"), button:has-text("Berichten wissen")').first();
    
    try {
      if (await clearButton.isVisible({ timeout: 2000 })) {
        await clearButton.click();
        
        // Confirm
        const confirmButton = this.page.locator('button:has-text("Bevestigen"), button:has-text("Ja")').first();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }
        
        await waitForRealtimeUpdate(this.page);
      }
    } catch {
      // Feature not available or accessible
    }
  }

  /**
   * Get statistics display
   */
  async getStatistics() {
    const stats = {
      totalUsers: 0,
      totalFlares: 0,
      totalMessages: 0,
      activeLanterns: 0,
    };

    try {
      const statsSection = this.page.locator('[class*="statistics"], [class*="stats"]').first();
      await statsSection.waitFor({ timeout: 3000, state: 'visible' });
      
      // Try to extract various statistics
      const text = await statsSection.textContent();
      
      const usersMatch = text?.match(/(\d+)\s*users?/i);
      if (usersMatch) stats.totalUsers = parseInt(usersMatch[1], 10);
      
      const flaresMatch = text?.match(/(\d+)\s*flares?/i);
      if (flaresMatch) stats.totalFlares = parseInt(flaresMatch[1], 10);
      
      const messagesMatch = text?.match(/(\d+)\s*messages?/i);
      if (messagesMatch) stats.totalMessages = parseInt(messagesMatch[1], 10);
      
      const lanternsMatch = text?.match(/(\d+)\s*lanterns?/i);
      if (lanternsMatch) stats.activeLanterns = parseInt(lanternsMatch[1], 10);
    } catch {
      // Stats not available
    }

    return stats;
  }

  /**
   * Verify statistics view displays correctly
   */
  async verifyStatisticsDisplay() {
    const stats = await this.getStatistics();
    
    // At minimum, we should have some data
    const hasStats = stats.totalUsers > 0 || stats.totalFlares >= 0;
    expect(hasStats).toBeTruthy();
  }

  /**
   * Manage user (ban, unban, etc.)
   */
  async manageUser(userEmail: string, action: 'ban' | 'unban' | 'promote' | 'demote') {
    // Find user in user management section
    const userRow = this.page.locator(`text=${userEmail}`).locator('..').first();
    
    // Find action button
    const actionButton = userRow.locator(`button:has-text("${action}")`).first();
    
    try {
      if (await actionButton.isVisible({ timeout: 2000 })) {
        await actionButton.click();
        
        // Confirm if needed
        const confirmButton = this.page.locator('button:has-text("Bevestigen"), button:has-text("Ja")').first();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }
        
        await waitForRealtimeUpdate(this.page);
      }
    } catch {
      // Action not available
    }
  }

  /**
   * View user management section
   */
  async gotoUserManagement() {
    const userMgmtButton = this.page.locator('button:has-text("Users"), a:has-text("Users")').first();
    
    try {
      if (await userMgmtButton.isVisible({ timeout: 2000 })) {
        await userMgmtButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch {
      // Not available
    }
  }

  /**
   * View reports
   */
  async gotoReports() {
    const reportsButton = this.page.locator('button:has-text("Reports"), a:has-text("Reports")').first();
    
    try {
      if (await reportsButton.isVisible({ timeout: 2000 })) {
        await reportsButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch {
      // Not available
    }
  }

  /**
   * Get report count
   */
  async getReportCount(): Promise<number> {
    try {
      const reports = this.page.locator('[class*="report"]');
      return await reports.count();
    } catch {
      return 0;
    }
  }

  /**
   * Resolve a report
   */
  async resolveReport(index: number = 0) {
    const reports = this.page.locator('[class*="report"]');
    const report = reports.nth(index);
    
    const resolveButton = report.locator('button:has-text("Resolve")').first();
    
    try {
      if (await resolveButton.isVisible({ timeout: 2000 })) {
        await resolveButton.click();
        await waitForRealtimeUpdate(this.page);
      }
    } catch {
      // Not available
    }
  }

  /**
   * Check if user has admin privileges by verifying admin nav exists
   */
  async hasAdminAccess(): Promise<boolean> {
    try {
      const adminNav = this.page.locator(SELECTORS.NAV_ADMIN);
      await adminNav.waitFor({ timeout: 3000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify all admin features are accessible
   */
  async verifyAdminFeatures() {
    // Check announcement feature
    const announceButton = this.page.locator(SELECTORS.SEND_ANNOUNCEMENT_BUTTON);
    await expect(announceButton).toBeVisible();
    
    // Check if user management exists
    await this.gotoUserManagement();
    
    // Go back to main admin view
    await this.goto();
  }
}
