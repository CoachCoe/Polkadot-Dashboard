describe('Governance Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    // Connect wallet before visiting the page
    cy.connectWallet();
    cy.visit('/governance');
    // Wait for the page to load and verify wallet connection
    cy.findByRole('heading', { name: /^governance$/i, level: 1 }).should('exist');
    cy.findByRole('button', { name: /5grw.*utqy/i }).should('exist');
  });

  it('displays the main governance sections', () => {
    cy.findByRole('heading', { name: /^governance$/i, level: 1 }).should('exist');
    cy.findByRole('heading', { name: /^governance stats$/i, level: 2 }).should('exist');
    cy.findByRole('tab', { name: /referendums/i }).should('exist');
    cy.findByRole('tab', { name: /delegation/i }).should('exist');
  });

  it('opens and closes the OpenGov guide', () => {
    // Open the guide
    cy.findByRole('button', { name: /learn about opengov/i }).click();
    cy.findByRole('dialog').should('exist');
    cy.findByText('Understanding OpenGov').should('exist');
    
    // Close using the main close button at the bottom
    cy.findByRole('dialog')
      .within(() => {
        cy.get('button.bg-primary').click({ force: true });
      });
    cy.findByRole('dialog').should('not.exist');
    
    // Open again and close using the X button
    cy.findByRole('button', { name: /learn about opengov/i }).click();
    cy.findByRole('dialog').should('exist');
    cy.findByRole('dialog')
      .within(() => {
        cy.get('button.absolute').click({ force: true });
      });
    cy.findByRole('dialog').should('not.exist');
  });

  it('switches between tabs', () => {
    // Check default tab
    cy.findByRole('tab', { name: /referendums/i }).should('have.attr', 'data-state', 'active');
    cy.findByRole('tabpanel', { name: /referendums/i }).should('be.visible');
    
    // Switch to delegation tab
    cy.findByRole('tab', { name: /delegation/i }).click();
    cy.findByRole('tab', { name: /delegation/i }).should('have.attr', 'data-state', 'active');
    cy.findByRole('tabpanel', { name: /delegation/i }).should('be.visible');
  });
}); 