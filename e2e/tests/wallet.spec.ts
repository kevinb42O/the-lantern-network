import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { WalletPage } from '../pages/wallet.page';
import { getTestCredentials } from '../utils/helpers';

test.describe('Wallet & Transactions', () => {
  let authPage: AuthPage;
  let walletPage: WalletPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    walletPage = new WalletPage(page);

    const { email, password } = getTestCredentials();
    await authPage.goto();
    await authPage.signInAndVerify(email, password);
    await authPage.completeProfileSetupIfNeeded();

    await walletPage.goto();
  });

  test('wallet view displays current balance', async () => {
    await test.step('Verify balance is displayed', async () => {
      await walletPage.verifyBalanceDisplayed();
    });

    await test.step('Get balance value', async () => {
      const balance = await walletPage.getBalance();
      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });

  test('transaction history loads', async () => {
    await test.step('Verify transaction history', async () => {
      await walletPage.verifyTransactionHistory();
    });

    await test.step('Get transaction count', async () => {
      const count = await walletPage.getTransactionCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
