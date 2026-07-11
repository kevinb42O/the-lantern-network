import { Page, expect } from '@playwright/test';
import { SELECTORS } from '../fixtures/test-data';
import { waitForNetworkIdle, waitForRealtimeUpdate } from '../utils/helpers';

export class FlaresPage {
  constructor(private page: Page) {}

  /**
   * Navigate to flares view
   */
  async goto() {
    // Try to find and click flares navigation
    const flaresNav = this.page.locator(SELECTORS.NAV_FLARES).first();
    
    try {
      await flaresNav.click({ timeout: 5000 });
    } catch {
      // Fallback: navigate directly
      await this.page.goto('/#flares');
    }
    
    await waitForNetworkIdle(this.page);
  }

  /**
   * Check if we're on the flares view
   */
  async isOnFlaresView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('flares') || url.endsWith('/');
  }

  /**
   * Wait for flares to load
   */
  async waitForFlares(timeout = 10000) {
    try {
      await this.page.waitForSelector(SELECTORS.FLARE_CARD, { timeout, state: 'visible' });
    } catch {
      // No flares yet, that's okay
    }
  }

  /**
   * Get count of visible flares
   */
  async getFlareCount(): Promise<number> {
    const flares = this.page.locator(SELECTORS.FLARE_CARD);
    return await flares.count();
  }

  /**
   * Click create flare button
   */
  async clickCreateFlare() {
    const createButton = this.page.locator(SELECTORS.CREATE_FLARE_BUTTON).first();
    await createButton.click();
    
    // Wait for modal to open
    await this.page.waitForSelector(SELECTORS.MODAL, { state: 'visible' });
  }

  /**
   * Fill flare title
   */
  async fillTitle(title: string) {
    const titleInput = this.page.locator(SELECTORS.FLARE_TITLE_INPUT).first();
    await titleInput.fill(title);
  }

  /**
   * Fill flare description
   */
  async fillDescription(description: string) {
    const descInput = this.page.locator(SELECTORS.FLARE_DESCRIPTION_INPUT).first();
    await descInput.fill(description);
  }

  /**
   * Select flare category
   */
  async selectCategory(category: string) {
    // Try to find category button
    const categoryButton = this.page.locator(`button:has-text("${category}")`).first();
    await categoryButton.click();
  }

  /**
   * Select flare type (request or offer)
   */
  async selectType(type: 'request' | 'offer') {
    const typeSelector = type === 'request' ? SELECTORS.FLARE_TYPE_REQUEST : SELECTORS.FLARE_TYPE_OFFER;
    const typeButton = this.page.locator(typeSelector).first();
    await typeButton.click();
  }

  /**
   * Toggle circle-only visibility
   */
  async toggleCircleOnly() {
    const circleToggle = this.page.locator('input[type="checkbox"], button:has-text("Circle")').first();
    await circleToggle.click();
  }

  /**
   * Submit flare creation
   */
  async submitFlare() {
    const submitButton = this.page.locator(SELECTORS.FLARE_SUBMIT_BUTTON).last();
    await submitButton.click();
    
    // Wait for modal to close
    await this.page.waitForSelector(SELECTORS.MODAL, { state: 'hidden', timeout: 10000 });
    
    // Wait for realtime update
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Create a new flare with all details
   */
  async createFlare(options: {
    title: string;
    description: string;
    category: string;
    type: 'request' | 'offer';
    circleOnly?: boolean;
  }) {
    await this.clickCreateFlare();
    
    // Select type first
    await this.selectType(options.type);
    
    // Fill in details
    await this.fillTitle(options.title);
    await this.fillDescription(options.description);
    await this.selectCategory(options.category);
    
    if (options.circleOnly) {
      await this.toggleCircleOnly();
    }
    
    await this.submitFlare();
  }

  /**
   * Find flare by title
   */
  async findFlareByTitle(title: string) {
    const flareCard = this.page.locator(SELECTORS.FLARE_CARD, { hasText: title }).first();
    return flareCard;
  }

  /**
   * Verify flare exists
   */
  async verifyFlareExists(title: string) {
    const flare = await this.findFlareByTitle(title);
    await expect(flare).toBeVisible();
  }

  /**
   * Click on a flare to view details
   */
  async clickFlare(title: string) {
    const flare = await this.findFlareByTitle(title);
    await flare.click();
  }

  /**
   * Offer to help on a flare
   */
  async offerHelp(flareTitle: string, message: string) {
    await this.clickFlare(flareTitle);
    
    // Wait for modal/detail view
    await this.page.waitForTimeout(500);
    
    // Find and click offer help button
    const offerButton = this.page.locator('button:has-text("Offer Help"), button:has-text("Help")').first();
    await offerButton.click();
    
    // Fill message if there's an input
    try {
      const messageInput = this.page.locator('textarea, input[type="text"]').first();
      if (await messageInput.isVisible({ timeout: 2000 })) {
        await messageInput.fill(message);
      }
    } catch {
      // No message input
    }
    
    // Submit
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Versturen")').first();
    await submitButton.click();
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Switch to filter tab
   */
  async switchToTab(tab: 'All' | 'Requests' | 'Offers' | 'Stories') {
    const tabButton = this.page.locator(`button:has-text("${tab}")`).first();
    await tabButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify filter tabs exist
   */
  async verifyFilterTabs() {
    const tabs = ['All', 'Requests', 'Offers', 'Stories'];
    
    for (const tab of tabs) {
      const tabButton = this.page.locator(`button:has-text("${tab}")`);
      await expect(tabButton).toBeVisible();
    }
  }

  /**
   * Check if flare card displays correct information
   */
  async verifyFlareCardInfo(title: string) {
    const flare = await this.findFlareByTitle(title);
    
    // Verify card has essential elements
    await expect(flare).toContainText(title);
    
    // Check for category icon or text
    const hasCategory = await flare.locator('[class*="category"], [class*="icon"]').count() > 0;
    expect(hasCategory).toBeTruthy();
  }

  /**
   * Create a story
   */
  async createStory(content: string) {
    // Switch to stories tab
    await this.switchToTab('Stories');
    
    // Click create story button
    const createButton = this.page.locator(SELECTORS.CREATE_STORY_BUTTON).first();
    await createButton.click();
    
    // Fill content
    const contentInput = this.page.locator('textarea').first();
    await contentInput.fill(content);
    
    // Submit
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Share")').first();
    await submitButton.click();
    
    // Wait for modal to close
    await this.page.waitForSelector(SELECTORS.MODAL, { state: 'hidden', timeout: 10000 });
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * React to a story
   */
  async reactToStory(storyContent: string, reactionType: 'heart' | 'celebrate' | 'home' = 'heart') {
    const story = this.page.locator(SELECTORS.STORY_CARD, { hasText: storyContent }).first();
    
    // Find reaction button
    const reactionButton = story.locator(SELECTORS.STORY_REACTION_BUTTON).first();
    await reactionButton.click();
    
    // If there's a menu, select the reaction type
    try {
      const reactionOption = this.page.locator(`button[aria-label*="${reactionType}"]`).first();
      if (await reactionOption.isVisible({ timeout: 1000 })) {
        await reactionOption.click();
      }
    } catch {
      // Direct reaction without menu
    }
    
    await waitForRealtimeUpdate(this.page);
  }

  /**
   * Get flare type badge text
   */
  async getFlareTypeBadge(title: string): Promise<string> {
    const flare = await this.findFlareByTitle(title);
    const badge = flare.locator('[class*="badge"]').first();
    return await badge.textContent() || '';
  }
}
