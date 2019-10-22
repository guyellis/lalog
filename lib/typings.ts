// Type definitions for lalog 0.6.1
// Project: https://github.com/guyellis/lalog
// Definitions by: Guy Ellis <https://github.com/guyellis>

/* ~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */

/* ~ Write your module's methods and properties in this class */

type LevelEnum =
  'trace'|
  'info'|
  'warn'|
  'error'|
  'fatal'|
  'security';

interface LogPresets {
  [key: string]: string;
}

interface LaLogOptions {
  addTrackId?: boolean;
  moduleName?: string;
  presets?: LogPresets;
  serviceName?: string;
  isTransient?: boolean;
}

interface TimeEndLog {
  (label: string, extraLogDat?: any): Promise<any>;
  trace?: (label: string, extraLogDat?: any) => Promise<any>;
  info?: (label: string, extraLogDat?: any) => Promise<any>;
  warn?: (label: string, extraLogDat?: any) => Promise<any>;
  error?: (label: string, extraLogDat?: any) => Promise<any>;
  fatal?: (label: string, extraLogDat?: any) => Promise<any>;
  security?: (label: string, extraLogDat?: any) => Promise<any>;
}

interface LaLog{
  new(options: LaLogOptions): void;

  // Static methods
  create: (options: LaLogOptions) => LaLog;
  setLevel: (level: LevelEnum) => LevelEnum;
  getLevel: () => LevelEnum;
  allLevels: () => Array<LevelEnum>;

  // Instance methods
  time: (label: string) => void;
  // TODO: timeEnd has all the log methods on it.
  timeEnd: (label: string, extraLogData?: object) => Promise<undefined>;
  trace: (logObj: object) => Promise<undefined>;
  info: (logObj: object) => Promise<undefined>;
  warn: (logObj: object) => Promise<undefined>;
  error: (logObj: object) => Promise<undefined>;
  fatal: (logObj: object) => Promise<undefined>;
  security: (logObj: object) => Promise<undefined>;
}
