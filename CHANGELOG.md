# Changelog

### 2.0.1 (2022-08-24)

- Fixes
  - TypeScript only. Export types from the index again. Brings back to parity.

### 2.0.0 (2022-08-22)

- Breaking
  - Restructure Error props inside `err` prop including `fullStack` and `shortStack`.
- Fixes
  - Include all props in `Error` object
  - Upgrade dependencies

### 1.0.2 (2021.08.28)

- Fixes
  - Make log level a required param

### 1.0.1 (2021.08.27)

- Fixes
  - Fix typing and error object handling bug

### 1.0.0 (2021-08-25)

- Breaking
  - Drop support for Node 12 and 14.
- Changes
  - Support Node 16
  - Upgrade all dependencies to the latest

### 0.8.4 (2021-01-24)

- Update dependencies

### 0.8.3 (2020-11-11)

- Fix: Fix Circular references in objects for JSON.stringify

### 0.8.2 (2020-11-11)

- Update dependencies

### 0.8.1

- Fix: Allow undefined to be passed to setLevel()

### 0.8.0

- Breaking: LevelEnum renamed to LevelType
- Breaking: timeEnd() no longer has level log methods on it.
- Breaking: timeEnd() now has 3 params - inserted  a 2nd param

### 0.7.0

### 0.6.0

- Add transient logging feature.
- Add typings

### 0.5.0

- Add a call stack to console.error() if Loggly returns a non-200 error.
- Only require isObject from lodash

### 0.4.1

- Improve error handling by refactoring more code into try...catch block
- Bug: Append original `msg` in `timeEnd()`

### 0.4.0

- Use `LALOG_LEVEL` environment variable as the initial log level if it is set and
is valid.

### 0.3.0

- Add `addTrackId` boolean option to `create()` parameter to create a `trackId` in the presets if truthy.
- Improve Readme

### 0.2.0

- Breaking: `Logger` constructor and `.create()` now take a single `options` object
argument instead of a `service` and `name` argument. The `options` should have `serviceName`
and `moduleName` props and can optionally have a `presets` prop.

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
