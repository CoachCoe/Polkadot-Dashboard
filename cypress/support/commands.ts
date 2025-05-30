/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
import '@testing-library/cypress/add-commands';

declare global {
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

// Cypress.Commands.add('login', (email, password) => { ... })
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands

// -- This is a parent command --
Cypress.Commands.add('connectWallet', () => {
  const mockWalletState = {
    state: {
      accounts: [{
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: {
          name: 'Test Account',
          source: 'polkadot-js'
        }
      }],
      selectedAccount: {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: {
          name: 'Test Account',
          source: 'polkadot-js'
        }
      },
      isConnected: true
    },
    version: 0
  };

  window.localStorage.setItem('wallet-storage', JSON.stringify(mockWalletState));
});

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... }) 