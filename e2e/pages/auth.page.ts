import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle, waitForNavigation } from '../utils/helpers';

export class AuthPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the auth page
   */
  async goto() {
    await this.page.goto('/');
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the auth page
   */
  async isOnAuthPage(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.EMAIL_INPUT, { timeout: 5000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if we're logged in (not on auth page)
   */
  async isLoggedIn(): Promise<boolean> {
    return !(await this.isOnAuthPage());
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.page.fill(SELECTORS.PASSWORD_INPUT, password);
  }

  /**
   * Click sign in button
   */
  async clickSignIn() {
    await this.page.click(SELECTORS.SIGN_IN_BUTTON);
  }

  /**
   * Sign in with credentials
   */
  async signIn(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
    
    // Wait for navigation after successful login
    await this.page.waitForLoadState('domcontentloaded');
    await waitForNetworkIdle(this.page, 10000);
  }

  /**
   * Sign in and verify success
   */
  async signInAndVerify(email: string, password: string) {
    await this.signIn(email, password);
    
    // Wait for auth to complete and verify we're logged in
    await this.page.waitForTimeout(2000);
    const loggedIn = await this.isLoggedIn();
    expect(loggedIn).toBeTruthy();
  }

  /**
   * Check for error message
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      const errorSelector = 'div:has-text("⚠️"), [class*="error"], [role="alert"]';
      await this.page.waitForSelector(errorSelector, { timeout: 3000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const errorSelector = 'div:has-text("⚠️"), [class*="error"], [role="alert"]';
    const element = this.page.locator(errorSelector).first();
    return await element.textContent() || '';
  }

  /**
   * Check for success message
   */
  async hasSuccessMessage(): Promise<boolean> {
    try {
      const successSelector = 'div:has-text("✅"), [class*="success"]';
      await this.page.waitForSelector(successSelector, { timeout: 3000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Switch to sign up mode
   */
  async switchToSignUp() {
    const signUpLink = this.page.locator('button:has-text("Sign up")');
    await signUpLink.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to magic link mode
   */
  async switchToMagicLink() {
    const magicLinkButton = this.page.locator('button:has-text("magic link")');
    await magicLinkButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Sign out
   */
  async signOut() {
    // Try to find and click sign out button in various locations
    const signOutSelectors = [
      'button:has-text("Sign Out")',
      'button:has-text("Logout")',
      'a:has-text("Sign Out")',
      'a:has-text("Logout")',
    ];

    for (const selector of signOutSelectors) {
      try {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          await waitForNavigation(this.page);
          return;
        }
      } catch {
        // Try next selector
      }
    }
    
    throw new Error('Sign out button not found');
  }

  /**
   * Wait for profile setup to complete (if shown)
   */
  async waitForProfileSetupOrHome(timeout = 30000) {
    // Wait for either profile setup form or main app to load
    try {
      await Promise.race([
        this.page.waitForSelector('input[placeholder*="display name" i]', { timeout, state: 'visible' }),
        this.page.waitForSelector('nav, [role="navigation"]', { timeout, state: 'visible' }),
      ]);
    } catch {
      // If neither appears, that's okay - might already be past setup
    }
  }

  /**
   * Complete profile setup if shown
   */
  async completeProfileSetupIfNeeded(displayName?: string) {
    try {
      const nameInput = this.page.locator('input[placeholder*="display name" i]');
      const isSetupVisible = await nameInput.isVisible({ timeout: 3000 });
      
      if (isSetupVisible) {
        await nameInput.fill(displayName || 'Test User');
        const submitButton = this.page.locator('button[type="submit"]').first();
        await submitButton.click();
        await waitForNavigation(this.page);
      }
    } catch {
      // Profile setup not needed or already completed
    }
  }

  /**
   * Check if logo is displayed
   */
  async hasLogo(): Promise<boolean> {
    try {
      await this.page.waitForSelector('img[alt*="Lantern" i]', { timeout: 3000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify page title/heading
   */
  async verifyHeading(expectedText: string) {
    const heading = this.page.locator('h1').first();
    await expect(heading).toContainText(expectedText);
  }
}
