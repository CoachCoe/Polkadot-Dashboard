import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    experimentalSourceRewriting: true,
    setupNodeEvents(_config) {
      // implement node event listeners here
    },
  },
  retries: {
    runMode: 2,
    openMode: 0
  }
}); 