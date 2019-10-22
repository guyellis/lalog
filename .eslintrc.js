module.exports = {
  "env": {
    "es6": true,
    "jest": true,
    "node": true
  },
  "extends": [
    "airbnb-base",
    "plugin:security/recommended",
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions:  {
    ecmaVersion:  2018,  // Allows for the parsing of modern ECMAScript features
    sourceType:  'module',  // Allows for the use of imports
  },
  "plugins": [
    "security",
    "jest"
  ],
  "rules": {
    'import/no-unresolved': [0],
    "@typescript-eslint/no-explicit-any": [0],
    "jest/no-disabled-tests": [2],
    "jest/no-focused-tests": [2],
    "jest/no-identical-title": [2],
    "jest/prefer-to-have-length": [2],
    "jest/valid-expect": [2],
    "security/detect-object-injection": [0]
  }
};
