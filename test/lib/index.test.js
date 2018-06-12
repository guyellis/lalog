const Logger = require('../../lib');

let loggerWrite = jest.fn();
Logger.prototype.write = (levelIndex, logObject) => {
  loggerWrite(levelIndex, logObject);
};

const logger = Logger.create({
  serviceName: 'test-service',
  moduleName: 'test-logger',
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
    const localLogger = Logger.create('mock-service', 'mock-module');
    ['trace', 'info', 'warn', 'error', 'fatal', 'security'].forEach((level) => {
      expect(typeof localLogger[level]).toBe('function');
    });
  });

  test('should get/set Levels', () => {
    let previousLevel = Logger.getLevel();
    expect(previousLevel).toBe('error');
    previousLevel = Logger.setLevel('warn');
    // returns previous level because set succeeded
    expect(previousLevel).toBe('error');
    previousLevel = Logger.setLevel('this is rubbish');
    // returns current level because set failed
    expect(previousLevel).toBe('warn');
  });

  test('should parse request object', () => {
    const object = {
      body: 1,
      headers: 2,
      method: 3,
      params: 4,
      path: 5,
      query: 6,
      url: 7,
      user: 8,
      rubbish: 9,
    };
    const actual = Logger.parseReq(object);
    delete object.rubbish;
    expect(actual).toEqual(object);
    expect(actual).not.toBe(object);
  });

  test('should call create() multiple times without problem', async () => {
    const logger1 = Logger.create({ serviceName: 'fake-service-1', moduleName: 'fake-module-1' });

    const logger2 = Logger.create({ serviceName: 'fake-service-1', moduleName: 'fake-module-2' });

    const logger3 = Logger.create({ serviceName: 'fake-service-3', moduleName: 'fake-module-2' });

    expect(logger1).not.toBe(logger2);
    expect(logger1).not.toBe(logger3);
    expect(logger2).not.toBe(logger3);
  });

  test('should new Logger() multiple times without problem', async () => {
    const logger1 = new Logger({ serviceName: 'fake-service-1', moduleName: 'fake-module-1' });

    const logger2 = new Logger({ serviceName: 'fake-service-1', moduleName: 'fake-module-2' });

    const logger3 = new Logger({ serviceName: 'fake-service-3', moduleName: 'fake-module-2' });

    expect(logger1).not.toBe(logger2);
    expect(logger1).not.toBe(logger3);
    expect(logger2).not.toBe(logger3);
  });

  test('should create a logger with presets', () => {
    const testLogger = new Logger({
      serviceName: 'fake-service-1',
      moduleName: 'fake-module-1',
      presets: { testProp: 'fake-track-id' },
    });
    expect(typeof testLogger).toBe('object');
    expect(testLogger.presets.testProp).toBe('fake-track-id');
  });

  test('should create a presets trackId with addTrackId option', () => {
    const testLogger = new Logger({
      serviceName: 'fake-service-1',
      moduleName: 'fake-module-1',
      addTrackId: true,
    });
    expect(typeof testLogger).toBe('object');
    expect(testLogger.presets.trackId).toHaveLength(36);
  });
});
