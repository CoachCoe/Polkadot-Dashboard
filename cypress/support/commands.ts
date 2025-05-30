/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
import '@testing-library/cypress/add-commands';
import type { Wallet } from '@talismn/connect-wallets';
import { mockWallet, mockAccount } from './mockWallet';

declare global {
  interface Window {
    __talismanWallets?: Wallet[];
    getWallets?: () => Wallet[];
  }
  
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock wallet connection
       * @example cy.connectWallet()
       */
      connectWallet(): Chainable<void>
      /**
       * Custom command to restore wallet state
       * @example cy.restoreWalletState()
       */
      restoreWalletState(): Chainable<void>
    }
  }
}

// Mock wallet state
const mockWalletState = {
  state: {
    selectedAccount: mockAccount,
    wallet: mockWallet,
    isConnecting: false,
    error: null
  },
  version: 0
};

Cypress.Commands.add('restoreWalletState', () => {
  // Set the wallet state in localStorage
  localStorage.setItem('wallet-storage', JSON.stringify(mockWalletState));
  
  // Mock the module in the window context
  cy.window().then((win) => {
    win.__talismanWallets = [mockWallet];
    // Stub getWallets to return our mock
    win.getWallets = () => [mockWallet];
  });
});

Cypress.Commands.add('connectWallet', () => {
  // Restore the wallet state first
  cy.restoreWalletState();

  // Click the connect wallet button and wait for the wallet list to appear
  cy.findByRole('button', { name: /connect wallet/i }).click();
  cy.findByRole('heading', { name: /select wallet/i }).should('exist');

  // Click the Polkadot.js wallet button
  cy.findByRole('button', { name: /polkadot\.js/i }).click();

  // Wait for the wallet to be connected and verify the account is displayed
  cy.findByRole('button', { name: /test account/i }).should('exist');
  
  // Verify the wallet state is properly set
  cy.window().then((win) => {
    const storedState = JSON.parse(win.localStorage.getItem('wallet-storage') || '{}');
    expect(storedState.state.selectedAccount).to.deep.equal(mockAccount);
  });
});