import { JWT } from 'google-auth-library';
import {
  LogBatch, LogSingle, isObject, safeJsonStringify,
} from '../utils';
import { ILogEntry, LogBody, LogSeverity } from './gcp-logging-types';
import { LevelType } from '../local-types';

const url = 'https://logging.googleapis.com/v2/entries:write';

let accessTokenCache: string | null | undefined = null;
const getAccessToken = async (email: string, key: string) => {
  if (accessTokenCache) {
    return accessTokenCache;
  }
  const scopes = ['https://www.googleapis.com/auth/logging.write'];
  const jwtClient = new JWT({
    email,
    key,
    scopes,
  });
  const accessToken = await jwtClient.authorize();
  accessTokenCache = accessToken.access_token;
  return accessTokenCache;
};

const getLogSeverity = (level?: LevelType): LogSeverity => {
  switch (level) {
    case 'trace':
      return 'DEBUG';
    case 'info':
      return 'INFO';
    case 'warn':
      return 'WARNING';
    case 'error':
      return 'ERROR';
    case 'fatal':
      return 'ALERT';
    case 'security':
      return 'WARNING';
    default:
      return 'DEFAULT';
  }
};

interface LogOptions {
  tag: string;
  logObj: any[];
}

const log = async (options: LogOptions, firstCall = true):
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
    severity: getLogSeverity(jsonPayload.level),
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

  // If we get 401 Unauthorized it might be because the token has expired so
  // we try once more.
  if (result.status === 401) {
    accessTokenCache = null;
    if (firstCall) {
      return log(options, false);
    }
    // eslint-disable-next-line no-console
    console.error(`fetch status is 401: ${result.statusText}`);
    return {};
  }

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
