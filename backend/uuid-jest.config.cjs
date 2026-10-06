module.exports = {
  ...require('./package.json').jest,
  testRegex: 'uuid-identities\\.spec\\.ts$',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
