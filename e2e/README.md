# E2E Test Suite for The Lantern Network

This directory contains end-to-end tests for The Lantern Network app using Playwright.

## Setup

### Prerequisites

1. Node.js 18+ installed
2. A Supabase project with test data
3. A test user account in your Supabase project

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Configuration

Create a `.env` file in the project root with your test credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password
```

**Important**: Never commit your `.env` file. It's already in `.gitignore`.

## Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── fixtures/           # Test data and constants
│   └── test-data.ts
├── pages/              # Page Object Models
│   ├── auth.page.ts
│   ├── flares.page.ts
│   ├── campfire.page.ts
│   ├── messages.page.ts
│   ├── wallet.page.ts
│   ├── profile.page.ts
│   └── admin.page.ts
├── tests/              # Test specs
│   ├── auth.spec.ts
│   ├── supabase-health.spec.ts
│   ├── flares.spec.ts
│   ├── campfire.spec.ts
│   ├── notifications.spec.ts
│   ├── admin.spec.ts
│   ├── circles.spec.ts
│   ├── messaging.spec.ts
│   ├── wallet.spec.ts
│   ├── profile.spec.ts
│   └── stories.spec.ts
└── utils/              # Helper functions
    └── helpers.ts
```

## Test Coverage

### Authentication Flow
- Login page loads correctly
- Login with valid credentials
- Login with invalid credentials shows error
- Logout functionality
- Session persistence

### Supabase Connection Health
- Supabase client initialization
- Database connection
- Auth service responsiveness
- Realtime subscriptions
- Table accessibility

### Flares Functionality
- View and create flares
- Request and offer types
- Circle-only visibility
- Filter tabs
- Category selection

### Campfire/Chat
- View and send messages
- Real-time updates
- Message display

### Messaging
- Help request conversations
- Circle DMs
- Tab navigation

### Wallet & Transactions
- Balance display
- Transaction history

### Profile
- Profile data display
- Stats display
- Sign out

### Admin Functions
- Admin panel access
- Send announcements
- Statistics view
- User management

### Circles/Trust Network
- Circle connections
- Circle chat

### Notifications & Announcements
- Unread badges
- Announcements display

### Stories
- Create stories
- View stories tab

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/e2e-tests.yml` for the full workflow configuration.

## Troubleshooting

### Tests failing locally

1. Ensure your `.env` file has valid credentials
2. Make sure the dev server is running (`npm run dev`)
3. Check that Supabase is accessible and not rate-limited
4. Clear browser cache: `npx playwright clean`

### Flaky tests

Tests are designed to be deterministic, but network issues can cause flakiness:
- Tests automatically retry on CI (2 retries)
- Increase timeouts if needed in `playwright.config.ts`
- Check for realtime subscription delays

### Admin tests failing

Admin tests only run if `TEST_USER_EMAIL` matches an admin email in the app.
Update `e2e/fixtures/test-data.ts` with your admin email if needed.

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on other tests
2. **Clean State**: Tests clean up after themselves to avoid polluting test data
3. **Proper Waits**: Use Playwright's built-in waiting mechanisms, not arbitrary timeouts
4. **Page Objects**: Use page object models for better maintainability
5. **Descriptive Names**: Test names should clearly describe what they test
6. **Error Messages**: Tests should provide clear failure messages

## Contributing

When adding new features to the app:

1. Add corresponding page object methods if needed
2. Create test specs for new functionality
3. Update test data fixtures as needed
4. Run tests locally before committing
5. Ensure tests pass in CI

## Support

For issues with tests, check:
- Test failure screenshots in `test-results/`
- Test reports in `playwright-report/`
- Console logs in test output
