process.env.LALOG_LEVEL = 'trace';
// eslint-disable-next-line import/first
import Logger from '../../lib';

describe('/lib/logger-init', () => {
  test('should set initial level if LALOG_LEVEL is set and valid', () => {
    const level = Logger.getLevel();
    expect(level).toBe('trace');
  });
});
