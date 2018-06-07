

describe('/lib/logger-init', () => {
  test('should set initial level if LALOG_LEVEL is set and valid', () => {
    process.env.LALOG_LEVEL = 'trace';
    // eslint-disable-next-line global-require
    const Logger = require('../../lib');
    const level = Logger.getLevel();
    expect(level).toBe('trace');
  });
});
