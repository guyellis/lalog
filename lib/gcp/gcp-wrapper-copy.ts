// import fetch, { RequestInit, Response } from 'node-fetch';
import {
  LogBatch, LogSingle, isObject, safeJsonStringify,
} from '../utils';

interface LogOptions {
  tag: string;
  logglyToken?: string;
  logObj: string;
}

const log = async (options: LogOptions, bulk: boolean):
 Promise<Record<string, unknown>> => Promise.resolve({
  bulk,
  options,
});

export const logSingle: LogSingle = (options) => {
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

export const logBatch: LogBatch = async (options) => {
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
  }, true);
};

export const forTest = {
  log,
};

export const gcpLoggers = {
  logBatch,
  logSingle,
};
