import { Request, Response } from 'express';

export type BetterOmit<T, K extends PropertyKey> =
  { [P in keyof T as Exclude<P, K>]: T[P] };

export const levels = ['trace', 'info', 'warn', 'error', 'fatal', 'security'] as const;
export type LevelType = typeof levels[number];

export interface LogPresets extends Record<string, unknown> {
    module?: string;
    trackId?: string;
  }

export interface LaLogOptions {
    addTrackId?: boolean;
    moduleName?: string;
    presets?: LogPresets;
    serviceName?: string;
    isTransient?: boolean;
  }

export type ParseReqIn = Request & { user?: unknown };
export type ParseReqOut = Pick<ParseReqIn, 'body' |
  'headers' |
  'method' |
  'params' |
  'path' |
  'query' |
  'url' |
  'user'>;

export interface LogData extends Record<string, unknown> {
    err?: Error;
    msg?: string;
    req?: ParseReqIn;
  }

export interface LogDataOut extends BetterOmit<LogData, 'req'>, LogPresets {
    /**
     * The Stack property from the Error object split into lines.
     */
    fullStack?: string[];
    /**
    * Created from the fullStack by removing lines containing node_modules
    */
    shortStack?: string[];
    req?: ParseReqOut;
  }

export interface ResponseWrapper {
    res: Response;
    code: number;
  }

export type LogFunction = (logData: LogData, response?: ResponseWrapper) => Promise<any>;
export type TimeLogFunction = (
    label: string, level: LevelType, extraLogDat?: LogData,
  ) => Promise<any>;

export type logDataEnriched = Omit<LogDataOut, 'err'> & {
    err: Record<string, unknown>
  }
