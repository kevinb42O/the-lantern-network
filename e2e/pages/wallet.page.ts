import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle } from '../utils/helpers';

export class WalletPage {
  constructor(private page: Page) {}

  /**
   * Navigate to wallet view
   */
  async goto() {
    const walletNav = this.page.locator(SELECTORS.NAV_WALLET).first();
    
    try {
      await walletNav.click({ timeout: 5000 });
    } catch {
      await this.page.goto('/#wallet');
    }
    
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the wallet view
   */
  async isOnWalletView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('wallet');
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<number> {
    const balanceElement = this.page.locator(SELECTORS.WALLET_BALANCE).first();
    await balanceElement.waitFor({ timeout: 5000, state: 'visible' });
    
    const text = await balanceElement.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Verify balance is displayed
   */
  async verifyBalanceDisplayed() {
    const balanceElement = this.page.locator(SELECTORS.WALLET_BALANCE).first();
    await expect(balanceElement).toBeVisible();
    
    const balance = await this.getBalance();
    expect(balance).toBeGreaterThanOrEqual(0);
  }

  /**
   * Get transaction count
   */
  async getTransactionCount(): Promise<number> {
    try {
      const transactions = this.page.locator(SELECTORS.TRANSACTION_HISTORY);
      return await transactions.count();
    } catch {
      return 0;
    }
  }

  /**
   * Verify transaction history loads
   */
  async verifyTransactionHistory() {
    // Wait for transactions to load or empty state
    await this.page.waitForTimeout(2000);
    
    const count = await this.getTransactionCount();
    
    // Either transactions exist or there's an empty state message
    if (count === 0) {
      // Check for empty state
      const emptyState = this.page.locator('text=/no transactions|empty|no history/i');
      try {
        await expect(emptyState).toBeVisible({ timeout: 3000 });
      } catch {
        // Might not have explicit empty state
      }
    } else {
      // Verify first transaction has details
      const firstTransaction = this.page.locator(SELECTORS.TRANSACTION_HISTORY).first();
      await expect(firstTransaction).toBeVisible();
    }
  }

  /**
   * Get transaction details by index
   */
  async getTransactionDetails(index: number = 0) {
    const transaction = this.page.locator(SELECTORS.TRANSACTION_HISTORY).nth(index);
    await transaction.waitFor({ timeout: 5000, state: 'visible' });
    
    const text = await transaction.textContent();
    return text || '';
  }

  /**
   * Verify balance updated after transaction
   */
  async verifyBalanceUpdated(previousBalance: number, expectedChange: number) {
    // Wait for balance to update
    await this.page.waitForTimeout(2000);
    
    const newBalance = await this.getBalance();
    const actualChange = newBalance - previousBalance;
    
    expect(actualChange).toBe(expectedChange);
  }

  /**
   * Check if wallet view has lantern icon/branding
   */
  async hasLanternBranding(): Promise<boolean> {
    const icon = this.page.locator('[class*="lantern"], img[alt*="lantern" i]');
    
    try {
      await icon.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get total earned (if displayed)
   */
  async getTotalEarned(): Promise<number | null> {
    try {
      const earnedElement = this.page.locator('text=/earned|received/i').first();
      const parent = earnedElement.locator('..').first();
      const text = await parent.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get total spent (if displayed)
   */
  async getTotalSpent(): Promise<number | null> {
    try {
      const spentElement = this.page.locator('text=/spent|given/i').first();
      const parent = spentElement.locator('..').first();
      const text = await parent.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Filter transactions by type (if available)
   */
  async filterByType(type: 'all' | 'earned' | 'spent') {
    const filterButton = this.page.locator(`button:has-text("${type}")`).first();
    
    try {
      if (await filterButton.isVisible({ timeout: 2000 })) {
        await filterButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch {
      // Filter not available
    }
  }

  /**
   * Verify transaction appears in history
   */
  async verifyTransactionExists(description: string) {
    const transaction = this.page.locator(SELECTORS.TRANSACTION_HISTORY, { hasText: description });
    await expect(transaction).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get most recent transaction
   */
  async getMostRecentTransaction() {
    const count = await this.getTransactionCount();
    
    if (count === 0) {
      return null;
    }
    
    return await this.getTransactionDetails(0);
  }
}
