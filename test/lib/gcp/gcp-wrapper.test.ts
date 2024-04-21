import fetch from 'node-fetch';
import { MockJwt } from './mock-jwt';
import Logger, { GcpLoggerService } from '../../../lib';
import {
  gcpLoggers, forTest,
} from '../../../lib/gcp/gcp-wrapper';
import { LogBatchOptions, LogSingleOptions } from '../../../lib/utils';
import { logSeverity } from '../../../lib/gcp/gcp-logging-types';

const { getAccessToken, getLogSeverity, log } = forTest;

const serviceCredentials: GcpLoggerService = {
  email: 'email',
  key: 'key',
  projectId: 'projectId',
  type: 'gcp',
};
const { logBatch, logSingle } = gcpLoggers(serviceCredentials);

jest.mock('node-fetch');

jest.mock('google-auth-library', () => ({
  JWT: MockJwt,
}));

// Assign console to an object to check calls to console and suppress
// console to stdout
global.console = {} as Console;

const fetchMock = fetch as unknown as jest.Mock;

describe('/lib/gcp/gcp-wrapper', () => {
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

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('placeholder for log', async () => {
    const actual = await log({
      logObj: [{ one: 'logObject' }],
      serviceCredentials,
      tag: 'tag',
    });
    expect(actual).toMatchInlineSnapshot(`
{
  "bulk": false,
  "options": {
    "logObj": "logObject",
    "logglyToken": "loggly token",
    "tag": "tag",
  },
}
`);
  });

  /**
   * This test is just for code coverage.
   */
  test('LogSeverity', () => {
    expect(logSeverity).toMatchInlineSnapshot(`
{
  "ALERT": 700,
  "CRITICAL": 600,
  "DEBUG": 100,
  "DEFAULT": 0,
  "EMERGENCY": 800,
  "ERROR": 500,
  "INFO": 200,
  "NOTICE": 300,
  "WARNING": 400,
}
`);
  });

  test('getLogSeverity returns expected results', () => {
    expect(getLogSeverity('trace')).toBe('DEBUG');
    expect(getLogSeverity('info')).toBe('INFO');
    expect(getLogSeverity('warn')).toBe('WARNING');
    expect(getLogSeverity('error')).toBe('ERROR');
    expect(getLogSeverity('fatal')).toBe('ALERT');
    expect(getLogSeverity('security')).toBe('WARNING');
    expect(getLogSeverity('unknown' as 'trace')).toBe('DEFAULT');
  });

  test('getAccessToken() should call jwtClient.authorize the first time and then use the cache', async () => {
    const loggerService: GcpLoggerService = {
      email: 'fake-email',
      key: 'fake-key',
      projectId: 'fake-project-id',
      type: 'gcp',
    };
    const firstResult = await getAccessToken(loggerService);
    expect(firstResult).toBe('fake-access-token');
    // TODO: In the previous check that authorize() was called once and in the next
    // part check that it wasn't called so we know the cache was used.
    const secondResult = await getAccessToken(loggerService);
    expect(secondResult).toBe('fake-access-token');
  });
});
