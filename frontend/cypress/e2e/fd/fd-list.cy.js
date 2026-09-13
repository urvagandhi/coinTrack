/* global cy, describe, it, beforeEach */
describe('Fixed Deposits — list, summary cards, filters', () => {
  beforeEach(() => {
    cy.visitFdPage();
    cy.get('h1').contains('Fixed').should('exist');
  });

  // [DEPRECATED-TDS] This test asserted on TDS-specific summary card values (totalTdsDeducted, totalNetReturns).
  // Re-enable with the TDS feature.
  /*
  it('renders summary stat cards from the summary fixture', () => {
    cy.contains('TDS Deducted').should('exist');
    cy.contains('Net Returns').should('exist');
    cy.contains('Total Investment').should('exist');
    cy.contains('₹15,00,000.00').should('exist');
    cy.contains('₹21,450.50').should('exist');
  });
  */

  it('renders the fixed-deposit table rows with holder, dates and status', () => {
    cy.contains('State Bank of India').should('be.visible');
    cy.contains('HDFC Bank').should('be.visible');
    cy.contains('Punjab National Bank').should('be.visible');
    cy.contains('Urva Patel').should('exist');
    cy.contains('ACTIVE').should('exist');
    cy.contains('PREMATURELY_WITHDRAWN').should('exist');
    cy.contains('MATURED').should('exist');
  });

  // [DEPRECATED-TDS] This test asserted on the TDS Summary section in the UI.
  // Re-enable with the TDS feature.
  /*
  it('renders the TDS Summary section', () => {
    cy.contains('TDS Summary').should('exist');
    cy.contains('per financial year').should('exist');
  });
  */

  it('shows WITHDRAW only on withdrawable rows; hidden on MATURED/PREMATURELY_WITHDRAWN (edge)', () => {
    // ACTIVE rows are withdrawable
    cy.get('tr')
      .contains('State Bank of India')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .should('exist');
    cy.get('tr')
      .contains('HDFC Bank')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .should('exist');

    // MATURED (Axis) → WITHDRAW hidden
    cy.get('tr')
      .contains('Axis Bank')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .should('not.exist');

    // PREMATURELY_WITHDRAWN (ICICI) → WITHDRAW hidden
    cy.get('tr')
      .contains('ICICI Bank')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .should('not.exist');

    // PREMATURELY_WITHDRAWN (Punjab National) → WITHDRAW hidden
    cy.get('tr')
      .contains('Punjab National Bank')
      .closest('tr')
      .find('button')
      .contains('WITHDRAW')
      .should('not.exist');
  });

  it('passes the status query param to the API when filtering (edge)', () => {
    cy.intercept(
      'GET',
      '**/api/fixed-deposits?**status=PREMATURELY_WITHDRAWN**',
      {
        fixture: 'fdList.json',
      }
    ).as('filteredFdList');

    cy.get('button').contains('PREMATURELY_WITHDRAWN').click();

    cy.wait('@filteredFdList')
      .its('request.url')
      .should('include', 'status=PREMATURELY_WITHDRAWN');
  });
});
