const DEFAULT_FIXTURES = {
  list: 'fdList.json',
  summary: 'fdSummary.json',
};

function b64url(obj) {
  const str = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildFakeToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'test-user',
    name: 'Urva Patel',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  return `${b64url(header)}.${b64url(payload)}.fake-signature`;
}

Cypress.Commands.add('seedAuth', () => {
  const token = buildFakeToken();
  Cypress.env('ct_jwt', token);
  cy.intercept('GET', '**/api/users/me', { fixture: 'userProfile.json' }).as(
    'profile'
  );
  cy.intercept('POST', '**/api/auth/refresh', {
    fixture: 'refresh.json',
  }).as('refresh');
});

Cypress.Commands.add('seedFdList', fixtures => {
  cy.intercept('GET', '**/api/fixed-deposits?*', { fixture: fixtures }).as(
    'fdList'
  );
  cy.intercept('GET', '**/api/fixed-deposits', { fixture: fixtures }).as(
    'fdListBare'
  );
});

Cypress.Commands.add('seedFdSummary', obj => {
  cy.intercept(
    'GET',
    '**/api/fixed-deposits/summary',
    obj ?? {
      fixture: 'fdSummary.json',
    }
  ).as('fdSummary');
});

// [DEPRECATED-TDS] The /tds-summary endpoint has been removed from the backend.
// Re-enable with the TDS feature.
/*
Cypress.Commands.add('seedTdsSummary', arr => {
  cy.intercept(
    'GET',
    // Glob intentionally omits `**` + `/` — a literal star-slash sequence inside this
      // block comment acts as the comment terminator and breaks parsing.
    '*api/fixed-deposits/tds-summary*',
    arr ?? {
      fixture: 'tdsSummary.json',
    }
  ).as('tdsSummary');
});
*/

Cypress.Commands.add('stubReads', (fixtures = {}) => {
  const f = { ...DEFAULT_FIXTURES, ...fixtures };
  cy.seedFdList(f.list);
  cy.seedFdSummary(f.summary);
  cy.intercept('GET', '**/api/ifsc*', { fixture: 'ifscBanks.json' }).as(
    'ifscBanks'
  );
});

Cypress.Commands.add('visitFdPage', (fixtures = {}) => {
  cy.stubReads(fixtures);
  cy.visit('/fixed-deposit', {
    onBeforeLoad(win) {
      win.localStorage.setItem('ct_jwt', Cypress.env('ct_jwt'));
    },
  });
});
