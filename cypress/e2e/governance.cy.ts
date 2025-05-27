describe('Governance Page', () => {
  beforeEach(() => {
    cy.visit('/governance');
  });

  it('displays the main governance sections', () => {
    cy.get('h1').should('contain', 'Governance');
    cy.contains('button', 'Learn about OpenGov').should('be.visible');
    
    // Check tabs
    cy.contains('button', 'Voting Power').should('be.visible');
    cy.contains('button', 'Voting History').should('be.visible');
    cy.contains('button', 'Delegation').should('be.visible');
  });

  it('opens and closes the OpenGov guide', () => {
    // Open guide
    cy.contains('button', 'Learn about OpenGov').click();
    cy.contains('Understanding OpenGov').should('be.visible');
    cy.contains('What is OpenGov?').should('be.visible');
    
    // Close guide
    cy.contains('button', 'Close').click();
    cy.contains('Understanding OpenGov').should('not.exist');
  });

  it('switches between tabs', () => {
    // Check Voting Power tab
    cy.contains('button', 'Voting Power').click();
    cy.contains('Amount to Vote With').should('be.visible');
    cy.contains('Conviction').should('be.visible');
    
    // Check Voting History tab
    cy.contains('button', 'Voting History').click();
    cy.contains('No delegation history found').should('be.visible');
    
    // Check Delegation tab
    cy.contains('button', 'Delegation').click();
    cy.contains('Delegation features coming soon').should('be.visible');
  });

  it('handles voting power calculations', () => {
    cy.contains('button', 'Voting Power').click();
    
    // Test slider interactions
    cy.get('[role="slider"]').first().type('{rightarrow}');
    cy.contains('Total Voting Power').should('be.visible');
    
    // Test conviction multiplier
    cy.get('[role="slider"]').last().type('{rightarrow}');
    cy.contains('Lock period:').should('be.visible');
  });
}); 