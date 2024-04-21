const collectCoverage = !process.env.SKIP_COVERAGE;

/** @type {jest.InitialOptions} */
module.exports = {
  collectCoverage,
  collectCoverageFrom: [
    '!**/.vscode/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!.eslintrc.js',
    '!**/node_modules/**',
    '!**/test/**',
    '**/*.{js,jsx,ts,tsx}',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/test/',
    '<rootDir>/lib/gcp/',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  roots: [
    '<rootDir>/lib/',
    '<rootDir>/test/',
  ],
  setupFilesAfterEnv: ['./test/setup.ts'],
  testMatch: ['**/test/**/*.test.[t|j]s?(x)'],
  transform: {
    '.+\\.[j|t]sx?$': 'ts-jest',
  },
  verbose: false,
};
