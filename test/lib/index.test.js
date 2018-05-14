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
});
