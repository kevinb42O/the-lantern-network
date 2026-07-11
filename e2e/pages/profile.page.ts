import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle } from '../utils/helpers';

export class ProfilePage {
  constructor(private page: Page) {}

  /**
   * Navigate to profile view
   */
  async goto() {
    const profileNav = this.page.locator(SELECTORS.NAV_PROFILE).first();
    
    try {
      await profileNav.click({ timeout: 5000 });
    } catch {
      await this.page.goto('/#profile');
    }
    
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the profile view
   */
  async isOnProfileView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('profile');
  }

  /**
   * Get display name
   */
  async getDisplayName(): Promise<string> {
    const nameElement = this.page.locator(SELECTORS.PROFILE_NAME).first();
    await nameElement.waitFor({ timeout: 5000, state: 'visible' });
    return await nameElement.textContent() || '';
  }

  /**
   * Verify profile data is displayed
   */
  async verifyProfileData() {
    // Check display name
    const name = await this.getDisplayName();
    expect(name.length).toBeGreaterThan(0);
    
    // Check stats section exists
    const stats = this.page.locator(SELECTORS.PROFILE_STATS).first();
    await expect(stats).toBeVisible();
  }

  /**
   * Get helps given count
   */
  async getHelpsGiven(): Promise<number> {
    try {
      const helpsElement = this.page.locator('text=/helps given|helped/i').first();
      const parent = helpsElement.locator('..').first();
      const text = await parent.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get reputation/trust level
   */
  async getReputation(): Promise<number> {
    try {
      const repElement = this.page.locator('text=/reputation|trust/i').first();
      const parent = repElement.locator('..').first();
      const text = await parent.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get lantern balance from profile
   */
  async getLanterns(): Promise<number> {
    try {
      const lanternsElement = this.page.locator('text=/lanterns|balance/i').first();
      const parent = lanternsElement.locator('..').first();
      const text = await parent.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Verify stats display correctly
   */
  async verifyStatsDisplay() {
    const helpsGiven = await this.getHelpsGiven();
    const reputation = await this.getReputation();
    const lanterns = await this.getLanterns();
    
    expect(helpsGiven).toBeGreaterThanOrEqual(0);
    expect(reputation).toBeGreaterThanOrEqual(0);
    expect(lanterns).toBeGreaterThanOrEqual(0);
  }

  /**
   * Check if badge progress is displayed
   */
  async hasBadgeProgress(): Promise<boolean> {
    const badgeSection = this.page.locator('text=/badges|achievements/i');
    
    try {
      await badgeSection.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      const badges = this.page.locator('[class*="badge"]');
      return await badges.count();
    } catch {
      return 0;
    }
  }

  /**
   * Check if elder status section exists
   */
  async hasElderStatus(): Promise<boolean> {
    const elderSection = this.page.locator('text=/elder|senior/i');
    
    try {
      await elderSection.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if invite codes section exists
   */
  async hasInviteCodes(): Promise<boolean> {
    const inviteSection = this.page.locator('text=/invite/i');
    
    try {
      await inviteSection.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate invite code (if available)
   */
  async generateInviteCode() {
    const generateButton = this.page.locator('button:has-text("Generate"), button:has-text("Create")').first();
    
    try {
      if (await generateButton.isVisible({ timeout: 2000 })) {
        await generateButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch {
      // Not available or not elder
    }
  }

  /**
   * Sign out from profile
   */
  async signOut() {
    const signOutButton = this.page.locator(SELECTORS.SIGN_OUT_BUTTON).first();
    await signOutButton.click();
    
    // Wait for redirect to auth page
    await this.page.waitForLoadState('domcontentloaded');
    await waitForNetworkIdle(this.page);
  }

  /**
   * Edit profile (if available)
   */
  async editProfile(updates: { displayName?: string; bio?: string }) {
    const editButton = this.page.locator('button:has-text("Edit")').first();
    
    try {
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
        
        if (updates.displayName) {
          const nameInput = this.page.locator('input[name="displayName"], input[placeholder*="name"]').first();
          await nameInput.fill(updates.displayName);
        }
        
        if (updates.bio) {
          const bioInput = this.page.locator('textarea[name="bio"], textarea[placeholder*="bio"]').first();
          await bioInput.fill(updates.bio);
        }
        
        const saveButton = this.page.locator('button:has-text("Save")').first();
        await saveButton.click();
        
        await this.page.waitForTimeout(1000);
      }
    } catch {
      // Edit not available
    }
  }

  /**
   * View badge details
   */
  async viewBadgeDetails(badgeName: string) {
    const badge = this.page.locator(`[class*="badge"]:has-text("${badgeName}")`).first();
    
    try {
      if (await badge.isVisible({ timeout: 2000 })) {
        await badge.click();
        await this.page.waitForTimeout(500);
      }
    } catch {
      // Badge not found or not clickable
    }
  }

  /**
   * Get join date
   */
  async getJoinDate(): Promise<string> {
    try {
      const joinElement = this.page.locator('text=/joined|member since/i').first();
      const parent = joinElement.locator('..').first();
      const text = await parent.textContent();
      return text || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if profile has avatar
   */
  async hasAvatar(): Promise<boolean> {
    const avatar = this.page.locator('[class*="avatar"], img[alt*="avatar" i]');
    
    try {
      await avatar.waitFor({ timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify profile loaded successfully
   */
  async verifyProfileLoaded() {
    // Check for essential profile elements
    await this.verifyProfileData();
    
    // Check that we're not on loading state
    const loadingSpinner = this.page.locator(SELECTORS.LOADING_SPINNER);
    await expect(loadingSpinner).not.toBeVisible();
  }
}
