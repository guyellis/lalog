process.env.LOGGLY_TOKEN = 'test-loggly-token';
process.env.LOGGLY_SUBDOMAIN = 'test-loggly-subdomain';

jest.mock('winston-loggly-bulk', () => jest.fn());

const mockWinston = {
  add: jest.fn(),
  log: jest.fn((level, json, cb) => cb()),
  transports: {
    Loggly: 1,
  },
};
jest.mock('winston', () => mockWinston);

const Logger = require('../../lib');

// let loggerWrite = jest.fn();
// Logger.prototype.write = (levelIndex, logObject) => {
//   loggerWrite(levelIndex, logObject);
// };

const logger = Logger.create('test-service', 'test-logger');

describe('/lib/loggly-wrapper', () => {
  beforeAll(() => {
  });

  beforeEach(() => {
    // loggerWrite = jest.fn();
  });

  afterEach(() => {
    // loggerWrite.mockRestore();
  });

  test('should log an error log', async () => {
    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    await logger.error(req);
    expect(mockWinston.log).toHaveBeenCalled();
  });

  test('should force Winston error', async () => {
    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    jest.spyOn(global.console, 'error');
    // console.log.bind(console, jest.fn());
    mockWinston.log = jest.fn((level, json, cb) => cb('fake error'));

    await logger.error(req);
    expect(mockWinston.log).toHaveBeenCalled();
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalled();
    // console.log.bind(console, consoleLog);
  });
});
