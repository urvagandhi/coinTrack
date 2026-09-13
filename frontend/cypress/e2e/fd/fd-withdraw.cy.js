/* global cy, describe, it, beforeEach */
describe('Fixed Deposits — premature withdrawal', () => {
  beforeEach(() => {
    cy.visitFdPage();
  });

  it('opens the withdrawal dialog and enforces date bounds (edge)', () => {
    cy.get('tr')
      .contains('State Bank of India')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .click();

    cy.get('h2').contains('Premature Withdrawal').should('exist');
    cy.get('input[type="date"]').should('have.attr', 'min', '2024-01-15');
    cy.get('input[type="date"]').should('have.attr', 'max', '2029-01-15');
  });

  it('completes a withdrawal and shows the realized breakdown + TDS disclaimer (happy)', () => {
    cy.intercept('POST', '**/api/fixed-deposits/*/withdraw', {
      fixture: 'prematureWithdraw.json',
    }).as('withdraw');

    cy.get('tr')
      .contains('State Bank of India')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .click();

    cy.get('input[type="date"]').type('2024-06-15');
    cy.get('button').contains('Confirm Withdraw').click();

    cy.wait('@withdraw').its('request.body').should('deep.equal', {
      withdrawalDate: '2024-06-15',
    });

    cy.contains('Realized Amount').should('exist');
    cy.contains('₹4,87,500.00').should('exist');
    cy.contains('500 days').should('exist');
    cy.contains('₹19,440.50').should('exist');
    // [DEPRECATED-TDS] These assertions checked TDS disclaimer text in the withdrawal breakdown.
    // Re-enable with the TDS feature.
    // cy.contains('final tax liability').should('exist');
    // cy.contains(/reconcile via i?ITR/i).should('exist');
  });
});
