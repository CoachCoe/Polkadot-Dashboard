/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
import '@testing-library/cypress/add-commands';
import type { Wallet, WalletAccount } from '@talismn/connect-wallets';

declare global {
  interface Window {
    __talismanWallets?: Wallet[];
  }
  
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock wallet connection
       * @example cy.connectWallet()
       */
      connectWallet(): Chainable<void>
    }
  }
}

Cypress.Commands.add('connectWallet', () => {
  // Mock the Talisman wallet API
  const mockAccount: WalletAccount = {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'Test Account',
    source: 'polkadot-js'
  };

  const mockWallet: Wallet = {
    enable: () => Promise.resolve(true),
    getAccounts: () => Promise.resolve([mockAccount]),
    subscribeAccounts: () => {
      // Return a noop unsubscribe function
      return () => {};
    },
    installed: true,
    title: 'Polkadot.js',
    extensionName: 'polkadot-js',
    installUrl: 'https://polkadot.js.org/extension/',
    logo: {
      src: 'https://polkadot.js.org/logo.svg',
      alt: 'Polkadot.js'
    },
    signer: {} as any,
    extension: {} as any,
    transformError: (err: Error) => err
  };

  // Set up the initial wallet state in localStorage
  const mockWalletState = {
    state: {
      accounts: [mockAccount],
      selectedAccount: mockAccount,
      isConnected: true,
    },
    version: 0
  };

  // Set the wallet state in localStorage before any interactions
  localStorage.setItem('wallet-storage', JSON.stringify(mockWalletState));

  // Mock the module in the window context
  cy.window().then((win) => {
    win.__talismanWallets = [mockWallet];
  });

  // Click the connect wallet button and wait for the wallet list to appear
  cy.findByRole('button', { name: /connect wallet/i }).click();
  cy.findByRole('heading', { name: /select wallet/i }).should('exist');

  // Click the Polkadot.js wallet button
  cy.findByRole('button', { name: /polkadot\.js/i }).click();

  // Wait for the wallet to be connected and verify the address is displayed
  cy.findByRole('button', { name: new RegExp(mockAccount.address, 'i') }).should('exist');
});