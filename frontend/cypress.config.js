const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    video: false,
    setupNodeEvents(on, config) {
      config.env.apiBase =
        process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
      config.env.CYPRESS_BACKEND_UP = process.env.CYPRESS_BACKEND_UP || '0';
      return config;
    },
  },
  env: {
    apiBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
    CYPRESS_BACKEND_UP: process.env.CYPRESS_BACKEND_UP || '0',
  },
});
