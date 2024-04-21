import { JWT } from 'google-auth-library';
import {
  LogBatch, LogSingle, isObject, safeJsonStringify,
} from '../utils';
import { ILogEntry, LogBody } from './gcp-logging-types';

const url = 'https://logging.googleapis.com/v2/entries:write';

const getAccessToken = async (email: string, key: string) => {
  const scopes = ['https://www.googleapis.com/auth/logging.write'];
  const jwtClient = new JWT({
    email,
    key,
    scopes,
  });
  const accessToken = await jwtClient.authorize();
  return accessToken.access_token;
};

interface LogOptions {
  tag: string;
  logObj: any[];
}

const log = async (options: LogOptions):
 Promise<Record<string, unknown>> => {
  const {
    logObj,
    tag,
  } = options;
  const {
    GCP_LOGGER_EMAIL: email,
    GCP_LOGGER_PRIVATE_KEY: key,
    GCP_LOGGER_PROJECT_ID: projectId,
  } = process.env;

  if (!email || !key) {
    throw new Error('GCP_LOGGER_EMAIL and GCP_LOGGER_PRIVATE_KEY must be set');
  }

  const accessToken = await getAccessToken(email, key);

  const entries: ILogEntry[] = logObj.map((jsonPayload) => ({
    jsonPayload,
  }));

  const logBody: LogBody = {
    entries,
    logName: `/projects/${projectId}/logs/${tag}`,
    resource: {
      type: 'global',
    },
  };

  const body = safeJsonStringify(logBody as unknown as Record<string, unknown>);

  const result = await fetch(url, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const json = await result.json();

  return json;
};

export const logSingle: LogSingle = (options) => {
  const { logObj } = options;
  if (!isObject(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Object in logSingle but got ${typeof logObj}`);
    return Promise.resolve();
  }

  return log({
    ...options,
    logObj: [logObj],
  });
};

export const logBatch: LogBatch = async (options) => {
  const { logObj } = options;
  if (!Array.isArray(logObj)) {
    // eslint-disable-next-line no-console
    console.error(`Expected an Array in logBatch but got ${typeof logObj}`);
    return Promise.resolve();
  }

  return log({
    ...options,
    logObj,
  });
};

export const forTest = {
  log,
};

export const gcpLoggers = {
  logBatch,
  logSingle,
};
