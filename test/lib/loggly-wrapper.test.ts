import fetch from 'node-fetch';
import Logger from '../../lib';
import {
  logSingle, logBatch, LogSingleOptions, LogBatchOptions,
} from '../../lib/loggly-wrapper';

jest.mock('node-fetch');

const logger = Logger.create({
  moduleName: 'test-logger',
  serviceName: 'test-service',
});

// Assign console to an object to check calls to console and suppress
// console to stdout
global.console = {} as Console;

const fetchMock = fetch as unknown as jest.Mock;

describe('/lib/loggly-wrapper', () => {
  beforeAll(() => {
    // Set log level to "error" before tests start running
    Logger.setLevel('error');
  });
  let consoleError: jest.Mock;
  let consoleWarn: jest.Mock;
  beforeEach(() => {
    consoleError = jest.fn();
    consoleWarn = jest.fn();
    global.console.error = consoleError;
    global.console.warn = consoleWarn;
    process.env.LOGGLY_TOKEN = 'test-loggly-token';

    fetchMock.mockReset();
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

    const resp = { json: (): Record<string, unknown> => ({}), status: 200 };
    fetchMock.mockResolvedValue(resp);

    await logger.error(logObj);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('should call setLevel without a param', () => {
    const existingLevel = Logger.setLevel();
    expect(existingLevel).toBe('error');
  });

  test('should log a warning log and not create an Error', async () => {
    Logger.setLevel('warn');

    const logObj = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    const resp = { json: (): Record<string, unknown> => ({}), status: 200 };
    fetchMock.mockResolvedValue(resp);

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

      fetchMock.mockImplementation((url: string, options: any) => {
        expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
        expect(options.method).toBe('POST');
        const body = JSON.parse(options.body);
        expect(body).toEqual({
          duration: '00:00:05.000',
          fake: 'fake-extra-data',
          level: 'info',
          module: 'test-logger',
          msg: 'Timer',
          timerLabel: 'my-time-label',
        });
        return { json: (): Record<string, unknown> => ({}), status: 200 };
      });

      logger.time('my-time-label');
      await logger.timeEnd('my-time-label', 'info', extraLogData);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(Date.now).toHaveBeenCalledTimes(2);
      expect.assertions(5);

      Date.now = originalDateNow;
    });

    test('should not log a default timer log if level is higher than info', async () => {
      const resp = { json: (): Record<string, unknown> => ({}), status: 200 };
      fetchMock.mockResolvedValue(resp);

      logger.time('my-time-label');
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

      fetchMock.mockImplementation((url, options) => {
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
        return { json: (): Record<string, unknown> => ({}), status: 200 };
      });

      logger.time('my-time-label');
      await logger.timeEnd('my-time-label', 'error', extraLogData);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(Date.now).toHaveBeenCalledTimes(2);
      expect.assertions(11);

      Date.now = originalDateNow;
    });

    test('should add a stack if timeEnd() label is missing', async () => {
      Logger.setLevel('info');

      fetchMock.mockImplementation((url, options) => {
        expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
        expect(options.method).toBe('POST');
        const body = JSON.parse(options.body);
        const {
          level, duration, timerLabel,
        } = body;

        expect(level).toBe('info');
        const durationTextStart = 'Missing label "my-time-label-missing" in timeEnd()\n'
          + 'Error\n'
          + '    at Logger.writeTimeEnd';
        expect(duration.startsWith(durationTextStart)).toBe(true);
        expect(timerLabel).toBe('my-time-label-missing');

        return { json: (): Record<string, unknown> => ({}), status: 200 };
      });

      logger.time('my-time-label');
      await logger.timeEnd('my-time-label-missing');
      expect(fetch).toHaveBeenCalledTimes(1);
      // TODO: This is wrong - should be 6 - but Jest thinks it's 5.
      // Happened during 23.x to 24.x Jest upgrade
      expect.assertions(5);
    });
  });

  test('should force fetch() error', async () => {
    Logger.setLevel('info');
    const req = {};

    fetchMock.mockImplementation(() => {
      throw new Error('fake error');
    });

    const result = await logger.info(req);
    expect(result).toEqual({});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  test('should console.error if object not passed to log function', async () => {
    await logger.error('i am a string');
    expect(consoleError).toHaveBeenCalledTimes(1);
    const expected = 'Expecting an object in logger write method but got "string"';
    expect(consoleError).toHaveBeenCalledWith(expected);
  });

  test('should add a stack if it is missing from err', async () => {
    const req = {
      err: {
        message: 'Will be used for missing msg',
      },
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    fetchMock.mockImplementation((url, options) => {
      expect(url).toBe('https://logs-01.loggly.com/inputs/test-loggly-token/tag/test-service-development/');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      const {
        fullStack, shortStack, msg,
      } = body;

      expect(fullStack).toBeTruthy();
      expect(shortStack).toBeTruthy();
      expect(msg).toBe('Will be used for missing msg');

      return { json: (): Record<string, unknown> => ({}), status: 200 };
    });

    await logger.error(req);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(6);
  });

  test('should use object message if present', async () => {
    const req = {
      err: {
        message: 'error message',
      },
      ip: '1.2.3.4',
      msg: 'root message',
      path: 'some path',
      user: 'some user',
    };

    fetchMock.mockImplementation((url, options) => {
      const body = JSON.parse(options.body);
      const {
        fullStack, shortStack, msg,
      } = body;

      expect(fullStack).toBeTruthy();
      expect(shortStack).toBeTruthy();
      expect(msg).toBe('root message');

      return { json: (): Record<string, unknown> => ({}), status: 200 };
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
        random: 'random',
        url: 'url',
        user: 'user',
      },
    };

    fetchMock.mockImplementation((url, options) => {
      const body = JSON.parse(options.body);

      const { req } = body;
      expect(req.body).toBe('body');
      expect(req.url).toBe('url');
      expect(req.random).toBeFalsy();

      return { json: (): Record<string, unknown> => ({}), status: 200 };
    });

    await logger.error(logObj);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(4);
  });

  test('should call res.send when response parameter is included', async () => {
    const response = {
      code: 1234,
      res: {
        send: (obj: any): void => {
          expect(obj.success).toBe(false);
        },
        status: (c: number): any => {
          expect(c).toBe(1234);
          return response.res;
        },
      },
    };

    const logData = {
      ip: '1.2.3.4',
      path: 'some path',
      user: 'some user',
    };

    const resp = { json: (): Record<string, unknown> => ({}), status: 200 };
    fetchMock.mockResolvedValue(resp);

    await logger.error(logData, response);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect.assertions(3);
  });

  test('should console.error() a non-200 status from Loggly', async () => {
    const logData = {};

    const resp = { json: (): Record<string, unknown> => ({}), status: 500 };
    fetchMock.mockResolvedValue(resp);

    const result = await logger.error(logData);
    expect(result).toEqual({});
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);

    // Make sure that console.log includes the call stack so we can trace
    // back to where the problem originated
    const [firstCallParams] = consoleError.mock.calls;
    const [firstParam] = firstCallParams;
    expect(firstParam.startsWith('fetch() call failed with 500')).toBe(true);
    expect(firstParam).toContain('\nError');
    expect(firstParam).toContain('lib/loggly-wrapper.ts');
  });

  test('should not call fetch() if LOGGLY_TOKEN has not been defined', async () => {
    delete process.env.LOGGLY_TOKEN;
    // const logger2 = Logger.create('test-service-2', 'test-logger-2');
    await logger.error({});
    expect(fetch).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenLastCalledWith('loggly token has not been defined');
  });

  test('should create a transient logger', async () => {
    let previousLevel = Logger.getLevel();
    previousLevel = Logger.setLevel('error');

    const testLogger = new Logger({
      isTransient: true,
      moduleName: 'fake-module-1',
      serviceName: 'fake-service-1',
    });

    await testLogger.trace({});
    expect(fetch).not.toHaveBeenCalled();

    await testLogger.info({});
    expect(fetch).not.toHaveBeenCalled();

    await testLogger.warn({});
    expect(fetch).not.toHaveBeenCalled();

    await testLogger.error({});
    expect(fetch).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][0]).toBe('https://logs-01.loggly.com/bulk/test-loggly-token/tag/fake-service-1-development/');

    Logger.setLevel(previousLevel);
  });

  test('should console.error if log param is not an object in logSingle', async () => {
    const logSingleOptions = true as unknown as LogSingleOptions;
    await logSingle(logSingleOptions);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  test('should console.error if log param is not an array in logBatch', async () => {
    const logBatchOptions = true as unknown as LogBatchOptions;
    await logBatch(logBatchOptions);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});

/* eslint-enable no-console */
