const Logger = require('../../lib');

describe('Logger Creation', () => {
  test('should call create() multiple times without problem', () => {
    const logger1 = Logger.create('fake-service-1', 'fake-module-1');

    const logger2 = Logger.create('fake-service-1', 'fake-module-2');

    const logger3 = Logger.create('fake-service-3', 'fake-module-2');

    // Check the loggly instances - they should always be the same
    expect(logger1.loggly).toBe(logger2.loggly);
    expect(logger1.loggly).toBe(logger3.loggly);
  });
});
