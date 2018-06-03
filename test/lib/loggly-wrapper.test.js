/* eslint-disable no-console */

process.env.LOGGLY_TOKEN = 'test-loggly-token';
process.env.LOGGLY_SUBDOMAIN = 'test-loggly-subdomain';

const fetch = require('node-fetch');

jest.mock('node-fetch');

const Logger = require('../../lib');

const logger = Logger.create({
  serviceName: 'test-service',
  moduleName: 'test-logger',
});

// Assign console to an object to check calls to console and supress
// console to stdout
global.console = {};

describe('/lib/loggly-wrapper', () => {
  beforeAll(() => {
    // Set log level to "error" before tests start running
    Logger.setLevel('error');
  });
  beforeEach(() => {
    global.console.error = jest.fn();
    global.console.warn = jest.fn();
    fetch.mockReset();
  });
  afterEach(() => {
    // Reset log level to "error" after each test in case it was changed
    Logger.setLevel('error');
  });

  test('should log an error log', async () => {
    const logObj = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    const resp = { status: 200, json: () => ({}) };
    fetch.mockResolvedValue(resp);

    await logger.error(logObj);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('should log a warning log and not create an Error', async () => {
    Logger.setLevel('warn');

    const logObj = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    const resp = { status: 200, json: () => ({}) };
    fetch.mockResolvedValue(resp);

    await logger.warn(logObj);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  describe('timer logging', () => {
    test('should log a default timer log if level is info or lower', async () => {
      Logger.setLevel('info');

      const extraLogData = {
        fake: 'fake-extra-data',
      };

      const originalDateNow = Date.now;
      let dateNowCallCounter = 0;
      // eslint-disable-next-line no-plusplus
      Date.now = jest.fn(() => (dateNowCallCounter++ > 0 ? 5000 : 0));

      fetch.mockImplementation((url, options) => {
        expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
        expect(options.method).toBe('POST');
        const body = JSON.parse(options.body);
        expect(body).toEqual({
          duration: '00:00:05.000',
          fake: 'fake-extra-data',
          level: 'info',
          msg: 'Timer',
          timerLabel: 'my-time-label',
          module: 'test-logger',
        });
        return { status: 200, json: () => ({}) };
      });

      await logger.time('my-time-label');
      await logger.timeEnd('my-time-label', extraLogData);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(Date.now).toHaveBeenCalledTimes(2);
      expect.assertions(5);

      Date.now = originalDateNow;
    });

    test('should not log a default timer log if level is higher than info', async () => {
      const resp = { status: 200, json: () => ({}) };
      fetch.mockResolvedValue(resp);

      await logger.time('my-time-label');
      await logger.timeEnd('my-time-label');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should log an explicit level timer log', async () => {
      const extraLogData = {
        fake: 'fake-extra-data',
      };

      const originalDateNow = Date.now;
      let dateNowCallCounter = 0;
      // eslint-disable-next-line no-plusplus
      Date.now = jest.fn(() => (dateNowCallCounter++ > 0 ? 5000 : 0));

      fetch.mockImplementation((url, options) => {
        expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
        expect(options.method).toBe('POST');
        const body = JSON.parse(options.body);
        const {
          level, duration, fake, msg, timerLabel, shortStack, fullStack,
        } = body;
        expect(level).toBe('error');
        expect(duration).toBe('00:00:05.000');
        expect(fake).toBe('fake-extra-data');
        expect(msg).toBe('Timer');
        expect(timerLabel).toBe('my-time-label');
        expect(shortStack).toBeTruthy();
        expect(fullStack).toBeTruthy();
        return { status: 200, json: () => ({}) };
      });

      await logger.time('my-time-label');
      await logger.timeEnd.error('my-time-label', extraLogData);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(Date.now).toHaveBeenCalledTimes(2);
      expect.assertions(11);

      Date.now = originalDateNow;
    });

    test('should add a stack if timeEnd() label is missing', async () => {
      Logger.setLevel('info');

      fetch.mockImplementation((url, options) => {
        expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
        expect(options.method).toBe('POST');
        const body = JSON.parse(options.body);
        const {
          level, duration, timerLabel,
        } = body;

        expect(level).toBe('info');
        const durationTextStart = 'Missing label "my-time-label-missing" in timeEnd()\n' +
          'Error\n' +
          '    at Logger.writeTimeEnd';
        expect(duration.startsWith(durationTextStart)).toBe(true);
        expect(timerLabel).toBe('my-time-label-missing');

        return { status: 200, json: () => ({}) };
      });

      logger.time('my-time-label');
      await logger.timeEnd('my-time-label-missing');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect.assertions(6);
    });
  });

  test('should force fetch() error', async () => {
    Logger.setLevel('info');
    const req = {};

    fetch.mockImplementation(() => {
      throw new Error('fake error');
    });

    const result = await logger.info(req);
    expect(result).toEqual({});
    expect(fetch).toHaveBeenCalledTimes(1);
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

    fetch.mockImplementation((url, options) => {
      expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      const {
        fullStack, shortStack, msg,
      } = body;

      expect(fullStack).toBeTruthy();
      expect(shortStack).toBeTruthy();
      expect(msg).toBe('Will be used for missing msg');

      return { status: 200, json: () => ({}) };
    });

    await logger.error(req);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(6);
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

    fetch.mockImplementation((url, options) => {
      const body = JSON.parse(options.body);
      const {
        fullStack, shortStack, msg,
      } = body;

      expect(fullStack).toBeTruthy();
      expect(shortStack).toBeTruthy();
      expect(msg).toBe('root message');

      return { status: 200, json: () => ({}) };
    });

    await logger.error(req);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(4);
  });

  test('should not log if level is too low', async () => {
    await logger.trace({});
    expect(fetch).not.toHaveBeenCalled();
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

    fetch.mockImplementation((url, options) => {
      const body = JSON.parse(options.body);

      const { req } = body;
      expect(req.body).toBe('body');
      expect(req.url).toBe('url');
      expect(req.random).toBeFalsy();

      return { status: 200, json: () => ({}) };
    });

    await logger.error(logObj);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(4);
  });

  test('should call res.send when response parameter is included', async () => {
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

    const logData = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    const resp = { status: 200, json: () => ({}) };
    fetch.mockResolvedValue(resp);

    await logger.error(logData, response);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(3);
  });

  test('should console.error() a non-200 status from Loggly', async () => {
    const logData = {};

    const resp = { status: 500, json: () => ({}) };
    fetch.mockResolvedValue(resp);

    const result = await logger.error(logData);
    expect(result).toEqual({});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenLastCalledWith('fetch() call failed with 500');
  });

  test('should not call fetch() if LOGGLY_TOKEN has not been defined', async () => {
    delete process.env.LOGGLY_TOKEN;
    // const logger2 = Logger.create('test-service-2', 'test-logger-2');
    await logger.error({});
    expect(fetch).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenLastCalledWith('loggly token has not been defined');
  });
});

/* eslint-enable no-console */
