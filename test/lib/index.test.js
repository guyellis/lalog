const Logger = require('../../lib');

let loggerWrite = jest.fn();
Logger.prototype.write = (levelIndex, logObject) => {
  loggerWrite(levelIndex, logObject);
};

const logger = Logger.create('test-service', 'test-logger');

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
});
