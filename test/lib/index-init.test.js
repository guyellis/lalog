describe('/lib/logger-init', () => {
  beforeAll(() => {
    // NODE_ENV is used in the Logger constructor to generate the tag
    process.env.NODE_ENV = 'development';
  });

  test('should set initial level if LALOG_LEVEL is set and valid', () => {
    process.env.LALOG_LEVEL = 'trace';
    // eslint-disable-next-line global-require
    const Logger = require('../../lib');
    const level = Logger.getLevel();
    expect(level).toBe('trace');
  });
});
