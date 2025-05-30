describe('Governance Page', () => {
  it('loads the governance page and shows the heading', () => {
    cy.visit('/governance', { failOnStatusCode: false });
    cy.findByRole('heading', { name: /^governance$/i, level: 1 }).should('exist');
  });
}); 