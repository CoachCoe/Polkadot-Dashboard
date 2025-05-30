describe('Staking Page', () => {
  it('loads the staking page and shows the heading', () => {
    cy.visit('/staking', { failOnStatusCode: false });
    cy.findByRole('heading', { name: /^staking$/i, level: 1 }).should('exist');
  });
}); 