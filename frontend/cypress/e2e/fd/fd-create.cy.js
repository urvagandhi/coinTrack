/* global cy, describe, it, beforeEach, expect */
const realMutations = Cypress.env('CYPRESS_BACKEND_UP') === '1';

function selectBank(name) {
  cy.get('input[placeholder="e.g. State Bank of India or SBIN"]')
    .clear()
    .type('State Bank');
  cy.get('[role="dialog"]').contains(name).first().click({ force: true });
}

function fillCommonFields() {
  selectBank('State Bank of India');
  cy.get('label').contains('Issue Date *').next('input').type('2024-01-15');
  cy.get('label').contains('Maturity Date *').next('input').type('2029-01-15');
  cy.get('input[placeholder="e.g. 5L or 500000"]').type('500000');
  cy.get('input[placeholder="e.g. 7.1"]').type('7.1');
}

describe('Fixed Deposits — create FD', () => {
  beforeEach(() => {
    cy.visitFdPage();
    cy.get('button').contains('New Deposit').click();
    cy.get('h2').contains('New Fixed Deposit').should('exist');
  });

  it('shows a validation error when maturity is not after issue date (edge)', () => {
    selectBank('State Bank of India');
    cy.get('label').contains('Issue Date *').next('input').type('2024-06-15');
    cy.get('label')
      .contains('Maturity Date *')
      .next('input')
      .type('2024-01-15');
    cy.get('input[placeholder="e.g. 5L or 500000"]').type('500000');
    cy.get('input[placeholder="e.g. 7.1"]').type('7.1');

    cy.get('button').contains('Save Deposit').click();
    cy.contains('Validation Error').should('exist');
    cy.contains('Maturity date must be after issue date.').should('exist');
  });

  it('sends CUMULATIVE + QUARTERLY by default and shows success toast (happy)', () => {
    cy.intercept('POST', '**/api/fixed-deposits', req => {
      req.reply({ fixture: 'fdCreated.json' });
    }).as('createDefault');
    fillCommonFields();

    cy.get('button').contains('Save Deposit').click();

    cy.get('@createDefault')
      .its('request.body')
      .then(b => {
        // [DEPRECATED-SEC-04-05] The Interest Structure / Eligibility fields are DISABLED along with
        // dialog sections 04/05 and are deliberately NOT sent: the backend now computes maturity
        // with its fixed defaults (CUMULATIVE / QUARTERLY / AT_MATURITY). Assert the keys are absent.
        expect(b.fdType).to.be.undefined;
        expect(b.compoundingFrequency).to.be.undefined;
        expect(b.payoutFrequency).to.be.undefined;
        expect(b.isSeniorCitizen).to.be.undefined;
        expect(b.isTaxSaver).to.be.undefined;
        // Maturity-mode contract: new FDs default to AUTOMATIC (server computes maturity).
        expect(b.maturityMode).to.eq('AUTOMATIC');
        // [DEPRECATED-TDS] hasPan / form15g15hSubmitted are no longer sent to the backend
        // (commented out of FdDialog submit payload along with the TDS feature).
        // expect(b.hasPan).to.eq(true);
        // expect(b.form15g15hSubmitted).to.eq(false);
      });
    cy.contains('FD Created').should('exist');
  });

  // [DEPRECATED-SEC-04-05] The 'NON_CUMULATIVE / senior / tax-saver' edge test is DISABLED along
  // with dialog sections 04/05 (those inputs are hidden and their fields no longer submitted).
  // Re-enable together with the section JSX + backend fields.
  // it('sends NON_CUMULATIVE + 15G/15H + senior flags (edge)', () => {
  //   cy.intercept('POST', '**/api/fixed-deposits', req => {
  //     req.reply({ fixture: 'fdCreated.json' });
  //   }).as('createFlagged');
  //   fillCommonFields();
  //
  //   cy.get('label').contains('FD Type').next('select').select('NON_CUMULATIVE');
  //   cy.get('label')
  //     .contains('Senior Citizen')
  //     .find('input[type="checkbox"]')
  //     .check();
  //   cy.get('label')
  //     .contains('Form 15G / 15H')
  //     .find('input[type="checkbox"]')
  //     .check();
  //
  //   cy.get('button').contains('Save Deposit').click();
  //
  //   cy.get('@createFlagged')
  //     .its('request.body')
  //     .then(b => {
  //       expect(b.fdType).to.eq('NON_CUMULATIVE');
  //       // [DEPRECATED-TDS] form15g15hSubmitted is no longer sent to the backend.
  //       // expect(b.form15g15hSubmitted).to.eq(true);
  //       expect(b.isSeniorCitizen).to.eq(true);
  //     });
  //   cy.contains('FD Created').should('exist');
  // });

  (realMutations ? it : it.skip)(
    'creates a real FD against the backend (CYPRESS_BACKEND_UP=1)',
    () => {
      cy.intercept('POST', '**/api/fixed-deposits', req => {
        req.continue();
      }).as('realCreate');

      fillCommonFields();
      cy.get('button').contains('Save Deposit').click();
      cy.wait('@realCreate').then(interception => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body.id).to.exist;
        expect(interception.response.body.fdNo).to.exist;
      });
    }
  );
});
