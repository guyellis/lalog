module.exports = {
  "env": {
    "es6": true,
    "jest": true,
    "node": true
  },
  "extends": [
    "airbnb-base",
    "plugin:security/recommended"
  ],
  "plugins": [
    "security",
    "jest"
  ],
  "rules": {
    "jest/no-disabled-tests": [2],
    "jest/no-focused-tests": [2],
    "jest/no-identical-title": [2],
    "jest/prefer-to-have-length": [2],
    "jest/valid-expect": [2],
    "security/detect-object-injection": [0]
  }
};
