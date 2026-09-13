/* global cy, describe, it, beforeEach */
describe('Fixed Deposits — export Excel (edge)', () => {
  beforeEach(() => {
    cy.visitFdPage();
  });

  it('triggers the export endpoint and shows success toast', () => {
    cy.intercept('GET', '**/api/fixed-deposits/export*', {
      fixture: 'fdList.json',
    }).as('exportFd');

    cy.get('button').contains('Export Excel').click();

    cy.wait('@exportFd').its('request.url').should('include', '/export');
    cy.contains('Export Successful').should('exist');
  });
});
