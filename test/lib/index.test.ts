import Logger, { LevelType, ParseReqInOut } from '../../lib';

let loggerWrite = jest.fn();
Logger.prototype.write = (levelIndex: number, logObject: any): Promise<any> => {
  loggerWrite(levelIndex, logObject);
  return Promise.resolve();
};

const logger = Logger.create({
  moduleName: 'test-logger',
  serviceName: 'test-service',
});

describe('/lib/logger', () => {
  beforeEach(() => {
    loggerWrite = jest.fn();
  });

  afterEach(() => {
    loggerWrite.mockRestore();
  });

  test('should log a security log', () => {
    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    logger.trace(req);
    expect(loggerWrite).toHaveBeenCalledWith(0, req);

    logger.info(req);
    expect(loggerWrite).toHaveBeenCalledWith(1, req);
  });

  test('should get all Levels', () => {
    const actual = Logger.allLevels();
    const expected = ['trace', 'info', 'warn', 'error', 'fatal', 'security'];
    expect(actual).toEqual(expected);
  });

  test('should create all log level methods with .create()', () => {
    const localLogger = Logger.create({
      moduleName: 'mock-module',
      serviceName: 'mock-service',
    });
    expect(typeof localLogger.trace).toBe('function');
    expect(typeof localLogger.info).toBe('function');
    expect(typeof localLogger.warn).toBe('function');
    expect(typeof localLogger.error).toBe('function');
    expect(typeof localLogger.fatal).toBe('function');
    expect(typeof localLogger.security).toBe('function');
  });

  test('should get/set Levels', () => {
    let previousLevel = Logger.getLevel();
    expect(previousLevel).toBe('error');
    previousLevel = Logger.setLevel('warn');
    // returns previous level because set succeeded
    expect(previousLevel).toBe('error');
    const invalidValue = 'this is rubbish' as LevelType;
    previousLevel = Logger.setLevel(invalidValue);
    // returns current level because set failed
    expect(previousLevel).toBe('warn');
  });

  test('should timeEnd() and preserve original msg', () => {
    logger.time('time-label');
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.timeEnd('time-label', 'info', {
          duration: 'I will be lost', // because this clashes with the duration it will be lost
          msg: 'fake-msg', // will be appended to 'Timer - '
          other: 'data', // will be preserved as is
        });
        expect(loggerWrite).toHaveBeenCalledTimes(1);

        const [lastCallParam1, lastCallParam2] = loggerWrite.mock.calls[0];
        expect(lastCallParam1).toBe(1);

        const {
          msg, other, timerLabel, duration,
        } = lastCallParam2;
        expect(msg).toBe('Timer - fake-msg');
        expect(other).toBe('data');
        expect(timerLabel).toBe('time-label');

        // Duration is a timestamp that will look something like this: "00:00:01.002"
        const durationParts = duration.split(':');
        const seconds = parseInt(durationParts[2], 10);
        expect(seconds).toBe(1);

        return resolve(true);
      }, 1000);
    });
  });

  test('should parse request object', () => {
    const object = {
      body: 1,
      headers: 2,
      method: 3,
      params: 4,
      path: 5,
      query: 6,
      rubbish: 9,
      url: 7,
      user: 8,
    } as unknown as ParseReqInOut;
    const actual = Logger.parseReq(object);
    delete (object as unknown as { rubbish: number }).rubbish;
    expect(actual).toEqual(object);
    expect(actual).not.toBe(object);
  });

  test('should call create() multiple times without problem', async () => {
    const logger1 = Logger.create({ moduleName: 'fake-module-1', serviceName: 'fake-service-1' });

    const logger2 = Logger.create({ moduleName: 'fake-module-2', serviceName: 'fake-service-1' });

    const logger3 = Logger.create({ moduleName: 'fake-module-2', serviceName: 'fake-service-3' });

    expect(logger1).not.toBe(logger2);
    expect(logger1).not.toBe(logger3);
    expect(logger2).not.toBe(logger3);
  });

  test('should new Logger() multiple times without problem', async () => {
    const logger1 = new Logger({ moduleName: 'fake-module-1', serviceName: 'fake-service-1' });

    const logger2 = new Logger({ moduleName: 'fake-module-2', serviceName: 'fake-service-1' });

    const logger3 = new Logger({ moduleName: 'fake-module-2', serviceName: 'fake-service-3' });

    expect(logger1).not.toBe(logger2);
    expect(logger1).not.toBe(logger3);
    expect(logger2).not.toBe(logger3);
  });

  test('should create a logger with presets', () => {
    const testLogger = new Logger({
      moduleName: 'fake-module-1',
      presets: { testProp: 'fake-track-id' },
      serviceName: 'fake-service-1',
    });
    expect(typeof testLogger).toBe('object');
    expect(testLogger.presets.testProp).toBe('fake-track-id');
  });

  test('should create a presets trackId with addTrackId option', () => {
    const testLogger = new Logger({
      addTrackId: true,
      moduleName: 'fake-module-1',
      serviceName: 'fake-service-1',
    });
    expect(typeof testLogger).toBe('object');
    expect(testLogger.presets.trackId).toHaveLength(36);
  });
});
