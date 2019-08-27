module.exports = {
  verbose: false,
  collectCoverageFrom: [
    '!**/.vscode/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!.eslintrc.js',
    '!typings.d.ts',
    '!**/node_modules/**',
    '!**/test/**',
    '**/*.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  setupFilesAfterEnv: ['./test/setup.ts'],
  testMatch: ['**/test/**/*.test.[t|j]s?(x)'],
  testPathIgnorePatterns: [
    'typings.d.ts',
  ],
  // Jasmine, jest's default test-runner, fails silently on afterAll within
  // a describe block. This is a bug that the jest team is not going to fix
  // because they plan to use jest-circus/runner by default in the near future.
  // https://github.com/facebook/jest/issues/6692
  // TODO: Remove the testRunner option and the previous comment when jest
  // updates the default test-runner to jest-circus.
  testRunner: 'jest-circus/runner',
  transform: {
    '.+\\.tsx?$': 'ts-jest',
  },
};
