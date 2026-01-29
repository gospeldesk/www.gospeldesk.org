module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/let-us-attend/*.test.js'],
  testPathIgnorePatterns: ['/_site/', '/node_modules/'],
  collectCoverageFrom: ['let-us-attend/let-us-attend.js']
};
