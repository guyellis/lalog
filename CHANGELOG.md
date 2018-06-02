# Changelog

### 0.1.2

- Fix bug where Loggly instance can only be created once
- Add 'module' name property to logged object
- Switch from `winston` to calling Loggly API directly.

### 0.1.1

- Don't override errorId if it's passed in as part of the log object.

### 0.1.0

- Add `console` style `time(<label>)` and `timeEnd(<label>, [optional object])` functionality.

### 0.0.3

- Initial Version
- Basic functionality
- Code coverage 100%
