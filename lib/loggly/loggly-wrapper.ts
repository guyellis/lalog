import fetch, { RequestInit, Response } from 'node-fetch';
import {
  LogBatch, LogSingle, isObject, safeJsonStringify,
} from '../utils';
import { LogglyLoggerService } from '../local-types';

interface LogOptions {
  tag: string;
  logglyToken?: string;
  logObj: string;
  serviceCredentials?: LogglyLoggerService;
}

const log = async (options: LogOptions, bulk: boolean): Promise<Record<string, unknown>> => {
  const {
    tag,
    logglyToken = process.env.LOGGLY_TOKEN,
    logObj: body,
  } = options;

  const pathPart = bulk ? 'bulk' : 'inputs';

  if (logglyToken) {
    let url = '';
    let fetchOptions: RequestInit = {};
    try {
      url = `https://logs-01.loggly.com/${pathPart}/${logglyToken}/tag/${tag}/`;
      fetchOptions = {
        body,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      };

      const result: Response = await fetch(url, fetchOptions);

      if (result.status !== 200) {
        const { stack } = new Error();
        // eslint-disable-next-line no-console
        console.error(`fetch() call failed with ${result.status}\n${stack}`);
        return {};
      }

      return result.json();
    } catch (error: unknown) {
      // Typescript requires the instanceof syntax which is why we have
      // this istanbul ignore directive.
      /* istanbul ignore next */
      const err = error instanceof Error ? error : new Error('unknown');
      // eslint-disable-next-line no-console
      console.error(`fetch() threw an error: ${err.message}
url: ${url}
options: ${safeJsonStringify(fetchOptions as Record<string, unknown>)}`);
      return {};
    }
  }
  // eslint-disable-next-line no-console
  console.warn('loggly token has not been defined');

  return {};
};

const logSingleSetup = (serviceCredentials: LogglyLoggerService) : LogSingle => async (options) => {
  const { logObj } = options;
  if (!isObject(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Object in logSingle but got ${typeof logObj}`);
    return Promise.resolve();
  }

  const body = safeJsonStringify(logObj);
  return log({
    ...options,
    logObj: body,
    serviceCredentials,
  }, false);
};

const logBatchSetup = (serviceCredentials: LogglyLoggerService): LogBatch => async (options) => {
  const { logObj } = options;
  if (!Array.isArray(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Array in logBatch but got ${typeof logObj}`);
    return Promise.resolve();
  }

  const body = logObj.map((logEntry) => safeJsonStringify(logEntry)).join('\n');
  return log({
    ...options,
    logObj: body,
    serviceCredentials,
  }, true);
};

export const logglyLoggers = (serviceCredentials: LogglyLoggerService) => ({
  logBatch: logBatchSetup(serviceCredentials),
  logSingle: logSingleSetup(serviceCredentials),
});
