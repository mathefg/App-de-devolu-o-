module.exports = {
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
  },
  timeout: 15000,
};
