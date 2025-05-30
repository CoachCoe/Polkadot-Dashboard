describe('Wallet Connection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    cy.visit('/');
    // Wait for the page to be fully loaded
    cy.findByRole('heading', { name: /explore polkadot/i, level: 1 }).should('exist');
  });

  it('should show connect wallet button when not connected', () => {
    cy.findByRole('button', { name: /connect wallet/i }).should('exist');
  });

  it('should show wallet address after connecting', () => {
    cy.connectWallet();
    cy.reload();
    // Wait for the wallet button to update with truncated address
    cy.findByRole('button', { name: /5grw.*utqy/i }).should('exist');
  });

  it('should maintain wallet connection when navigating to governance page', () => {
    cy.connectWallet();
    cy.reload();
    // Wait for the wallet to be connected
    cy.findByRole('button', { name: /5grw.*utqy/i }).should('exist');
    // Click the governance link in the navigation
    cy.findByRole('link', { name: /^governance$/i }).click();
    // Verify we're on the governance page and still connected
    cy.findByRole('heading', { name: /^governance$/i, level: 1 }).should('exist');
    cy.findByRole('button', { name: /5grw.*utqy/i }).should('exist');
  });
}); 