// [DEPRECATED-TDS] This test exercised the removed TDS endpoints. Re-enable with the TDS feature.
/*
describe('Fixed Deposits — TDS Summary', () => {
  beforeEach(() => {
    cy.visitFdPage();
    cy.contains('TDS Summary').should('exist');
  });

  it('renders per-FY aggregate cards and per-row figures (happy)', () => {
    cy.contains('Gross Interest').should('exist');
    cy.contains('₹2,40,000.00').should('exist'); // 100000+60000+80000
    cy.contains('₹4,000.00').should('exist'); // TDS 1000+3000
    cy.contains('₹2,36,000.00').should('exist'); // Net

    // Row-level values
    cy.contains('Kotak Mahindra Bank').should('exist');
    cy.contains('State Bank of India').should('exist');
    cy.contains('Axis Bank').should('exist');
    cy.contains('10%').should('exist');
  });

  it('shows 15G/H badge for exempt rows and PAN badge otherwise (edge)', () => {
    cy.contains('15G/H').should('exist');
    cy.contains('PAN').should('exist');
  });

  it('shows the disclosure that TDS is accrued yearly and provisional (edge)', () => {
    cy.contains('accrued that year').should('exist');
    cy.contains('not your final tax liability').should('exist');
    cy.contains(/reconcile it in your i?ITR/i).should('exist');
  });

  it('passes the selected financial year to the API when a year badge is clicked (edge)', () => {
    cy.intercept(
      'GET',
      // Glob intentionally omits `**` + `/` — a literal star-slash sequence inside this
      // block comment acts as the comment terminator and breaks parsing.
      '*api/fixed-deposits/tds-summary*financialYear=2024*',
      {
        fixture: 'tdsSummary.json',
      }
    ).as('tdsFor2024');

    cy.get('button').contains('2024').click();
    cy.wait('@tdsFor2024')
      .its('request.url')
      .should('include', 'financialYear=2024');
  });
});
*/
