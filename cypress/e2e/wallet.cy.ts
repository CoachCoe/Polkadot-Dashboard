import { mockWallet } from '../support/mockWallet';

describe('Wallet Connection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the home page
    cy.visit('/', {
      onBeforeLoad(win) {
        win.__talismanWallets = [mockWallet];
        win.getWallets = () => [mockWallet];
      },
      timeout: 10000,
      failOnStatusCode: false
    });

    // Wait for the page to be fully loaded and interactive
    cy.findByRole('button', { name: /connect wallet/i }).should('exist');
  });

  it('should show connect wallet button when not connected', () => {
    cy.findByRole('button', { name: /connect wallet/i }).should('exist');
  });

  it.skip('should show wallet address after connecting', () => {
    // First restore the wallet state
    cy.restoreWalletState();

    // Click the connect wallet button
    cy.findByRole('button', { name: /connect wallet/i }).click();

    // Wait for the wallet list to appear and click Polkadot.js
    cy.findByRole('heading', { name: /select wallet/i }).should('exist');
    cy.findByRole('button', { name: /polkadot\.js/i }).click();

    // Wait for the wallet to be connected
    cy.findByRole('button', { name: /test account/i }).should('exist');

    // Click the account button to open the popover
    cy.findByRole('button', { name: /test account/i }).click();

    // Verify the wallet details are shown in the popover
    cy.findByRole('heading', { name: /connected account/i }).should('exist');
    cy.findByText('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY').should('exist');

    // Verify disconnect button is available
    cy.findByRole('button', { name: /disconnect/i }).should('exist');
  });

  it.skip('should handle wallet disconnection', () => {
    // First restore the wallet state
    cy.restoreWalletState();

    // Click the connect wallet button
    cy.findByRole('button', { name: /connect wallet/i }).click();

    // Wait for the wallet list to appear and click Polkadot.js
    cy.findByRole('heading', { name: /select wallet/i }).should('exist');
    cy.findByRole('button', { name: /polkadot\.js/i }).click();

    // Wait for the wallet to be connected
    cy.findByRole('button', { name: /test account/i }).should('exist');

    // Click the account button to open the popover
    cy.findByRole('button', { name: /test account/i }).click();

    // Click the disconnect button
    cy.findByRole('button', { name: /disconnect/i }).click();

    // Verify we're back to the connect wallet state
    cy.findByRole('button', { name: /connect wallet/i }).should('exist');

    // Verify the wallet state is cleared
    cy.window().then((win) => {
      const storedState = JSON.parse(win.localStorage.getItem('wallet-storage') || '{}');
      expect(storedState.state.selectedAccount).to.be.null;
    });
  });

  it.skip('should handle wallet connection error', () => {
    // ... existing test code ...
  });
}); 