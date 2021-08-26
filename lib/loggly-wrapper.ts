import fetch, { RequestInit, Response } from 'node-fetch';
import { isObject, safeJsonStringify } from './utils';

interface LogOptions {
  tag: string;
  logglyToken?: string;
  logObj: string;
}

const log = async (
  options: LogOptions, bulk: boolean,
): Promise<Record<string, unknown>> => {
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
    } catch (err) {
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

export interface LogSingleOptions {
  tag: string;
  logglyToken?: string;
  logObj: any;
}

export const logSingle = (
  options: LogSingleOptions,
): Promise<Record<string, unknown> | void> => {
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
  }, false);
};

export interface LogBatchOptions {
  tag: string;
  logglyToken?: string;
  logObj: any[];
}

export const logBatch = async (
  options: LogBatchOptions,
): Promise<Record<string, unknown> | void> => {
  const { logObj } = options;
  if (!Array.isArray(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Array in logBatch but got ${typeof logObj}`);
    return Promise.resolve();
  }

  const body = logObj.map(safeJsonStringify).join('\n');
  return log({
    ...options,
    logObj: body,
  }, true);
};
