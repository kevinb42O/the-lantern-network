/**
 * Test data constants and helpers for e2e tests
 */

export const TEST_TIMEOUTS = {
  SHORT: 2000,
  MEDIUM: 5000,
  LONG: 10000,
  REALTIME: 3000, // Time to wait for Supabase realtime updates
} as const;

export const TEST_ROUTES = {
  HOME: '/',
  AUTH: '/',
  FLARES: '/#flares',
  CAMPFIRE: '/#campfire',
  MESSAGES: '/#messages',
  WALLET: '/#wallet',
  PROFILE: '/#profile',
  ADMIN: '/#admin',
} as const;

export const FLARE_CATEGORIES = {
  MECHANICAL: 'Mechanical',
  FOOD: 'Food',
  TALK: 'Talk',
  OTHER: 'Other',
} as const;

export const FLARE_TYPES = {
  REQUEST: 'request',
  OFFER: 'offer',
} as const;

export const TEST_FLARE = {
  REQUEST: {
    title: 'Test Help Request',
    description: 'This is a test help request created by automated tests',
    category: FLARE_CATEGORIES.OTHER,
    type: FLARE_TYPES.REQUEST,
  },
  OFFER: {
    title: 'Test Help Offer',
    description: 'This is a test help offer created by automated tests',
    category: FLARE_CATEGORIES.OTHER,
    type: FLARE_TYPES.OFFER,
  },
} as const;

export const TEST_MESSAGE = {
  CAMPFIRE: 'Test message from automated e2e tests',
  HELP_CONVERSATION: 'Test help conversation message',
  CIRCLE_DM: 'Test circle DM message',
} as const;

export const TEST_STORY = {
  CONTENT: 'Test story from automated e2e tests 🚀',
} as const;

/**
 * Selectors for common UI elements
 * Updated for Flemish translation
 */
export const SELECTORS = {
  // Auth
  EMAIL_INPUT: '#email',
  PASSWORD_INPUT: '#password',
  SIGN_IN_BUTTON: 'button[type="submit"]',
  SIGN_OUT_BUTTON: 'button:has-text("Afmelden")',
  
  // Navigation - Updated for Flemish
  NAV_FLARES: 'nav a[href*="flares"], nav button:has-text("Lichtjes")',
  NAV_CAMPFIRE: 'nav a[href*="campfire"], nav button:has-text("\'t Kampvuur")',
  NAV_MESSAGES: 'nav a[href*="messages"], nav button:has-text("Gesprekken")',
  NAV_WALLET: 'nav a[href*="wallet"], nav button:has-text("Portemonnee")',
  NAV_PROFILE: 'nav a[href*="profile"], nav button:has-text("Profiel")',
  NAV_ADMIN: 'nav a[href*="admin"], nav button:has-text("Beheer")',
  
  // Flares - Updated for Flemish
  CREATE_FLARE_BUTTON: 'button:has-text("Aanmaken"), button:has-text("Nieuw Lichtje")',
  FLARE_CARD: '[data-testid="flare-card"], .flare-card, [class*="card"]',
  FLARE_TITLE_INPUT: 'input[placeholder*="titel" i], input[name="title"]',
  FLARE_DESCRIPTION_INPUT: 'textarea[placeholder*="beschrijving" i], textarea[placeholder*="beschrijf" i], textarea[name="description"]',
  FLARE_TYPE_REQUEST: 'button:has-text("Vraag"), input[value="request"]',
  FLARE_TYPE_OFFER: 'button:has-text("Aanbod"), input[value="offer"]',
  FLARE_SUBMIT_BUTTON: 'button[type="submit"], button:has-text("Aanmaken")',
  
  // Campfire - Updated for Flemish
  MESSAGE_INPUT: 'textarea[placeholder*="bericht" i], input[placeholder*="bericht" i]',
  SEND_MESSAGE_BUTTON: 'button[type="submit"], button:has-text("Versturen")',
  MESSAGE_ITEM: '[data-testid="message"], .message, [class*="message"]',
  
  // Wallet - Updated for Flemish
  WALLET_BALANCE: '[data-testid="balance"], [class*="balance"]',
  TRANSACTION_HISTORY: '[data-testid="transaction"], [class*="transaction"]',
  
  // Profile - Updated for Flemish
  PROFILE_NAME: '[data-testid="profile-name"], [class*="profile-name"]',
  PROFILE_STATS: '[data-testid="stats"], [class*="stats"]',
  
  // Admin - Updated for Flemish
  ADMIN_PANEL: '[data-testid="admin-panel"], [class*="admin"]',
  SEND_ANNOUNCEMENT_BUTTON: 'button:has-text("Versturen"), button:has-text("Aankondiging")',
  
  // Stories - Updated for Flemish
  CREATE_STORY_BUTTON: 'button:has-text("Verhaal delen"), button:has-text("Verhaal")',
  STORY_CARD: '[data-testid="story"], [class*="story"]',
  STORY_REACTION_BUTTON: 'button[aria-label*="react"], button:has([class*="heart"])',
  
  // Common
  TOAST: '[data-sonner-toast]',
  MODAL: '[role="dialog"], [data-radix-dialog-content]',
  LOADING_SPINNER: '[class*="loading"], [class*="spinner"], [aria-busy="true"]',
  ERROR_MESSAGE: '[role="alert"], [class*="error"]',
} as const;

/**
 * Helper to create test data with unique identifiers
 */
export function createTestFlare(type: 'request' | 'offer', suffix: string = '') {
  const timestamp = Date.now();
  const base = type === 'request' ? TEST_FLARE.REQUEST : TEST_FLARE.OFFER;
  
  return {
    ...base,
    title: `${base.title} ${timestamp}${suffix}`,
    description: `${base.description} (Created at ${new Date().toISOString()})`,
  };
}

/**
 * Helper to create test message with timestamp
 */
export function createTestMessage(type: keyof typeof TEST_MESSAGE = 'CAMPFIRE') {
  const timestamp = Date.now();
  return `${TEST_MESSAGE[type]} - ${timestamp}`;
}

/**
 * Helper to create test story with timestamp
 */
export function createTestStory() {
  const timestamp = Date.now();
  return `${TEST_STORY.CONTENT} - ${timestamp}`;
}

/**
 * Expected table names in Supabase
 */
export const SUPABASE_TABLES = [
  'profiles',
  'flares',
  'messages',
  'help_requests',
  'help_offers',
  'connections',
  'transactions',
  'stories',
  'story_reactions',
] as const;

/**
 * Helper to check if email is admin
 * Uses environment variable for flexibility
 */
export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || 'kevinb42O@hotmail.com';
  return email.toLowerCase() === adminEmail.toLowerCase();
}
