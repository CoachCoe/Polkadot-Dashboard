describe('Wallet Connection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the home page
    cy.visit('/', {
      timeout: 10000,
      failOnStatusCode: false
    });

    // Wait for the page to be fully loaded and interactive
    cy.findByRole('button', { name: /connect wallet/i }).should('exist');
  });

  it('should show connect wallet button when not connected', () => {
    cy.findByRole('button', { name: /connect wallet/i }).should('exist');
  });

  it('should show wallet address after connecting', () => {
    cy.connectWallet();

    // Verify the wallet address is displayed and can be clicked
    cy.findByRole('button', { name: /5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY/i })
      .should('exist')
      .click();

    // Verify the wallet details are shown in the popover
    cy.findByRole('heading', { name: /connected account/i }).should('exist');
    cy.findByText('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY').should('exist');

    // Verify disconnect button is available
    cy.findByRole('button', { name: /disconnect/i }).should('exist');
  });

  it('should maintain wallet connection when navigating to governance page', () => {
    cy.connectWallet();

    // Verify wallet is connected on home page
    cy.findByRole('button', { name: /5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY/i })
      .should('exist');

    // Navigate to governance page
    cy.findByRole('link', { name: /governance/i }).click();

    // Wait for the governance page to load
    cy.findByRole('heading', { name: /^governance$/i, level: 1 }).should('exist');

    // Verify wallet is still connected
    cy.findByRole('button', { name: /5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY/i })
      .should('exist')
      .click();

    // Verify wallet details are still accessible
    cy.findByRole('heading', { name: /connected account/i }).should('exist');
    cy.findByText('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY').should('exist');

    // Verify disconnect button is still available
    cy.findByRole('button', { name: /disconnect/i }).should('exist');
  });
}); 