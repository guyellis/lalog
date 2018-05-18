/* eslint-disable no-console */

process.env.LOGGLY_TOKEN = 'test-loggly-token';
process.env.LOGGLY_SUBDOMAIN = 'test-loggly-subdomain';

jest.mock('winston-loggly-bulk', () => jest.fn());

const mockWinston = {
  add: jest.fn(),
  transports: {
    Loggly: 1,
  },
};
jest.mock('winston', () => mockWinston);

const Logger = require('../../lib');

const logger = Logger.create('test-service', 'test-logger');

// Assign console to an object to check calls to console and supress
// console to stdout
global.console = {};

describe('/lib/loggly-wrapper', () => {
  beforeEach(() => {
    global.console.error = jest.fn();
    mockWinston.log = jest.fn((level, json, cb) => cb());
  });

  test('should log an error log', async () => {
    const logObj = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    mockWinston.log = jest.fn((level, json, cb) => {
      // If .error() is logged and no err prop is passed to
      // method then an Error will be created for the stack
      expect(json.fullStack).toBeTruthy();
      expect(json.shortStack).toBeTruthy();
      cb();
    });

    await logger.error(logObj);
    expect(mockWinston.log).toHaveBeenCalled();
    expect.assertions(3);
  });

  test('should log a warning log and not create an Error', async () => {
    Logger.setLevel('warn');

    const logObj = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    mockWinston.log = jest.fn((level, json, cb) => {
      // If .warn() is logged and no err prop is passed to
      // method then no Error created
      expect(json.fullStack).toBeFalsy();
      cb();
    });

    await logger.warn(logObj);
    expect(mockWinston.log).toHaveBeenCalled();
    expect.assertions(2);

    Logger.setLevel('error');
  });

  test('should force Winston error', async () => {
    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    mockWinston.log = jest.fn((level, json, cb) => cb('fake error'));

    await logger.error(req);
    expect(mockWinston.log).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test('should console.error if object not passed to log function', async () => {
    await logger.error('i am a string');
    expect(console.error).toHaveBeenCalledTimes(1);
    const expected = 'Expecting an object in logger write method but got "string"';
    expect(console.error).toHaveBeenCalledWith(expected);
  });

  test('should add a stack if it is missing from err', async () => {
    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
      err: {
        message: 'Will be used for missing msg',
      },
    };

    mockWinston.log = jest.fn((level, json, cb) => {
      expect(json.fullStack).toBeTruthy();
      expect(json.shortStack).toBeTruthy();
      expect(json.msg).toBe('Will be used for missing msg');
      cb();
    });

    await logger.error(req);
    expect(mockWinston.log).toHaveBeenCalledTimes(1);
    expect.assertions(4);
  });

  test('should use object message if present', async () => {
    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
      msg: 'root message',
      err: {
        message: 'error message',
      },
    };

    mockWinston.log = jest.fn((level, json, cb) => {
      expect(json.fullStack).toBeTruthy();
      expect(json.shortStack).toBeTruthy();
      expect(json.msg).toBe('root message');
      cb();
    });

    await logger.error(req);
    expect(mockWinston.log).toHaveBeenCalledTimes(1);
    expect.assertions(4);
  });

  test('should not log if level is too low', async () => {
    await logger.trace({});
    expect(mockWinston.log).not.toHaveBeenCalled();
  });

  test('should parse a req object', async () => {
    const logObj = {
      req: {
        body: 'body',
        headers: 'headers',
        method: 'method',
        params: 'params',
        path: 'path',
        query: 'query',
        url: 'url',
        user: 'user',
        random: 'random',
      },
    };

    mockWinston.log = jest.fn((level, json, cb) => {
      const { req } = json;
      expect(req.body).toBe('body');
      expect(req.url).toBe('url');
      expect(req.random).toBeFalsy();
      cb();
    });

    await logger.error(logObj);
    expect(mockWinston.log).toHaveBeenCalledTimes(1);
    expect.assertions(4);
  });


  test('should call res.send', async () => {
    const response = {
      code: 1234,
      res: {
        status: (c) => {
          expect(c).toBe(1234);
          return response.res;
        },
        send: (obj) => {
          expect(obj.success).toBe(false);
        },
      },
    };

    const req = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    await logger.error(req, response);
    expect(mockWinston.log).toHaveBeenCalled();
    expect.assertions(3);
  });

  test('should not call winston.log if LOGGLY_TOKEN has not been defined', async () => {
    delete process.env.LOGGLY_TOKEN;
    const logger2 = Logger.create('test-service-2', 'test-logger-2');
    await logger2.error({});
    expect(mockWinston.log).not.toHaveBeenCalled();
  });
});

/* eslint-enable no-console */
