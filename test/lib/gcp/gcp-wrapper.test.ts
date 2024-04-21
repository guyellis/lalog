import fetch from 'node-fetch';

import Logger from '../../../lib';
import {
  logSingle, logBatch, forTest,
} from '../../../lib/gcp/gcp-wrapper';
import { LogBatchOptions, LogSingleOptions } from '../../../lib/utils';

const { log } = forTest;

jest.mock('node-fetch');

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
});

/* eslint-enable no-console */
